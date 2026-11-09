import json
import math
import os
import sys
from pathlib import Path

import numpy as np
from manim import (
    AnimationGroup, Arrow, Axes, Create, DashedLine, Dot, FadeIn, FadeOut,
    Line, MathTex, Scene, Text, Transform, VGroup, VMobject, ValueTracker,
    Write, config, linear,
)
from scipy.integrate import quad
from scipy.stats import multivariate_normal, norm


SCRIPT_PATH = Path(os.environ.get("BIVARIATE_SCRIPT", "/shared/script.json"))
SCRIPT = json.loads(SCRIPT_PATH.read_text())
PARAMETERS = SCRIPT["parameters"]
MEAN_X = PARAMETERS["meanX"]
MEAN_Y = PARAMETERS["meanY"]
SIGMA_X = PARAMETERS["sigmaX"]
SIGMA_Y = PARAMETERS["sigmaY"]
RHO = PARAMETERS["rho"]
OBSERVED_X = PARAMETERS["observedX"]
THRESHOLD_Y = PARAMETERS["thresholdY"]
COVARIANCE = np.array([
    [SIGMA_X**2, RHO * SIGMA_X * SIGMA_Y],
    [RHO * SIGMA_X * SIGMA_Y, SIGMA_Y**2],
])
JOINT = multivariate_normal(mean=[MEAN_X, MEAN_Y], cov=COVARIANCE)
CONDITIONAL_VARIANCE = SIGMA_Y**2 * (1 - RHO**2)
CONDITIONAL_SD = math.sqrt(CONDITIONAL_VARIANCE)
CONDITIONAL_MEAN = MEAN_Y + RHO * SIGMA_Y / SIGMA_X * (OBSERVED_X - MEAN_X)
MARGINAL_X_DENSITY = float(norm.pdf(OBSERVED_X, loc=MEAN_X, scale=SIGMA_X))
BACKGROUND = "#14191A"
WHITE = "#F2F5F1"
MUTED = "#A2ACA7"
GRID = "#35413C"
TEAL = "#43D9BC"
GOLD = "#FFC857"
CORAL = "#EF807A"
config.frame_width = 16
config.frame_height = 9
config.background_color = BACKGROUND
config.tex_dir = "/cache/tex"


def conditional_mean(observed_x):
    return MEAN_Y + RHO * SIGMA_Y / SIGMA_X * (observed_x - MEAN_X)


def cut_density(observed_x, ordinate):
    return JOINT.pdf(np.column_stack((
        np.broadcast_to(observed_x, np.shape(ordinate)).ravel(),
        np.asarray(ordinate).ravel(),
    ))).reshape(np.shape(ordinate))


