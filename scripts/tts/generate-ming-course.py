import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import time


ROOT = Path(__file__).resolve().parents[2]
MODEL = "Ming-3.0-tts-0.5B"
VOICE = "Ming-Spanish-temporary"
PROVIDER = "ming-local"
IDENTITY = {"model": MODEL, "voice": VOICE, "provider": PROVIDER, "temporary": True}
RATE = 44100
PAUSE_FRAMES = 13230
DEFAULT_GEMINI = Path("/home/aquiluer/Scripts/TTS/outputs/gemini-puck-course-2026-11-10-v1")
DEFAULT_BATCH = DEFAULT_GEMINI.with_name("ming-temporary-course-2026-11-10-v1")
DEFAULT_CODE = Path("/home/aquiluer/Scripts/TTS/Ming-3.0-tts")
DEFAULT_MODEL = Path("/home/aquiluer/Scripts/TTS/models/Ming-3.0-tts-0.5B")


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def spoken_cues(item):
    return [cue for step in item["animation"]["steps"] for cue in step["cues"]]


def select_snapshot(original, progress):
    catalogue = json.loads(original)
    if sha256(original) != progress["catalogueSha256"]:
        raise ValueError("Immutable Gemini catalogue checksum changed")
    items = catalogue["items"]
    ids = [item["id"] for item in items]
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate item IDs")
    for item in items:
        if not re.fullmatch(r"[a-z0-9]+(?:(?:-{1,2}|\.)[a-z0-9]+)*", item["id"]):
            raise ValueError("Unsafe item ID")
        if item["animation"]["id"] != item["id"]:
            raise ValueError("Animation identity changed")
        cues = spoken_cues(item)
        if not cues or any(not isinstance(cue["text"], str) or not cue["text"].strip() for cue in cues):
            raise ValueError("Missing exact spoken text")
    excluded = [item_id for item_id in ids if progress["items"].get(item_id, {}).get("status") == "complete"]
    targets = [item_id for item_id in ids if item_id not in excluded]
    return {
        "version": 1, **IDENTITY, "catalogueSha256": sha256(original),
        "originCatalogueSha256": sha256(original), "originInputSha256": catalogue["inputSha256"],
        "sourceRevision": catalogue["sourceRevision"], "excludeIds": excluded, "targetIds": targets,
        "totalItems": len(items), "targetItems": len(targets),
        "targetCues": sum(len(spoken_cues(item)) for item in items if item["id"] in targets),
        "silenceMs": 300, "sampleRate": RATE,
    }


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def file_hash(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.tmp")
    with temporary.open("w", encoding="utf-8") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)
    descriptor = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


@contextmanager
def batch_lock(batch):
    batch.mkdir(parents=True, exist_ok=True)
    with (batch / ".lock").open("a+", encoding="utf-8") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise RuntimeError("Batch is already locked by another process") from error
        lock.seek(0)
        lock.truncate()
        json.dump({"pid": os.getpid(), "startedAt": time.time()}, lock)
        lock.flush()
        os.fsync(lock.fileno())
        try:
            yield
        finally:
            lock.seek(0)
            lock.truncate()
            lock.write('{"pid": null, "status": "unlocked"}\n')
            lock.flush()
            fcntl.flock(lock, fcntl.LOCK_UN)


def runtime_identity(code, model):
    files = sorted(code.rglob("*.py")) + sorted(path for path in model.rglob("*") if path.is_file() and ".cache" not in path.parts)
    if not (code / "ming_tts.py").is_file() or not any(path.suffix == ".safetensors" for path in files):
        raise ValueError("Installed Ming runtime/weights missing; downloads are disabled")
    return {str(path): file_hash(path) for path in files}


