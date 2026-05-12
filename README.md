# 🧠 Smart Hire AI

![Smart Hire AI Banner](https://via.placeholder.com/1200x400/050505/8b5cf6?text=Smart+Hire+AI+-+Candidate+Intelligence)

Smart Hire AI is an advanced applicant tracking and resume screening application that leverages neural embeddings and Natural Language Processing (NLP) to instantly analyze, classify, and rank applicant resumes against your exact job description.

## ✨ Features

- **Intelligent Extraction:** Automatically parses multi-page PDFs, preserving vital structural data like skills and experience while discarding formatting noise.
- **Neural Embeddings:** Uses DistilBERT models to map candidate experiences into a high-dimensional semantic space, matching them intelligently against job requirements.
- **Precision Ranking:** Classifies candidates into professional categories and ranks them instantly by their semantic Cosine Similarity score.
- **Beautiful Glassmorphic UI:** A premium, dynamic dashboard that feels responsive and state-of-the-art.

## 🛠️ Technology Stack

**Frontend:**
- HTML5
- Vanilla JavaScript
- Tailwind CSS (via CDN) for styling
- FontAwesome for icons
- Google Fonts (Outfit, Inter)

**Backend:**
- **Python 3.x**
- **FastAPI** & **Uvicorn**
- **PyMuPDF**: For PDF parsing and text extraction.
- **Transformers (Hugging Face)**: For loading state-of-the-art NLP models.
- **Sentence-Transformers**: To generate semantic embeddings.
- **PyTorch** & **Scikit-Learn**: For the machine learning pipeline.

## 📂 Folder Structure

```text
SmartHireAi90+/
│
├── backend/                  # Python FastAPI Backend & ML Models
│   ├── app/                  # Application Logic
│   │   ├── api/              # API Endpoints
│   │   ├── services/         # Business logic and ML inference
│   │   └── main.py           # FastAPI entry point
│   ├── ml_model/             # Trained ML Models and Checkpoints
│   │   ├── smarthire_v5_model/ # The v5 DistilBERT model
│   │   ├── checkpoints/
│   │   └── label_encoder_v5.pkl
│   ├── Resumedata/           # Sample or uploaded resume data
│   ├── requirements.txt      # Python dependencies
│   └── smart_hire.ipynb      # Jupyter Notebook for Model Training
│
├── frontend/                 # Vanilla Web Frontend
│   ├── index.html            # Main User Interface
│   └── app.js                # Frontend Application Logic
│
├── Manual-How-To-Start.txt   # Quick start instructions
└── README.md                 # Project Documentation
```

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- **Python 3.8+** installed on your machine.
- A modern web browser (Chrome, Firefox, Safari, Edge).

### 1. Backend Setup

1. Open your terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will now be running at `http://localhost:8000` (and `http://localhost:8000/docs` for the interactive API documentation).*

### 2. Frontend Setup

Since the frontend is built with pure HTML, CSS (Tailwind CDN), and Vanilla JavaScript, no Node.js or build process is required!

1. Navigate to the `frontend` directory.
2. You can simply open the `index.html` file in your preferred web browser. 
   *(Alternatively, you can serve it using a simple HTTP server like `python -m http.server 3000` from the `frontend` folder).*

## 💡 How to Use

1. **Launch the Interface:** Open the frontend in your browser.
2. **Provide Job Description:** Paste the full job description in the provided text area (include required tech stack, responsibilities, etc.).
3. **Upload Resumes:** Drag and drop or click to upload one or multiple applicant resumes in PDF format.
4. **Process Candidates:** Click the **"Process Candidates"** button to start the ML-powered analysis.
5. **Review Results:** Wait a few moments as the neural embeddings are computed, and view the top-ranked candidates based on semantic match scores.

---
*Built with ❤️ for modern hiring teams.*
