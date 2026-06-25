import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ITEMS_PATH = ROOT / "data" / "grammar_items.json"
BANK_PATH = ROOT / "data" / "grammar_bank.json"
EXTRA_ITEMS_PATH = ROOT / "data" / "grammar_items_extra.json"

PRACTICE_DISTRACTORS = {
    "am": ["are", "is", "be"],
    "are": ["am", "is", "be"],
    "is": ["am", "are", "be"],
    "plays": ["play", "playing", "played"],
    "study": ["studies", "studied", "studying"],
    "drinks": ["drink", "drinking", "drank"],
    "play": ["plays", "played", "playing"],
    "lives": ["live", "living", "lived"],
    "Are": ["Do", "Is", "Did"],
    "Does": ["Do", "Is", "Did"],
    "Do": ["Does", "Are", "Did"],
    "Is": ["Are", "Do", "Does"],
    "Did": ["Do", "Does", "Are"],
    "studying": ["study", "studied", "studies"],
    "playing": ["play", "played", "plays"],
    "cooking": ["cook", "cooked", "cooks"],
    "watching": ["watch", "watched", "watches"],
    "listening": ["listen", "listened", "listens"],
    "visited": ["visit", "visiting", "visits"],
    "lived": ["live", "living", "lives"],
    "boils": ["boil", "boiled", "boiling"],
    "read": ["reads", "reading", "has read"],
    "writing": ["write", "wrote", "writes"],
    "sleeping": ["sleep", "slept", "sleeps"],
    "waiting": ["wait", "waited", "waits"],
    "been": ["be", "being", "was"],
    "known": ["know", "knew", "knowing"],
    "worked": ["work", "working", "works"],
    "eaten": ["eat", "ate", "eating"],
    "seen": ["see", "saw", "seeing"],
    "stayed": ["stay", "staying", "stays"],
    "finished": ["finish", "finishing", "finishes"],
    "written": ["write", "wrote", "writing"],
    "cleaned": ["clean", "cleaning", "cleans"],
    "arrived": ["arrive", "arriving", "arrives"],
    "went": ["go", "goes", "going"],
    "played": ["play", "plays", "playing"],
    "saw": ["see", "seen", "seeing"],
    "did": ["do", "does", "done"],
    "will": ["is", "did", "has"],
    "going": ["go", "went", "gone"],
    "leave": ["leaves", "left", "leaving"],
    "open": ["opens", "opened", "opening"],
    "can": ["must", "will", "does"],
    "speak": ["speaks", "speaking", "spoke"],
    "swim": ["swims", "swam", "swimming"],
    "use": ["uses", "used", "using"],
    "solve": ["solves", "solved", "solving"],
    "had": ["have", "has", "having"],
    "gone": ["go", "went", "going"],
    "left": ["leave", "leaving", "leaves"],
    "completed": ["complete", "completing", "completes"],
    "started": ["start", "starting", "starts"],
    "will have": ["have", "had", "will be"],
    "been living": ["lived", "living", "live"],
    "been studying": ["studied", "studying", "study"],
    "been raining": ["rained", "raining", "rain"],
    "been working": ["worked", "working", "work"],
    "been waiting": ["waited", "waiting", "wait"]
}


def ordered_choices(answer, distractors):
    choices = [answer] + distractors
    deduped = []
    for choice in choices:
        if choice not in deduped:
            deduped.append(choice)
    for fallback in ["過去形", "be動詞 + -ing", "to + 動詞の原形", "助動詞 + 動詞の原形", "名詞 + 前置詞", "比較級 + than"]:
        if len(deduped) >= 4:
            break
        if fallback not in deduped:
            deduped.append(fallback)
    if len(deduped) != 4:
        raise ValueError(f"expected 4 unique choices for {answer}: {deduped}")
    # Deterministic but not always answer-first.
    shift = sum(ord(ch) for ch in answer) % 4
    return deduped[shift:] + deduped[:shift]


def validate_question(question, mode):
    choices = question["choices"]
    answer = question["answer"]
    if len(choices) != 4 or len(set(choices)) != 4:
        raise ValueError(f"bad choices: {question}")
    if answer not in choices:
        raise ValueError(f"answer missing: {question}")
    if mode == "practice" and question["stem"].count("___") != 1:
        raise ValueError(f"practice stem must have exactly one blank: {question}")


def build_memory(item):
    if "memorySeeds" not in item:
        ex = item["explanation"]
        item = {
            **item,
            "memorySeeds": [
                {
                    "stem": f"「{item['item']}」の中心ルールとして最も適切なものは？",
                    "answer": ex["rule"],
                    "distractors": item.get("ruleDistractors", [
                        "過去の一点だけを表す。",
                        "主語と動詞を省略してよい。",
                        "名詞を必ず複数形にする。"
                    ]),
                    "why": ex["rule"]
                },
                {
                    "stem": f"「{item['item']}」の基本形として最も近いものは？",
                    "answer": ex["form"],
                    "distractors": item.get("formDistractors", [
                        "have + 過去分詞",
                        "be動詞 + -ing",
                        "助動詞 + 動詞の原形"
                    ]),
                    "why": f"基本形は「{ex['form']}」。"
                }
            ]
        }
    questions = []
    for idx, seed in enumerate(item["memorySeeds"], start=1):
        q = {
            "id": f"{item['id']}_memory_{idx}",
            "itemId": item["id"],
            "mode": "memory",
            "type": "rule",
            "stem": seed["stem"],
            "choices": ordered_choices(seed["answer"], seed["distractors"]),
            "answer": seed["answer"],
            "whyCorrect": seed["why"],
            "whyWrong": {
                choice: "この文法事項のルールとは合わない選択肢です。"
                for choice in seed["distractors"]
            }
        }
        validate_question(q, "memory")
        questions.append(q)
    return questions


def build_practice(item):
    if "practiceSeeds" not in item:
        item = {**item, "practiceSeeds": item["practiceExamples"]}
    questions = []
    for idx, seed in enumerate(item["practiceSeeds"], start=1):
        answer = seed["answer"]
        distractors = seed.get("distractors") or PRACTICE_DISTRACTORS.get(answer)
        if not distractors:
            raise KeyError(f"no distractors for answer: {answer}")
        q = {
            "id": f"{item['id']}_practice_{idx}",
            "itemId": item["id"],
            "mode": "practice",
            "type": "blank",
            "stem": seed["stem"],
            "choices": ordered_choices(answer, distractors),
            "answer": answer,
            "whyCorrect": seed["why"],
            "whyWrong": {
                choice: "語形・時制・主語との対応が、この空所には合いません。"
                for choice in distractors
            },
            "translation": seed["translation"]
        }
        validate_question(q, "practice")
        questions.append(q)
    return questions


def main():
    items = json.loads(ITEMS_PATH.read_text(encoding="utf-8"))["items"]
    if EXTRA_ITEMS_PATH.exists():
        items.extend(json.loads(EXTRA_ITEMS_PATH.read_text(encoding="utf-8"))["items"])
    bank = {"memoryQuestions": [], "practiceQuestions": []}
    for item in items:
        bank["memoryQuestions"].extend(build_memory(item))
        bank["practiceQuestions"].extend(build_practice(item))

    BANK_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(bank['memoryQuestions'])} memory and {len(bank['practiceQuestions'])} practice questions.")


if __name__ == "__main__":
    main()