def prepare_batch(batch, origin, code, model, seed):
    if batch == origin or origin in batch.parents or ROOT in batch.parents:
        raise ValueError("Use a separate external batch; Gemini is read-only")
    with batch_lock(batch):
        if (batch / "selection.json").exists():
            return load_batch(batch)[1]
        unexpected = [path for path in batch.iterdir() if path.name != ".lock"]
        if unexpected:
            raise ValueError("Incomplete preparation; use a new empty batch")
        proof = json.loads(subprocess.check_output(["node", str(Path(__file__).with_name("verify-ming-source.mjs")),
                                                    str(origin), str(ROOT)], text=True))
        original = (origin / "catalogue.json").read_bytes()
        selection = select_snapshot(original, read_json(origin / "progress.json"))
        if proof["catalogueSha256"] != selection["catalogueSha256"] or proof["excludeIds"] != selection["excludeIds"]:
            raise ValueError("Gemini snapshot changed during verification")
        selection.update(origin=str(origin), verifiedCurrentCanon=proof["verifiedCurrentCanon"], seed=seed,
                         runtimeFiles=runtime_identity(code, model), mingCode=str(code), modelPath=str(model),
                         originFiles={str(path.relative_to(origin)): file_hash(path) for path in sorted(origin.rglob("*")) if path.is_file()},
                         helperSha256=file_hash(Path(__file__).with_name("generate-course.py")))
        with (batch / "catalogue.json").open("xb") as stream:
            stream.write(original)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(batch / "catalogue.json", 0o400)
        write_json(batch / "selection.json", selection)
        write_json(batch / "progress.json", {"version": 1, **IDENTITY, "selectionSha256": file_hash(batch / "selection.json"),
                                             "catalogueSha256": selection["catalogueSha256"], "status": "pending", "items": {}})
        return selection


def load_batch(batch):
    selection = read_json(batch / "selection.json")
    state = read_json(batch / "progress.json")
    original = (batch / "catalogue.json").read_bytes()
    if file_hash(batch / "selection.json") != state["selectionSha256"] or sha256(original) != selection["catalogueSha256"]:
        raise ValueError("Immutable batch checksum changed")
    for key, value in IDENTITY.items():
        if selection.get(key) != value or state.get(key) != value:
            raise ValueError("Ming model identity changed")
    catalogue = json.loads(original)
    validation = select_snapshot(original, {"catalogueSha256": selection["catalogueSha256"],
        "items": {item_id: {"status": "complete"} for item_id in selection["excludeIds"]}})
    for key in ("targetIds", "targetItems", "targetCues", "excludeIds", "originInputSha256"):
        if selection[key] != validation[key]:
            raise ValueError(f"Invalid frozen selection: {key}")
    if not set(state["items"]).issubset(selection["targetIds"]):
        raise ValueError("Checkpoint contains excluded or unknown items")
    return catalogue, selection, state


def signature(settings):
    return sha256(json.dumps(settings, sort_keys=True, ensure_ascii=False).encode())


def cue_signature(selection, item, index, reference_hash):
    return signature({**IDENTITY, "pipeline": 1, "catalogueSha256": selection["catalogueSha256"],
        "id": item["id"], "canonicalSha256": item["canonicalSha256"], "index": index,
        "text": spoken_cues(item)[index]["text"], "referenceSha256": reference_hash,
        "seed": selection["seed"], "maxLength": 80, "textNormalization": False,
        "runtimeFiles": selection["runtimeFiles"], "helperSha256": selection["helperSha256"]})


def validate_fragment(path, expected_signature, text):
    import soundfile as sf

    metadata = path.with_suffix(".json")
    if not path.exists() and not metadata.exists():
        return None
    if not path.is_file() or not metadata.is_file():
        raise ValueError(f"Incomplete fragment pair, not overwritten: {path}")
    report = read_json(metadata)
    if report.get("signature") != expected_signature or report.get("text") != text or report.get("sha256") != file_hash(path):
        raise ValueError(f"Corrupt fragment signature/text/checksum: {path}")
    if any(report.get(key) != value for key, value in IDENTITY.items()):
        raise ValueError(f"Wrong fragment model identity: {path}")
    info = sf.info(path)
    if info.samplerate != RATE or info.channels != 1 or info.subtype != "PCM_16" or info.frames <= 0 or info.frames != report["frames"]:
        raise ValueError(f"Invalid fragment frames/format: {path}")
    if report["sample_rate"] != RATE or report["duration_seconds"] != info.frames / RATE:
        raise ValueError(f"Invalid measured fragment duration: {path}")
    peak = max(int(abs(block.astype("int32")).max()) for block in sf.blocks(path, blocksize=65536, dtype="int16"))
    if peak < 32:
        raise ValueError(f"Silent fragment: {path}")
    return report


def produce_fragment(base, model, path, text, expected_signature, seed, reference=None):
    report = base.synthesize_audio(model, text, path, expected_signature, seed, reference)
    report.update(IDENTITY)
    write_json(path.with_suffix(".json"), report)
    return validate_fragment(path, expected_signature, text)


