import re
from typing import List, Optional, Tuple
from rapidfuzz import fuzz, process

GRADE_REGEX = re.compile(r"\b([A-F][\+\-]?)\b", re.IGNORECASE)

def _split_lines(text: str) -> List[str]:
    # normalize & split
    return [ln.strip() for ln in text.splitlines() if ln.strip()]

def _best_subject_line(lines: List[str], aliases: List[str]) -> Tuple[int, str, int]:
    """
    Returns (index, matched_line, score). If not found, (-1, "", 0)
    """
    best_idx, best_line, best_score = -1, "", 0
    for i, ln in enumerate(lines):
        # compare each alias to the current line, keep max score
        scores = [fuzz.partial_ratio(alias.lower(), ln.lower()) for alias in aliases]
        score = max(scores) if scores else 0
        if score > best_score:
            best_idx, best_line, best_score = i, ln, score
    return best_idx, best_line, best_score

def extract_subject_grade(transcript_text: str, subject_aliases: List[str], min_match: int = 80) -> Optional[str]:
    """
    Find the grade for the given subject (by aliases). Searches the subject line and nearby lines.
    Returns grade string like 'A-', 'B', 'C+', or None if not found.
    """
    lines = _split_lines(transcript_text)
    idx, matched_line, score = _best_subject_line(lines, subject_aliases)
    if idx == -1 or score < min_match:
        return None

    # Search the subject line and a small window around it for a grade.
    window = lines[max(0, idx-3): min(len(lines), idx+4)]
    text_window = " | ".join(window)

    # Common transcript layouts: subject ... grade ... credits
    # Try near-subject-line first
    m = GRADE_REGEX.search(text_window)
    if m:
        return m.group(1).upper()

    # Fallback: look on the same line first
    m2 = GRADE_REGEX.search(matched_line)
    return m2.group(1).upper() if m2 else None
