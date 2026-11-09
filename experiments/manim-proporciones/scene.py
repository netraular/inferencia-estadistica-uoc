import json
import os
from pathlib import Path
from textwrap import wrap

import av
from manim import (
    DOWN, RIGHT, Circle, FadeIn, FadeOut, Indicate, LaggedStart,
    MathTex, Rectangle, Scene, Text, TransformMatchingTex, VGroup, config,
)


ROOT = Path(__file__).resolve().parent
INK = "#253330"
TEAL = "#117568"
ROSE = "#ad3459"
MUTED = "#64736e"
PAPER = "#fcfefd"


def label(value, position, size=28, color=INK):
    return Text(value, font="DejaVu Sans", font_size=size, color=color).move_to(position)


def formula(tex, position, color=TEAL):
    result = MathTex(tex, font_size=38, color=color).move_to(position)
    if result.width > 5.6:
        result.scale_to_fit_width(5.6)
    return result


def seeds(total, part, columns, position, color):
    spacing = 3.9 / columns
    result = VGroup(*[
        Circle(radius=spacing * 0.31, stroke_width=0, fill_opacity=1,
               fill_color=color if index < part else "#dce7e1")
        .move_to(((index % columns) * spacing, -(index // columns) * spacing, 0))
        for index in range(total)
    ])
    return result.move_to(position)


def probability_bar(part, total, position, color):
    background = Rectangle(width=4.5, height=0.52, stroke_width=0,
                           fill_color="#dce7e1", fill_opacity=1).move_to(position)
    fill = Rectangle(width=4.5 * part / total, height=0.52, stroke_width=0,
                     fill_color=color, fill_opacity=1).align_to(background, -RIGHT)
    fill.set_y(background.get_y())
    return VGroup(background, fill)


def decode_narration(source, destination):
    with av.open(str(source)) as audio, av.open(str(destination), "w") as output:
        layout = audio.streams.audio[0].layout.name
        stream = output.add_stream("pcm_s16le", rate=44100)
        stream.layout = layout
        resampler = av.AudioResampler(format="s16", layout=layout, rate=44100)
        for frame in audio.decode(audio=0):
            for converted in resampler.resample(frame):
                for packet in stream.encode(converted):
                    output.mux(packet)
        for converted in resampler.resample(None):
            for packet in stream.encode(converted):
                output.mux(packet)
        for packet in stream.encode(None):
            output.mux(packet)


class Proporciones(Scene):
    def at(self, milestone, *animations, run_time=0.8):
        target = self.story["milestones"][milestone]
        remaining = target - self.time
        if remaining < -1 / config.frame_rate:
            raise ValueError(f"Animation overruns narration milestone: {milestone}")
        if remaining > 1 / config.frame_rate:
            self.wait(remaining, frozen_frame=False)
        self.play(*animations, run_time=run_time)

    def captions(self):
        band = Rectangle(width=config.frame_width, height=1.05, stroke_width=0,
                         fill_color=INK, fill_opacity=1).to_edge(DOWN, buff=0)
        text = VGroup()
        active = [None]

        def update(caption):
            cue = next((index for index, item in enumerate(self.story["cues"])
                        if item["start"] <= self.time < item["end"]), None)
            if cue == active[0]:
                return
            active[0] = cue
            if cue is None:
                caption.become(VGroup())
                return
            content = "\n".join(wrap(self.story["cues"][cue]["text"], width=86))
            rendered = label(content, band.get_center(), size=22, color=PAPER)
            if rendered.width > config.frame_width - 0.65:
                rendered.scale_to_fit_width(config.frame_width - 0.65)
            if rendered.height > 0.83:
                rendered.scale_to_fit_height(0.83)
            caption.become(VGroup(rendered))
            caption.set_z_index(21)

        text.add_updater(update)
        band.set_z_index(20)
        text.set_z_index(21)
        self.add(band, text)

    def construct(self):
        self.story = json.loads((ROOT / "artifacts/story.json").read_text())
        audio_root = Path(os.environ.get("COURSE_AUDIO") or ROOT.parent.parent / "static/audio")
        narration = ROOT / ".cache/narration.wav"
        narration.parent.mkdir(exist_ok=True)
        decode_narration(audio_root / self.story["audioFile"], narration)
        self.add_sound(str(narration))
        self.camera.background_color = PAPER
        self.captions()

        title = label("Comparar semillas, no solo recuentos", (0, 3.15, 0), size=32)
        tray_a = label("BANDEJA A", (-3.5, 2.35, 0), size=22, color=TEAL)
        tray_b = label("BANDEJA B", (3.5, 2.35, 0), size=22, color=ROSE)
        count_a = label("18", (-3.5, 0.85, 0), size=76, color=TEAL)
        count_b = label("30", (3.5, 0.85, 0), size=76, color=ROSE)
        question = label("\u00bfCu\u00e1l ha germinado mejor?", (0, -1.4, 0), size=30)
        missing = label("Falta el total", (0, -1.4, 0), size=30)
        self.add(title, tray_a, tray_b)
        self.play(FadeIn(count_a), FadeIn(count_b), run_time=0.6)
        self.at("question", FadeIn(question))
        self.at("missing_total", FadeOut(question), FadeIn(missing))

        grid_a = seeds(72, 18, 12, (-3.5, 0.75, 0), TEAL)
        total_a = label("18 germinadas / 72 sembradas", (-3.5, 1.9, 0), size=22)
        self.at("tray_a", FadeOut(count_a), FadeOut(missing), FadeIn(total_a),
                LaggedStart(*[FadeIn(seed) for seed in grid_a], lag_ratio=0.008), run_time=1.2)
        self.remove(*grid_a)
        self.add(grid_a)
        equation_a = formula(r"p_A=\frac{18}{72}", (-3.5, -0.85, 0))
        self.at("divide", FadeIn(equation_a))
        decimal_a = formula(r"p_A=\frac{18}{72}=0{,}25", (-3.5, -0.85, 0))
        self.at("decimal_a", TransformMatchingTex(equation_a, decimal_a))
        quarter = VGroup(*[
            Circle(radius=0.15, stroke_width=0, fill_opacity=1,
                   fill_color=TEAL if index == 0 else "#dce7e1")
            for index in range(4)
        ]).arrange(RIGHT, buff=0.22).move_to((-3.5, -1.65, 0))
        quarter_text = label("1 de cada 4", (-3.5, -2.12, 0), size=20)
        self.at("quarter", FadeIn(quarter), FadeIn(quarter_text))

        grid_b = seeds(200, 30, 20, (3.5, 0.75, 0), ROSE)
        total_b = label("30 germinadas / 200 sembradas", (3.5, 1.9, 0), size=22)
        self.at("tray_b", FadeOut(count_b), FadeIn(total_b),
                LaggedStart(*[FadeIn(seed) for seed in grid_b], lag_ratio=0.003), run_time=1.2)
        self.remove(*grid_b)
        self.add(grid_b)
        equation_b = formula(r"p_B=\frac{30}{200}", (3.5, -0.85, 0), ROSE)
        decimal_b = formula(r"p_B=\frac{30}{200}=0{,}15", (3.5, -0.85, 0), ROSE)
        self.add(equation_b)
        self.at("decimal_b", TransformMatchingTex(equation_b, decimal_b))

        bar_a = probability_bar(18, 72, (-3.5, 0.65, 0), TEAL)
        bar_b = probability_bar(30, 200, (3.5, 0.65, 0), ROSE)
        percent_a = label("25 %", (-3.5, -0.05, 0), size=46, color=TEAL)
        percent_b = label("15 %", (3.5, -0.05, 0), size=46, color=ROSE)
        self.at("compare", FadeOut(grid_a), FadeOut(grid_b), FadeOut(quarter),
                FadeOut(quarter_text), FadeIn(bar_a), FadeIn(bar_b),
                FadeIn(percent_a), FadeIn(percent_b), run_time=1)
        scope = label("Descripci\u00f3n de las bandejas observadas",
                      (0, -1.9, 0), size=24, color=MUTED)
        self.at("scope", Indicate(percent_a, color=TEAL),
                Indicate(percent_b, color=ROSE), FadeIn(scope), run_time=1)
        remaining = self.story["duration"] - self.time
        if remaining < 0:
            raise ValueError("Animation exceeds the source narration")
        self.wait(remaining, frozen_frame=False)