def mathematical_probe():
    mean = conditional_mean(OBSERVED_X)
    z_value = (THRESHOLD_Y - mean) / CONDITIONAL_SD
    marginal_x = norm.pdf(OBSERVED_X, loc=MEAN_X, scale=SIGMA_X)
    ordinates = np.linspace(15, 125, 301)
    conditional = norm.pdf(ordinates, loc=mean, scale=CONDITIONAL_SD)
    np.testing.assert_allclose(cut_density(OBSERVED_X, ordinates), marginal_x * conditional)
    cut_area = quad(lambda ordinate: float(cut_density(OBSERVED_X, ordinate)), -np.inf, np.inf)[0]
    normalized_area = quad(lambda ordinate: norm.pdf(ordinate, loc=mean, scale=CONDITIONAL_SD), -np.inf, np.inf)[0]
    values = {
        "mean": mean,
        "variance": CONDITIONAL_VARIANCE,
        "standardDeviation": CONDITIONAL_SD,
        "z": z_value,
        "tail": norm.sf(z_value),
    }
    for name, expected in SCRIPT["expected"].items():
        assert math.isclose(values[name], expected, abs_tol=1e-12), (name, values[name], expected)
    assert math.isclose(cut_area, marginal_x, abs_tol=1e-10)
    assert math.isclose(normalized_area, 1, abs_tol=1e-10)
    assert len(SCRIPT["cues"]) == 22
    assert SCRIPT["frames"] == round(SCRIPT["duration"] * SCRIPT["fps"])
    config.tex_dir = "/cache/tex"
    formula = MathTex(r"f_{Y\mid X}(y\mid40)=\frac{f_{X,Y}(40,y)}{f_X(40)}")
    assert formula.width > 0 and formula.height > 0
    result = {
        **values,
        "cutArea": cut_area,
        "marginalXDensity": marginal_x,
        "conditionalArea": normalized_area,
        "nativeMathTex": {"width": formula.width, "height": formula.height},
        "python": sys.version,
    }
    Path("/cache/probe.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))


def label(text, size=24, color=WHITE):
    return Text(text, font="DejaVu Sans", font_size=size, color=color)


def formula(tex, size=32, color=WHITE):
    return MathTex(tex, font_size=size, color=color)


def density_curve(axes, density, color=GOLD, width=3):
    ordinates = np.linspace(48, 100, 201)
    heights = density(ordinates)
    curve = VMobject(color=color, stroke_width=width)
    curve.set_points_as_corners([axes.c2p(ordinate, height) for ordinate, height in zip(ordinates, heights)])
    return curve


def density_area(axes, density, start=48, color=GOLD, opacity=0.16):
    ordinates = np.linspace(start, 100, 151)
    vertices = [axes.c2p(start, 0)]
    vertices.extend(axes.c2p(ordinate, height) for ordinate, height in zip(ordinates, density(ordinates)))
    vertices.extend([axes.c2p(100, 0), axes.c2p(start, 0)])
    shape = VMobject(fill_color=color, fill_opacity=opacity, stroke_width=0)
    shape.set_points_as_corners(vertices)
    return shape


def chart_axes(max_density):
    axes = Axes(
        x_range=[48, 100, 10], y_range=[0, max_density, max_density / 3],
        x_length=6.05, y_length=3.65,
        axis_config={"color": MUTED, "stroke_width": 1.2, "include_ticks": False, "include_tip": False},
    )
    axes.move_to([4.18, 0.16, 0])
    return axes


def chart_ticks(axes, normalized):
    ticks = VGroup()
    for ordinate in [50, 60, 70, 80, 90, 100]:
        ticks.add(formula(str(ordinate), 21, MUTED).move_to(axes.c2p(ordinate, 0) + [0, -0.24, 0]))
    heights = [0.02, 0.04, 0.06] if normalized else [0.0002, 0.0004, 0.0006]
    for height in heights:
        ticks.add(formula(f"{height:.2f}" if normalized else f"{height:.4f}", 17, MUTED).move_to(axes.c2p(48, height) + [-0.35, 0, 0]))
    ticks.add(formula("Y", 25, MUTED).move_to(axes.c2p(100, 0) + [0.28, -0.05, 0]))
    return ticks


def subtitle(cue):
    lines = []
    current = ""
    for word in cue["text"].split():
        candidate = f"{current} {word}".strip()
        if current and label(candidate, 29).width > 14.4:
            lines.append(label(current, 29))
            current = word
        else:
            current = candidate
    lines.append(label(current, 29))
    block = VGroup(*lines).arrange(np.array([0, -1, 0]), buff=0.09)
    if block.height > 0.78:
        block.scale_to_fit_height(0.78)
    return block.move_to([0, -4.0, 0])


class BivariateScene(Scene):
    def step(self, seconds, *animations, **animation_options):
        frames = round(seconds * SCRIPT["fps"])
        self.play(*animations, run_time=frames / SCRIPT["fps"], **animation_options)
        self.elapsed_frames += frames

    def until(self, frame):
        missing = frame - self.elapsed_frames
        assert missing >= 0, (frame, self.elapsed_frames)
        if missing:
            self.wait(missing / SCRIPT["fps"])
            self.elapsed_frames += missing

    def record_bounds(self, name, mobject):
        box = {
            "name": name,
            "left": float(mobject.get_left()[0]), "right": float(mobject.get_right()[0]),
            "bottom": float(mobject.get_bottom()[1]), "top": float(mobject.get_top()[1]),
        }
        assert box["left"] >= -7.82 and box["right"] <= 7.82, box
        assert box["bottom"] >= -4.42 and box["top"] <= 4.42, box
        self.bounds.append(box)

    def construct(self):
        self.elapsed_frames = 0
        self.bounds = []
        self.normalized = False
        title = label("DEL PLANO CONJUNTO A UNA COLA CONDICIONAL", 28)
        title.move_to([0, 4.02, 0])
        parameters = formula(
            r"\mu_X=30\quad\mu_Y=70\quad\sigma_X=5\quad\sigma_Y=8\quad\rho=0.25\qquad X=40", 29,
        ).move_to([0, 3.43, 0])
        self.record_bounds("parameters-at-frame-zero", parameters)
        self.add(title, parameters, Line([-7.3, 3.02, 0], [7.3, 3.02, 0], color=GRID, stroke_width=1))
        left_title = label("01  DENSIDAD CONJUNTA", 23, TEAL).move_to([-4.2, 2.66, 0])
        self.right_title = label("02  PERFIL DEL CORTE", 23, GOLD).move_to([4.18, 2.66, 0])
        self.add(left_title, self.right_title)
        self.joint_axes = Axes(
            x_range=[15, 45, 10], y_range=[46, 98, 10], x_length=6.05, y_length=3.65,
            axis_config={"color": MUTED, "stroke_width": 1.2, "include_ticks": False, "include_tip": False},
        ).move_to([-4.2, 0.16, 0])
        joint_ticks = VGroup()
        for abscissa in [20, 30, 40]:
            joint_ticks.add(formula(str(abscissa), 21, MUTED).move_to(self.joint_axes.c2p(abscissa, 46) + [0, -0.24, 0]))
            self.add(Line(self.joint_axes.c2p(abscissa, 46), self.joint_axes.c2p(abscissa, 98), color=GRID, stroke_width=0.65))
        for ordinate in [50, 70, 90]:
            joint_ticks.add(formula(str(ordinate), 21, MUTED).move_to(self.joint_axes.c2p(15, ordinate) + [-0.28, 0, 0]))
            self.add(Line(self.joint_axes.c2p(15, ordinate), self.joint_axes.c2p(45, ordinate), color=GRID, stroke_width=0.65))
        joint_ticks.add(formula("X", 25, MUTED).move_to(self.joint_axes.c2p(45, 46) + [0.25, -0.06, 0]))
        joint_ticks.add(formula("Y", 25, MUTED).move_to(self.joint_axes.c2p(15, 98) + [-0.23, 0.23, 0]))
        self.add(self.joint_axes, joint_ticks)
        eigenvalues, eigenvectors = np.linalg.eigh(COVARIANCE)
        covariance_root = eigenvectors @ np.diag(np.sqrt(eigenvalues))
        angles = np.linspace(0, 2 * np.pi, 181)
        self.contours = VGroup()
        for radius in [3, 2.5, 2, 1.5, 1, 0.5]:
            points = np.array([MEAN_X, MEAN_Y])[:, None] + covariance_root @ (radius * np.array([np.cos(angles), np.sin(angles)]))
            shape = VMobject(color=TEAL, stroke_width=1.2, fill_color=TEAL, fill_opacity=0.065)
            shape.set_points_as_corners([self.joint_axes.c2p(abscissa, ordinate) for abscissa, ordinate in points.T])
            self.contours.add(shape)
        self.add(self.contours)
        self.cut = Line(self.joint_axes.c2p(OBSERVED_X, 46), self.joint_axes.c2p(OBSERVED_X, 98), color=GOLD, stroke_width=3)
        cut_label = formula("X=40", 26, GOLD).move_to(self.joint_axes.c2p(40, 98) + [0, 0.27, 0])
        self.add(self.cut, cut_label)
        self.raw_axes = chart_axes(0.00065)
        self.conditional_axes = chart_axes(0.06)
        self.right_axes = self.raw_axes.copy()
        self.right_ticks = chart_ticks(self.raw_axes, False)
        self.raw_density = lambda ordinates: cut_density(OBSERVED_X, ordinates)
        self.conditional_density = lambda ordinates: norm.pdf(ordinates, loc=CONDITIONAL_MEAN, scale=CONDITIONAL_SD)
        self.profile = density_curve(self.raw_axes, self.raw_density)
        self.profile_area = density_area(self.raw_axes, self.raw_density)
        self.area_label = formula(r"\int f_{X,Y}(40,y)\,dy=" + f"{MARGINAL_X_DENSITY:.5f}", 23, GOLD).move_to([4.18, 2.22, 0])
        self.add(self.right_axes, self.right_ticks, self.profile_area, self.profile, self.area_label)
        relation = formula(r"f_{X,Y}(40,y)=f_X(40)\,f_{Y\mid X}(y\mid40)", 24, MUTED).move_to([-3.85, -2.28, 0])
        self.record_bounds("joint-cut-factorization", relation)
        self.add(relation)
        self.equation = formula(r"X=40:\quad f_{X,Y}(40,y)\ \text{es un corte, no una marginal}", 33).move_to([0, -3.02, 0])
        self.add(self.equation)
        self.scan_y = ValueTracker(52)
        self.scan_left = Dot(radius=0.065, color=GOLD)
        self.scan_right = Dot(radius=0.065, color=GOLD)
        self.scan_link = DashedLine([0, 0, 0], [1, 0, 0], color=GOLD, stroke_width=1, dashed_ratio=0.35)
        self.scan_left.add_updater(lambda mob: mob.move_to(self.joint_axes.c2p(40, self.scan_y.get_value())))
        self.scan_right.add_updater(lambda mob: mob.move_to(self.raw_axes.c2p(self.scan_y.get_value(), float(cut_density(40, self.scan_y.get_value())))))
        self.scan_link.add_updater(lambda mob: mob.put_start_and_end_on(self.scan_left.get_center(), self.scan_right.get_center()))
        self.scan_group = VGroup(self.scan_link, self.scan_left, self.scan_right)
        self.add(self.scan_group)
        self.construction_mean = ValueTracker(MEAN_Y)
        self.construction_sd = ValueTracker(SIGMA_Y)
        self.construction_curve = density_curve(self.conditional_axes, lambda ordinates: norm.pdf(ordinates, loc=MEAN_Y, scale=SIGMA_Y), WHITE, 2.2)
        self.construction_curve.add_updater(lambda mob: mob.become(density_curve(
            self.conditional_axes,
            lambda ordinates: norm.pdf(ordinates, loc=self.construction_mean.get_value(), scale=self.construction_sd.get_value()), WHITE, 2.2,
        )))
        self.mean_guide = Line(self.conditional_axes.c2p(70, 0), self.conditional_axes.c2p(70, 0.056), color=WHITE, stroke_width=1.5)
        self.mean_guide.add_updater(lambda mob: mob.put_start_and_end_on(
            self.conditional_axes.c2p(self.construction_mean.get_value(), 0),
            self.conditional_axes.c2p(self.construction_mean.get_value(), 0.056),
        ))
        self.mean_label = formula(r"\mu", 24, WHITE).move_to(self.conditional_axes.c2p(70, 0.056) + [0, 0.15, 0])
        self.mean_label.add_updater(lambda mob: mob.move_to(self.conditional_axes.c2p(self.construction_mean.get_value(), 0.056) + [0, 0.15, 0]))
        self.mean_74 = formula("74", 24, GOLD).move_to(self.conditional_axes.c2p(74, 0.056) + [0, 0.15, 0])
        self.construction_label = label("blanco: media 70 -> 74", 18, WHITE).move_to([4.25, -2.28, 0])
        self.marginal_curve = density_curve(self.conditional_axes, lambda ordinates: norm.pdf(ordinates, loc=MEAN_Y, scale=SIGMA_Y), MUTED, 1.6)
        self.marginal_label = formula(r"f_Y:\ \text{marginal}", 22, MUTED).move_to([2.45, 1.60, 0])
        self.regression = Line(self.joint_axes.c2p(15, conditional_mean(15)), self.joint_axes.c2p(45, conditional_mean(45)), color=CORAL, stroke_width=2)
        self.distance_arrow = Arrow(self.joint_axes.c2p(30, 70), self.joint_axes.c2p(40, 70), buff=0, color=WHITE, stroke_width=2, max_tip_length_to_length_ratio=0.10)
        self.distance_label = formula("40-30=10", 22).move_to(self.joint_axes.c2p(35, 70) + [0, -0.3, 0])
        self.mean_dot = Dot(self.joint_axes.c2p(30, 70), color=CORAL, radius=0.075)
        self.shift_arrow = Arrow(self.joint_axes.c2p(40, 70), self.joint_axes.c2p(40, 74), buff=0, color=CORAL, stroke_width=3, max_tip_length_to_length_ratio=0.25)
        self.shift_label = formula("+4", 25, CORAL).move_to(self.joint_axes.c2p(40, 72) + [0.33, 0, 0])
        self.threshold = ValueTracker(98)
        self.tail_opacity = ValueTracker(0.45)
        self.tail = density_area(self.conditional_axes, self.conditional_density, 98, GOLD, 0.45)
        self.tail.add_updater(lambda mob: mob.become(density_area(self.conditional_axes, self.conditional_density, self.threshold.get_value(), GOLD, self.tail_opacity.get_value())))
        self.threshold_line = Line(self.conditional_axes.c2p(98, 0), self.conditional_axes.c2p(98, 0.055), color=CORAL, stroke_width=2.4)
        self.threshold_line.add_updater(lambda mob: mob.put_start_and_end_on(self.conditional_axes.c2p(self.threshold.get_value(), 0), self.conditional_axes.c2p(self.threshold.get_value(), 0.055)))
        self.threshold_label = formula("Y=82", 24, CORAL).move_to(self.conditional_axes.c2p(82, 0.055) + [0, 0.2, 0])
        self.distance_y = Arrow(self.conditional_axes.c2p(74, 0.013), self.conditional_axes.c2p(82, 0.013), buff=0, color=CORAL, stroke_width=2, max_tip_length_to_length_ratio=0.10)
        self.distance_y_label = formula("8", 24, CORAL).move_to(self.conditional_axes.c2p(78, 0.013) + [0, 0.2, 0])
        self.z_axis = VGroup()
        for z_value in [-2, -1, 0, 1, 2, 3]:
            position = self.conditional_axes.c2p(CONDITIONAL_MEAN + CONDITIONAL_SD * z_value, 0) + [0, -0.65, 0]
            self.z_axis.add(formula(str(z_value), 20, TEAL).move_to(position))
        self.z_axis.add(formula("Z", 22, TEAL).move_to([7.4, -2.31, 0]))
        self.z_axis_line = Line(self.conditional_axes.c2p(48, 0) + [0, -0.49, 0], self.conditional_axes.c2p(100, 0) + [0, -0.49, 0], color=TEAL, stroke_width=1)
        self.z_marker = formula(r"z=\frac8{\sqrt{60}}\simeq1.033", 24, TEAL).move_to([4.5, -2.81, 0])
        equations = [
            r"X=40:\quad f_{X,Y}(40,y)\ \text{es un corte, no una marginal}",
            r"\mathbb E[Y\mid X=x]=\mu_Y+\rho\frac{\sigma_Y}{\sigma_X}(x-\mu_X)",
            r"x-\mu_X=40-30=10",
            r"b=\rho\frac{\sigma_Y}{\sigma_X}",
            r"b=0.25\frac85=0.4",
            r"\Delta\mu_Y=0.4\cdot10=4",
            r"\mu_{Y\mid40}=70+4\qquad f_{Y\mid X}(y\mid40)=\frac{f_{X,Y}(40,y)}{f_X(40)}",
            r"\mu_{Y\mid40}=74\qquad\int f_{Y\mid X}(y\mid40)\,dy=1",
            r"\operatorname{Var}(Y\mid X=40)=64(1-0.25^2)",
            r"\operatorname{Var}(Y\mid X=40)=60\ <\ 64",
            r"\sigma_{Y\mid40}=\sqrt{60}\simeq7.746",
            r"\operatorname{Var}(Y\mid X)=\sigma_Y^2(1-\rho^2)\qquad\sigma_{Y\mid X}=\sigma_Y\sqrt{1-\rho^2}",
            r"P(Y>82\mid X=40)=\ ?",
            r"Y\mid X=40\sim\mathcal N(74,60)\qquad\text{area total}=1",
            r"82-\mu_{Y\mid40}=82-74",
            r"82-74=8",
            r"Z=\frac{Y-74}{\sqrt{60}}\qquad z=\frac8{\sqrt{60}}",
            r"z=1.03279556\ldots\simeq1.033",
            r"P(Y>82\,\boldsymbol{\mid X=40})=P(Z>1.03279556\ldots)",
            r"P(Y>82\mid X=40)\ne P(Y>82)",
            r"P(Y>82\mid X=40)=1-\Phi\!\left(\frac8{\sqrt{60}}\right)",
            r"P(Y>82\mid X=40)=0.15084979\ldots\simeq15.1\%",
        ]
        for index, cue in enumerate(SCRIPT["cues"]):
            start_frame = round(cue["start"] * SCRIPT["fps"])
            end_frame = round(cue["end"] * SCRIPT["fps"])
            self.until(start_frame)
            caption = subtitle(cue)
            self.record_bounds(f"subtitle-{index + 1}", caption)
            target_equation = formula(equations[index], 33, GOLD if index == 21 else WHITE)
            if target_equation.width > 14.4:
                target_equation.scale_to_fit_width(14.4)
            target_equation.move_to([0, -3.02, 0])
            self.record_bounds(f"equation-{index + 1}", target_equation)
            assert target_equation.get_bottom()[1] > caption.get_top()[1] + 0.10
            self.add(caption)
            self.step(0.4, Transform(self.equation, target_equation))
            self.action(index, (end_frame - self.elapsed_frames) / SCRIPT["fps"])
            self.until(end_frame)
            self.remove(caption)
        self.until(SCRIPT["frames"])
        assert self.elapsed_frames == 2253
        geometry = {
            "timelineFrames": self.elapsed_frames,
            "fps": SCRIPT["fps"], "cues": len(SCRIPT["cues"]),
            "bounds": self.bounds,
            "cutX": OBSERVED_X,
            "covariance": COVARIANCE.tolist(),
            "contourMahalanobisRadii": [3, 2.5, 2, 1.5, 1, 0.5],
            "thresholdZ": (THRESHOLD_Y - CONDITIONAL_MEAN) / CONDITIONAL_SD,
            "conditionalTail": float(norm.sf(THRESHOLD_Y, loc=CONDITIONAL_MEAN, scale=CONDITIONAL_SD)),
            "marginalTail": float(norm.sf(THRESHOLD_Y, loc=MEAN_Y, scale=SIGMA_Y)),
        }
        Path("/cache/geometry.json").write_text(json.dumps(geometry, indent=2))

    def action(self, index, available):
        duration = min(1.4, available)
        if index == 0:
            self.step(duration, self.scan_y.animate.set_value(74))
        elif index == 1:
            self.step(duration, self.scan_y.animate.set_value(93))
        elif index == 2:
            self.scan_group.clear_updaters(recursive=True)
            self.step(duration, FadeOut(self.scan_group), Create(self.distance_arrow), FadeIn(self.distance_label))
        elif index == 3:
            self.step(duration, Create(self.regression), FadeIn(self.mean_dot))
        elif index == 4:
            self.step(duration, self.regression.animate.set_stroke(width=3.5))
        elif index == 5:
            self.step(min(2.0, available), self.mean_dot.animate.move_to(self.joint_axes.c2p(40, 74)), Create(self.shift_arrow), FadeIn(self.shift_label))
        elif index == 6:
            self.normalized = True
            normalized_title = label("02  DENSIDAD CONDICIONAL", 23, GOLD).move_to([4.18, 2.66, 0])
            area_one = formula(r"\int f_{Y\mid X}(y\mid40)\,dy=1", 23, GOLD).move_to([4.18, 2.22, 0])
            self.step(0.8,
                Transform(self.right_axes, self.conditional_axes),
                Transform(self.right_ticks, chart_ticks(self.conditional_axes, True)),
                Transform(self.profile, density_curve(self.conditional_axes, self.conditional_density)),
                Transform(self.profile_area, density_area(self.conditional_axes, self.conditional_density)),
                Transform(self.right_title, normalized_title), Transform(self.area_label, area_one),
                FadeIn(self.construction_curve), FadeIn(self.mean_guide), FadeIn(self.mean_label), FadeIn(self.construction_label),
            )
            self.step(min(1.4, available - 0.8), self.construction_mean.animate.set_value(74))
        elif index == 7:
            self.mean_label.clear_updaters()
            self.step(duration, Transform(self.mean_label, self.mean_74), self.mean_guide.animate.set_color(GOLD))
        elif index == 8:
            construction_note = label("blanco: ajuste de la varianza", 18, WHITE).move_to([4.25, -2.28, 0])
            self.step(duration, self.construction_sd.animate.set_value(CONDITIONAL_SD), Transform(self.construction_label, construction_note))
        elif index == 9:
            self.construction_curve.clear_updaters()
            self.mean_guide.clear_updaters()
            self.step(duration, FadeOut(self.construction_curve), FadeOut(self.construction_label))
        elif index == 10:
            self.sigma_span = Line(self.conditional_axes.c2p(74, 0.043), self.conditional_axes.c2p(74 + CONDITIONAL_SD, 0.043), color=TEAL, stroke_width=2)
            self.sigma_label = formula(r"\sqrt{60}", 24, TEAL).move_to(self.conditional_axes.c2p(74 + CONDITIONAL_SD / 2, 0.043) + [0, 0.22, 0])
            self.step(duration, Create(self.sigma_span), FadeIn(self.sigma_label))
        elif index == 11:
            self.step(duration, FadeOut(self.sigma_span), FadeOut(self.sigma_label))
        elif index == 12:
            self.add(self.tail, self.threshold_line)
            self.step(min(1.8, available), self.threshold.animate.set_value(82), rate_func=linear)
            self.add(self.threshold_label)
        elif index == 13:
            self.step(duration, self.profile_area.animate.set_fill(opacity=0.10))
        elif index == 14:
            self.step(duration, Create(self.distance_y))
        elif index == 15:
            self.step(duration, FadeIn(self.distance_y_label))
        elif index == 16:
            self.step(duration, FadeIn(self.z_axis), Create(self.z_axis_line), FadeOut(self.distance_y), FadeOut(self.distance_y_label))
        elif index == 17:
            self.step(duration, self.threshold_line.animate.set_stroke(width=3.5))
        elif index == 18:
            self.step(duration, self.cut.animate.set_stroke(width=4.5), self.area_label.animate.set_color(TEAL))
        elif index == 19:
            marginal_area = density_area(self.conditional_axes, lambda ordinates: norm.pdf(ordinates, loc=MEAN_Y, scale=SIGMA_Y), 82, MUTED, 0.13)
            self.step(0.8, FadeIn(self.marginal_curve), FadeIn(self.marginal_label), FadeIn(marginal_area))
            self.step(0.8, FadeOut(marginal_area))
        elif index == 20:
            self.step(duration, self.tail_opacity.animate.set_value(0.55))
        elif index == 21:
            result = formula(r"15.1\%", 38, GOLD).move_to(self.conditional_axes.c2p(88, 0.029))
            self.record_bounds("final-tail-percent", result)
            self.step(duration, Write(result), self.profile.animate.set_stroke(width=4))


if __name__ == "__main__" and "--probe" in sys.argv:
    mathematical_probe()