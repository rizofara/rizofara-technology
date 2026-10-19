from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


# --- CALCULATOR SCHEMAS ---
class CalculatorBreakdownItem(BaseModel):
    step: str
    label: str
    multiplier: Optional[float] = None
    amount_min: Optional[int] = None
    amount_max: Optional[int] = None


class CalculatorRequest(BaseModel):
    service_type: str = Field(..., description="Slug layanan, misal: skripsi, tugas, website, chatbot")
    complexity: str = Field("intermediate", description="Kode kompleksitas, misal: basic, intermediate, advanced, expert")
    urgency_days: int = Field(14, ge=1, le=90, description="Jumlah hari sebelum deadline (1-90 hari)")
    tech_platform: Optional[str] = Field("web", description="Kode platform, misal: web, mobile, ai_ml, iot, desktop")
    include_report: bool = Field(True, description="Legacy flag: Termasuk pembuatan dokumen/bab program")
    include_wireframe: bool = Field(False, description="Legacy flag: Termasuk pembuatan Wireframe dengan Balsamiq Mockups")
    selected_addons: Optional[List[str]] = Field(
        default=None,
        description="Daftar kode add-on yang dipilih secara dinamis (misal ['report', 'wireframe', 'deploy'])"
    )


class CalculatorResponse(BaseModel):
    service_type: str
    service_name: Optional[str] = None
    estimated_min_price: int
    estimated_max_price: int
    recommended_dp: int
    estimated_days: int
    urgency_tier: str = "Standar"
    is_feasible: bool = True
    min_allowed_days: int = 5
    breakdown: List[CalculatorBreakdownItem] = []
    benefits: List[str]
    notes: str


# --- MILESTONE & TIMELINE SCHEMAS (MODUL M6) ---

class OrderMilestoneCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(default=None, max_length=255)
    weight_percent: int = Field(default=25, ge=0, le=100)
    is_completed: bool = False
    display_order: int = 1


class OrderMilestoneUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=150)
    description: Optional[str] = Field(default=None, max_length=255)
    weight_percent: Optional[int] = Field(default=None, ge=0, le=100)
    is_completed: Optional[bool] = None
    display_order: Optional[int] = None


class OrderMilestoneResponse(BaseModel):
    id: int
    order_id: int
    title: str
    description: Optional[str] = None
    weight_percent: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class OrderTimelineCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    message: Optional[str] = None
    progress_percent: Optional[int] = Field(default=None, ge=0, le=100)
    is_public: bool = True


class OrderTimelineResponse(BaseModel):
    id: int
    order_id: int
    title: str
    message: Optional[str] = None
    progress_percent: int
    is_public: bool
    created_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- PAYMENT LEDGER SCHEMAS (MODUL M8) ---

class OrderPaymentCreate(BaseModel):
    payment_type: str = Field(
        default="dp",
        pattern="^(dp|installment|final|extra|refund)$",
        description="Jenis pembayaran: dp, installment, final, extra, atau refund",
    )
    amount: int = Field(..., gt=0, description="Nominal Rupiah (> 0)")
    method: str = Field(
        default="transfer_bank",
        pattern="^(transfer_bank|qris|ewallet|cash)$",
    )
    reference_note: Optional[str] = Field(default=None, max_length=255)
    status: str = Field(default="verified", pattern="^(pending|verified|rejected)$")


class OrderPaymentResponse(BaseModel):
    id: int
    order_id: int
    payment_type: str
    amount: int
    method: str
    reference_note: Optional[str] = None
    status: str
    verified_by: Optional[str] = None
    paid_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- REVISION SCHEMAS (MODUL M7) ---

class RevisionCreate(BaseModel):
    notes: str = Field(..., min_length=3)
    wa_last4: Optional[str] = Field(
        default=None,
        description="Opsional: 4 digit terakhir WA klien untuk verifikasi keamanan",
    )


