"""Tiny fake OpenAI-compatible server, ONLY to test the backend wiring offline."""
from fastapi import FastAPI
app = FastAPI()
@app.post("/v1/chat/completions")
def c(body: dict):
    return {"id":"x","object":"chat.completion","created":0,"model":body["model"],
            "choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant",
            "content":"[MOCK] السكري حالة مزمنة تؤثر على مستوى السكر في الدم. استشر طبيبًا."}}]}
