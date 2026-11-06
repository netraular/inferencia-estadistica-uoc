import argparse
import fcntl
import hashlib
import importlib
import json
import os
from pathlib import Path
import random
import re
import subprocess
import sys
import time

from num2words import num2words

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT
DEFAULT_OUTPUT = ROOT / "data-src/inferencia-estadistica/_work/audio"
DEFAULT_SECTION_OUTPUT = DEFAULT_OUTPUT.with_name("audio-secciones")
NORMALIZER_VERSION = 1
REFERENCE_TEXT = "Hola. Esta es una prueba de voz en castellano."


def audio_signature(text, seed, reference_hash=None):
    settings = {"text": text, "seed": seed, "reference": reference_hash,
                "model": "Ming-3.0-tts-0.5B", "normalizer": NORMALIZER_VERSION,
                "max_length": 80, "pipeline": 1}
    return hashlib.sha256(json.dumps(settings, sort_keys=True).encode()).hexdigest()


def file_hash(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def cached_audio(path, signature):
    import soundfile as sf

    try:
        report = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
        if report["signature"] != signature or report["sha256"] != file_hash(path):
            return None
        info = sf.info(path)
        if info.frames != report["frames"] or info.samplerate != 44100 or info.channels != 1:
            return None
        return report
    except (OSError, ValueError, KeyError, RuntimeError):
        return None


def synthesize_audio(model, text, output, signature, seed, reference=None):
    import numpy as np
    import soundfile as sf
    import torch

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.cuda.reset_peak_memory_stats()
    started = time.perf_counter()
    waveform = model.synthesize(
        task="MULTILINGUAL", language_id="Spanish", text=text,
        prompt_wav_path=str(reference) if reference else None,
        prompt_text=REFERENCE_TEXT if reference else None,
        use_spk_emb=bool(reference), use_zero_spk_emb=not reference, max_length=80,
    )
    torch.cuda.synchronize()
    elapsed = time.perf_counter() - started
    audio = waveform.detach().cpu().float().numpy().reshape(-1)
    if not audio.size or not np.isfinite(audio).all() or np.max(np.abs(audio)) < 0.001:
        raise RuntimeError(f"Empty, invalid or silent audio: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(".wav.tmp")
    sf.write(temporary, audio, model.sample_rate, format="WAV", subtype="PCM_16")
    temporary.replace(output)
    report = {
        "signature": signature, "sha256": file_hash(output), "text": text,
        "seed": seed, "reference": str(reference) if reference else None,
        "gpu": torch.cuda.get_device_name(), "sample_rate": model.sample_rate,
        "frames": len(audio), "duration_seconds": len(audio) / model.sample_rate,
        "generation_seconds": elapsed,
        "peak_allocated_mib": torch.cuda.max_memory_allocated() / 1024**2,
        "peak_amplitude": float(np.max(np.abs(audio))),
        "clipped_fraction": float(np.mean(np.abs(audio) >= 0.9999)),
    }
    write_json(output.with_suffix(".json"), report)
    return report


def vtt_timestamp(seconds):
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    whole_seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{whole_seconds:02d}.{milliseconds:03d}"


def generate_section_scene(model, scene, output, seed, reference, reference_hash, on_cue=None):
    import numpy as np
    import soundfile as sf

    parts = []
    generated = False
    for index, cue in enumerate(scene["cues"], 1):
        path = output.parent / output.stem / f"{index:03d}.wav"
        signature = audio_signature(cue["spoken_text"], seed, reference_hash)
        report = cached_audio(path, signature)
        reused = report is not None
        if not reused:
            report = synthesize_audio(model, cue["spoken_text"], path, signature, seed, reference)
            generated = True
        parts.append((path, report))
        if on_cue:
            on_cue(index, len(scene["cues"]), reused)
    signature = hashlib.sha256(("section-cues-v1:" + "".join(report["signature"] for _, report in parts)).encode()).hexdigest()
    existing = cached_audio(output, signature)
    if existing is not None and existing.get("cue_timing") == "measured" and [cue["text"] for cue in existing.get("cues", [])] == [cue["text"] for cue in scene["cues"]]:
        return existing, generated
    output.parent.mkdir(parents=True, exist_ok=True)
    rate = 44100
    position = 0
    timings = []
    temporary = output.with_suffix(".wav.tmp")
    with sf.SoundFile(temporary, mode="w", samplerate=rate, channels=1, format="WAV", subtype="PCM_16") as destination:
        for index, (path, report) in enumerate(parts):
            start = position / rate
            for block in sf.blocks(path, blocksize=65536, dtype="int16"):
                destination.write(block)
                position += len(block)
            timings.append({"text": scene["cues"][index]["text"], "start": start, "end": position / rate,
                            "audio": str(path.relative_to(output.parent))})
            if index < len(parts) - 1:
                silence = np.zeros(round(rate * 0.3), dtype=np.int16)
                destination.write(silence)
                position += len(silence)
    temporary.replace(output)
    report = {"signature": signature, "sha256": file_hash(output), "text": scene["spoken_text"],
              "sample_rate": rate, "frames": position, "duration_seconds": position / rate,
              "generation_seconds": sum(part["generation_seconds"] for _, part in parts),
              "cue_timing": "measured", "cues": timings}
    write_json(output.with_suffix(".json"), report)
    return report, generated


def assemble_lesson(directory, lesson, parts):
    import numpy as np
    import soundfile as sf

    signature = hashlib.sha256("".join(report["signature"] for _, report in parts).encode()).hexdigest()
    existing = cached_audio(directory / "audio.wav", signature)
    sections = "sectionId" in lesson
    if existing is not None and (directory / "audio.vtt").is_file() and (not sections or existing.get("cue_timing") == "measured"):
        return existing
    rate = 44100
    position = 0
    timings = []
    cues = ["WEBVTT", ""]
    temporary = directory / "audio.wav.tmp"
    with sf.SoundFile(temporary, mode="w", samplerate=rate, channels=1, format="WAV", subtype="PCM_16") as destination:
        for index, (path, report) in enumerate(parts):
            scene = lesson["scenes"][index]
            start = position / rate
            for block in sf.blocks(path, blocksize=65536, dtype="int16"):
                destination.write(block)
                position += len(block)
            end = position / rate
            timings.append({"title": scene["title"], "chapter": scene["chapter"],
                            "start": start, "end": end, "text": scene["spoken_text"],
                            "audio": str(path.relative_to(directory))})
            if sections:
                if report.get("cue_timing") != "measured" or len(report.get("cues", [])) != len(scene["cues"]):
                    raise ValueError("Section audio must have measured cue boundaries")
                timings[-1]["cues"] = [{"text": cue["text"], "start": start + cue["start"], "end": start + cue["end"]}
                                       for cue in report["cues"]]
            cues.extend([str(index + 1), f"{vtt_timestamp(start)} --> {vtt_timestamp(end)}", scene["spoken_text"], ""])
            if index < len(parts) - 1:
                silence = np.zeros(round(rate * 0.3), dtype=np.int16)
                destination.write(silence)
                position += len(silence)
    temporary.replace(directory / "audio.wav")
    (directory / "audio.vtt").write_text("\n".join(cues) + "\n", encoding="utf-8")
    report = {"id": lesson["id"], "title": lesson["title"], "unit": lesson["unit"],
              "source": lesson["source"], "signature": signature,
              "sha256": file_hash(directory / "audio.wav"), "sample_rate": rate,
              "frames": position, "duration_seconds": position / rate,
              "generation_seconds": sum(part["generation_seconds"] for _, part in parts),
              "scene_count": len(parts), "scenes": timings,
              "subtitles": "Scene boundaries measured from audio; no word-level alignment.",
              "quality": "Signal validated; pronunciation has not been audited by listening."}
    if sections:
        report.update({key: lesson[key] for key in ("parentLesson", "parentTitle", "sectionId", "sourceSections", "optional")})
        report.update(cue_timing="measured", subtitles="Scene and cue boundaries measured from synthesized audio fragments; no word-level alignment.")
    write_json(directory / "audio.json", report)
    return report


def load_ming_class(code_directory):
    module = code_directory / "ming_tts.py"
    if not module.is_file():
        raise ValueError(f"Ming runtime not found: {module}")
    sys.path.insert(0, str(code_directory))
    return importlib.import_module("ming_tts").MingTTS


def generate_course(manifest, output, seed, ming_code, model_path, lesson_ids=None, max_scenes=None):
    import numpy as np
    import torch
    from loguru import logger

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is unavailable")
    if lesson_ids and not set(lesson_ids).issubset({lesson["id"] for lesson in manifest["lessons"]}):
        raise ValueError("Unknown lesson ID")
    ming_class = load_ming_class(ming_code)
    logger.disable("modeling_bailingmm")
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    progress = {"status": "loading", "started_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "total_lessons": manifest["lesson_count"], "total_scenes": manifest["scene_count"],
                "completed_lessons": 0, "completed_scenes": 0, "generated_scenes": 0,
                "reused_scenes": 0, "audio_seconds": 0, "generation_seconds": 0,
                "gpu": torch.cuda.get_device_name(), "output_directory": str(output)}
    sections = manifest.get("mode") == "sections"
    if sections:
        progress.update(mode="sections", total_cues=manifest["cue_count"], completed_cues=0, generated_cues=0, reused_cues=0)

    def save_progress(status):
        progress["status"] = status
        progress["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
        write_json(output / "progreso.json", progress)

    def save_cue_progress(number, total, reused):
        progress["current_cue"] = {"number": number, "total": total}
        progress["completed_cues"] += 1
        progress["reused_cues" if reused else "generated_cues"] += 1
        save_progress("running")

    save_progress("loading")
    try:
        model = ming_class(str(model_path), text_normalization=False)
        reference = output / "voz-referencia.wav"
        reference_signature = audio_signature(REFERENCE_TEXT, seed)
        if cached_audio(reference, reference_signature) is None:
            synthesize_audio(model, REFERENCE_TEXT, reference, reference_signature, seed)
        reference_hash = file_hash(reference)
        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        model.prepare_prompt(str(reference), True)
        save_progress("running")
        for lesson in manifest["lessons"]:
            if lesson_ids and lesson["id"] not in lesson_ids:
                continue
            directory = output / lesson["directory"]
            parts = []
            progress["current_lesson"] = lesson["title"]
            for index, scene in enumerate(lesson["scenes"], 1):
                path = directory / "fragmentos" / f"{index:03d}.wav"
                progress["current_scene"] = {"number": index, "title": scene["title"], "total": len(lesson["scenes"])}
                if sections:
                    report, generated = generate_section_scene(model, scene, path, seed, reference, reference_hash, save_cue_progress)
                    progress["generated_scenes" if generated else "reused_scenes"] += 1
                else:
                    signature = audio_signature(scene["spoken_text"], seed, reference_hash)
                    report = cached_audio(path, signature)
                    if report is None:
                        report = synthesize_audio(model, scene["spoken_text"], path, signature, seed, reference)
                        progress["generated_scenes"] += 1
                    else:
                        progress["reused_scenes"] += 1
                parts.append((path, report))
                progress["completed_scenes"] += 1
                progress["audio_seconds"] += report["duration_seconds"]
                progress["generation_seconds"] += report["generation_seconds"]
                save_progress("running")
                print(f"[{progress['completed_scenes']}/{progress['total_scenes']}] {lesson['id']} {index}/{len(lesson['scenes'])}: {report['duration_seconds']:.1f}s audio", flush=True)
                if max_scenes and progress["completed_scenes"] >= max_scenes and index < len(lesson["scenes"]):
                    save_progress("paused")
                    return progress
            report = assemble_lesson(directory, lesson, parts)
            lesson["audio"] = str((directory / "audio.wav").relative_to(output))
            lesson["duration_seconds"] = report["duration_seconds"]
            lesson["status"] = "complete"
            progress["completed_lessons"] += 1
            write_json(output / "curso.json", manifest)
            if max_scenes and progress["completed_scenes"] >= max_scenes:
                save_progress("paused")
                return progress
        manifest["status"] = "complete" if progress["completed_lessons"] == manifest["lesson_count"] else "partial"
        write_json(output / "curso.json", manifest)
        save_progress(manifest["status"])
        return progress
    except BaseException as error:
        progress["error"] = str(error)
        save_progress("paused" if isinstance(error, KeyboardInterrupt) else "failed")
        raise


def spoken_number(match):
    value = match.group()
    if "," not in value and re.fullmatch(r"[1-9]\d{0,2}(?:\.\d{3})+", value):
        value = value.replace(".", "")
    parts = re.split(r"[.,]", value, maxsplit=1)
    words = num2words(int(parts[0]), lang="es")
    if len(parts) == 2:
        words += " coma " + " ".join(num2words(int(digit), lang="es") for digit in parts[1])
    return words


def spoken_text(text):
    text = re.sub(r"\{([^{}]*)\}", lambda match: " conjunto de " + match[1].replace(",", ", ") + " fin del conjunto ", text)
    text = re.sub(r"\b\d+(?:,\d+){2,}\b", lambda match: match[0].replace(",", ", "), text)
    text = re.sub(r"(?<!\w)(\d+(?:[.,]\d+)?)[eE]([+-]?\d+)\b", r"\1 por diez elevado a \2", text)
    text = re.sub(r"(?<!\w)-(?=[A-Za-z\u03b1-\u03c9])", " menos ", text)
    text = re.sub(r"(?<=\d)(?=[A-Za-z\u03b1-\u03c9])|(?<=[A-Za-z\u03b1-\u03c9])(?=\d)", " por ", text)
    text = re.sub(r"\bF\u207b\u00b9", "funci\u00f3n inversa de distribuci\u00f3n", text)
    greek = {
        "\u03b1": "alfa", "\u03b2": "beta", "\u03b3": "gamma", "\u03b4": "delta",
        "\u03b5": "\u00e9psilon", "\u03b6": "zeta", "\u03b7": "eta", "\u03b8": "theta",
        "\u03ba": "kappa", "\u03bb": "lambda", "\u03bc": "mu", "\u03bd": "nu",
        "\u03be": "xi", "\u03c0": "pi", "\u03c1": "rho", "\u03c3": "sigma",
        "\u03c4": "tau", "\u03c6": "fi", "\u03c7": "ji", "\u03c8": "psi", "\u03c9": "omega",
    }
    for symbol, name in greek.items():
        text = text.replace(symbol, " " + name + " ").replace(symbol.upper(), " " + name + " may\u00fascula ")
    functions = {"P": "probabilidad de", "E": "esperanza de", "Var": "varianza de", "Cov": "covarianza de", "exp": "exponencial de", "log": "logaritmo de", "ln": "logaritmo natural de"}
    for function, name in functions.items():
        text = re.sub(r"\b" + function + r"\s*\(", name + " (", text)
    text = text.replace("<=", " menor o igual que ").replace(">=", " mayor o igual que ").replace("!=", " distinto de ")
    symbols = {
        "\u00d7": " por ", "\u2264": " menor o igual que ", "\u2265": " mayor o igual que ",
        "\u2212": " menos ", "\u207b": " elevado a menos ", "\u222a": " uni\u00f3n ",
        "\u2229": " intersecci\u00f3n ", "\u222b": " integral de ", "\u221a": " ra\u00edz de ",
        "\u00b9": " uno ", "\u00b2": " al cuadrado ", "\u00b3": " al cubo ",
        "%": " por ciento ", "=": " igual a ", "+": " m\u00e1s ", "/": " dividido entre ",
        "<": " menor que ", ">": " mayor que ", "^": " elevado a ", "|": " barra vertical ",
        "_": " sub\u00edndice ", "(": ", abre par\u00e9ntesis, ", ")": ", cierra par\u00e9ntesis, ",
        "[": ", abre corchete, ", "]": ", cierra corchete, ",
    }
    for symbol, words in symbols.items():
        text = text.replace(symbol, words)
    text = re.sub(r"(?<=\w)-(?=\d)|(?<=\d)\s*-\s*|(?<!\w)-(?=\d)", " menos ", text)
    text = re.sub(r"\d+(?:[.,]\d+)*", spoken_number, text)
    letters = {"B": "be", "C": "ce", "D": "de", "E": "e", "F": "efe", "G": "ge", "H": "hache", "I": "i", "J": "jota", "K": "ka", "L": "ele", "M": "eme", "N": "ene", "O": "o", "P": "pe", "Q": "cu", "R": "erre", "S": "ese", "T": "te", "U": "u", "V": "uve", "W": "uve doble", "X": "equis", "Y": "i griega", "Z": "zeta"}
    text = re.sub(r"\b[B-Z]\b", lambda match: letters[match[0]] + " may\u00fascula", text)
    text = re.sub(r"\b[b-df-hj-np-xz]\b", lambda match: letters[match[0].upper()], text)
    text = text.replace("jStat", "la biblioteca estad\u00edstica")
    return re.sub(r"\s+", " ", text).strip()


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(value, indent=2, ensure_ascii=True) + "\n", encoding="utf-8"
    )
    temporary.replace(path)


def prepare_course(source, output, sections=False):
    source = source.resolve()
    output = output.resolve()
    snapshot = output / "curso.json"
    if snapshot.is_file():
        saved = json.loads(snapshot.read_text(encoding="utf-8"))
        if saved.get("mode", "global") != ("sections" if sections else "global"):
            raise ValueError("The saved course uses another narration mode; use a new output directory")
    export_directory = output / "fuente"
    export_directory.mkdir(parents=True, exist_ok=True)
    node_script = """
import {pathToFileURL} from 'node:url';
const {exportNarration} = await import(pathToFileURL(process.argv[3]));
console.log(JSON.stringify(await exportNarration(process.argv[2], {source:process.argv[1], sections:process.argv[4] === 'sections'})));
"""
    try:
        result = subprocess.run(
            ["node", "--input-type=module", "--eval", node_script, str(source), str(export_directory),
             str(Path(__file__).with_name("export-narration.mjs")), "sections" if sections else "global"],
            check=True, capture_output=True, text=True,
        )
    except subprocess.CalledProcessError as error:
        raise RuntimeError(f"Lecture export failed:\n{error.stderr}") from error
    exported = json.loads(result.stdout)
    course = exported["course"]
    lectures = json.loads((export_directory / "lecturas.json").read_text(encoding="utf-8"))
    by_id = {lecture["id"]: lecture for lecture in lectures}
    planned = []
    for unit in course["units"]:
        unit_directory = f"{unit['number']:02d}-{unit['id']}"
        for position, lesson in enumerate(unit["lessons"], 1):
            lecture = by_id[lesson["id"]]
            directory = output / unit_directory / f"{position:02d}-{lesson['id']}"
            directory.mkdir(parents=True, exist_ok=True)
            transcript = "\n\n".join(scene["caption"] for scene in lecture["scenes"]) + "\n"
            (directory / "guion-original.txt").write_text(transcript, encoding="utf-8")
            for scene_index, scene in enumerate(lecture["scenes"]):
                if sections:
                    scene["spoken_text"] = scene["caption"]
                    for cue in scene["cues"]:
                        cue["spoken_text"] = cue["text"]
                else:
                    caption = (lesson["title"] + ". " if scene_index == 0 else "") + scene["caption"]
                    scene["spoken_text"] = spoken_text(caption)
            narration = "\n\n".join(scene["spoken_text"] for scene in lecture["scenes"]) + "\n"
            (directory / "guion.txt").write_text(narration, encoding="utf-8")
            planned.append({
                "id": lesson["id"], "title": lesson["title"],
                "unit": unit["title"], "unit_id": unit["id"],
                "directory": str(directory.relative_to(output)),
                "source": lecture["source"], "scenes": lecture["scenes"],
                "words": len(transcript.split()),
                "estimated_seconds": lecture["duration"],
                **({key: lesson[key] for key in ("parentLesson", "parentTitle", "sectionId", "sourceSections", "optional")} if sections else {}),
            })
    if len(planned) != len(lectures) or {lesson["id"] for lesson in planned} != set(by_id) or len(by_id) != len(lectures):
        raise ValueError("The course and exported lectures do not match")
    manifest = {
        "title": course["title"], "source_directory": str(source),
        "model": "inclusionAI/Ming-3.0-tts-0.5B", "status": "prepared",
        "normalizer_version": NORMALIZER_VERSION,
        "lesson_count": len(planned), "scene_count": sum(len(lesson["scenes"]) for lesson in planned),
        "word_count": sum(lesson["words"] for lesson in planned),
        "estimated_audio_seconds": sum(lesson["estimated_seconds"] for lesson in planned),
        "lessons": planned,
    }
    if sections:
        manifest.update(mode="sections", parent_lesson_count=exported["parent_lesson_count"],
                        cue_count=sum(len(scene["cues"]) for lesson in planned for scene in lesson["scenes"]))
    write_json(output / "curso.json", manifest)
    return manifest


def load_course(source, output, refresh=False, sections=False):
    snapshot = output / "curso.json"
    if not snapshot.is_file():
        return prepare_course(source, output, sections=sections)
    manifest = json.loads(snapshot.read_text(encoding="utf-8"))
    if manifest.get("mode", "global") != ("sections" if sections else "global"):
        raise ValueError("The saved course uses another narration mode; use a new output directory")
    if manifest.get("normalizer_version") != NORMALIZER_VERSION:
        raise ValueError("The saved course uses another normalizer; prepare a new output directory")
    lessons = manifest["lessons"]
    if len(lessons) != manifest["lesson_count"] or sum(len(lesson["scenes"]) for lesson in lessons) != manifest["scene_count"]:
        raise ValueError("The saved course is incomplete")
    if sections:
        if len({lesson["id"] for lesson in lessons}) != len(lessons) or any(
            lesson["id"] != f"{lesson['parentLesson']}--{lesson['sectionId']}" or len(lesson["scenes"]) != 1
            or any(not cue.get("spoken_text") or cue["spoken_text"] != cue["text"] for cue in lesson["scenes"][0]["cues"])
            for lesson in lessons
        ) or sum(len(scene["cues"]) for lesson in lessons for scene in lesson["scenes"]) != manifest["cue_count"]:
            raise ValueError("The saved section course is incomplete")
        if len({lesson["parentLesson"] for lesson in lessons}) != manifest["parent_lesson_count"]:
            raise ValueError("The saved section parents are incomplete")
    if refresh:
        return prepare_course(source, output, sections=sections)
    return manifest


def main():
    parser = argparse.ArgumentParser(description="Generate all statistics lessons with Ming on CUDA; resume completed fragments.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, help="Batch directory; section mode defaults to a separate audio-secciones batch.")
    parser.add_argument("--ming-code", type=Path, default=os.environ.get("MING_CODE_DIR"))
    parser.add_argument("--model", type=Path, default=os.environ.get("MING_MODEL_DIR"))
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--sections", action="store_true", help="Prepare or resume natural section narration, keyed by section animation ID.")
    parser.add_argument("--refresh", action="store_true", help="Explicitly rebuild a same-mode snapshot with --prepare-only.")
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--lesson", action="append", help="Generate only this lesson or section animation ID; repeat to select several.")
    parser.add_argument("--max-scenes", type=int, help="Stop after this many scenes, including reused scenes.")
    parser.add_argument("--seed", type=int, default=1895)
    args = parser.parse_args()
    if args.max_scenes is not None and args.max_scenes < 1:
        parser.error("--max-scenes must be positive")
    if args.refresh and (not args.prepare_only or args.status):
        parser.error("--refresh requires --prepare-only and cannot be used with --status")
    output = (args.output or (DEFAULT_SECTION_OUTPUT if args.sections else DEFAULT_OUTPUT)).resolve()
    if args.status:
        if (output / "curso.json").is_file():
            load_course(args.source, output, sections=args.sections)
        print((output / "progreso.json").read_text(encoding="utf-8"))
        return
    if not args.prepare_only:
        if args.ming_code is None or not (args.ming_code / "ming_tts.py").is_file():
            parser.error("provide --ming-code or MING_CODE_DIR pointing to the Ming runtime")
        if args.model is None or not (args.model / "model.safetensors").is_file():
            parser.error("provide --model or MING_MODEL_DIR pointing to Ming 0.5B weights")
    output.mkdir(parents=True, exist_ok=True)
    with (output / ".generation.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            parser.error("Another generation is already using this output directory")
        os.environ.setdefault("TQDM_DISABLE", "1")
        try:
            manifest = load_course(args.source, output, refresh=args.refresh, sections=args.sections)
        except ValueError as error:
            parser.error(str(error))
        if args.prepare_only:
            result = {key: value for key, value in manifest.items() if key != "lessons"}
        else:
            result = generate_course(manifest, output, args.seed, args.ming_code.resolve(),
                                     args.model.resolve(), args.lesson, args.max_scenes)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()