class RevisionAdminUpdate(BaseModel):
    status: Optional[str] = Field(
        default=None, pattern="^(submitted|in_progress|completed|rejected)$"
    )
    admin_response: Optional[str] = None
    is_out_of_scope: Optional[bool] = None
    extra_cost: Optional[int] = Field(default=None, ge=0)


class RevisionResponse(BaseModel):
    id: int
    notes: str
    status: str
    admin_response: Optional[str] = None
    is_out_of_scope: bool = False
    extra_cost: int = 0
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- ORDER SCHEMAS (MODUL M5) ---

class OrderCreate(BaseModel):
    client_name: str = Field(..., min_length=2, max_length=100)
    client_whatsapp: str = Field(..., min_length=8, max_length=30)
    client_email: Optional[str] = None
    campus_or_company: Optional[str] = None
    service_type: str
    tech_stack: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    deadline: str
    price_estimate: Optional[int] = 0
    # Parameter spesifikasi untuk kalkulasi ulang harga di server (Perbaikan B-02)
    complexity: Optional[str] = "intermediate"
    tech_platform: Optional[str] = "web"
    urgency_days: Optional[int] = Field(default=14, ge=1, le=90)
    include_report: Optional[bool] = True
    include_wireframe: Optional[bool] = False
    selected_addons: Optional[List[str]] = None
    source: Optional[str] = "web"
    # Field opsional ketika order diinput manual oleh Admin
    status: Optional[str] = None
    progress_percent: Optional[int] = Field(default=None, ge=0, le=100)
    final_price: Optional[int] = Field(default=None, ge=0)
    dp_amount: Optional[int] = Field(default=None, ge=0)
    assigned_to: Optional[str] = None
    current_stage_note: Optional[str] = None


class OrderFileResponse(BaseModel):
    id: int
    file_name: str
    file_size: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


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
    price_estimate_max: int = 0
    final_price: int = 0
    discount_amount: int = 0
    dp_amount: int
    effective_bill: int = 0
    total_paid: int = 0
    remaining_balance: int = 0
    payment_status: str = "unpaid"
    pricing_snapshot: Optional[Dict[str, Any]] = None
    status: str
    progress_percent: int
    current_stage: Optional[str] = None
    source: str = "web"
    cancel_reason: Optional[str] = None
    demo_url: Optional[str] = None
    assigned_to: Optional[str] = None
    internal_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    files: List[OrderFileResponse] = []
    revisions: List[RevisionResponse] = []
    milestones: List[OrderMilestoneResponse] = []
    timeline_logs: List[OrderTimelineResponse] = []
    payments: List[OrderPaymentResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Tracking View untuk Klien (Aman, tanpa catatan internal & nama disamarkan)
class OrderTrackResponse(BaseModel):
    order_code: str
    client_name: str
    service_type: str
    title: str
    deadline: str
    status: str
    progress_percent: int
    current_stage: Optional[str] = None
    demo_url: Optional[str] = None
    price_estimate: int = 0
    final_price: int = 0
    discount_amount: int = 0
    effective_bill: int = 0
    total_paid: int = 0
    remaining_balance: int = 0
    payment_status: str = "unpaid"
    created_at: datetime
    files_count: int
    revisions: List[RevisionResponse] = []
    milestones: List[OrderMilestoneResponse] = []
    timeline_logs: List[OrderTimelineResponse] = []
    payments: List[OrderPaymentResponse] = []


class OrderStatusUpdate(BaseModel):
    client_name: Optional[str] = None
    client_whatsapp: Optional[str] = None
    campus_or_company: Optional[str] = None
    service_type: Optional[str] = None
    tech_stack: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None
    progress_percent: Optional[int] = None
    final_price: Optional[int] = None
    discount_amount: Optional[int] = None
    dp_amount: Optional[int] = None
    demo_url: Optional[str] = None
    assigned_to: Optional[str] = None
    internal_notes: Optional[str] = None
    cancel_reason: Optional[str] = None
    timeline_message: Optional[str] = None

