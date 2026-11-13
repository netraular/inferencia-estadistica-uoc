import argparse
import fcntl
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import unicodedata
import urllib.parse
import urllib.request
import wave
from decimal import Decimal
from pathlib import Path


GROUP_PREFIX = "course-full-"
MAX_AUDIO_BYTES = 96_000_044
ENGINE = "torchaudio-2.6-voxpopuli-es/forced-align"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(value):
    return hashlib.sha256(value).hexdigest()


def save(path, value):
    temporary = path.with_name(f"{path.name}.{os.getpid()}.tmp")
    try:
        with temporary.open("xb") as stream:
            stream.write(value)
            stream.flush()
            os.fsync(stream.fileno())
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def save_json(path, value):
    save(path, (json.dumps(value, ensure_ascii=False, allow_nan=False, indent=2) + "\n").encode())


def fetch_json(url):
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=60) as response:
        value = response.read(10_000_001)
    require(len(value) <= 10_000_000, "Queue metadata response exceeds limit")
    return json.loads(value)


def completed_jobs(endpoint, group):
    jobs = []
    offset = 0
    while True:
        query = urllib.parse.urlencode({"group": group, "filter": "all", "limit": 200, "offset": offset})
        page = fetch_json(f"{endpoint}/api/jobs?{query}")
        require(isinstance(page.get("jobs"), list), "Invalid queue page")
        jobs.extend(page["jobs"])
        offset += len(page["jobs"])
        if offset >= page["total"]:
            return ([job for job in jobs if job["status"] == "completed"],
                    {json.loads(job["source_ref"])["itemId"] for job in jobs})
        require(page["jobs"], "Queue pagination did not advance")


def wav_duration(path):
    with wave.open(str(path), "rb") as audio:
        require((audio.getnchannels(), audio.getsampwidth(), audio.getframerate(), audio.getcomptype())
                == (1, 2, 24000, "NONE"), "Expected original mono PCM16/24kHz WAV")
        require(audio.getnframes() > 0, "Empty WAV")
        return audio.getnframes() / audio.getframerate()


def download(endpoint, job, directory):
    require(re.fullmatch(r"[a-f0-9-]{36}", job["id"]), "Invalid queue job id")
    target = directory / f"{job['id']}.wav"
    checksum = target.with_suffix(".sha256")
    if target.exists() and checksum.exists():
        require(digest(target.read_bytes()) == checksum.read_text().strip(), "Cached WAV checksum changed")
        require(abs(wav_duration(target) - job["duration"]) < 1 / 24000, "Cached WAV duration differs from queue")
        return target
    require(not target.exists(), "Unsealed cached WAV requires manual review")
    temporary = target.with_suffix(".download")
    temporary.unlink(missing_ok=True)
    try:
        with urllib.request.urlopen(f"{endpoint}/audio/{job['id']}.wav", timeout=120) as response, temporary.open("xb") as stream:
            total = 0
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                require(total <= MAX_AUDIO_BYTES, "WAV exceeds download limit")
                stream.write(chunk)
            stream.flush()
            os.fsync(stream.fileno())
        measured = wav_duration(temporary)
        require(abs(measured - job["duration"]) < 1 / 24000, "Queue duration differs from downloaded WAV")
        temporary.replace(target)
        save(checksum, (digest(target.read_bytes()) + "\n").encode())
    finally:
        temporary.unlink(missing_ok=True)
    return target


def original_cues(item):
    return [{"sceneIndex": scene_index, "cueIndex": cue_index, "text": cue["text"]}
            for scene_index, scene in enumerate(item["animation"]["steps"])
            for cue_index, cue in enumerate(scene["cues"])]


