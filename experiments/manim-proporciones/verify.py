import hashlib
import json
import os
from pathlib import Path

import av
import numpy as np
from PIL import Image, ImageDraw
from scipy.signal import correlate


ROOT = Path(__file__).resolve().parent
story = json.loads((ROOT / "artifacts/story.json").read_text())
audio_root = Path(os.environ.get("COURSE_AUDIO") or ROOT.parent.parent / "static/audio")
source = audio_root / story["audioFile"]
assert hashlib.sha256(source.read_bytes()).hexdigest() == story["audioSha256"]
movie = ROOT / "artifacts/proporciones.mp4"
snapshots = {}
with av.open(str(movie)) as container:
    video = container.streams.video[0]
    assert (video.width, video.height) == (1280, 720)
    assert video.average_rate == 30
    assert video.codec_context.name == "h264"
    assert container.streams.audio[0].codec_context.name == "aac"
    duration = container.duration / av.time_base
    assert abs(duration - story["duration"]) < 0.15
    for index, frame in enumerate(container.decode(video=0)):
        if index in (60, 360, 750, 1050):
            snapshots[index] = frame.to_image()
    frame_count = index + 1
assert frame_count == round(story["duration"] * 30)
assert len(snapshots) == 4
for image in snapshots.values():
    assert np.asarray(image).std() > 25
assert not np.array_equal(np.asarray(snapshots[60]), np.asarray(snapshots[360]))
assert not np.array_equal(np.asarray(snapshots[360])[-95:], np.asarray(snapshots[750])[-95:])


def samples(path):
    with av.open(str(path)) as audio:
        resampler = av.AudioResampler(format="flt", layout="mono", rate=16000)
        chunks = [converted.to_ndarray().ravel()
                  for frame in audio.decode(audio=0)
                  for converted in resampler.resample(frame)]
        chunks.extend(frame.to_ndarray().ravel() for frame in resampler.resample(None))
    return np.concatenate(chunks)


reference = samples(source)
rendered = samples(movie)
prefix_length = 64000
offset = int(np.argmax(correlate(rendered[:prefix_length + 1600],
                                 reference[:prefix_length], mode="valid", method="fft")))
count = min(len(reference), len(rendered) - offset)
correlation = float(np.corrcoef(reference[:count], rendered[offset:offset + count])[0, 1])
assert correlation > 0.99, f"Source narration differs from output: {correlation}"
assert count / 16000 >= story["duration"] - 0.1
snapshots[1050].save(ROOT / "artifacts/poster.jpg", quality=92)
sheet = Image.new("RGB", (1280, 768), "#fcfefd")
drawing = ImageDraw.Draw(sheet)
for slot, (frame_index, image) in enumerate(snapshots.items()):
    column, row = slot % 2, slot // 2
    sheet.paste(image.resize((640, 360)), (column * 640, row * 384 + 24))
    drawing.text((column * 640 + 12, row * 384 + 6), f"{frame_index / 30:g} s", fill="#253330")
sheet.save(ROOT / "artifacts/contact-sheet.jpg", quality=92)
report = {
    "resolution":[1280, 720], "fps":30, "frames":frame_count,
    "sourceDuration":story["duration"], "containerDuration":duration,
    "videoCodec":"h264", "audioCodec":"aac", "bytes":movie.stat().st_size,
    "measuredCues":len(story["cues"]), "sourceAudioSha256":story["audioSha256"],
    "audioCorrelation":round(correlation, 6), "audioEncoderDelaySeconds":offset / 16000,
    "sampledFramesSeconds":[index / 30 for index in snapshots],
    "browserChecked":False, "listened":False
}
(ROOT / "artifacts/verification.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))