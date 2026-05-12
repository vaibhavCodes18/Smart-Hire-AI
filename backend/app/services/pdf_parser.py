import fitz

def extract_text_from_pdf(path: str) -> str:
    try:
        doc = fitz.open(path)
        txt = " ".join(p.get_text() for p in doc)
        doc.close()
        return txt if len(txt.strip()) > 50 else None
    except Exception as e:
        print(f"pdf error {path}: {e}")
        return None
