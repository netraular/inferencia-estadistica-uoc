import json
from pathlib import Path

from manim import (
    DOWN, UP, WHITE, MathTex, Rectangle, Scene, Text, VGroup, config, linear,
)


BRIEF = json.loads(Path("/brief/brief.json").read_text())
config.background_color = BRIEF["background"]
config.frame_height = 8
config.frame_width = 8 * BRIEF["width"] / BRIEF["height"]


class ComplementScene(Scene):
    def construct(self):
        ink = BRIEF["ink"]
        fps = BRIEF["fps"]
        title = Text(BRIEF["title"], font="DejaVu Sans", font_size=42, color=ink)
        title.move_to(UP * 2.8)
        formulas = [
            MathTex(phase["formula"], font_size=56, color=ink).move_to(UP * 1.25)
            for phase in BRIEF["phases"]
        ]
        width, height = 10.8, 0.72
        green_width = width * BRIEF["probability"]
        coral_width = width * BRIEF["complement"]
        green = Rectangle(
            width=green_width, height=height, stroke_width=0,
            color=BRIEF["green"], fill_color=BRIEF["green"], fill_opacity=1,
        ).move_to([-width / 2 + green_width / 2, -0.5, 0])
        coral = Rectangle(
            width=coral_width, height=height, stroke_width=0,
            color=BRIEF["coral"], fill_color=BRIEF["coral"], fill_opacity=1,
        ).move_to([width / 2 - coral_width / 2, -0.5, 0])
        green_label = MathTex(r"A\quad 30\%", font_size=30, color=WHITE).move_to(green)
        coral_label = MathTex(r"A^c\quad 70\%", font_size=30, color=WHITE).move_to(coral)
        complement = VGroup(coral, coral_label)
        footer = MathTex(BRIEF["footer"], font_size=36, color=ink).move_to(DOWN * 2.65)
        self.add(title, formulas[0], green, green_label, complement, footer)
        self.wait(30 / fps)
        self.remove(formulas[0])
        self.add(formulas[1])
        self.play(complement.animate.shift(DOWN * 0.18), run_time=15 / fps, rate_func=linear)
        self.wait(45 / fps)
        self.remove(formulas[1])
        self.add(formulas[2])
        self.play(complement.animate.shift(UP * 0.18), run_time=15 / fps, rate_func=linear)
        coral.set_stroke(ink, width=3)
        self.wait(45 / fps)