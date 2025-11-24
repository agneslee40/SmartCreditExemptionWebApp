import re
from typing import List, Optional
from transformers import pipeline

# Valid grades we accept
VALID_GRADES = {
    "A+", "A", "A-",
    "B+", "B", "B-",
    "C+", "C", "C-",
    "D+", "D", "D-",
    "F", "EX", "P"
}

# Load a small free text2text model (FLAN-T5 small)
# This happens once when the module is imported.
print("[grade_extractor] Loading FLAN-T5-small for grade extraction...")
grade_nlp = pipeline("text2text-generation", model="google/flan-t5-small")
print("[grade_extractor] Model loaded.")


def _build_subject_window(text: str, aliases: List[str],
                          before: int = 600, after: int = 800) -> str:
    """
    Get a local snippet of the transcript around the subject name.
    This keeps the prompt short but relevant.
    """
    if not text:
        return ""

    lower = text.lower()
    idx = -1

    # Try to find exact alias occurrence
    for alias in aliases:
        alias = alias.lower().strip()
        if not alias:
            continue
        i = lower.find(alias)
        if i != -1:
            idx = i
            break

    # If we can't find it, just return a truncated transcript
    if idx == -1:
        return text[:4000]

    start = max(0, idx - before)
    end = min(len(text), idx + after)
    return text[start:end]


def extract_subject_grade(text: str, aliases: List[str]) -> Optional[str]:
    """
    Use a small LLM (FLAN-T5) to read the transcript snippet and
    extract the letter grade for the given subject.

    Returns:
        'A+', 'B', 'C-' etc, or None if not found.
    """
    if not text or not aliases:
        return None

    # Prepare a focused window around the subject
    snippet = _build_subject_window(text, aliases)

    subject_display = aliases[0]

    prompt = f"""
You are given a snippet of a student's academic transcript.

Your task:
- Find the final letter grade that the student obtained for the subject "{subject_display}".
- Only consider letter grades in this set: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, EX, P.
- Return ONLY the grade (for example: A+, B, C-, F).
- If you cannot find the grade for this subject, reply with: NONE

Transcript snippet:
{snippet}
"""

    try:
        result = grade_nlp(
            prompt.strip(),
            max_length=16,
            num_return_sequences=1,
            do_sample=False
        )
    except Exception as e:
        print("[grade_extractor] Error calling model:", e)
        return None

    raw_answer = result[0]["generated_text"].strip().upper()
    # Debug print (optional – can comment out when stable)
    print("[grade_extractor] Raw model answer:", repr(raw_answer))

    # Split into tokens and pick the first valid grade token
    tokens = re.split(r"[\s,;:.]+", raw_answer)
    for tok in tokens:
        tok = tok.strip().upper()
        if tok in VALID_GRADES:
            return tok

    if "NONE" in raw_answer:
        return None

    # If model gave something odd
    return None
