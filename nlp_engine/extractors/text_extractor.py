from pdfminer.high_level import extract_text

def extract_text_from_pdf(file_path: str) -> str:
    try:
        return extract_text(file_path) or ""
    except Exception as e:
        print(f"[text_extractor] Error reading {file_path}: {e}")
        return ""
