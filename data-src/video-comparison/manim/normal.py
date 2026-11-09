import json
from pathlib import Path

import numpy as np
from scipy.stats import norm
from manim import (
    Axes, BraceBetweenPoints, Create, DecimalNumber, Dot,
    Line, MathTex, Rectangle, Scene, Text, TransformFromCopy, TransformMatchingTex, ValueTracker,
    VGroup, always_redraw, config, linear,
)


STORY = json.loads((Path(__file__).resolve().parents[1] / "normal/storyboard.json").read_text())
INK, MUTED, GREEN, CORAL = "#182D28", "#596860", "#008B70", "#BF5547"
config.background_color = "#FCFCFD"
config.pixel_width, config.pixel_height = STORY["width"], STORY["height"]
config.frame_rate = STORY["fps"]


def position(horizontal, vertical):
    return np.array([(horizontal - 640) / 90, (360 - vertical) / 90, 0])


def label(content, horizontal, vertical, size=26, color=INK):
    return Text(content, font="DejaVu Sans", font_size=size, color=color).move_to(position(horizontal, vertical))


class NormalStandardization(Scene):
    def construct(self):
        self.clock_frames = 0
        self.formula = None
        self.caption = None
        self.stage_title = None
        self.sigma = ValueTracker(STORY["sigma"])
        self.selected = ValueTracker(STORY["threshold"])
        self.shade_end = ValueTracker(-4)
        self.add(label("La normal: de X a Z", 360, 43, 38))
        self.add(label("MANIM", 1165, 43, 19, MUTED))
        self.add(Line(position(64, 78), position(1216, 78), color="#DCE5DF"))
        self.left_axes = self.make_axes(335, [2, 18, 4])
        self.right_axes = self.make_axes(945, [-4, 4, 2])
        self.left_curve = self.curve(self.left_axes, STORY["mean"], STORY["sigma"], [2, 18])
        self.right_curve = self.curve(self.right_axes, 0, 1, [-4, 4])
        self.add(self.left_axes, label("X", 604, 503, 24))
        self.add(label("Densidad", 145, 239, 20, MUTED))
        self.add(label("Densidad", 755, 239, 20, MUTED))
        self.add(Line(position(640, 239), position(640, 513), color="#DCE5DF"))
        self.sigma_number = DecimalNumber(2, num_decimal_places=2, color=GREEN, font_size=32)
        self.sigma_number.move_to(position(454, 548))
        self.sigma_number.add_updater(lambda number: number.set_value(self.sigma.get_value()).move_to(position(454, 548)))
        self.add(label("media = 10", 210, 548, 22, MUTED), label("sigma =", 360, 548, 22, MUTED), self.sigma_number)
        self.add(label("Area total = 1", 335, 578, 22, MUTED))
        self.add(Rectangle(width=1280 / 90, height=100 / 90, fill_color=INK, fill_opacity=1, stroke_width=0).move_to(position(640, 670)).set_z_index(20))
        self.stage("density")
        self.show_formula("density", animate=False)
        self.until(STORY["events"]["draw"][0])
        self.animate(2.5, Create(self.left_curve))
        self.change_width()
        self.standardize()
        self.map_points()
        self.show_probability()
        self.show_complement()
        self.until(STORY["duration"])
        assert self.clock_frames == STORY["frames"]

    def make_axes(self, horizontal, domain):
        axes = Axes(x_range=domain, y_range=[0, 0.45, 0.1], x_length=5.1, y_length=2.1,
                    tips=False, axis_config={"color": MUTED, "stroke_width": 2},
                    x_axis_config={"include_numbers": True, "font_size": 22,
                                   "numbers_to_exclude": [],
                                   "numbers_to_include": [domain[0], (domain[0] + domain[1]) / 2, domain[1]]})
        axes.x_axis.numbers.set_color(INK)
        return axes.move_to(position(horizontal, 372))

    def curve(self, axes, mean, sigma, domain):
        return axes.plot(lambda value: norm.pdf(value, mean, sigma), x_range=[*domain, 0.12], color=GREEN, stroke_width=4)

    def animate(self, duration, *animations, **options):
        frames = round(duration * STORY["fps"])
        self.play(*animations, run_time=frames / STORY["fps"], **options)
        self.clock_frames += frames

    def until(self, time):
        target = round(time * STORY["fps"])
        remaining = target - self.clock_frames
        assert remaining >= 0, f"Storyboard overrun: {self.clock_frames} > {target}"
        if remaining:
            self.wait(remaining / STORY["fps"])
            self.clock_frames = target

    def stage(self, name):
        phase = next(phase for phase in STORY["phases"] if phase["id"] == name)
        self.until(phase["start"])
        if self.caption is not None:
            self.remove(self.caption, self.stage_title)
        words = phase["caption"].split()
        split = min(range(1, len(words)), key=lambda index: abs(len(" ".join(words[:index])) - len(" ".join(words[index:]))))
        lines = [" ".join(words[:split]), " ".join(words[split:])]
        self.caption = VGroup(*[label(text, 640, 650 + index * 38, 25, "#FFFFFF") for index, text in enumerate(lines)]).set_z_index(21)
        assert self.caption.width * 90 <= 1152
        self.stage_title = label(phase["title"], 640, 205, 23, MUTED)
        self.add(self.caption, self.stage_title)

    def show_formula(self, name, animate=True, extra=()):
        replacement = MathTex(*STORY["formulas"][name], font_size=40, color=INK)
        if replacement.width * 90 > 1140:
            replacement.scale_to_fit_width(1140 / 90)
        replacement.move_to(position(640, 134))
        assert replacement.height * 90 <= 114
        if self.formula is not None and animate:
            start, end = STORY["events"][name]
            self.until(start)
            self.animate(end - start, TransformMatchingTex(self.formula, replacement, transform_mismatches=True), *extra)
        else:
            self.add(replacement)
        self.formula = replacement

    def change_width(self):
        self.stage("width")
        self.left_curve.add_updater(lambda curve: curve.become(self.curve(self.left_axes, STORY["mean"], self.sigma.get_value(), [2, 18])))
        brace = always_redraw(lambda: BraceBetweenPoints(
            self.left_axes.c2p(10 - self.sigma.get_value(), 0) + [0, -0.47, 0],
            self.left_axes.c2p(10 + self.sigma.get_value(), 0) + [0, -0.47, 0],
            direction=[0, -1, 0], color=GREEN))
        self.add(brace)
        for event, value in [("narrow", 1), ("widen", 2.6), ("restore", STORY["sigma"])]:
            start, end = STORY["events"][event]
            self.until(start)
            self.animate(end - start, self.sigma.animate.set_value(value))
        self.left_curve.clear_updaters()
        self.remove(brace)

    def standardize(self):
        self.stage("substitution")
        self.add(self.right_axes, label("Z", 1212, 503, 24))
        self.add(label("media = 0    sigma = 1", 945, 548, 23, MUTED), label("Area total = 1", 945, 578, 22, MUTED))
        self.show_formula("standardize", extra=[TransformFromCopy(self.left_curve, self.right_curve)])
        for name in ["parameters", "threshold", "simplify"]:
            self.show_formula(name)

    def point_group(self, axes, mean, sigma, transform):
        def current():
            value = transform(self.selected.get_value())
            location = axes.c2p(value, norm.pdf(value, mean, sigma))
            return VGroup(Line(axes.c2p(value, 0), location, color=CORAL, stroke_width=2), Dot(location, color=CORAL, radius=0.065))
        return always_redraw(current)

    def map_points(self):
        self.stage("mapping")
        self.show_formula("mapping")
        self.selected.set_value(6)
        self.left_point = self.point_group(self.left_axes, 10, 2, lambda value: value)
        self.right_point = self.point_group(self.right_axes, 0, 1, lambda value: (value - STORY["mean"]) / STORY["sigma"])
        self.add(self.left_point, self.right_point)
        values = [DecimalNumber(6, num_decimal_places=2, color=CORAL, font_size=29), DecimalNumber(-2, num_decimal_places=2, color=CORAL, font_size=29)]
        for number, horizontal, transform in [(values[0], 535, lambda value: value), (values[1], 1145, lambda value: (value - 10) / 2)]:
            number.add_updater(lambda node, horizontal=horizontal, transform=transform: node.set_value(transform(self.selected.get_value())).move_to(position(horizontal, 260)))
        self.add(*values)
        for event, target in [("scan", 14), ("settle", STORY["threshold"])]:
            start, end = STORY["events"][event]
            self.until(start)
            self.animate(end - start, self.selected.animate.set_value(target))
        self.until(STORY["events"]["probability"][0])
        self.remove(*values)

    def area(self, axes, curve, mean, sigma, tail=False):
        edge = mean + sigma * self.shade_end.get_value()
        domain = [2, 18] if mean else [-4, 4]
        bounds = [STORY["threshold"] if mean else STORY["z"], domain[1]] if tail else [domain[0], max(domain[0] + 0.0001, edge)]
        return axes.get_area(curve, x_range=bounds, color=CORAL if tail else GREEN, opacity=0.3)

    def show_probability(self):
        self.stage("probability")
        self.left_area = always_redraw(lambda: self.area(self.left_axes, self.left_curve, 10, 2))
        self.right_area = always_redraw(lambda: self.area(self.right_axes, self.right_curve, 0, 1))
        self.add(self.left_area, self.right_area)
        value = DecimalNumber(0, num_decimal_places=4, color=GREEN, font_size=32).move_to(position(640, 600))
        value.add_updater(lambda node: node.set_value(norm.cdf(self.shade_end.get_value())).move_to(position(640, 600)))
        self.add(value)
        self.show_formula("probability")
        self.animate(3, self.shade_end.animate.set_value(1), rate_func=linear)
        self.show_formula("integral")
        self.until(STORY["events"]["tail"][0])
        self.remove(value)

    def show_complement(self):
        self.stage("complement")
        self.show_formula("tail")
        self.remove(self.left_area, self.right_area)
        self.add(self.area(self.left_axes, self.left_curve, 10, 2, tail=True), self.area(self.right_axes, self.right_curve, 0, 1, tail=True))
        self.add(label("0.8413 + 0.1587 = 1", 640, 602, 22, CORAL))