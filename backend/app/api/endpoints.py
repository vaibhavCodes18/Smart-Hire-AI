from typing import List
import os
import shutil
import tempfile

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.pdf_parser import extract_text_from_pdf
from app.services.ai_model import process_resume, get_jd_embedding

router = APIRouter()
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "smarthire_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze")
async def analyze_resumes(
    job_description: str = Form(...),
    resumes: List[UploadFile] = File(...)
):
    if not job_description or not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
        
    if not resumes:
        raise HTTPException(status_code=400, detail="No resumes uploaded.")

    # Process JD
    jd_emb = get_jd_embedding(job_description)
    results = []

    for file in resumes:
        if not file.filename.endswith(".pdf"):
            continue

        try:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            raw_text = extract_text_from_pdf(file_path)
            if not raw_text:
                continue

            # Process resume
            category, score = process_resume(raw_text, jd_emb)

            results.append({
                "filename": file.filename,
                "category": category,
                "score": score
            })

        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            continue
            
    # Sort descending by score
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results
