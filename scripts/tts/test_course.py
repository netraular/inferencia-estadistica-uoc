import contextlib
import fcntl
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np
import soundfile as sf

SCRIPT = Path(__file__).with_name("generate-course.py")
SPEC = importlib.util.spec_from_file_location("course_tts", SCRIPT)
COURSE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COURSE)


class CourseTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="tts-course-test-")
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)

    def test_spanish_math(self):
        examples = {
            "0,04": "cero coma cero cuatro",
            "20 %": "veinte por ciento",
            "1.000": "mil",
            "0.125": "cero coma uno dos cinco",
            "{0,1,2}": "conjunto de cero, uno, dos fin del conjunto",
            "-0,5": "menos cero coma cinco",
            "3c": "tres por ce",
            "-\u03bb4": "menos lambda por cuatro",
            "1e-3": "uno por diez elevado a menos tres",
        }
        for text, expected in examples.items():
            with self.subTest(text=text):
                self.assertEqual(COURSE.spoken_text(text), expected)
        self.assertIn("menos lambda", COURSE.spoken_text("exp(-\u03bb(4+3))"))

    def test_every_lesson_is_prepared_from_this_repository(self):
        manifest = COURSE.prepare_course(COURSE.DEFAULT_SOURCE, self.directory)
        self.assertEqual(COURSE.DEFAULT_SOURCE, SCRIPT.resolve().parents[2])
        self.assertEqual(manifest["lesson_count"], 36)
        self.assertEqual(manifest["scene_count"], 1224)
        self.assertEqual(len({lesson["id"] for lesson in manifest["lessons"]}), 36)
        for lesson in manifest["lessons"]:
            directory = self.directory / lesson["directory"]
            self.assertTrue((directory / "guion-original.txt").is_file())
            text = (directory / "guion.txt").read_text(encoding="utf-8")
            self.assertTrue(text.strip())
            self.assertIsNone(re.search(r"[0-9\u03b1-\u03c9\u0391-\u03a9\u00d7\u2264\u2265\u2212\u207b\u222a\u222b\u221a%/=<>^|_]", text))

    def test_resume_uses_saved_snapshot_without_live_source(self):
        manifest = {"normalizer_version": COURSE.NORMALIZER_VERSION, "lesson_count": 1,
                    "scene_count": 1, "lessons": [{"id": "saved", "scenes": [{"spoken_text": "Texto."}]}]}
        COURSE.write_json(self.directory / "curso.json", manifest)
        with patch.object(COURSE, "prepare_course", side_effect=AssertionError("Source must not be accessed")):
            actual = COURSE.load_course(self.directory / "missing-source", self.directory)
        self.assertEqual(actual, manifest)
        manifest["scene_count"] = 2
        COURSE.write_json(self.directory / "curso.json", manifest)
        with self.assertRaisesRegex(ValueError, "incomplete"):
            COURSE.load_course(self.directory / "missing-source", self.directory)

    def test_signature_includes_generation_inputs(self):
        signatures = {COURSE.audio_signature("text", 1, "ref"),
                      COURSE.audio_signature("other", 1, "ref"),
                      COURSE.audio_signature("text", 2, "ref"),
                      COURSE.audio_signature("text", 1, "other")}
        self.assertEqual(len(signatures), 4)

    def test_assembly_resume_and_timing(self):
        fragments = self.directory / "fragmentos"
        fragments.mkdir()
        parts = []
        scenes = []
        for index in range(2):
            path = fragments / f"{index}.wav"
            sf.write(path, np.full(4410, 0.1, dtype=np.float32), 44100, subtype="PCM_16")
            report = {"signature": str(index), "sha256": COURSE.file_hash(path),
                      "frames": 4410, "generation_seconds": 1}
            COURSE.write_json(path.with_suffix(".json"), report)
            self.assertIsNotNone(COURSE.cached_audio(path, str(index)))
            self.assertIsNone(COURSE.cached_audio(path, "wrong"))
            parts.append((path, report))
            scenes.append({"title": f"Scene {index}", "chapter": "Test", "spoken_text": "Texto de prueba."})
        lesson = {"id": "test", "title": "Test", "unit": "Test", "source": {}, "scenes": scenes}
        result = COURSE.assemble_lesson(self.directory, lesson, parts)
        self.assertEqual(result["frames"], 22050)
        self.assertEqual(result["scene_count"], 2)
        self.assertAlmostEqual(result["scenes"][1]["start"], 0.4)
        self.assertIn("00:00:00.400 --> 00:00:00.500", (self.directory / "audio.vtt").read_text())
        previous = (self.directory / "audio.wav").stat().st_mtime_ns
        COURSE.assemble_lesson(self.directory, lesson, parts)
        self.assertEqual((self.directory / "audio.wav").stat().st_mtime_ns, previous)
        self.assertIsNone(COURSE.cached_audio(self.directory / "missing.wav", "missing"))
        path.write_bytes(b"corrupt")
        self.assertIsNone(COURSE.cached_audio(path, str(index)))

    def test_subtitle_timestamp_rollover(self):
        self.assertEqual(COURSE.vtt_timestamp(3599.9996), "01:00:00.000")

    def test_parallel_generations_are_rejected(self):
        with (self.directory / ".generation.lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            result = subprocess.run([sys.executable, str(SCRIPT), "--prepare-only", "--output", str(self.directory)],
                                    capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("Another generation", result.stderr)
        self.assertFalse((self.directory / "curso.json").exists())

    def test_prepare_cli_does_not_import_gpu_dependencies(self):
        code = """
import importlib.abc
import runpy
import sys
class RejectGpuImports(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.split('.')[0] in {'torch', 'torchaudio', 'ming_tts', 'transformers', 'loguru'}:
            raise AssertionError('GPU dependency imported: ' + fullname)
sys.meta_path.insert(0, RejectGpuImports())
sys.argv = [sys.argv[1], '--prepare-only', '--output', sys.argv[2]]
runpy.run_path(sys.argv[0], run_name='__main__')
"""
        result = subprocess.run([sys.executable, "-c", code, str(SCRIPT), str(self.directory)],
                                check=True, capture_output=True, text=True)
        self.assertEqual(json.loads(result.stdout)["lesson_count"], 36)

    def test_missing_gpu_paths_fail_before_writing(self):
        environment = dict(os.environ)
        environment.pop("MING_CODE_DIR", None)
        environment.pop("MING_MODEL_DIR", None)
        result = subprocess.run([sys.executable, str(SCRIPT), "--output", str(self.directory)],
                                env=environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("--ming-code", result.stderr)
        self.assertFalse((self.directory / "curso.json").exists())

    def test_external_ming_adapter(self):
        with self.assertRaisesRegex(ValueError, "Ming runtime not found"):
            COURSE.load_ming_class(self.directory)
        (self.directory / "ming_tts.py").write_text("class MingTTS:\n    pass\n", encoding="utf-8")
        with patch.object(sys, "path", list(sys.path)), patch.dict(sys.modules):
            sys.modules.pop("ming_tts", None)
            model_class = COURSE.load_ming_class(self.directory)
            self.assertEqual(model_class.__name__, "MingTTS")
            self.assertEqual(Path(sys.modules["ming_tts"].__file__), self.directory / "ming_tts.py")

    def test_batch_resume_with_cpu_stubs(self):
        scenes = [{"title": f"Scene {index}", "chapter": "Test", "spoken_text": f"Texto {index}."} for index in range(2)]
        lesson = {"id": "test", "title": "Test", "unit": "Test", "source": {},
                  "directory": "00-test/01-test", "scenes": scenes}
        manifest = {"normalizer_version": COURSE.NORMALIZER_VERSION, "lesson_count": 1,
                    "scene_count": 2, "lessons": [lesson]}
        directory = self.directory / lesson["directory"]
        directory.mkdir(parents=True)
        model = SimpleNamespace(prepare_prompt=lambda *args: None)
        gpu = SimpleNamespace(is_available=lambda: True, get_device_name=lambda: "Test GPU", manual_seed_all=lambda seed: None)
        torch = SimpleNamespace(cuda=gpu, manual_seed=lambda seed: None)
        loguru = SimpleNamespace(logger=SimpleNamespace(disable=lambda name: None))

        def fake_synthesize(model, text, output, signature, seed, reference=None):
            output.parent.mkdir(parents=True, exist_ok=True)
            sf.write(output, np.full(4410, 0.1, dtype=np.float32), 44100, subtype="PCM_16")
            report = {"signature": signature, "sha256": COURSE.file_hash(output), "frames": 4410,
                      "duration_seconds": 0.1, "generation_seconds": 1, "text": text}
            COURSE.write_json(output.with_suffix(".json"), report)
            return report

        with patch.dict(sys.modules, {"torch": torch, "loguru": loguru}), \
             patch.object(COURSE, "load_ming_class", return_value=lambda *args, **kwargs: model), \
             patch.object(COURSE, "synthesize_audio", side_effect=fake_synthesize) as synthesize, \
             contextlib.redirect_stdout(io.StringIO()):
            first = COURSE.generate_course(manifest, self.directory, 1895, self.directory, self.directory)
            self.assertEqual(first["status"], "complete")
            self.assertEqual(first["generated_scenes"], 2)
            self.assertEqual(synthesize.call_count, 3)
            synthesize.reset_mock()
            resumed = COURSE.generate_course(manifest, self.directory, 1895, self.directory, self.directory)
            self.assertEqual(resumed["status"], "complete")
            self.assertEqual(resumed["reused_scenes"], 2)
            self.assertEqual(resumed["generated_scenes"], 0)
            synthesize.assert_not_called()


if __name__ == "__main__":
    unittest.main()