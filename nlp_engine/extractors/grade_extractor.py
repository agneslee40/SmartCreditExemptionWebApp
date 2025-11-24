import re
from typing import List, Optional, Tuple
from rapidfuzz import fuzz, process
from typing import List, Optional

# Grade pattern (A+, A, A-, B+, ...)
GRADE_PATTERN = r"(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F\*?|EX|P)"

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

def extract_subject_grade(text: str, aliases: List[str]) -> Optional[str]:
    """
    Extract subject grade from Sunway-style transcript.
    Supports:
    - Subject Code + Subject Title + Credits + Grade Point + Grade
    - Subject Title + Credits + Grade
    - Fuzzy alias matching
    """

    lines = text.splitlines()

    # Make alias lowercase for comparison
    aliases_lower = [a.lower() for a in aliases]

    # ------------------------------
    # 1) Try matching CODE + TITLE + CREDITS + GP + GRADE
    # ------------------------------
    # Example:
    #   MTH1114 Computer Mathematics 4 3.50 A+
    for line in lines:
        line_clean = " ".join(line.split())  # normalize spaces
        # Search for alias in line
        if any(alias in line_clean.lower() for alias in aliases_lower):
            match = re.search(GRADE_PATTERN, line_clean, re.IGNORECASE)
            if match:
                return match.group(1).upper()

    # ------------------------------
    # 2) Try TITLE + credits + grade
    # Example:
    #   Computer Mathematics     4    3.50   A+
    # ------------------------------
    for line in lines:
        line_clean = " ".join(line.split())
        if any(alias in line_clean.lower() for alias in aliases_lower):
            # look for grade anywhere after the alias
            match = re.search(GRADE_PATTERN, line_clean, re.IGNORECASE)
            if match:
                return match.group(1).upper()

    # ------------------------------
    # 3) Last fallback: global search around alias
    # ------------------------------
    text_lower = text.lower()
    for alias in aliases_lower:
        idx = text_lower.find(alias)
        if idx != -1:
            window = text[idx: idx + 100]  # look 100 characters ahead
            match = re.search(GRADE_PATTERN, window, re.IGNORECASE)
            if match:
                return match.group(1).upper()

    return None
