import hashlib
import importlib.metadata
import json
import sys
from html.parser import HTMLParser
from pathlib import Path

import av
import numpy as np
from PIL import Image, ImageDraw


SAMPLES = [0, 126, 180, 303, 423, 528, 636, 750, 885, 1026, 1152, 1184]


class PlayerParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.video = []
        self.sources = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "video":
            self.video.append(attributes)
        if tag == "source":
            self.sources.append(attributes)
        for attribute in ["src", "href", "poster"]:
            value = attributes.get(attribute, "")
            assert not value.startswith(("http:", "https:", "//")), "Remote player dependency"
        assert tag not in ["script", "iframe"], "Player must be native and standalone"


def check_player():
    parser = PlayerParser()
    parser.feed(Path("/output/player.html").read_text())
    assert len(parser.video) == len(parser.sources) == 1
    video = parser.video[0]
    assert "controls" in video and "playsinline" in video and "autoplay" not in video
    assert video["poster"] == "poster.jpg" and parser.sources[0]["src"] == "video.mp4"
    assert parser.sources[0]["type"] == "video/mp4"


def audio_packets(path):
    digest = hashlib.sha256()
    count = 0
    with av.open(str(path)) as container:
        for packet in container.demux(audio=0):
            if packet.dts is not None:
                digest.update(bytes(packet))
                count += 1
    return {"packetCount": count, "packetSha256": digest.hexdigest()}


def audio_pcm(path):
    digest = hashlib.sha256()
    count = 0
    with av.open(str(path)) as container:
        for frame in container.decode(audio=0):
            digest.update(frame.to_ndarray().tobytes())
            count += frame.samples
    return {"samples": count, "decodedSha256": digest.hexdigest()}


def normalized_audio_identity(source_path, final_path):
    arrays = []
    for path in [source_path, final_path]:
        with av.open(str(path)) as container:
            arrays.append(np.concatenate([frame.to_ndarray() for frame in container.decode(audio=0)], axis=1))
    source, final = arrays
    padding = final.shape[1] - source.shape[1]
    assert 0 <= padding <= 6615
    matches = [offset for offset in range(padding + 1) if np.array_equal(
        source[:, 22050:22562], final[:, offset + 22050:offset + 22562]
    )]
    assert len(matches) == 1, f"Ambiguous MP3 padding alignment: {matches}"
    offset = matches[0]
    assert np.array_equal(source, final[:, offset:offset + source.shape[1]])
    return {
        "leadingPaddingSamples": offset,
        "trailingPaddingSamples": padding - offset,
        "allNarrationSamplesIdentical": True,
    }


def inspect(path):
    full = path.name == "video.mp4"
    expected = 1185 if full else 30
    cache = Path("/work/.cache")
    samples = {}
    minimum_caption_pixels = 1280 * 720
    with av.open(str(path)) as container:
        stream = container.streams.video[0]
        assert (stream.width, stream.height) == (1280, 720)
        assert stream.average_rate == 30
        count = 0
        first_std = None
        for index, frame in enumerate(container.decode(video=0)):
            pixels = frame.to_ndarray(format="rgb24")
            if first_std is None:
                first_std = float(pixels.std())
            assert abs(float(frame.pts * frame.time_base) - index / 30) < 0.00001
            caption_pixels = int(np.all(pixels[600:705, 64:1216] > 210, axis=2).sum())
            minimum_caption_pixels = min(minimum_caption_pixels, caption_pixels)
            assert caption_pixels > 400, f"Missing permanent caption at frame {index}"
            assert pixels[:588].std() > 15, f"Blank mathematical scene at frame {index}"
            if full and index in SAMPLES:
                samples[index] = frame.to_image()
            if not full and index == 29:
                frame.to_image().save(path.parent / "probe-frame.jpg")
            count += 1
        assert count == expected, f"Unexpected frame count: {count}"
        duration = float(stream.duration * stream.time_base)
        assert abs(duration - expected / 30) < 0.00001
        report = {
            "codec": stream.codec_context.name,
            "pixelFormat": stream.codec_context.format.name,
            "width": stream.width,
            "height": stream.height,
            "fps": str(stream.average_rate),
            "decodedFrames": count,
            "videoDuration": duration,
            "containerDuration": container.duration / 1000000,
            "firstFramePixelStdDev": first_std,
            "minimumCaptionPixelsAcrossAllFrames": minimum_caption_pixels,
        }
        if full:
            audio = container.streams.audio[0]
            report["audio"] = {
                "codec": audio.codec_context.name,
                "sampleRate": audio.codec_context.sample_rate,
                "channels": audio.codec_context.channels,
                "duration": float(audio.duration * audio.time_base),
            }
            assert abs(report["containerDuration"] - 39.5) <= 0.15
    if full:
        check_player()
        source_packets = audio_packets(Path("/shared/audio.mp3"))
        final_packets = audio_packets(path)
        assert source_packets == final_packets, "Original MP3 packets were changed"
        report["audioPacketIdentity"] = final_packets
        report["sourceAudioPcm"] = audio_pcm(Path("/shared/audio.mp3"))
        report["finalAudioPcm"] = audio_pcm(path)
        report["gaplessNormalizedAudioIdentity"] = normalized_audio_identity(Path("/shared/audio.mp3"), path)
        script = json.loads(Path("/shared/script.json").read_text())
        layout = json.loads((cache / "caption-layout.json").read_text())
        assert len(layout) == len(script["cues"]) == 10
        for cue, measured in zip(script["cues"], layout):
            assert cue["text"] == measured["text"] == " ".join(measured["lines"])
            assert (cue["start"], cue["end"]) == (measured["start"], measured["end"])
            assert len(measured["lines"]) <= 2 and max(measured["lineWidthsPx"]) <= 1120
        report["captionCount"] = len(layout)
        report["maximumCaptionLineWidthPx"] = max(max(cue["lineWidthsPx"]) for cue in layout)
        assert [model["probability"] for model in script["models"]] == [0.4, 0.32, 0.3]
        report["modelProbabilities"] = [0.4, 0.32, 0.3]
        samples[528].save("/output/poster.jpg", quality=94, subsampling=0)
        sheet = Image.new("RGB", (1280, 6 * 388), "#171B1C")
        draw = ImageDraw.Draw(sheet)
        for position, (index, image) in enumerate(samples.items()):
            horizontal = (position % 2) * 640
            vertical = (position // 2) * 388
            sheet.paste(image.resize((640, 360)), (horizontal, vertical))
            draw.text((horizontal + 12, vertical + 364), f"frame {index} / {index / 30:.2f}s", fill="white")
            image.save(cache / f"sample-{index:04d}.jpg", quality=93)
        sheet.save(cache / "sample-sheet.jpg", quality=94)
        report["sampledFrames"] = list(samples)
        report["videoBytes"] = path.stat().st_size
        report["sourceAudioSha256"] = script["audioSha256"]
        (cache / "validation.json").write_text(json.dumps(report, indent=2))
        Path("/work/VALIDATION.json").write_text(json.dumps(report, indent=2) + "\n")
        Path("/work/CAPTIONS.json").write_text(json.dumps(layout, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        packages = sorted({distribution.metadata["Name"]: distribution.version
                           for distribution in importlib.metadata.distributions()}.items(), key=lambda item: item[0].lower())
        Path("/work/requirements.lock.txt").write_text("\n".join(f"{name}=={version}" for name, version in packages) + "\n")
    return report


if __name__ == "__main__":
    print(json.dumps(inspect(Path(sys.argv[1])), indent=2))