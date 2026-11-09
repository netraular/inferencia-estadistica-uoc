import json
from pathlib import Path

import numpy as np
from manim import (
    Axes,
    BraceBetweenPoints,
    Create,
    DashedLine,
    FadeIn,
    FadeOut,
    LaggedStart,
    Line,
    MathTex,
    Polygon,
    Rectangle,
    ReplacementTransform,
    Scene,
    Text,
    Transform,
    VGroup,
    config,
    linear,
)


SCRIPT = json.loads(Path("/shared/script.json").read_text(encoding="utf-8"))
BACKGROUND = "#171B1C"
INK = "#F5F5EF"
MUTED = "#B3C0BD"
GREEN = "#66DBB1"
GOLD = "#F4CF76"
CORAL = "#FF9D94"
config.background_color = BACKGROUND
config.pixel_width = SCRIPT["width"]
config.pixel_height = SCRIPT["height"]
config.frame_rate = SCRIPT["fps"]


def point(horizontal, vertical):
    return np.array([(horizontal - 640) / 90, (360 - vertical) / 90, 0])


def label(text, horizontal, vertical, size=28, color=INK, width=None):
    result = Text(text, font="DejaVu Sans", font_size=size, color=color)
    if width and result.width > width / 90:
        result.scale_to_fit_width(width / 90)
    result.move_to(point(horizontal, vertical))
    return result


def formula(tex, horizontal, vertical, size=34, color=INK, width=425):
    result = MathTex(tex, font_size=size, color=color)
    if result.width > width / 90:
        result.scale_to_fit_width(width / 90)
    result.move_to(point(horizontal, vertical))
    return result