def prepare_item(item, jobs, source_sha, endpoint, output):
    cues = original_cues(item)
    ordered = sorted(jobs, key=lambda job: job["source"]["part"])
    parts = ordered[0]["source"]["parts"]
    require(len({job["source"]["part"] for job in ordered}) == len(ordered), "Duplicate video parts")
    if len(ordered) != parts:
        return None
    directory = output / "items" / item["id"]
    directory.mkdir(parents=True, exist_ok=True)
    part_directory = directory / "parts"
    part_directory.mkdir(exist_ok=True)
    cursor = 0
    duration = 0
    sources = []
    for part, job in enumerate(ordered):
        source = job["source"]
        require(source["catalogueSha256"] == source_sha and source["canonicalSha256"] == item["canonicalSha256"], "Stale source catalogue")
        require(source["part"] == part and source["parts"] == parts and source["firstCue"] == cursor, "Missing or unordered source cues")
        require(job["voice"] == "Puck" and job["style"] == item["queueStyle"], "Queue voice/style changed")
        text = "\n\n".join(cue["text"] for cue in cues[cursor:cursor + source["cueCount"]])
        require(text == job["text"] and digest(text.encode()) == source["textSha256"], "Original narration changed")
        cursor += source["cueCount"]
        audio = download(endpoint, job, part_directory)
        part_duration = wav_duration(audio)
        sources.append({"jobId": job["id"], "part": part, "firstCue": source["firstCue"],
                        "cueCount": source["cueCount"], "offset": duration, "duration": part_duration,
                        "wavSha256": digest(audio.read_bytes()), "path": str(audio.relative_to(directory))})
        duration += part_duration
    require(cursor == len(cues), "Video does not cover every original cue")
    snapshot = {"version": 1, "id": item["id"], "catalogueSha256": source_sha,
                "canonicalSha256": item["canonicalSha256"], "duration": duration, "parts": sources, "cues": cues}
    snapshot_path = directory / "source.json"
    if snapshot_path.exists():
        require(json.loads(snapshot_path.read_text()) == snapshot, "Prepared source changed; use a new output directory")
    else:
        save_json(snapshot_path, snapshot)
    return directory, snapshot


def load_aligner(threads):
    import numpy as np
    import torch
    import torchaudio

    torch.set_num_threads(threads)
    torch.set_num_interop_threads(1)
    bundle = torchaudio.pipelines.VOXPOPULI_ASR_BASE_10K_ES
    require(bundle.sample_rate == 16000, "Unexpected alignment sample rate")
    model = bundle.get_model().eval().to("cpu")
    return np, torch, torchaudio, model, bundle.get_labels()


