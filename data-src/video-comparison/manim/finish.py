import hashlib
import heapq
import json
from pathlib import Path

import av


def packets(container, output_stream):
    for packet in container.demux():
        if packet.dts is None:
            continue
        timestamp = packet.dts * packet.time_base
        packet.stream = output_stream
        yield timestamp, packet


def finish():
    script = json.loads(Path("/shared/script.json").read_text())
    audio_path = Path("/shared/audio.mp3")
    assert hashlib.sha256(audio_path.read_bytes()).hexdigest() == script["audioSha256"]
    movie_path = Path("/work/.cache/full/videos/scene/720p30/ProbabilityArea.mp4")
    with av.open(str(movie_path)) as movie, av.open(str(audio_path)) as audio:
        with av.open("/output/video.mp4", "w", options={"movflags": "+faststart"}) as output:
            video_stream = output.add_stream(template=movie.streams.video[0])
            audio_stream = output.add_stream(template=audio.streams.audio[0])
            for _, packet in heapq.merge(packets(movie, video_stream), packets(audio, audio_stream), key=lambda item: item[0]):
                output.mux(packet)
    print("Muxed original H.264 and MP3 packets without re-encoding, trimming or resampling")


if __name__ == "__main__":
    finish()