class ProbabilityArea(Scene):
    def construct(self):
        self.clock_frames = 0
        self.caption_measurements = []
        self.stage = 0
        self.axes = Axes(
            x_range=[0, 2.2, 1],
            y_range=[0, 1.1, 0.25],
            x_length=6.6,
            y_length=3.1,
            tips=False,
            axis_config={"color": MUTED, "stroke_width": 2},
        ).move_to(point(392, 333))
        self.add(
            label("PROBABILIDAD COMO \u00c1REA", 640, 38, 32),
            Line(point(64, 71), point(1216, 71), color="#394440"),
            self.axes,
            label("Densidad (1/min)", 178, 157, 24, MUTED),
            label("Tiempo t (min)", 595, 551, 24, MUTED),
            label("f(t) = 0 fuera de [0, 2]", 370, 117, 23, MUTED),
        )
        for value in [0, 1, 2]:
            self.add(formula(str(value), *self.screen(self.axes.c2p(value, 0) + [0, -0.25, 0]), size=26))
        for value, tex in [(0.25, "0.25"), (0.5, "0.5"), (0.75, "0.75"), (1, "1")]:
            self.add(formula(tex, *self.screen(self.axes.c2p(0, value) + [-0.42, 0, 0]), size=24))
        self.model_label = label("MODELO 1 / UNIFORME", 999, 110, 25, GREEN, 430)
        self.density_formula = formula(r"f(t)=0.5,\quad 0\leq t\leq2", 999, 177)
        self.graph = self.axes.plot(lambda time: 0.5, x_range=[0, 2], color=GREEN, stroke_width=5)
        self.area = self.rectangle(0, 2, 0.5, GREEN, 0.19)
        self.details = VGroup(
            formula(r"\text{\'Area total}=0.5\times2=1", 999, 300),
            label("Toda la densidad suma uno", 999, 366, 25, MUTED, 430),
        )
        self.add(self.model_label, self.density_formula, self.area, self.graph, self.details)
        band = Rectangle(width=1280 / 90, height=132 / 90, stroke_width=0, fill_color="#0A0E0F", fill_opacity=1)
        band.move_to(point(640, 654)).set_z_index(30)
        self.add(band, Line(point(64, 588), point(1216, 588), color="#394440").set_z_index(31))
        self.caption = None
        actions = [
            self.whole_support,
            self.select_interval,
            self.interval_width,
            self.height_times_width,
            self.uniform_probability,
            self.cancel_units,
            self.increasing_model,
            self.integrate_strips,
            self.piecewise_model,
            self.piecewise_probability,
        ]
        for index, cue in enumerate(SCRIPT["cues"]):
            self.hold_until(round(cue["start"] * SCRIPT["fps"]))
            self.show_caption(index, cue)
            actions[index]()
            next_frame = round(SCRIPT["cues"][index + 1]["start"] * SCRIPT["fps"]) if index < 9 else SCRIPT["frames"]
            self.hold_until(next_frame)
        assert self.clock_frames == SCRIPT["frames"]
        Path("/work/.cache/caption-layout.json").write_text(
            json.dumps(self.caption_measurements, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def screen(self, location):
        return 640 + location[0] * 90, 360 - location[1] * 90

    def animate(self, frames, *animations, rate_func=None):
        options = {"run_time": frames / SCRIPT["fps"]}
        if rate_func:
            options["rate_func"] = rate_func
        self.play(*animations, **options)
        self.clock_frames += frames

    def hold_until(self, frame):
        remaining = frame - self.clock_frames
        assert remaining >= 0, f"Storyboard overrun at {frame}"
        if remaining:
            self.wait(remaining / SCRIPT["fps"], frozen_frame=True)
            self.clock_frames = frame

    def show_caption(self, index, cue):
        words = cue["text"].split()
        candidates = []
        for split in range(1, len(words)):
            lines = [" ".join(words[:split]), " ".join(words[split:])]
            measured = [label(text, 640, 640, 30).width * 90 for text in lines]
            candidates.append((max(measured), abs(measured[0] - measured[1]), lines, measured))
        whole = label(cue["text"], 640, 654, 30)
        if whole.width * 90 <= 1120:
            lines = [cue["text"]]
            widths = [whole.width * 90]
        else:
            _, _, lines, widths = min(candidates, key=lambda candidate: (candidate[0], candidate[1]))
        assert max(widths) <= 1120, "Caption exceeds the fixed band"
        new_caption = VGroup(*[
            label(text, 640, 654 + (line_index - (len(lines) - 1) / 2) * 40, 30)
            for line_index, text in enumerate(lines)
        ]).set_z_index(32)
        assert new_caption.get_bottom()[1] > point(0, 705)[1]
        assert new_caption.get_top()[1] < point(0, 600)[1]
        if self.caption is not None:
            self.remove(self.caption)
        self.caption = new_caption
        self.add(new_caption)
        self.caption_measurements.append({
            "cue": index + 1,
            "start": cue["start"],
            "end": cue["end"],
            "displayUntil": SCRIPT["cues"][index + 1]["start"] if index < 9 else SCRIPT["duration"],
            "text": cue["text"],
            "lines": lines,
            "lineWidthsPx": widths,
            "fontSize": 30,
            "bandTopPx": 588,
            "bandBottomPx": 720,
        })

    def rectangle(self, start, end, height, color, opacity=0.4):
        return Polygon(
            self.axes.c2p(start, 0), self.axes.c2p(end, 0),
            self.axes.c2p(end, height), self.axes.c2p(start, height),
            stroke_color=color, stroke_width=1.5, fill_color=color, fill_opacity=opacity,
        )

    def set_details(self, *items, frames=18):
        replacement = VGroup(*items)
        assert replacement.get_bottom()[1] > point(0, 560)[1]
        assert replacement.get_top()[1] < point(0, 223)[1]
        assert replacement.get_left()[0] >= point(775, 0)[0]
        assert replacement.get_right()[0] <= point(1216, 0)[0]
        for upper, lower in zip(items, items[1:]):
            gap = (upper.get_bottom()[1] - lower.get_top()[1]) * 90
            assert gap >= 8, f"Overlapping explanation lines: gap={gap}"
        if len(self.details):
            self.animate(frames // 2, FadeOut(self.details))
        else:
            self.hold_until(self.clock_frames + frames // 2)
        self.animate(frames - frames // 2, FadeIn(replacement))
        self.details = replacement

    def whole_support(self):
        self.total_label = label("\u00c1REA TOTAL = 1", 390, 421, 28, GREEN)
        self.animate(30, FadeIn(self.total_label))

    def select_interval(self):
        self.remove(self.total_label)
        selected = self.rectangle(0.4, 1.2, 0.5, GOLD)
        self.limits = VGroup(*[
            DashedLine(self.axes.c2p(value, 0), self.axes.c2p(value, 0.62), color=GOLD, stroke_width=2)
            for value in [0.4, 1.2]
        ], *[
            formula(tex, *self.screen(self.axes.c2p(value, 0) + [0, -0.31, 0]), size=28, color=GOLD)
            for value, tex in [(0.4, "0.4"), (1.2, "1.2")]
        ])
        self.animate(30, Transform(self.area, selected), FadeIn(self.limits))
        self.set_details(
            formula(r"P(0.4\leq T\leq1.2)=\ ?", 999, 294),
            label("Solo el intervalo seleccionado", 999, 365, 24, GOLD, 430),
        )
    def interval_width(self):
        self.width_brace = BraceBetweenPoints(self.axes.c2p(0.4, 0) + [0, -0.63, 0], self.axes.c2p(1.2, 0) + [0, -0.63, 0], direction=[0, -1, 0], color=GOLD)
        self.set_details(
            label("ANCHURA", 999, 256, 25, GOLD),
            formula(r"1.2-0.4=0.8\ \mathrm{min}", 999, 318),
            label("Distancia entre los dos l\u00edmites", 999, 389, 23, MUTED, 430),
        )
        self.animate(24, FadeIn(self.width_brace))

    def height_times_width(self):
        self.height_brace = BraceBetweenPoints(self.axes.c2p(0.4, 0), self.axes.c2p(0.4, 0.5), direction=[-1, 0, 0], color=GREEN)
        self.animate(24, FadeIn(self.height_brace), self.area.animate.set_fill(opacity=0.62))
        self.set_details(
            label("ALTURA \u00d7 ANCHURA", 999, 256, 25, GOLD),
            formula(r"0.5\times0.8=0.4", 999, 328, 42, GOLD),
            formula(r"\underbrace{0.5}_{\text{densidad}}\ \times\ \underbrace{0.8}_{\text{tiempo}}", 999, 440, 30),
        )

    def uniform_probability(self):
        self.set_details(
            label("PROBABILIDAD / \u00c1REA", 999, 257, 25, GOLD),
            formula(r"P(0.4\leq T\leq1.2)=0.4", 999, 333, 38, GOLD),
            label("La altura no es la probabilidad", 999, 422, 24, MUTED, 430),
        )
        self.animate(30, FadeOut(self.width_brace), FadeOut(self.height_brace))

    def cancel_units(self):
        self.set_details(
            formula(r"0.5\,\frac{1}{\mathrm{min}}\times0.8\,\mathrm{min}", 999, 285, 36),
            formula(r"\frac{1}{\mathrm{min}}\times\mathrm{min}=1", 999, 388, 38, GREEN),
            label("0.4 / sin unidades", 999, 501, 28, GOLD),
        )

    def increasing_model(self):
        self.remove(self.details)
        self.details = VGroup()
        new_graph = self.axes.plot(lambda time: time / 2, x_range=[0, 2], color=GREEN, stroke_width=5)
        new_label = label("OTRO MODELO / CRECIENTE", 999, 110, 25, GREEN, 430)
        new_formula = formula(r"f(t)=\frac{t}{2},\quad0\leq t\leq2", 999, 177)
        self.strips = VGroup(*[
            self.rectangle(start, start + 0.1, (start + 0.05) / 2, GOLD, 0.5)
            for start in np.arange(0.4, 1.2, 0.1)
        ])
        self.animate(30, Transform(self.graph, new_graph), Transform(self.model_label, new_label), Transform(self.density_formula, new_formula), FadeOut(self.area), FadeIn(self.strips))
        self.set_details(
            label("LA ALTURA AHORA CAMBIA", 999, 260, 23, GREEN, 430),
            formula(r"\sum_i f(t_i)\,\Delta t", 999, 341, 41, GOLD),
            label("0.4 era el resultado del modelo 1", 999, 441, 23, MUTED, 430),
        )
        self.fine_strips = VGroup(*[
            self.rectangle(start, start + 0.025, (start + 0.0125) / 2, GOLD, 0.5)
            for start in np.arange(0.4, 1.2, 0.025)
        ])
        self.animate(30, ReplacementTransform(self.strips, self.fine_strips))

    def integrate_strips(self):
        self.integral_area = Polygon(
            self.axes.c2p(0.4, 0), self.axes.c2p(1.2, 0),
            self.axes.c2p(1.2, 0.6), self.axes.c2p(0.4, 0.2),
            stroke_color=GOLD, stroke_width=2, fill_color=GOLD, fill_opacity=0.58,
        )
        self.fine_strips.set_opacity(0)
        self.animate(54, LaggedStart(*[
            strip.animate.set_fill(opacity=0.58).set_stroke(opacity=1)
            for strip in self.fine_strips
        ], lag_ratio=0.1), rate_func=linear)
        self.animate(18, ReplacementTransform(self.fine_strips, self.integral_area))
        self.set_details(
            formula(r"\int_{0.4}^{1.2}\frac{t}{2}\,dt", 999, 267, 37, GOLD),
            formula(r"\left[\frac{t^2}{4}\right]_{0.4}^{1.2}=0.32", 999, 389, 34, GOLD),
            formula(r"dt:\ \text{la variable es }t", 999, 502, 28),
        )
        self.animate(36, self.integral_area.animate.set_fill(opacity=0.7))

    def piecewise_model(self):
        self.remove(self.details)
        self.details = VGroup()
        new_graph = VGroup(
            Line(self.axes.c2p(0, 0.25), self.axes.c2p(1, 0.25), color=GREEN, stroke_width=5),
            Line(self.axes.c2p(1, 0.75), self.axes.c2p(2, 0.75), color=CORAL, stroke_width=5),
        )
        new_label = label("TERCER MODELO / POR TRAMOS", 999, 110, 24, CORAL, 430)
        new_formula = formula(r"f(t)=\begin{cases}0.25&0\leq t<1\\0.75&1\leq t\leq2\end{cases}", 999, 184, 29)
        self.left_area = self.rectangle(0.4, 1, 0.25, GREEN, 0.6)
        self.right_area = self.rectangle(1, 1.2, 0.75, CORAL, 0.65)
        self.boundary = DashedLine(self.axes.c2p(1, 0), self.axes.c2p(1, 1.04), color=CORAL, stroke_width=2.5)
        self.boundary_label = label("frontera: t = 1", 460, 186, 23, CORAL)
        self.animate(30, Transform(self.graph, new_graph), Transform(self.model_label, new_label), Transform(self.density_formula, new_formula), FadeOut(self.integral_area), FadeIn(self.boundary), FadeIn(self.boundary_label))
        self.animate(30, FadeIn(self.left_area), FadeIn(self.right_area))
        self.set_details(
            formula(r"\int_{0.4}^{1}0.25\,dt", 999, 285, 30, GREEN),
            formula(r"+\int_{1}^{1.2}0.75\,dt", 999, 398, 30, CORAL),
            label("Una regla a cada lado de 1", 999, 508, 24, MUTED, 430),
        )

    def piecewise_probability(self):
        self.set_details(
            formula(r"0.25(1-0.4)=0.15", 999, 263, 33, GREEN),
            formula(r"0.75(1.2-1)=0.15", 999, 323, 33, CORAL),
            formula(r"P=0.15+0.15=0.30", 999, 403, 40, GOLD),
            label("Cada f\u00f3rmula, solo en su tramo", 999, 485, 23, MUTED, 430),
        )
        self.animate(24, self.left_area.animate.set_fill(opacity=0.8), self.right_area.animate.set_fill(opacity=0.8))