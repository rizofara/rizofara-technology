import uvicorn
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.5)
    print("🌐 Membuka website di browser: http://127.0.0.1:8000 ...")
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 MENJALANKAN RIZOFARA TECHNOLOGY (SATU PINTU)")
    print("👉 Website & Aplikasi: http://127.0.0.1:8000")
    print("👉 Swagger API Docs  : http://127.0.0.1:8000/docs")
    print("=" * 60)
    
    # Buka browser secara otomatis
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Jalankan server
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
