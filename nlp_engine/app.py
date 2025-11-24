from flask import Flask, request, jsonify
from extractors.text_extractor import extract_text_from_pdf
from extractors.grade_extractor import extract_subject_grade
from extractors.credit_extractor import extract_subject_credits
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import numpy as np
import re
from sentence_transformers import SentenceTransformer, util


def json_safe(value):
    """Convert numpy and other types into JSON-serializable types."""
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return float(value)
    return value   # fallback: string or None

def detect_course_content(text: str) -> bool:
    syllabus_keywords = [
        "learning outcome",
        "course description",
        "topics",
        "prerequisite",
        "instructional methods",
        "assessment methods",
        "weekly schedule",
        "lecture plan",
        "reference materials",
    ]

    text_lower = text.lower()
    return any(k in text_lower for k in syllabus_keywords)


app = Flask(__name__)
print("Loading embedding model... please wait.")
emb_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Model loaded successfully!")


def normalize_text(text: str) -> str:
    """Lowercase, remove extra spaces and punctuation for more robust similarity."""
    if not text:
        return ""
    text = text.lower()
    # Collapse all whitespace (newlines, tabs) into single spaces
    text = re.sub(r"\s+", " ", text)
    # Remove punctuation and non-alphanumeric except spaces
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text.strip()


def compute_similarity(t1: str, t2: str) -> float:
    vec = TfidfVectorizer()
    X = vec.fit_transform([t1 or "", t2 or ""])
    return round(cosine_similarity(X[0:1], X[1:2])[0][0] * 100, 2)

GRADE_RANK = {
    "A+": 13, "A": 12, "A-": 11,
    "B+": 10, "B": 9, "B-": 8,
    "C+": 7, "C": 6, "C-": 5,
    "D+": 4, "D": 3, "D-": 2,
    "F": 1
}

def grade_meets_requirement(grade: str, minimum="C") -> bool:
    if grade is None:
        return False
    grade = grade.upper().strip()
    if grade not in GRADE_RANK:
        return False
    return GRADE_RANK[grade] >= GRADE_RANK[minimum]

def compute_semantic_similarity(t1: str, t2: str) -> float:
    """Compute semantic similarity using Sentence-BERT embeddings."""
    if not t1 or not t2:
        return 0.0
    emb1 = emb_model.encode(t1, convert_to_tensor=True)
    emb2 = emb_model.encode(t2, convert_to_tensor=True)
    cos_sim = util.cos_sim(emb1, emb2)[0][0].item()
    return round(cos_sim * 100, 2)

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(force=True)

    app_type = data.get("type", "Credit Exemption")
    subject_name = data.get("subject_name", "")
    aliases = data.get("subject_aliases") or [subject_name]
    applicant_files = data.get("applicant_files", [])
    sunway_files = data.get("sunway_files", [])

    if not subject_name:
        return jsonify({"error": "subject_name is required"}), 400
    if not applicant_files or not sunway_files:
        return jsonify({"error": "applicant_files and sunway_files are required"}), 400

    # -----------------------------------------------------
    # 1) EXTRACT APPLICANT FILES: split transcript vs module content
    # -----------------------------------------------------
    applicant_transcript_text = ""
    applicant_course_text = None

    for p in applicant_files:
        if not os.path.exists(p):
            return jsonify({"error": f"Applicant file not found: {p}"}), 400

        extracted = extract_text_from_pdf(p)
        if detect_course_content(extracted):
            applicant_course_text = extracted   # course syllabus
        else:
            applicant_transcript_text += extracted + "\n"  # transcript

    if applicant_course_text is None:
        return jsonify({"error": "No applicant course syllabus detected"}), 400

    # -----------------------------------------------------
    # 2) EXTRACT SUNWAY FILES: find Sunway syllabus
    # -----------------------------------------------------
    sunway_course_text = None

    for p in sunway_files:
        if not os.path.exists(p):
            return jsonify({"error": f"Sunway file not found: {p}"}), 400

        extracted = extract_text_from_pdf(p)
        if detect_course_content(extracted):
            sunway_course_text = extracted

    if sunway_course_text is None:
        return jsonify({"error": "No Sunway course syllabus detected"}), 400

    # -----------------------------------------------------
    # 3) GRADE + CREDIT extraction (from TRANSCRIPT ONLY)
    # -----------------------------------------------------
    subject_grade = extract_subject_grade(applicant_transcript_text, aliases)
    subject_credits = extract_subject_credits(applicant_course_text, aliases)

    # -----------------------------------------------------
    # 4) SEMANTIC SIMILARITY (COURSE-CONTENT vs COURSE-CONTENT)
    # -----------------------------------------------------
    normalized_app = normalize_text(applicant_course_text)
    normalized_sun = normalize_text(sunway_course_text)

    similarity = compute_semantic_similarity(normalized_app, normalized_sun)

    # -----------------------------------------------------
    # 5) RULES
    # -----------------------------------------------------
    sim_ok = similarity >= 80
    grade_ok = grade_meets_requirement(subject_grade, "C")
    credit_ok = (subject_credits is not None and subject_credits >= 3)

    ai_decision = "approve" if (sim_ok and grade_ok and credit_ok) else "reject"

    reasoning = {
        "subject": subject_name,
        "similarity_percent": similarity,
        "similarity_ok": sim_ok,
        "detected_grade": subject_grade,
        "grade_ok": grade_ok,
        "detected_credit_hours": subject_credits,
        "credit_ok": credit_ok
    }

    suggested_equivalent_grade = None
    if app_type.lower() == "credit transfer" and ai_decision == "approve":
        suggested_equivalent_grade = subject_grade or "C"

    response = {
        "ai_decision": str(ai_decision),
        "type": str(app_type),
        "reasoning": {k: json_safe(v) for k, v in reasoning.items()},
        "suggested_equivalent_grade": json_safe(suggested_equivalent_grade)
    }
    
    #Debug Temp
    print("----- TRANSCRIPT TEXT -----")
    print(applicant_transcript_text[:800])
    print("----- END -----")
    #

    return jsonify(response)

#Debug Temp
text = extract_text_from_pdf("datasets/applicants/SunwayTranscripts.pdf")

grade = extract_subject_grade(text, ["Computer Mathematics"])
print("GRADE =", grade)
#

# --- Manual test for grade extraction when starting the service ---
if __name__ == "__main__":
    try:
        sample_text = extract_text_from_pdf("datasets/applicants/SunwayTranscripts.pdf")
        test_grade = extract_subject_grade(sample_text, ["Computer Mathematics"])
        print("TEST GRADE (Computer Mathematics):", test_grade)
    except Exception as e:
        print("Manual grade test failed:", e)

    app.run(port=8000)

