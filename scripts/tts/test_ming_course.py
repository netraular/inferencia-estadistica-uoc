import copy
from contextlib import ExitStack
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
import soundfile as sf
import torch


SPEC = importlib.util.spec_from_file_location("ming_course", Path(__file__).with_name("generate-ming-course.py"))
ming = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ming)


def fixture():
    items = [{"id": f"pec1--ejercicio-{index}.1", "kind": "exercise", "canonicalSha256": str(index),
              "animation": {"id": f"pec1--ejercicio-{index}.1", "steps": [{"cues": [{"text": f"Texto exacto {index}."}]}]}}
             for index in range(541)]
    catalogue = {"items": items, "sourceFiles": {"source.js": "frozen"}, "inputSha256": "inputs", "sourceRevision": "revision"}
    original = json.dumps(catalogue, ensure_ascii=False).encode()
    progress = {"catalogueSha256": ming.sha256(original), "items": {
        item["id"]: {"status": "complete"} for item in items[:3]}}
    progress["items"][items[3]["id"]] = {"status": "partial", "cues": {"0": {"status": "complete"}}}
    return original, progress


class SnapshotTests(unittest.TestCase):
    def test_exact_snapshot_and_exclusions(self):
        original, progress = fixture()
        previous = copy.deepcopy(progress)
        selection = ming.select_snapshot(original, progress)
        self.assertEqual(selection["totalItems"], 541)
        self.assertEqual(selection["targetItems"], 538)
        self.assertEqual(selection["targetCues"], 538)
        self.assertEqual(len(selection["excludeIds"]), 3)
        self.assertIn("pec1--ejercicio-3.1", selection["targetIds"])
        self.assertEqual(selection["catalogueSha256"], ming.sha256(original))
        self.assertEqual(progress, previous)
        self.assertEqual(ming.spoken_cues(json.loads(original)["items"][3])[0]["text"], "Texto exacto 3.")
        self.assertEqual(selection["provider"], "ming-local")
        self.assertTrue(selection["temporary"])
        self.assertNotEqual(selection["voice"], "Puck")

    def test_changed_snapshot_refused(self):
        original, progress = fixture()
        with self.assertRaisesRegex(ValueError, "checksum"):
            ming.select_snapshot(original + b" ", progress)

    def test_animation_identity_refused(self):
        original, progress = fixture()
        catalogue = json.loads(original)
        catalogue["items"][3]["animation"]["id"] = "wrong"
        original = json.dumps(catalogue).encode()
        progress["catalogueSha256"] = ming.sha256(original)
        with self.assertRaisesRegex(ValueError, "identity"):
            ming.select_snapshot(original, progress)