def cue_path(batch, item, index):
    return batch / "items" / item["id"] / "cues" / f"{index:06d}.wav"


def measured_scenes(item, parts):
    frames = 0
    scenes = []
    index = 0
    for step in item["animation"]["steps"]:
        cues = []
        for cue in step["cues"]:
            if index:
                frames += PAUSE_FRAMES
            start = frames / RATE
            frames += parts[index][1]["frames"]
            cues.append({"text": cue["text"], "start": start, "end": frames / RATE})
            index += 1
        scenes.append({"start": cues[0]["start"], "end": cues[-1]["end"], "cues": cues})
    return scenes, frames


def probe_mp3(path):
    result = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
        "stream=codec_name,channels,sample_rate:format=duration", "-of", "json", str(path)], text=True))
    streams = result["streams"]
    if len(streams) != 1 or streams[0] != {"codec_name": "mp3", "sample_rate": str(RATE), "channels": 1}:
        raise ValueError("Invalid MP3 format")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-threads", "1", "-i", str(path),
                    "-map", "0:a:0", "-f", "null", "-"], check=True, stdout=subprocess.DEVNULL)
    return float(result["format"]["duration"])


def assemble_item(batch, item, selection, parts):
    import numpy as np
    import soundfile as sf

    directory = batch / "items" / item["id"]
    scenes, frames = measured_scenes(item, parts)
    wav = directory / "audio.wav"
    temporary = directory / "audio.pending.wav"
    with sf.SoundFile(temporary, mode="w", samplerate=RATE, channels=1, format="WAV", subtype="PCM_16") as destination:
        for index, (path, _) in enumerate(parts):
            if index:
                destination.write(np.zeros(PAUSE_FRAMES, dtype=np.int16))
            for block in sf.blocks(path, blocksize=65536, dtype="int16"):
                destination.write(block)
    temporary.replace(wav)
    temporary = directory / "audio.pending.mp3"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-y", "-threads", "1", "-filter_threads", "1",
        "-i", str(wav), "-map", "0:a:0", "-map_metadata", "-1", "-vn", "-ac", "1", "-ar", str(RATE),
        "-c:a", "libmp3lame", "-b:a", "48k", "-threads", "1", str(temporary)], check=True)
    mp3_duration = probe_mp3(temporary)
    if not frames / RATE <= mp3_duration < frames / RATE + 0.15:
        raise ValueError("MP3 duration truncates or shifts measured audio")
    temporary.replace(directory / "audio.mp3")
    report = {key: value for key, value in item.items() if key != "animation"}
    report.update({**IDENTITY, "catalogueSha256": selection["catalogueSha256"], "sourceDuration": frames / RATE,
        "duration": frames / RATE, "mp3Duration": mp3_duration, "frames": frames, "sampleRate": RATE, "silenceMs": 300,
        "cueTiming": "measured", "scenes": scenes, "wavSha256": file_hash(wav),
        "mp3Sha256": file_hash(directory / "audio.mp3"), "mp3Bytes": (directory / "audio.mp3").stat().st_size,
        "sourceSignature": signature([part["signature"] for _, part in parts]),
        "generationSeconds": sum(part["generation_seconds"] for _, part in parts),
        "encoding": {"codec": "mp3", "channels": 1, "bitrate": 48000}, "listened": False})
    write_json(directory / "audio.json", report)
    return verify_item(batch, item, selection, parts)


