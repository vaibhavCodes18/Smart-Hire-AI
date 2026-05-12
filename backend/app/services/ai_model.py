import os
import re
import pickle
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

_ML_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "ml_model"))
HF_MODEL_DIR = os.path.join(_ML_DIR, "smarthire_v5_model")
LABEL_ENC_PATH = os.path.join(HF_MODEL_DIR, "label_encoder_v5.pkl")

print("Loading embeddings model...")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

print("Loading classification model...")
try:
    tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(HF_MODEL_DIR)
    model.eval()
    
    with open(LABEL_ENC_PATH, "rb") as f:
        label_encoder = pickle.load(f)
    print("Classification model loaded successfully.")
except Exception as e:
    print(f"Failed to load classification model: {e}")
    tokenizer = None
    model = None
    label_encoder = None

def clean_text(text: str) -> str:
    t = text
    t = re.sub(r"http\S+|www\S+", " ", t)                       
    t = re.sub(r"\S+@\S+", " ", t)                              
    t = re.sub(r"[\+]?[\d][\d\s\-\.\(\)]{7,15}[\d]", " ", t)   
    t = re.sub(r"[^\w\s\+\#\/\.\-]", " ", t)                    
    t = re.sub(r"\s+", " ", t).strip()
    return t[:4000]

def get_jd_embedding(jd_text: str):
    cleaned = clean_text(jd_text)
    return embed_model.encode([cleaned])

def process_resume(resume_text: str, jd_emb):
    cleaned = clean_text(resume_text)
    
    # 1. Similarity
    res_emb = embed_model.encode([cleaned])
    score = cosine_similarity(jd_emb, res_emb)[0][0]
    score = float(max(0.0, score))
    
    # 2. Classification
    category = "Uncategorized"
    if model and tokenizer and label_encoder:
        inputs = tokenizer(cleaned, truncation=True, padding="max_length", max_length=256, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            pred_idx = torch.argmax(logits, dim=1).item()
            category = label_encoder.inverse_transform([pred_idx])[0]
            
    return category, score