class CPUModel:
    sample_rate = ming.RATE

    def __init__(self):
        self.texts = []

    def synthesize(self, **kwargs):
        self.texts.append(kwargs["text"])
        if kwargs["task"] != "MULTILINGUAL" or kwargs["language_id"] != "Spanish":
            raise AssertionError("Existing multilingual contract changed")
        samples = np.arange(4410, dtype=np.float32)
        return torch.from_numpy((0.2 * np.sin(samples * 2 * np.pi * 440 / ming.RATE)).reshape(1, -1))


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.batch = Path(self.temporary.name) / "batch"
        self.batch.mkdir()
        self.base = ming.load_base()
        self.model = CPUModel()
        self.loads = 0
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        for name in ("manual_seed_all", "reset_peak_memory_stats", "synchronize"):
            self.stack.enter_context(patch.object(torch.cuda, name))
        self.stack.enter_context(patch.object(torch.cuda, "get_device_name", return_value="CPU test stub, not production"))
        self.stack.enter_context(patch.object(torch.cuda, "max_memory_allocated", return_value=0))
        self.stack.enter_context(patch.object(ming.time, "sleep", side_effect=AssertionError("Local generation must not pace API calls")))
        items = [{"id": item_id, "title": item_id, "kind": kind, "canonicalSha256": item_id,
                  "animation": {"id": item_id, "steps": [
                      {"cues": [{"text": "Texto exacto: \u00bfcambia la cantidad?", "start": 500, "end": 999}]},
                      {"cues": [{"text": "No.", "start": 500, "end": 999}, {"text": "Tres miligramos.", "start": 999, "end": 1000}]}]}}
                 for item_id, kind in [("teoria--a", "section"), ("pec1--ejercicio-1.1", "exercise")]]
        original = json.dumps({"items": items, "sourceFiles": {}, "inputSha256": "inputs", "sourceRevision": "revision"}).encode()
        self.items = items
        self.selection = ming.select_snapshot(original, {"catalogueSha256": ming.sha256(original), "items": {}})
        self.selection.update(seed=42, runtimeFiles={}, helperSha256="fixture", origin=str(self.batch), originFiles={})
        (self.batch / "catalogue.json").write_bytes(original)
        ming.write_json(self.batch / "selection.json", self.selection)
        ming.write_json(self.batch / "progress.json", {**ming.IDENTITY, "selectionSha256": ming.file_hash(self.batch / "selection.json"),
            "catalogueSha256": self.selection["catalogueSha256"], "items": {}, "status": "pending"})

    def factory(self):
        self.loads += 1
        return self.model

    def producer(self, model, path, text, expected_signature, seed, reference):
        return ming.produce_fragment(self.base, model, path, text, expected_signature, seed, reference)

    def run_batch(self, **kwargs):
        return ming.generate_batch(self.batch, model_factory=self.factory, producer=self.producer, **kwargs)

    def test_partial_resume_exact_cues_and_complete_reuse(self):
        first = self.run_batch(max_new_cues=2)
        self.assertEqual(first["status"], "paused")
        self.assertEqual(first["completedCues"], 2)
        self.assertEqual(self.loads, 1)
        frozen = ming.cue_path(self.batch, self.items[0], 0).read_bytes()
        second = self.run_batch()
        self.assertEqual(second["status"], "complete")
        self.assertEqual(second["completedItems"], 2)
        self.assertEqual(second["completedCues"], 6)
        self.assertEqual(second["generatedThisRun"], 4)
        self.assertEqual(self.loads, 2)
        self.assertEqual(ming.cue_path(self.batch, self.items[0], 0).read_bytes(), frozen)
        self.assertEqual(self.model.texts, [self.base.REFERENCE_TEXT] + [cue["text"] for item in self.items for cue in ming.spoken_cues(item)])
        third = self.run_batch()
        self.assertEqual(third["generatedThisRun"], 0)
        self.assertEqual(third["reusedThisRun"], 6)
        self.assertEqual(self.loads, 2)
        report = ming.read_json(self.batch / "items" / self.items[0]["id"] / "audio.json")
        self.assertEqual(report["sourceDuration"], 0.9)
        self.assertEqual(report["cueTiming"], "measured")
        self.assertEqual(report["scenes"][1]["start"], 0.4)
        self.assertEqual(report["scenes"][1]["cues"][1]["start"], 0.8)
        self.assertEqual(report["voice"], ming.VOICE)
        self.assertTrue(report["temporary"])
        self.assertFalse(report["listened"])
        ming.verify_batch(self.batch)

    def test_corruption_stops_without_regeneration(self):
        self.run_batch(max_new_cues=1)
        path = ming.cue_path(self.batch, self.items[0], 0)
        path.write_bytes(path.read_bytes() + b"corrupt")
        with self.assertRaisesRegex(ValueError, "checksum"):
            self.run_batch()
        self.assertEqual(self.loads, 1)
        self.assertEqual(ming.read_json(self.batch / "progress.json")["status"], "failed")

    def test_checkpoint_hash_change_stops(self):
        self.run_batch(max_new_cues=1)
        state = ming.read_json(self.batch / "progress.json")
        state["items"][self.items[0]["id"]]["cues"]["0"]["sha256"] = "changed"
        ming.write_json(self.batch / "progress.json", state)
        with self.assertRaisesRegex(ValueError, "Checkpoint fragment"):
            self.run_batch()
        self.assertEqual(self.loads, 1)

    def test_incomplete_fragment_not_silently_overwritten(self):
        self.run_batch(max_new_cues=1)
        ming.cue_path(self.batch, self.items[0], 0).with_suffix(".json").unlink()
        with self.assertRaisesRegex(ValueError, "Incomplete fragment pair"):
            self.run_batch()
        self.assertEqual(self.loads, 1)

    def test_wrong_fragment_voice_refused(self):
        self.run_batch(max_new_cues=1)
        metadata = ming.cue_path(self.batch, self.items[0], 0).with_suffix(".json")
        report = ming.read_json(metadata)
        report["voice"] = "Puck"
        ming.write_json(metadata, report)
        with self.assertRaisesRegex(ValueError, "model identity"):
            self.run_batch()

    def test_exact_text_is_part_of_cache_contract(self):
        self.run_batch(max_new_cues=1)
        metadata = ming.cue_path(self.batch, self.items[0], 0).with_suffix(".json")
        report = ming.read_json(metadata)
        report["text"] = "Rewritten"
        ming.write_json(metadata, report)
        with self.assertRaisesRegex(ValueError, "signature/text"):
            self.run_batch()

    def test_pid_lock_blocks_and_releases(self):
        with ming.batch_lock(self.batch):
            self.assertTrue(ming.lock_status(self.batch)["lockActive"])
            self.assertEqual(ming.lock_status(self.batch)["lockPid"], ming.os.getpid())
            with self.assertRaisesRegex(RuntimeError, "locked"):
                self.run_batch()
        self.assertFalse(ming.lock_status(self.batch)["lockActive"])
        with ming.batch_lock(self.batch):
            pass

    def test_immutable_selection_hash_checked(self):
        selection = ming.read_json(self.batch / "selection.json")
        selection["seed"] = 43
        ming.write_json(self.batch / "selection.json", selection)
        with self.assertRaisesRegex(ValueError, "checksum"):
            ming.load_batch(self.batch)

    def test_corrupt_completed_mp3_never_regenerated(self):
        self.run_batch(ids=[self.items[0]["id"]])
        mp3 = self.batch / "items" / self.items[0]["id"] / "audio.mp3"
        mp3.write_bytes(mp3.read_bytes() + b"corrupt")
        with self.assertRaisesRegex(ValueError, "MP3 checksum"):
            self.run_batch()
        self.assertEqual(self.loads, 1)

    def test_no_secret_or_api_dependency_in_local_runner(self):
        source = Path(ming.__file__).read_text()
        for forbidden in ("gemini.env", "GEMINI_API_KEY", "urllib", "requests.", "time.sleep"):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()