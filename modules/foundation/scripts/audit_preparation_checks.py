"""Validate 10-second checks for every preparation file in the learning path."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = ROOT / "modules" / "foundation" / "data" / "questions.json"
PREP_DIR = ROOT / "modules" / "foundation" / "data"
CHECK_RE = re.compile(r"(?ms)^:::check\s+([^\s]+)\n(.*?)^:::\s*$")


def mapped_lessons(data: dict) -> list[dict]:
    return [lesson for chapter in data["learningPath"]["chapters"] for lesson in chapter["lessons"]]


def instructional_headings(text: str) -> list[str]:
    headings = re.findall(r"(?m)^##\s+(.+?)\s*$", text)
    return [heading for heading in headings if heading != "教授からの課題"]


def fields(body: str) -> dict[str, object]:
    result: dict[str, object] = {"choices": []}
    for line in body.splitlines():
        if line.startswith("question:"):
            result["question"] = line.split(":", 1)[1].strip()
        elif line.startswith("choice:"):
            key, _, label = line.split(":", 1)[1].partition("|")
            result["choices"].append((key.strip(), label.strip()))
        elif line.startswith("answer:"):
            result["answer"] = line.split(":", 1)[1].strip()
        elif line.startswith("explanation:"):
            result["explanation"] = line.split(":", 1)[1].strip()
    return result


def main() -> int:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []
    total_checks = 0
    total_headings = 0

    for lesson in mapped_lessons(data):
        unit = lesson["id"]
        path = PREP_DIR / f"prep-{unit}.md"
        if not path.exists():
            errors.append(f"MISSING {path}")
            continue
        text = path.read_text(encoding="utf-8")
        expected = len(instructional_headings(text))
        matches = list(CHECK_RE.finditer(text))
        ids = [match.group(1) for match in matches]
        total_headings += expected
        total_checks += len(matches)
        if len(matches) != expected:
            errors.append(f"{unit}: headings={expected}, checks={len(matches)}")
        if len(ids) != len(set(ids)):
            errors.append(f"{unit}: duplicate check id")
        for match in matches:
            check_id = match.group(1)
            data_fields = fields(match.group(2))
            choices = data_fields["choices"]
            if not data_fields.get("question"):
                errors.append(f"{unit}/{check_id}: missing question")
            if len(choices) != 2:
                errors.append(f"{unit}/{check_id}: choices={len(choices)}")
            if len({key for key, _ in choices}) != len(choices):
                errors.append(f"{unit}/{check_id}: duplicate choice key")
            if data_fields.get("answer") not in {key for key, _ in choices}:
                errors.append(f"{unit}/{check_id}: answer is not a choice")
            if not data_fields.get("explanation"):
                errors.append(f"{unit}/{check_id}: missing explanation")

    print(f"LESSON_FILES={len(mapped_lessons(data))}")
    print(f"INSTRUCTION_HEADINGS={total_headings}")
    print(f"CHECK_BLOCKS={total_checks}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("ERRORS=0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