def verify_item(batch, item, selection, parts):
    import numpy as np
    import soundfile as sf

    directory = batch / "items" / item["id"]
    report = read_json(directory / "audio.json")
    scenes, frames = measured_scenes(item, parts)
    expected = {key: value for key, value in item.items() if key != "animation"}
    expected.update({**IDENTITY, "catalogueSha256": selection["catalogueSha256"], "sourceDuration": frames / RATE,
        "duration": frames / RATE, "frames": frames, "sampleRate": RATE, "silenceMs": 300,
        "cueTiming": "measured", "scenes": scenes, "sourceSignature": signature([part["signature"] for _, part in parts]),
        "encoding": {"codec": "mp3", "channels": 1, "bitrate": 48000}})
    if any(report.get(key) != value for key, value in expected.items()):
        raise ValueError("Assembled audio identity/timeline changed")
    wav = directory / "audio.wav"
    info = sf.info(wav)
    if info.frames != frames or info.samplerate != RATE or info.channels != 1 or info.subtype != "PCM_16":
        raise ValueError("Assembled WAV format/frames changed")
    if report["wavSha256"] != file_hash(wav):
        raise ValueError("Assembled WAV checksum changed")
    with sf.SoundFile(wav) as audio:
        for index, (path, _) in enumerate(parts):
            if index and np.any(audio.read(PAUSE_FRAMES, dtype="int16") != 0):
                raise ValueError("Inter-cue pause changed")
            for block in sf.blocks(path, blocksize=65536, dtype="int16"):
                if not np.array_equal(audio.read(len(block), dtype="int16"), block):
                    raise ValueError("Assembled WAV differs from exact cue PCM")
    mp3 = directory / "audio.mp3"
    if report["mp3Sha256"] != file_hash(mp3) or report["mp3Bytes"] != mp3.stat().st_size:
        raise ValueError("MP3 checksum changed")
    if report["mp3Duration"] != probe_mp3(mp3) or not frames / RATE <= report["mp3Duration"] < frames / RATE + 0.15:
        raise ValueError("MP3 measured duration changed")
    return report


