import urllib.parse
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from app.core.config import settings

router = APIRouter()

class ConsultationMessageRequest(BaseModel):
    name: str
    service_type: str
    topic: str
    deadline: Optional[str] = "Segera"
    budget_estimate: Optional[str] = "-"
    notes: Optional[str] = ""

class ConsultationResponse(BaseModel):
    whatsapp_url: str
    message_text: str

@router.post("/whatsapp-link", response_model=ConsultationResponse)
def generate_whatsapp_link(data: ConsultationMessageRequest):
    """
    Menghasilkan link WhatsApp (wa.me) langsung dengan template pesan yang rapi
    dan profesional agar tingkat konversi closing tinggi.
    """
    text = (
        f"Halo Tim {settings.PROJECT_NAME},\n\n"
        f"Saya mau konsultasi project:\n"
        f"👤 Nama: {data.name}\n"
        f"📌 Layanan: {data.service_type}\n"
        f"💡 Judul/Topik: {data.topic}\n"
        f"⏰ Target Deadline: {data.deadline}\n"
        f"💰 Estimasi Budget: {data.budget_estimate}\n"
    )

    if data.notes:
        text += f"📝 Catatan Tambahan: {data.notes}\n"
    
    text += "\nMohon info ketersediaan dan diskusi lebih lanjut. Terima kasih!"
    
    encoded_text = urllib.parse.quote(text)
    admin_phone = settings.WHATSAPP_ADMIN_NUMBER.replace("+", "").replace("-", "").replace(" ", "")
    wa_url = f"https://wa.me/{admin_phone}?text={encoded_text}"

    return ConsultationResponse(
        whatsapp_url=wa_url,
        message_text=text
    )
