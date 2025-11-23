import re
from typing import List, Optional
from rapidfuzz import fuzz

CREDIT_PATTERNS = [
    re.compile(r"\b(\d+)\s*(credit\s*hours?|credits?|cr\.)\b", re.IGNORECASE),
    re.compile(r"\bcredit[s]?:\s*(\d+)\b", re.IGNORECASE),
    re.compile(r"\bCH:\s*(\d+)\b", re.IGNORECASE),
]

def extract_subject_credits(text: str, subject_aliases: List[str], min_match: int = 80) -> Optional[int]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # find best subject line
    best_idx, best_score = -1, 0
    for i, ln in enumerate(lines):
        score = max(fuzz.partial_ratio(alias.lower(), ln.lower()) for alias in subject_aliases)
        if score > best_score:
            best_idx, best_score = i, score

    if best_idx == -1 or best_score < min_match:
        return None

    # search around that line
    window = lines[max(0, best_idx-3): min(len(lines), best_idx+4)]
    for ln in window:
        for pat in CREDIT_PATTERNS:
            m = pat.search(ln)
            if m:
                try:
                    return int(m.group(1))
                except:
                    pass
    return None
