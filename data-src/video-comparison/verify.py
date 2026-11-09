import hashlib
import json
from pathlib import Path

import av
import numpy as np
from PIL import Image, ImageDraw
from scipy.signal import correlate


ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "static/comparativa-videos"
SOURCE = ROOT / "data-src/video-comparison"
STORY = json.loads((MEDIA / "shared/script.json").read_text())
AUDIO = MEDIA / "shared/audio.mp3"
assert hashlib.sha256(AUDIO.read_bytes()).hexdigest() == STORY["audioSha256"]
TECHNOLOGIES = [
    ("actual", "Tecnologia actual", "Konva 10.9.1 / GSAP 3.15.1 / MathJax 3.2.1"),
    ("manim", "Manim Community", "Manim Community 0.19.0"),
    ("remotion", "Remotion", "Remotion 4.0.542 / React 18.3.1"),
    ("canvas-commons", "Canvas Commons", "Canvas Commons 0.4.0"),
]


def audio_samples(path):
    with av.open(str(path)) as container:
        resampler = av.AudioResampler(format="flt", layout="mono", rate=16000)
        chunks = [converted.to_ndarray().ravel()
                  for frame in container.decode(audio=0)
                  for converted in resampler.resample(frame)]
        chunks.extend(frame.to_ndarray().ravel() for frame in resampler.resample(None))
    return np.concatenate(chunks)


def packets(path):
    with av.open(str(path)) as container:
        return [hashlib.sha256(bytes(packet)).hexdigest()
                for packet in container.demux(audio=0) if packet.size]


reference = audio_samples(AUDIO)
reference_packets = packets(AUDIO)
sample_indices = {round((cue["start"] + cue["end"]) * 15) for cue in STORY["cues"]}
sample_indices.update([683, 684, 869, 918, 959, 960, 1143])
review = SOURCE / ".cache/review"
review.mkdir(parents=True, exist_ok=True)
results = []
for technology, title, version in TECHNOLOGIES:
    path = MEDIA / technology / "video.mp4"
    snapshots = {}
    with av.open(str(path)) as container:
        stream = container.streams.video[0]
        assert (stream.width, stream.height) == (STORY["width"], STORY["height"]), technology
        assert stream.average_rate == STORY["fps"], technology
        assert stream.codec_context.name == "h264", technology
        video_duration = float(stream.duration * stream.time_base)
        container_duration = container.duration / av.time_base
        audio_codec = container.streams.audio[0].codec_context.name
        assert abs(video_duration - STORY["duration"]) < 1 / STORY["fps"], technology
        assert abs(container_duration - STORY["duration"]) < 0.15, technology
        count = 0
        for index, frame in enumerate(container.decode(video=0)):
            assert abs(float(frame.pts * frame.time_base) - index / STORY["fps"]) < 0.001, technology
            count += 1
            if index in sample_indices:
                image = frame.to_image()
                pixels = np.asarray(image)
                assert pixels[:580].std() > 15, f"Blank scene: {technology} frame {index}"
                snapshots[index] = image
        assert count == STORY["frames"], technology
    for cue in STORY["cues"]:
        index = round((cue["start"] + cue["end"]) * 15)
        caption = np.asarray(snapshots[index])[625:]
        light = np.all(caption > 185, axis=2)
        assert np.count_nonzero(light) > 800, f"Missing caption: {technology} frame {index}"
    rendered = audio_samples(path)
    prefix = 64000
    offset = int(np.argmax(correlate(rendered[:prefix + 1600], reference[:prefix],
                                     mode="valid", method="fft")))
    length = min(len(reference), len(rendered) - offset)
    similarity = float(np.corrcoef(reference[:length], rendered[offset:offset + length])[0, 1])
    assert similarity > 0.99, f"Narration changed: {technology} ({similarity})"
    assert length / 16000 >= STORY["duration"] - 0.12, technology
    if not (MEDIA / technology / "poster.jpg").exists():
        snapshots[round((15.9 + 19.1) * 15)].save(MEDIA / technology / "poster.jpg", quality=92)
    sheet = Image.new("RGB", (1280, 264), "#fcfefd")
    draw = ImageDraw.Draw(sheet)
    for slot, index in enumerate([525, 918, 1143]):
        image = snapshots[index].resize((426, 240))
        sheet.paste(image, (slot * 426, 24))
        draw.text((slot * 426 + 10, 6), f"{technology}: {index / 30:.1f} s", fill="#253330")
    sheet.save(review / f"{technology}.jpg", quality=94)
    result = {
        "id":technology, "title":title, "versions":version,
        "width":STORY["width"], "height":STORY["height"], "fps":STORY["fps"],
        "frames":count, "videoDuration":round(video_duration, 6),
        "containerDuration":round(container_duration, 6), "bytes":path.stat().st_size,
        "videoCodec":"h264", "audioCodec":audio_codec,
        "sourceAudioSha256":STORY["audioSha256"],
        "audioCorrelation":round(similarity, 6), "audioOffsetSeconds":offset / 16000,
        "originalAudioPacketsPreserved":packets(path) == reference_packets,
        "measuredCaptions":len(STORY["cues"]), "decodedSamples":len(snapshots),
        "probabilities":[model["probability"] for model in STORY["models"]],
        "checked":True, "websiteBrowserChecked":False, "listened":False,
    }
    if technology == "canvas-commons":
        evidence = SOURCE / technology / "work/render-checks.json"
        if not evidence.exists():
            evidence = SOURCE / technology / "RENDER-CHECKS.json"
        checks = json.loads(evidence.read_text())
        assert checks["count"] == STORY["frames"]
        assert checks["result"] == 0
        assert [{key:cue[key] for key in ["start", "end", "text"]}
                for cue in checks["checks"]["captions"]] == STORY["cues"]
        assert all(len(cue["lines"]) <= 2 and max(cue["widths"]) <= 1120
                   for cue in checks["checks"]["captions"])
        (SOURCE / technology / "VALIDATION.json").write_text(json.dumps(result, indent=2) + "\n")
    results.append(result)
    print(json.dumps(result))
(MEDIA / "shared/results.json").write_text(json.dumps(results, indent=2) + "\n")