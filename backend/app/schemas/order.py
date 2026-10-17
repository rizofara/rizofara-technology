from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# --- CALCULATOR SCHEMAS ---
class CalculatorRequest(BaseModel):
    service_type: str = Field(..., description="skripsi, tugas, website, atau chatbot")
    complexity: str = Field("intermediate", description="basic, intermediate, advanced, expert")
    urgency_days: int = Field(14, ge=5, description="Jumlah hari sebelum deadline (minimal 5 hari)")
    tech_platform: Optional[str] = Field("web", description="web, mobile, ai_ml, iot, desktop")
    include_report: bool = Field(True, description="Termasuk pembuatan dokumen/bab program")
    include_wireframe: bool = Field(False, description="Termasuk pembuatan Wireframe dengan Balsamiq Mockups")

class CalculatorResponse(BaseModel):
    service_type: str
    estimated_min_price: int
    estimated_max_price: int
    recommended_dp: int
    estimated_days: int
    benefits: List[str]
    notes: str

# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    client_name: str
    client_whatsapp: str
    client_email: Optional[str] = None
    campus_or_company: Optional[str] = None
    service_type: str
    tech_stack: Optional[str] = None
    title: str
    description: str
    deadline: str
    price_estimate: Optional[int] = 0

class OrderFileResponse(BaseModel):
    id: int
    file_name: str
    file_size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class RevisionResponse(BaseModel):
    id: int
    notes: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_code: str
    client_name: str
    client_whatsapp: str
    client_email: Optional[str] = None
    campus_or_company: Optional[str] = None
    service_type: str
    tech_stack: Optional[str] = None
    title: str
    description: str
    deadline: str
    price_estimate: int
    dp_amount: int
    status: str
    progress_percent: int
    demo_url: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    files: List[OrderFileResponse] = []
    revisions: List[RevisionResponse] = []

    class Config:
        from_attributes = True

# Tracking View untuk Klien (Aman, tanpa catatan internal)
class OrderTrackResponse(BaseModel):
    order_code: str
    client_name: str
    service_type: str
    title: str
    deadline: str
    status: str
    progress_percent: int
    demo_url: Optional[str] = None
    created_at: datetime
    files_count: int
    revisions: List[RevisionResponse] = []

class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    progress_percent: Optional[int] = None
    dp_amount: Optional[int] = None
    demo_url: Optional[str] = None
    assigned_to: Optional[str] = None
    internal_notes: Optional[str] = None

class RevisionCreate(BaseModel):
    notes: str
