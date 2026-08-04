"""Add short preparation checks from the existing lesson questions.

The preparation Markdown remains the source of truth. This helper only adds
one two-choice check after each instructional H2 in files that do not yet
contain checks. Existing check blocks are left untouched so hand-authored
content keeps its stable IDs and wording.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = ROOT / "modules" / "foundation" / "data" / "questions.json"
PREP_DIR = ROOT / "modules" / "foundation" / "data"
STOP_WORDS = {
    "基本", "応用", "確認", "判断", "意味", "用法", "使い分け", "表す", "見る",
    "分ける", "分け", "決める", "決め", "読む", "読む", "文", "語", "形",
    "内容", "順", "方法", "関係", "位置", "後ろ", "前", "名詞", "動詞",
    "a", "an", "and", "as", "at", "be", "by", "do", "for", "from", "go",
    "in", "is", "of", "on", "or", "so", "the", "that", "this", "to", "up",
}

# The first batch is deliberately pinned after a dry-run review. The question
# bank contains duplicate legacy/merged records, so positional matching alone
# can otherwise attach a nearby but different judgment to a heading.
QUESTION_OVERRIDES: dict[str, list[str]] = {
    "02-verb-frames": ["10", "cur-010", "add-321", "add-326", "add-327", "add-329", "add-332", "add-328", "add-003"],
    "15-nouns-articles": ["21", "131", "add-077", "129", "add-308", "cur-131"],
    "04-articles-quantity": ["126", "128", "132", "133", "156", "add-052", "add-053"],
    "14-pronouns-determiners": ["legacy-133", "add-036", "cur-136", "legacy-149", "add-314", "add-018", "add-019"],
    "16-adjectives-adverbs": ["22", "23", "140", "141", "142", "144", "146", "148"],
    "13-prepositions": ["add-230", "legacy-136", "legacy-139", "legacy-141", "add-035", "159", "add-067", "add-050"],
    "12-conjunctions-basic": ["121", "add-091", "20", "add-301", "add-090"],
}


def clean_text(value: object) -> str:
    text = "" if value is None else str(value)
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace("|", "／")
    return text


def tokens(value: str) -> set[str]:
    text = clean_text(value).lower()
    found = re.findall(r"[a-z][a-z0-9_/-]*|[\u3040-\u30ff\u3400-\u9fff]+", text)
    result: set[str] = set()
    for token in found:
        if re.fullmatch(r"[\u3040-\u30ff\u3400-\u9fff]+", token):
            candidates = {token}
            candidates.update(
                part
                for part in re.split(r"(?:は|の|を|と|で|に|が|へ|や|も|より|から|まで|・|／|、|,|：|:|\(|\)|（|）)", token)
                if part
            )
        else:
            candidates = {token}
        result.update(candidate for candidate in candidates if candidate not in STOP_WORDS and len(candidate) > 1)
    return result


def english_phrases(value: str) -> set[str]:
    words = re.findall(r"[a-z][a-z0-9_/-]*", clean_text(value).lower())
    phrases: set[str] = set()
    for length in (2, 3):
        phrases.update(
            " ".join(words[index : index + length])
            for index in range(max(0, len(words) - length + 1))
        )
    return phrases


def parse_sections(raw: str) -> list[dict[str, object]]:
    lines = raw.splitlines()
    headings: list[tuple[int, str]] = []
    for index, line in enumerate(lines):
        match = re.match(r"^##\s+(.+?)\s*$", line)
        if match:
            headings.append((index, match.group(1)))

    sections: list[dict[str, object]] = []
    for position, (start, title) in enumerate(headings):
        if title == "教授からの課題":
            continue
        end = headings[position + 1][0] if position + 1 < len(headings) else len(lines)
        body = lines[start + 1 : end]
        sections.append({"title": title, "body": body})
    return sections


def question_text(question: dict[str, object]) -> str:
    return " ".join(
        clean_text(question.get(key, ""))
        for key in ("target", "prompt", "sentence", "ruleRefs", "misconceptions", "explanation")
    )


def choose_question(
    section: dict[str, object],
    questions: list[dict[str, object]],
    used: set[str],
    section_index: int,
) -> dict[str, object]:
    body_text = " ".join(str(line) for line in section["body"])
    section_text = f"{section['title']} {body_text}"
    heading_tokens = tokens(str(section["title"]))
    section_tokens = tokens(section_text)
    section_phrases = english_phrases(section_text)
    board_text = " ".join(
        line for line in section["body"] if not line.strip().startswith("```")
    )
    board_tokens = tokens(board_text)

    ranked: list[tuple[int, int, dict[str, object]]] = []
    for index, question in enumerate(questions):
        question_id = str(question.get("id", index))
        if question_id in used:
            continue
        q_text = question_text(question)
        q_tokens = tokens(q_text)
        q_phrases = english_phrases(q_text)
        target_tokens = tokens(clean_text(question.get("target", "")))
        rule_tokens = tokens(clean_text(question.get("ruleRefs", "")))
        target = clean_text(question.get("target", ""))
        score = 0
        if target and len(target) >= 2 and target in clean_text(section_text):
            score += 60 + min(len(target), 20)
        score += len(heading_tokens & target_tokens) * 100
        score += len(heading_tokens & q_tokens) * 3
        score += len(section_tokens & target_tokens) * 12
        score += len(section_tokens & rule_tokens) * 8
        score += len(board_tokens & q_tokens) * 3
        score += len(section_phrases & q_phrases) * 40
        score += len(section_tokens & q_tokens)
        score += max(0, 18 - abs(index - section_index) * 2)
        ranked.append((score, -index, question))

    if not ranked:
        return questions[0]
    ranked.sort(key=lambda row: (row[0], row[1]), reverse=True)
    return ranked[0][2]


def shorten_explanation(question: dict[str, object]) -> str:
    explanation = question.get("explanation", "")
    if isinstance(explanation, list):
        explanation = explanation[0] if explanation else ""
    text = clean_text(explanation)
    if len(text) <= 180:
        return text
    pieces = re.split(r"(?<=[。！？])", text)
    short = ""
    for piece in pieces:
        if not piece:
            continue
        if len(short) + len(piece) > 180:
            break
        short += piece
    if short:
        return short
    return text[:177].rstrip() + "…"


def make_check(unit: str, index: int, question: dict[str, object]) -> str:
    choices = [clean_text(choice) for choice in question.get("choices", [])]
    if not choices:
        choices = ["正しい", "誤り"]
    answer_index = int(question.get("answerIndex", 0))
    answer_index = max(0, min(answer_index, len(choices) - 1))
    wrong_index = 0 if answer_index != 0 else (1 if len(choices) > 1 else 0)
    answer_key = "A" if index % 2 == 1 else "B"
    wrong_key = "B" if answer_key == "A" else "A"
    answer_choice = choices[answer_index]
    wrong_choice = choices[wrong_index]

    prompt = clean_text(question.get("prompt", ""))
    sentence = clean_text(question.get("sentence", ""))
    if "空所" in prompt:
        prompt = "次の文の空所に入る語は？"
    elif not prompt:
        prompt = "上の説明に当てはまるものは？"
    question_line = clean_text(f"{prompt} {sentence}")

    explanation = shorten_explanation(question)
    return "\n".join(
        [
            f":::check check-{unit}-{index:02d}",
            f"question: {question_line}",
            f"choice: {answer_key}|{answer_choice}",
            f"choice: {wrong_key}|{wrong_choice}",
            f"answer: {answer_key}",
            f"explanation: {explanation}",
            ":::" ,
        ]
    )


def add_checks(raw: str, unit: str, lesson_id: str, questions: list[dict[str, object]]) -> tuple[str, list[dict[str, str]]]:
    sections = parse_sections(raw)
    if not sections:
        return raw, []
    lines = raw.splitlines()
    headings: list[tuple[int, str]] = []
    for line_index, line in enumerate(lines):
        match = re.match(r"^##\s+(.+?)\s*$", line)
        if match:
            headings.append((line_index, match.group(1)))

    selected: list[dict[str, str]] = []
    used: set[str] = set()
    insertions: list[tuple[int, str]] = []
    section_index = 0
    question_by_id = {str(question.get("id", "")): question for question in questions}
    for heading_position, (start, title) in enumerate(headings):
        if title == "教授からの課題":
            break
        end = headings[heading_position + 1][0] if heading_position + 1 < len(headings) else len(lines)
        section = {"title": title, "body": lines[start + 1 : end]}
        override_ids = QUESTION_OVERRIDES.get(unit, [])
        override_id = override_ids[section_index] if section_index < len(override_ids) else ""
        question = question_by_id.get(override_id) or choose_question(section, questions, used, section_index - 1)
        question_id = str(question.get("id", ""))
        used.add(question_id)
        section_index += 1
        check = make_check(unit, section_index, question)
        insertions.append((end, check))
        selected.append({"heading": title, "questionId": question_id, "target": clean_text(question.get("target", ""))})

    for line_index, check in reversed(insertions):
        insert_at = line_index
        while insert_at > 0 and not lines[insert_at - 1].strip():
            insert_at -= 1
        prefix = lines[:insert_at]
        suffix = lines[insert_at:]
        if prefix and prefix[-1].strip():
            prefix.append("")
        prefix.extend(check.splitlines())
        prefix.append("")
        lines = prefix + suffix
    return "\n".join(lines).rstrip() + "\n", selected


def remove_generated_checks(raw: str, unit: str) -> str:
    pattern = rf"\n*:::check check-{re.escape(unit)}-\d+\n.*?\n:::\n*"
    return re.sub(pattern, "\n\n", raw, flags=re.S)


def lesson_map(data: dict[str, object]) -> list[dict[str, object]]:
    lessons: list[dict[str, object]] = []
    for chapter in data["learningPath"]["chapters"]:
        lessons.extend(chapter["lessons"])
    return lessons


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write missing checks to mapped preparation files")
    parser.add_argument("--remove-generated", action="store_true", help="remove checks generated by this helper")
    parser.add_argument("--units", help="comma-separated lessonId values to process")
    args = parser.parse_args()

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    wanted = {item.strip() for item in args.units.split(",")} if args.units else None
    questions_by_lesson: dict[str, list[dict[str, object]]] = {}
    for question in data["questions"]:
        questions_by_lesson.setdefault(question.get("lessonId", ""), []).append(question)

    total = 0
    for lesson in lesson_map(data):
        unit = lesson["id"]
        if wanted is not None and unit not in wanted:
            continue
        path = PREP_DIR / f"prep-{unit}.md"
        if not path.exists():
            print(f"MISSING {path}")
            continue
        raw = path.read_text(encoding="utf-8")
        if args.remove_generated:
            updated = remove_generated_checks(raw, unit)
            if args.apply and updated != raw:
                path.write_text(updated, encoding="utf-8", newline="\n")
            print(f"REMOVE {unit}: {raw.count(f'check-{unit}-')} generated checks")
            continue
        if re.search(r"(?m)^:::check", raw):
            print(f"SKIP {unit}: existing checks")
            continue
        updated, selected = add_checks(raw, unit, lesson["id"], questions_by_lesson.get(lesson["id"], []))
        print(f"{unit}: {len(selected)} checks")
        for item in selected:
            print(f"  {item['heading']} <= {item['questionId']} [{item['target']}]")
        total += len(selected)
        if args.apply:
            path.write_text(updated, encoding="utf-8", newline="\n")
    print(f"TOTAL_CHECKS={total}")
    print("MODE=APPLY" if args.apply else "MODE=DRY_RUN")


if __name__ == "__main__":
    main()