def load_base():
    spec = importlib.util.spec_from_file_location("ming_existing_runtime", Path(__file__).with_name("generate-course.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def generate_batch(batch, ids=None, max_new_cues=None, threads=2, model_factory=None, producer=None):
    with batch_lock(batch):
        catalogue, selection, state = load_batch(batch)
        if ids and not set(ids).issubset(selection["targetIds"]):
            raise ValueError("Unknown/excluded target IDs")
        targets = [item for item in catalogue["items"] if item["id"] in selection["targetIds"]]
        started = time.monotonic()
        state.update(pid=os.getpid(), totalItems=selection["targetItems"], totalCues=selection["targetCues"],
                     generatedThisRun=0, reusedThisRun=0, startedAt=time.time())

        def save(status):
            state.update(status=status, updatedAt=time.time(), elapsedSeconds=time.monotonic() - started,
                completedItems=sum(record.get("status") == "complete" for record in state["items"].values()),
                completedCues=sum(len(record.get("cues", {})) for record in state["items"].values()),
                audioSeconds=sum(cue["frames"] / RATE for record in state["items"].values() for cue in record.get("cues", {}).values()),
                generationSeconds=sum(cue.get("generationSeconds", 0) for record in state["items"].values() for cue in record.get("cues", {}).values()))
            write_json(batch / "progress.json", state)

        model = None
        base = None
        gpu_lock = None

        def get_model():
            nonlocal model, base, gpu_lock
            if model is not None:
                return model
            save("loading")
            if model_factory:
                model = model_factory()
                return model
            gpu_lock = (batch.parent / ".ming-local-gpu.lock").open("a+", encoding="utf-8")
            try:
                fcntl.flock(gpu_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as error:
                raise RuntimeError("Another local Ming loader owns the GPU lock") from error
            gpu_lock.seek(0)
            gpu_lock.truncate()
            gpu_lock.write(f"{os.getpid()}\n")
            gpu_lock.flush()
            os.environ["HF_HUB_OFFLINE"] = "1"
            os.environ["TRANSFORMERS_OFFLINE"] = "1"
            if runtime_identity(Path(selection["mingCode"]), Path(selection["modelPath"])) != selection["runtimeFiles"]:
                raise ValueError("Installed Ming runtime/weights changed")
            if file_hash(Path(__file__).with_name("generate-course.py")) != selection["helperSha256"]:
                raise ValueError("Existing synthesis helper changed")
            import torch
            from loguru import logger

            torch.set_num_threads(threads)
            torch.set_num_interop_threads(1)
            if not torch.cuda.is_available():
                raise RuntimeError("CUDA unavailable; refusing CPU fallback")
            state.update(gpu=torch.cuda.get_device_name(0), threads=threads, device="cuda:0")
            base = load_base()
            logger.disable("modeling_bailingmm")
            torch.manual_seed(selection["seed"])
            torch.cuda.manual_seed_all(selection["seed"])
            model = base.load_ming_class(Path(selection["mingCode"]))(selection["modelPath"], text_normalization=False)
            if model.sample_rate != RATE:
                raise ValueError("Ming runtime sample rate changed")
            return model

        def produce(path, text, expected_signature, reference=None):
            active_model = get_model()
            if producer:
                return producer(active_model, path, text, expected_signature, selection["seed"], reference)
            return produce_fragment(base, active_model, path, text, expected_signature, selection["seed"], reference)

        try:
            state.pop("error", None)
            save("validating")
            reference = batch / "voice-reference.wav"
            reference_text = "Hola. Esta es una prueba de voz en castellano."
            reference_signature = signature({**IDENTITY, "text": reference_text, "seed": selection["seed"],
                "runtimeFiles": selection["runtimeFiles"], "helperSha256": selection["helperSha256"]})
            report = validate_fragment(reference, reference_signature, reference_text)
            if report is None:
                if any(record.get("cues") for record in state["items"].values()):
                    raise ValueError("Reference missing for existing fragments")
                produce(reference, reference_text, reference_signature)
            reference_hash = file_hash(reference)
            state["referenceSha256"] = reference_hash
            all_parts = {}
            for item in targets:
                record = state["items"].setdefault(item["id"], {"status": "pending", "cues": {}})
                if not set(record["cues"]).issubset({str(index) for index in range(len(spoken_cues(item)))}):
                    raise ValueError("Unknown cue in checkpoint")
                parts = []
                for index, cue in enumerate(spoken_cues(item)):
                    path = cue_path(batch, item, index)
                    expected_signature = cue_signature(selection, item, index, reference_hash)
                    report = validate_fragment(path, expected_signature, cue["text"])
                    old = record["cues"].get(str(index))
                    if old and (report is None or old["sha256"] != report["sha256"] or old["signature"] != report["signature"] or old["frames"] != report["frames"]):
                        raise ValueError(f"Checkpoint fragment missing/changed: {path}")
                    if report:
                        record["cues"][str(index)] = {"sha256": report["sha256"], "signature": report["signature"],
                            "frames": report["frames"], "generationSeconds": report["generation_seconds"]}
                        state["reusedThisRun"] += 1
                    parts.append((path, report))
                all_parts[item["id"]] = parts
                if record["status"] == "complete" or (batch / "items" / item["id"] / "audio.json").exists():
                    if any(report is None for _, report in parts):
                        raise ValueError("Complete item has missing cue fragments")
                    verify_item(batch, item, selection, parts)
                    record["status"] = "complete"
            save("running")
            prompted = False
            for item in targets:
                if ids and item["id"] not in ids:
                    continue
                record = state["items"][item["id"]]
                if record["status"] == "complete":
                    continue
                parts = all_parts[item["id"]]
                for index, cue in enumerate(spoken_cues(item)):
                    if parts[index][1] is not None:
                        continue
                    active_model = get_model()
                    if not prompted and not model_factory:
                        import torch

                        torch.manual_seed(selection["seed"])
                        torch.cuda.manual_seed_all(selection["seed"])
                        active_model.prepare_prompt(str(reference), True)
                        prompted = True
                    state.update(currentItem=item["id"], currentCue=index, currentItemCues=len(parts))
                    save("running")
                    path = parts[index][0]
                    report = produce(path, cue["text"], cue_signature(selection, item, index, reference_hash), reference)
                    parts[index] = (path, report)
                    record["cues"][str(index)] = {"sha256": report["sha256"], "signature": report["signature"],
                        "frames": report["frames"], "generationSeconds": report["generation_seconds"]}
                    state["generatedThisRun"] += 1
                    record["status"] = "partial"
                    save("running")
                    print(json.dumps({"item": item["id"], "cue": index + 1, "total": len(parts),
                        "audioSeconds": report["duration_seconds"], "generationSeconds": report["generation_seconds"]}), flush=True)
                    if max_new_cues and state["generatedThisRun"] >= max_new_cues and index < len(parts) - 1:
                        save("paused")
                        return state
                report = assemble_item(batch, item, selection, parts)
                record.update(status="complete", duration=report["duration"], mp3Sha256=report["mp3Sha256"])
                save("running")
                print(f"COMPLETE {item['id']} {report['duration']:.3f}s", flush=True)
                if max_new_cues and state["generatedThisRun"] >= max_new_cues:
                    save("paused")
                    return state
            save("complete" if state["completedItems"] == len(targets) else "paused")
            return state
        except BaseException as error:
            state["error"] = f"{type(error).__name__}: {error}"
            save("failed")
            raise
        finally:
            if gpu_lock is not None:
                gpu_lock.close()


def lock_status(batch):
    with (batch / ".lock").open("r", encoding="utf-8") as lock:
        owner = json.load(lock)
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return {"lockActive": True, "lockPid": owner.get("pid")}
        return {"lockActive": False, "lockPid": owner.get("pid")}


def main():
    parser = argparse.ArgumentParser(description="Offline Ming temporary audio from an immutable complete course catalogue")
    parser.add_argument("--batch", type=Path, default=DEFAULT_BATCH)
    parser.add_argument("--origin", type=Path, default=DEFAULT_GEMINI)
    parser.add_argument("--ming-code", type=Path, default=DEFAULT_CODE)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--export-complete", action="store_true")
    parser.add_argument("--ids", nargs="+")
    parser.add_argument("--max-new-cues", type=int)
    args = parser.parse_args()
    batch = args.batch.resolve()
    if args.export_complete:
        print(json.dumps(export_complete(batch), ensure_ascii=False))
        return
    if args.status:
        catalogue, selection, state = load_batch(batch)
        print(json.dumps({**state, **lock_status(batch), "items": {item_id: {**record, "cues": len(record.get("cues", {}))}
            for item_id, record in state["items"].items() if record.get("cues")},
            "targetItems": selection["targetItems"], "targetCues": selection["targetCues"]}, ensure_ascii=False, indent=2))
        return
    if args.threads < 1 or (args.max_new_cues is not None and args.max_new_cues < 1):
        parser.error("threads/max-new-cues must be positive")
    if args.verify:
        verify_batch(batch)
        return
    if not (batch / "selection.json").exists() or args.prepare_only:
        selection = prepare_batch(batch, args.origin.resolve(), args.ming_code.resolve(), args.model_path.resolve(), args.seed)
        print(json.dumps({key: selection[key] for key in ("model", "voice", "provider", "temporary", "totalItems",
            "targetItems", "targetCues", "excludeIds", "catalogueSha256", "verifiedCurrentCanon")}, ensure_ascii=False), flush=True)
    if not args.prepare_only:
        generate_batch(batch, args.ids, args.max_new_cues, args.threads)


def export_complete(batch):
    catalogue, selection, state = load_batch(batch)
    reference_hash = file_hash(batch / "voice-reference.wav")
    completed = []
    for item in catalogue["items"]:
        if state["items"].get(item["id"], {}).get("status") != "complete":
            continue
        parts = []
        for index, cue in enumerate(spoken_cues(item)):
            path = cue_path(batch, item, index)
            report = validate_fragment(path, cue_signature(selection, item, index, reference_hash), cue["text"])
            if report is None:
                raise ValueError("Complete checkpoint has missing fragments")
            parts.append((path, report))
        completed.append(verify_item(batch, item, selection, parts))
    return {"version": 1, **IDENTITY, "catalogueSha256": selection["catalogueSha256"], "items": completed}


def verify_batch(batch):
    catalogue, selection, state = load_batch(batch)
    origin = Path(selection["origin"])
    for relative, expected_hash in selection["originFiles"].items():
        if relative == "progress.json":
            progress = read_json(origin / relative)
            if (not isinstance(progress, dict) or progress.get("version") != selection["version"]
                    or progress.get("catalogueSha256") != selection["catalogueSha256"]
                    or not isinstance(progress.get("items"), dict)
                    or not set(progress["items"]).issubset({item["id"] for item in catalogue["items"]})):
                raise ValueError("Original Gemini progress identity/items changed")
            continue
        if file_hash(origin / relative) != expected_hash:
            raise ValueError(f"Original Gemini artifact changed: {relative}")
    reference = batch / "voice-reference.wav"
    reference_hash = file_hash(reference)
    completed = 0
    fragments = 0
    for item in catalogue["items"]:
        if item["id"] not in selection["targetIds"]:
            continue
        parts = []
        for index, cue in enumerate(spoken_cues(item)):
            path = cue_path(batch, item, index)
            report = validate_fragment(path, cue_signature(selection, item, index, reference_hash), cue["text"])
            if report:
                fragments += 1
            parts.append((path, report))
        if state["items"].get(item["id"], {}).get("status") == "complete":
            if any(report is None for _, report in parts):
                raise ValueError("Complete checkpoint has missing fragments")
            verify_item(batch, item, selection, parts)
            completed += 1
    print(json.dumps({"verifiedItems": completed, "verifiedFragments": fragments, **IDENTITY}))


if __name__ == "__main__":
    main()