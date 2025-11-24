from transformers import pipeline

# Load model once (slow only the first time)
credit_model = pipeline(
    "text2text-generation",
    model="google/flan-t5-base",
    tokenizer="google/flan-t5-base"
)

def extract_credit_hours_ai(text: str, subject_name: str):
    """
    Uses a small free AI model to extract credit hours from course syllabus.
    Works for many inconsistent formats.
    """

    prompt = f"""
    Extract the CREDIT HOURS for the subject "{subject_name}" from the text below.
    If you cannot find the credit hours, return "NONE".
    Return ONLY the number.

    Text:
    {text}
    """

    try:
        result = credit_model(prompt, max_length=50)
        output = result[0]["generated_text"].strip()

        # Normalise AI output
        output = output.replace("credit hours", "").replace("credits", "").strip()

        # Keep only numbers
        import re
        num = re.findall(r"\d+", output)
        if num:
            return int(num[0])

        return None
    except:
        return None
 