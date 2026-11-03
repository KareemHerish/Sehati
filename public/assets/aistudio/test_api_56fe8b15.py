import requests

# رابط الـ API بتاعك
URL = "http://127.0.0.1:8000/chat" 

print("=== أداة اختبار الباك إند (اكتب 'خروج' للقفل) ===")
print("جرب الحالات الآتية: 1. ألم في الصدر 2. جرعة دواء 3. سؤال عادي\n")

while True:
    user_input = input("أنت: ")
    if user_input.strip() == "خروج":
        break
    
    # ملحوظة: لو الباك إند عندك بيستقبل الكلمة باسم تاني غير "message" (زي "text" أو "query")، عدلها هنا
    payload = {"message": user_input}
    
    try:
        response = requests.post(URL, json=payload)
        if response.status_code == 200:
            # اطبع الرد (لو الرد بيرجع جوه key معين زي 'reply' أو 'response'، عدلها)
            print("البوت:", response.json())
        else:
            print("خطأ في الخادم:", response.status_code, response.text)
    except Exception as e:
        print("فشل الاتصال بالخادم، اتأكد إن uvicorn شغال. التفاصيل:", e)