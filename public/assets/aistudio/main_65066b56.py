"""Week 5: first model response from our own backend.
Run:  uvicorn main:app --reload
Test: curl -X POST localhost:8000/chat -H "Content-Type: application/json" -d '{"message":"ما هو مرض السكري؟"}'
Retrieval (Chroma + MedlinePlus) is added in a later week; for now the model gets a fixed
safety prompt and the safety filter runs before the model."""
import os
import re
import time
from tracemalloc import start
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
client = OpenAI(
    base_url=os.getenv("LLM_BASE_URL"),
    api_key=os.getenv("LLM_API_KEY"),
    timeout=30.0,
    max_retries=0
)

MODEL = os.getenv("LLM_MODEL", "gemini-3.5-flash-lite")
SYSTEM_PROMPT = (
    "You are a health information assistant. Give general, educational health information "
    "in the user's language. Never diagnose, never give medicine doses, and say when to see "
    "a doctor. If you are not sure, say you are not sure. Keep answers short."
)
EMERGENCY = ("هذه قد تكون حالة طارئة. اتصل بالإسعاف على 123 الآن (أو برقم الطوارئ المحلي إذا كنت خارج مصر). "
             "This may be an emergency. Call 123 (or your local emergency number) now.")
REFUSAL = ("لا أستطيع تشخيص الحالات أو تحديد جرعات الأدوية. من فضلك اسأل طبيبًا أو صيدليًا. "
           "I cannot diagnose or give doses. Please ask a doctor or pharmacist.")
FALLBACK = "حدث خطأ مؤقت. حاول مرة أخرى. / Something went wrong. Please try again."

RED_FLAGS = ["ألم في الصدر", "ضيق في التنفس", "لا أستطيع التنفس", "فقدت الوعي", "نزيف شديد",
             "أفكر في إنهاء حياتي", "chest pain", "can't breathe", "unconscious", "severe bleeding"]
DOSE = [r"جرعة", r"كم حبة", r"كم مللي", r"\bdose\b",
    r"\bdosage\b", r"how many (pills|tablets|mg)"]
DIAG = [r"هل (أنا )?مصاب", r"شخص(ني|لي)", r"ماذا أعاني",
              r"diagnose me", r"do i have"]

app = FastAPI(title="Health Information Navigator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Chat(BaseModel):
    message: str


def safety_filter(text: str):
    t = text.lower()
    if any(f in t for f in RED_FLAGS):
        return "red_flag", EMERGENCY
    if any(re.search(p, t) for p in DOSE + DIAG):
        return "refused", REFUSAL
    return "safe", None


@app.post("/chat")
def chat(req: Chat):
    start = time.time()
    status, canned = safety_filter(req.message)
    if canned:
        return {"status": status, "reply": canned, "seconds": round(time.time() - start, 2)}
    try:
        print(f"DEBUG URL: {client.base_url}")
        print(f"DEBUG Model: {MODEL}")
        r = client.chat.completions.create(
            model=MODEL,
            reasoning_effort="low",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": req.message}
            ]
        )
        return {"status": "answered", "model": MODEL, "reply": r.choices[0].message.content,
                "seconds": round(time.time() - start, 2)}
    except Exception as e:
        print("API Error Type:", type(e).__name__)
        print("API Error Details:", repr(e))

        if hasattr(e, "status_code"):
            print("Status Code:", e.status_code)

        if hasattr(e, "response"):
            print("Response:", e.response.text)

        return {
            "status": "error",
            "reply": FALLBACK,
            "seconds": round(time.time() - start, 2)
        }