def emissions(path, runtime):
    np, torch, _, model, _ = runtime
    decoded = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-f", "f32le",
                              "-ac", "1", "-ar", "16000", "pipe:1"], check=True, stdout=subprocess.PIPE).stdout
    audio = np.frombuffer(decoded, dtype="<f4").copy()
    stride = 320
    receptive_field = 400
    frames = (len(audio) - receptive_field) // stride + 1
    require(frames > 0, "Audio too short for alignment")
    matrices = []
    for core_start in range(0, len(audio), 192000):
        first_frame = core_start // stride
        last_frame = min((core_start + 192000) // stride, frames)
        if last_frame <= first_frame:
            break
        start = max(0, core_start - 16000)
        end = min(len(audio), core_start + 192000 + 16000)
        with torch.inference_mode():
            logits, _ = model(torch.from_numpy(audio[start:end]).unsqueeze(0))
            require(logits.shape[1] == (end - start - receptive_field) // stride + 1, "Unexpected encoder stride")
            local_start = (core_start - start) // stride
            matrix = torch.log_softmax(logits[0, local_start:local_start + last_frame - first_frame], dim=-1).numpy()
        matrices.append(matrix)
        print(json.dumps({"state": "encoding", "seconds": round(min(end, len(audio)) / 16000, 1)}), flush=True)
    result = np.concatenate(matrices)
    require(len(result) == frames and np.isfinite(result).all(), "Incomplete acoustic emissions")
    return result


def align_part(path, cues, runtime, min_score, pronunciations):
    from num2words import num2words

    _, torch, torchaudio, _, labels = runtime
    vocabulary = {label.casefold(): index for index, label in enumerate(labels)}
    words = []
    tokens = []
    ranges = []
    for cue in cues:
        for match in re.finditer(r"\S+", cue["text"]):
            text = match.group()
            spoken = pronunciations.get(text, text)
            spoken = re.sub(r"(?<!\w)\d+(?:[.,]\d+)?(?!\w)",
                            lambda number: num2words(Decimal(number.group().replace(",", ".")), lang="es").replace("punto", "coma"), spoken)
            letters = []
            unsupported = []
            for character in unicodedata.normalize("NFC", spoken.casefold()):
                if character.isspace():
                    character = "|"
                if character in vocabulary and vocabulary[character] != 0:
                    letters.append(vocabulary[character])
                elif character.isalnum() or unicodedata.category(character).startswith("S") or character in "-\\_":
                    unsupported.append(character)
            if not letters and not unsupported:
                continue
            require(letters, f"Unalignable word requires a pronunciation mapping: {text}")
            words.append({**cue, "text": text, "alignmentText": spoken, "charStart": match.start(), "charEnd": match.end(),
                          "unsupportedCharacters": sorted(set(unsupported))})
            ranges.append((len(tokens), len(tokens) + len(letters)))
            tokens.extend(letters)
            tokens.append(vocabulary["|"])
    tokens.pop()
    matrix = emissions(path, runtime)
    require(len(matrix) * len(tokens) <= 500_000_000, "Alignment exceeds memory budget; use smaller narration blocks")
    alignment, scores = torchaudio.functional.forced_align(torch.from_numpy(matrix).unsqueeze(0),
                                                         torch.tensor([tokens], dtype=torch.int64), blank=0)
    spans = torchaudio.functional.merge_tokens(alignment[0], scores[0], blank=0)
    require([span.token for span in spans] == tokens, "Alignment lost original characters")
    previous_end = 0
    duration = wav_duration(path)
    for word, (first, last) in zip(words, ranges):
        selected = spans[first:last]
        start = selected[0].start * 0.02 + 0.0125
        end = min(duration, selected[-1].end * 0.02 + 0.0125)
        score = sum(span.score * (span.end - span.start) for span in selected) / sum(span.end - span.start for span in selected)
        require(all(math.isfinite(value) for value in (start, end, score)), "Non-finite alignment")
        word.update(start=start, end=end, score=float(score))
        word["needsReview"] = bool(word["unsupportedCharacters"] or score < min_score or start < previous_end or end <= start)
        previous_end = end
    return words


def timestamp(seconds):
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    whole_seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{whole_seconds:02}.{milliseconds:03}"


def cue_moments(scenes):
    return [{"id": f"scene-{cue['sceneIndex']}-cue-{cue['cueIndex']}",
             "kind": "scene-start" if cue["cueIndex"] == 0 else "cue", **cue}
            for scene in scenes for cue in scene["cues"]]


def align_item(directory, snapshot, runtime, min_score, anchors, pronunciations):
    destination = directory / "alignment.json"
    if destination.exists():
        previous = json.loads(destination.read_text())
        require(previous["sourceSha256"] == digest((directory / "source.json").read_bytes()), "Alignment source changed")
        require(previous["engine"] == ENGINE and previous["minScore"] == min_score and previous["anchors"] == anchors
            and previous["pronunciations"] == pronunciations, "Alignment options changed; use a new output directory")
        if "cueMoments" not in previous:
            previous["cueMoments"] = cue_moments(previous["scenes"])
            save_json(destination, previous)
        return previous
    words = []
    for part in snapshot["parts"]:
        selected = snapshot["cues"][part["firstCue"]:part["firstCue"] + part["cueCount"]]
        aligned = align_part(directory / part["path"], selected, runtime, min_score, pronunciations)
        for word in aligned:
            word["start"] += part["offset"]
            word["end"] += part["offset"]
        words.extend(aligned)
    scenes = []
    for cue in snapshot["cues"]:
        matching = [word for word in words if (word["sceneIndex"], word["cueIndex"]) == (cue["sceneIndex"], cue["cueIndex"])]
        require(matching, "Missing aligned cue")
        entry = {**cue, "start": matching[0]["start"], "end": matching[-1]["end"],
                 "score": min(word["score"] for word in matching), "needsReview": any(word["needsReview"] for word in matching)}
        if len(scenes) == cue["sceneIndex"]:
            scenes.append({"start": entry["start"], "end": entry["end"], "cues": []})
        scenes[-1]["cues"].append(entry)
        scenes[-1]["end"] = entry["end"]
    normalize = lambda text: re.findall(r"\w+", unicodedata.normalize("NFC", text.casefold()))
    moments = []
    for anchor in anchors:
        wanted = normalize(anchor["text"])
        matches = []
        for first in range(len(words)):
            if any(anchor.get(key, words[first][key]) != words[first][key] for key in ("sceneIndex", "cueIndex")):
                continue
            found = []
            for last in range(first, len(words)):
                found.extend(normalize(words[last]["text"]))
                if len(found) >= len(wanted):
                    if wanted and found == wanted:
                        matches.append((first, last))
                    break
        require(len(matches) == 1, f"Anchor must identify exactly one occurrence: {anchor['id']}")
        first, last = matches[0]
        moments.append({**anchor, "start": words[first]["start"], "end": words[last]["end"],
                        "needsReview": any(word["needsReview"] for word in words[first:last + 1])})
    result = {"version": 1, "id": snapshot["id"], "catalogueSha256": snapshot["catalogueSha256"],
              "canonicalSha256": snapshot["canonicalSha256"], "sourceSha256": digest((directory / "source.json").read_bytes()),
              "engine": ENGINE, "minScore": min_score, "cueTiming": "forced-aligned", "listened": False,
              "duration": snapshot["duration"], "needsReview": any(word["needsReview"] for word in words),
              "words": words, "scenes": scenes, "cueMoments": cue_moments(scenes),
              "anchors": anchors, "moments": moments, "pronunciations": pronunciations}
    captions = ["WEBVTT", "", "NOTE Forced alignment; consult alignment.json for review flags.", ""]
    for scene in scenes:
        for cue in scene["cues"]:
            if cue["end"] > cue["start"]:
                captions.extend([f"{timestamp(cue['start'])} --> {timestamp(cue['end'])}", cue["text"], ""])
    save(directory / "audio.vtt", ("\n".join(captions) + "\n").encode())
    save_json(destination, result)
    return result


def prepare_video_audio(directory, snapshot, aligned, batch):
    alignment_sha = digest((directory / "alignment.json").read_bytes())
    target = batch / "items" / snapshot["id"]
    target.mkdir(parents=True, exist_ok=True)
    metadata_path = target / "audio.json"
    mp3_path = target / "audio.mp3"
    if metadata_path.exists():
        previous = json.loads(metadata_path.read_text())
        require(previous["alignmentSha256"] == alignment_sha, "Prepared alignment changed; use a new video batch")
        require(previous["mp3Sha256"] == digest(mp3_path.read_bytes()), "Prepared MP3 checksum changed")
        return previous
    require(not mp3_path.exists(), "Unsealed prepared MP3 requires manual review")
    temporary_wav = target / f".audio-{os.getpid()}.wav"
    temporary_mp3 = target / f".audio-{os.getpid()}.mp3"
    try:
        with wave.open(str(temporary_wav), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(24000)
            for part in snapshot["parts"]:
                source = directory / part["path"]
                require(digest(source.read_bytes()) == part["wavSha256"], "Original queue WAV changed")
                with wave.open(str(source), "rb") as audio:
                    while frames := audio.readframes(65536):
                        output.writeframesraw(frames)
        require(abs(wav_duration(temporary_wav) - snapshot["duration"]) < 1 / 24000, "Concatenated audio duration changed")
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(temporary_wav),
                        "-map_metadata", "-1", "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame",
                        "-b:a", "96k", str(temporary_mp3)], check=True)
        mp3 = temporary_mp3.read_bytes()
        require(mp3, "Empty prepared MP3")
        metadata = {"version": 1, "complete": True, "id": snapshot["id"],
                    "model": "gemini-3.8-flash-tts", "voice": "Puck", "cueTiming": "forced-aligned",
                    "temporary": True, "listened": False, "needsReview": aligned["needsReview"],
                    "canonicalSha256": snapshot["canonicalSha256"], "duration": snapshot["duration"],
                    "mp3Sha256": digest(mp3), "mp3Bytes": len(mp3), "scenes": aligned["scenes"],
                    "alignmentSha256": alignment_sha, "alignmentEngine": aligned["engine"],
                    "sourceSha256": aligned["sourceSha256"], "catalogueSha256": snapshot["catalogueSha256"],
                    "queueParts": [{key: part[key] for key in ("jobId", "part", "offset", "duration", "wavSha256")}
                                   for part in snapshot["parts"]]}
        temporary_mp3.replace(mp3_path)
        save_json(metadata_path, metadata)
        return metadata
    finally:
        temporary_wav.unlink(missing_ok=True)
        temporary_mp3.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description="Align completed long Gemini narrations locally; never submits synthesis requests.")
    parser.add_argument("--catalogue", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--endpoint", default="https://tts.raular.com")
    parser.add_argument("--ids", help="Comma-separated original video IDs; default: all completed videos")
    parser.add_argument("--anchors", type=Path, help='JSON object mapping video IDs to [{"id": "...", "text": "..."}]')
    parser.add_argument("--pronunciations", type=Path, help="JSON object mapping exact source tokens to Spanish spoken forms")
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--min-score", type=float, default=-1.5)
    parser.add_argument("--download-only", action="store_true")
    parser.add_argument("--video-batch", type=Path, help="Prepare provisional MP3/timing inputs in a separate immutable Remotion batch")
    args = parser.parse_args()
    require(1 <= args.threads <= 8 and math.isfinite(args.min_score), "Invalid alignment settings")
    require(not (args.download_only and args.video_batch), "Video preparation requires acoustic alignment")
    endpoint = args.endpoint.rstrip("/")
    require(urllib.parse.urlsplit(endpoint).scheme == "https", "Queue endpoint must use HTTPS")
    catalogue_bytes = args.catalogue.read_bytes()
    require(not args.output.resolve().is_relative_to(args.catalogue.resolve().parent), "Use a separate alignment output, not the original source batch")
    catalogue = json.loads(catalogue_bytes)
    require(catalogue["version"] == 1 and catalogue["model"] == "gemini-3.8-flash-tts" and catalogue["voice"] == "Puck", "Incompatible source catalogue")
    source_sha = digest(catalogue_bytes)
    items = {item["id"]: item for item in catalogue["items"]}
    selected = set(args.ids.split(",")) if args.ids else set(items)
    require(selected <= items.keys(), "Unknown requested video ID")
    anchors = json.loads(args.anchors.read_text()) if args.anchors else {}
    require(isinstance(anchors, dict) and set(anchors) <= items.keys(), "Invalid anchor catalogue")
    for entries in anchors.values():
        require(isinstance(entries, list), "Expected a list of anchors per video")
        require(all(isinstance(entry, dict) and isinstance(entry.get("id"), str) and entry["id"].strip()
                    and isinstance(entry.get("text"), str) and entry["text"].strip() for entry in entries), "Invalid anchor")
        require(len({entry["id"] for entry in entries}) == len(entries), "Duplicate anchor IDs")
    pronunciations = json.loads(args.pronunciations.read_text()) if args.pronunciations else {}
    require(isinstance(pronunciations, dict) and all(isinstance(key, str) and isinstance(value, str) and value.strip()
                                                  for key, value in pronunciations.items()), "Invalid pronunciations")
    args.output.mkdir(parents=True, exist_ok=True)
    with (args.output / ".alignment.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        frozen = args.output / "catalogue.json"
        if frozen.exists():
            require(frozen.read_bytes() == catalogue_bytes, "Frozen catalogue changed")
        else:
            save(frozen, catalogue_bytes)
        if args.video_batch:
            require(args.video_batch.is_absolute(), "Video batch must be absolute")
            require(not args.video_batch.resolve().is_relative_to(args.catalogue.resolve().parent)
                    and not args.video_batch.resolve().is_relative_to(args.output.resolve()), "Use a separate video batch")
            args.video_batch.mkdir(parents=True, exist_ok=True)
            video_catalogue = args.video_batch / "catalogue.json"
            if video_catalogue.exists():
                require(video_catalogue.read_bytes() == catalogue_bytes, "Video catalogue changed")
            else:
                save(video_catalogue, catalogue_bytes)
        grouped = {}
        completed, queued_items = completed_jobs(endpoint, GROUP_PREFIX + source_sha[:24])
        require(queued_items <= items.keys(), "Queue contains unknown source items")
        for job in completed:
            source = json.loads(job["source_ref"])
            require(source.get("narrationMode") in ("whole-video", "video-part"), "Individual-phrase jobs are not accepted")
            require(source["itemId"] in items, "Unknown queue source item")
            if source["itemId"] in selected:
                grouped.setdefault(source["itemId"], []).append({**job, "source": source})
        runtime = None
        report = []
        for item_id, jobs in grouped.items():
            item = {**items[item_id], "queueStyle": catalogue["style"]}
            prepared = prepare_item(item, jobs, source_sha, endpoint, args.output)
            if prepared is None:
                report.append({"id": item_id, "state": "waiting-for-parts"})
                continue
            directory, snapshot = prepared
            if args.download_only:
                report.append({"id": item_id, "state": "downloaded", "parts": len(snapshot["parts"])})
            else:
                if runtime is None and not (directory / "alignment.json").exists():
                    runtime = load_aligner(args.threads)
                aligned = align_item(directory, snapshot, runtime, args.min_score, anchors.get(item_id, []), pronunciations)
                if args.video_batch:
                    prepare_video_audio(directory, snapshot, aligned, args.video_batch)
                report.append({"id": item_id, "state": "needs-review" if aligned["needsReview"] else "aligned",
                               "words": len(aligned["words"]), "moments": len(aligned["cueMoments"]) + len(aligned["moments"])})
            print(json.dumps(report[-1]), flush=True)
        missing = selected.intersection(queued_items) - grouped.keys()
        summary = {"version": 1, "catalogueSha256": source_sha, "items": report, "waitingForAudio": sorted(missing),
               "notInLongQueue": sorted(selected - queued_items)}
        save_json(args.output / "alignment-progress.json", summary)
        print(json.dumps({"processed": len(report), "waitingForAudio": len(missing), "synthesisRequests": 0}), flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)