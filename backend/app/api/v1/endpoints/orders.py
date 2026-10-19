import re
import secrets
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.db.session import get_db
from app.models.order import (
    Order,
    OrderFile,
    OrderMilestone,
    OrderTimelineLog,
    OrderPayment,
    Revision,
)
from app.models.admin_user import AdminUser
from app.api.v1.deps import get_current_admin
from app.schemas.order import (
    CalculatorRequest,
    OrderCreate,
    OrderResponse,
    OrderTrackResponse,
    OrderStatusUpdate,
    OrderMilestoneCreate,
    OrderMilestoneUpdate,
    OrderMilestoneResponse,
    OrderTimelineCreate,
    OrderTimelineResponse,
    OrderPaymentCreate,
    OrderPaymentResponse,
    RevisionCreate,
    RevisionAdminUpdate,
    RevisionResponse,
)
from app.core.config import settings
from app.services.storage import save_private_order_file
from app.services.pricing_engine import calculate_price


router = APIRouter()

# Alfabet tanpa karakter yang membingungkan (tanpa 0, O, 1, I, L)
SAFE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def normalize_whatsapp(phone: str) -> str:
    """
    Menormalisasi nomor WhatsApp menjadi format angka standar 628xxxxxxxxxx.
    Contoh: '0856-9239-0483' -> '6285692390483'
    """
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    elif digits.startswith("8"):
        digits = "62" + digits
    return digits


def mask_client_name(full_name: str) -> str:
    """
    Menyamarkan nama klien pada endpoint publik untuk melindungi privasi (Perbaikan S-02).
    Contoh: 'Budi Santoso' -> 'Budi S***', 'Rizky' -> 'Riz***'
    """
    parts = (full_name or "").strip().split()
    if not parts:
        return "Klien***"
    if len(parts) == 1:
        first = parts[0]
        visible = first[:3] if len(first) > 3 else first[:1]
        return f"{visible}***"
    return f"{parts[0]} {parts[1][0].upper()}***"


def generate_order_code(db: Session) -> str:
    """
    Generate kode order unik menggunakan prefix dari konfigurasi (contoh: RZ-2610-K7Q2).
    Dicek ke database agar dijamin tidak pernah bentrok (Perbaikan B-11).
    """
    prefix = settings.ORDER_CODE_PREFIX.upper()
    date_str = utc_now().strftime("%y%m")
    for _ in range(10):
        random_part = "".join(secrets.choice(SAFE_ALPHABET) for _ in range(4))
        candidate = f"{prefix}-{date_str}-{random_part}"
        exists = db.query(Order).filter(Order.order_code == candidate).first()
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Gagal membuat kode order unik.")


def compute_order_financials(order: Order) -> Dict[str, Any]:
    """
    Menghitung ringkasan tagihan dan pembayaran (Modul M8):
    - `effective_bill`: Harga Deal (`final_price` jika > 0, atau `price_estimate`)
      dikurangi `discount_amount` ditambah biaya revisi tambahan (`extra_cost` out-of-scope).
    - `total_paid`: Total pembayaran berstatus `verified` dikurangi `refund`.
    - `remaining_balance`: Sisa tagihan yang belum dibayar.
    - `payment_status`: `unpaid` | `partial` | `paid`.
    """
    base_bill = (
        order.final_price
        if (order.final_price and order.final_price > 0)
        else (order.price_estimate or 0)
    )
    extra_rev_cost = sum(
        (r.extra_cost or 0)
        for r in (order.revisions or [])
        if r.is_out_of_scope and r.status != "rejected"
    )
    effective_bill = max(0, base_bill - (order.discount_amount or 0) + extra_rev_cost)

    payments = order.payments or []
    if len(payments) > 0:
        verified_in = sum(
            p.amount
            for p in payments
            if p.status == "verified" and p.payment_type != "refund"
        )
        verified_refund = sum(
            p.amount
            for p in payments
            if p.status == "verified" and p.payment_type == "refund"
        )
        total_paid = max(0, verified_in - verified_refund)
    else:
        total_paid = max(0, order.dp_amount or 0)

    remaining_balance = max(0, effective_bill - total_paid)
    if total_paid <= 0:
        payment_status = "unpaid"
    elif remaining_balance == 0 and effective_bill > 0:
        payment_status = "paid"
    else:
        payment_status = "partial"

    return {
        "effective_bill": effective_bill,
        "total_paid": total_paid,
        "remaining_balance": remaining_balance,
        "payment_status": payment_status,
    }


def resolve_current_stage(order: Order) -> str:
    """
    Menentukan deskripsi tahapan / Bab yang sedang dikerjakan saat ini untuk ditampilkan
    di tabel Admin maupun halaman Cek Status Order Klien.
    """
    if order.status == "completed" or (order.progress_percent or 0) >= 100:
        return "Selesai 100% - Seluruh Bab / Modul & Pengujian Tuntas"
    if order.status == "cancelled":
        return "Pesanan Dibatalkan"

    # Cek log timeline terbaru yang memiliki pesan progres spesifik dari Admin
    logs = order.timeline_logs or []
    for log in logs:
        if log.is_public and log.message and not log.title.startswith("Pesanan Diterima"):
            return log.message

    # Jika belum ada catatan spesifik, ambil milestone pertama yang belum selesai (sedang dikerjakan)
    milestones = sorted(order.milestones or [], key=lambda m: (m.display_order, m.id))
    for m in milestones:
        if not m.is_completed:
            return f"Sedang Dikerjakan: {m.title}"

    return "Menunggu Konfirmasi & Penjadwalan Tim Teknis"


def serialize_order_admin(order: Order) -> OrderResponse:
    """Mengonversi model Order beserta kalkulasi finansial & tahapan aktif ke OrderResponse."""
    fin = compute_order_financials(order)
    resp = OrderResponse.model_validate(order)
    resp.effective_bill = fin["effective_bill"]
    resp.total_paid = fin["total_paid"]
    resp.remaining_balance = fin["remaining_balance"]
    resp.payment_status = fin["payment_status"]
    resp.current_stage = resolve_current_stage(order)
    return resp


def recalculate_milestone_progress(order: Order) -> int:
    """
    Menghitung ulang `order.progress_percent` berdasarkan bobot milestone yang telah selesai.
    """
    milestones = order.milestones or []
    total_weight = sum(m.weight_percent for m in milestones)
    if total_weight <= 0:
        return order.progress_percent
    completed_weight = sum(m.weight_percent for m in milestones if m.is_completed)
    new_pct = min(100, int(round((completed_weight / total_weight) * 100)))
    order.progress_percent = new_pct
    return new_pct


def create_default_milestones_and_timeline(
    db: Session, order: Order, current_stage_note: Optional[str] = None
) -> None:
    """
    Membuat 4 tahapan checklist Milestone standar (otomatis menyesuaikan format Bab 1-5
    untuk Skripsi/Tugas atau Tahap 1-4 untuk Website/Chatbot) dan log Timeline awal.
    """
    is_academic = (order.service_type or "").lower() in ("skripsi", "tugas")

    if is_academic:
        default_milestones = [
            OrderMilestone(
                order_id=order.id,
                title="Bab 1 & 2 - Analisis Kebutuhan, Dataset & Landasan Sistem",
                description="Identifikasi rumusan masalah, persiapan dataset/variabel, dan ruang lingkup sistem.",
                weight_percent=15,
                is_completed=False,
                display_order=1,
            ),
            OrderMilestone(
                order_id=order.id,
                title="Bab 3 - Perancangan Arsitektur, Flowchart, UML/DFD & Database",
                description="Penyusunan skema tabel database, diagram alur algoritma, dan wireframe antarmuka.",
                weight_percent=25,
                is_completed=False,
                display_order=2,
            ),
            OrderMilestone(
                order_id=order.id,
                title="Bab 4 - Implementasi Kode Program, Integrasi Fitur & Pengujian",
                description="Pengembangan source code utama, pelatihan model/algoritma, dan uji akurasi/blackbox.",
                weight_percent=40,
                is_completed=False,
                display_order=3,
            ),
            OrderMilestone(
                order_id=order.id,
                title="Bab 5 - Evaluasi Akhir, Pembahasan Program & Demo Sidang",
                description="Finalisasi dokumentasi bab pembahasan kode, video panduan instalasi, dan serah terima.",
                weight_percent=20,
                is_completed=False,
                display_order=4,
            ),
        ]
    else:
        default_milestones = [
            OrderMilestone(
                order_id=order.id,
                title="Tahap 1 - Konfirmasi Kebutuhan, Scope & Pembayaran DP",
                description="Diskusi spesifikasi teknis detail dan verifikasi pembayaran uang muka (DP).",
                weight_percent=15,
                is_completed=False,
                display_order=1,
            ),
            OrderMilestone(
                order_id=order.id,
                title="Tahap 2 - Perancangan Arsitektur, Database & Desain UI/UX",
                description="Penyusunan skema database, persiapan API, dan struktur antarmuka proyek.",
                weight_percent=25,
                is_completed=False,
                display_order=2,
            ),
            OrderMilestone(
                order_id=order.id,
                title="Tahap 3 - Pengembangan Kode Program & Integrasi Fitur Utama",
                description="Implementasi logika backend, algoritma inti, serta antarmuka pengguna (UI).",
                weight_percent=40,
                is_completed=False,
                display_order=3,
            ),
            OrderMilestone(
                order_id=order.id,
                title="Tahap 4 - Pengujian (QA), Demo Aplikasi & Serah Terima",
                description="Uji coba fungsionalitas bersama klien, penyerahan source code, dan panduan.",
                weight_percent=20,
                is_completed=False,
                display_order=4,
            ),
        ]
    db.add_all(default_milestones)

    initial_log = OrderTimelineLog(
        order_id=order.id,
        title="Pesanan Diterima & Masuk Antrean Review",
        message=(
            current_stage_note.strip()
            if (current_stage_note and current_stage_note.strip())
            else (
                f"Pesanan '{order.title}' dengan kode {order.order_code} telah tercatat di sistem. "
                f"Tim kami akan segera meninjau spesifikasi Anda."
            )
        ),
        progress_percent=order.progress_percent,
        is_public=True,
        created_by="Sistem Rizofara",
    )
    db.add(initial_log)


# =====================================================================
# 1. PEMBUATAN ORDER & UNGGAH FILE PRIVAT (KLIEN / PUBLIK / ADMIN)
# =====================================================================

@router.post("/", response_model=OrderResponse)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    """
    Buat order baru dari klien maupun input manual Admin.
    Harga dihitung ulang di sisi server menggunakan Pricing Engine dan disimpan
    sebagai `pricing_snapshot` agar perubahan harga di masa depan tidak mengubah
    tagihan order lama (Perbaikan B-01, B-02 & Modul M5).
    """
    order_code = generate_order_code(db)
    normalized_wa = normalize_whatsapp(data.client_whatsapp)
    if len(normalized_wa) < 10:
        raise HTTPException(status_code=400, detail="Nomor WhatsApp tidak valid.")

    calc_req = CalculatorRequest(
        service_type=data.service_type,
        complexity=data.complexity or "intermediate",
        urgency_days=data.urgency_days or 14,
        tech_platform=data.tech_platform or "web",
        include_report=True if data.include_report is None else data.include_report,
        include_wireframe=bool(data.include_wireframe),
        selected_addons=data.selected_addons,
    )
    calc_result = calculate_price(calc_req, db=db)

    snapshot = {
        "calculated_at": utc_now().isoformat(),
        "request": calc_req.model_dump(),
        "estimated_min_price": calc_result.estimated_min_price,
        "estimated_max_price": calc_result.estimated_max_price,
        "recommended_dp": calc_result.recommended_dp,
        "urgency_tier": calc_result.urgency_tier,
        "breakdown": [b.model_dump() for b in calc_result.breakdown],
    }

    order = Order(
        order_code=order_code,
        client_name=data.client_name.strip(),
        client_whatsapp=normalized_wa,
        client_email=data.client_email,
        campus_or_company=data.campus_or_company,
        service_type=data.service_type.lower().strip(),
        tech_stack=data.tech_stack,
        title=data.title.strip(),
        description=data.description.strip(),
        deadline=data.deadline.strip(),
        price_estimate=calc_result.estimated_min_price,
        price_estimate_max=calc_result.estimated_max_price,
        final_price=data.final_price if data.final_price is not None else 0,
        discount_amount=0,
        dp_amount=data.dp_amount if data.dp_amount is not None else 0,
        pricing_snapshot=snapshot,
        status=data.status or "pending",
        progress_percent=data.progress_percent if data.progress_percent is not None else 10,
        assigned_to=data.assigned_to,
        source=data.source or "web",
    )
    db.add(order)
    db.flush()  # Dapatkan order.id sebelum membuat milestone & timeline

    create_default_milestones_and_timeline(db, order, data.current_stage_note)
    if data.current_stage_note and data.current_stage_note.strip():
        db.add(
            OrderTimelineLog(
                order_id=order.id,
                title=f"Tahapan Aktif ({order.progress_percent}%)",
                message=data.current_stage_note.strip(),
                progress_percent=order.progress_percent,
                is_public=True,
                created_by="Admin Rizofara",
            )
        )
    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


@router.post("/{order_id}/upload-file")
async def upload_order_file(
    order_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload file panduan tugas, jurnal acuan, atau dokumen skripsi.
    Menggunakan validasi ekstensi, ukuran maksimal 20 MB, dan disimpan di folder PRIVAT
    (Perbaikan S-03 & S-04).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    if len(order.files) >= 5:
        raise HTTPException(
            status_code=400,
            detail="Batas maksimal unggahan untuk satu order adalah 5 file.",
        )

    orig_name, dest_path, file_size = await save_private_order_file(
        file=file, order_code=order.order_code, category="brief"
    )

    order_file = OrderFile(
        order_id=order.id,
        file_name=orig_name,
        file_path=dest_path,
        file_size=file_size,
    )
    db.add(order_file)
    db.commit()
    return {
        "message": "File berhasil diunggah dengan aman",
        "file_name": orig_name,
        "file_size": file_size,
    }


# =====================================================================
# 2. PELACAKAN ORDER PUBLIK / KLIEN (MODUL M6.3 & KEAMANAN S-02)
# =====================================================================

@router.get("/track/{identifier}", response_model=List[OrderTrackResponse])
def track_order(
    identifier: str,
    wa_last4: Optional[str] = Query(
        default=None,
        description="4 digit terakhir Nomor WhatsApp untuk verifikasi keamanan",
    ),
    db: Session = Depends(get_db),
):
    """
    Pelacakan order untuk klien secara AMAN (Perbaikan S-02 & Modul M6.3):
    Mengembalikan status, progres, daftar milestone, timeline publik, riwayat pembayaran,
    ringkasan sisa tagihan, dan balasan revisi dari admin.
    """
    clean_id = identifier.strip()

    if len(clean_id) < 8:
        raise HTTPException(
            status_code=404,
            detail="Order tidak ditemukan. Masukkan Kode Order lengkap (contoh: RZ-2610-XXXX) atau Nomor WhatsApp lengkap.",
        )

    if "-" in clean_id:
        orders = (
            db.query(Order)
            .filter(func.upper(Order.order_code) == clean_id.upper())
            .all()
        )
    else:
        normalized_query_wa = normalize_whatsapp(clean_id)
        if len(normalized_query_wa) < 10:
            raise HTTPException(
                status_code=404,
                detail="Order tidak ditemukan. Pastikan Kode Order atau Nomor WhatsApp lengkap.",
            )
        all_candidates = db.query(Order).all()
        orders = [
            o
            for o in all_candidates
            if normalize_whatsapp(o.client_whatsapp) == normalized_query_wa
        ]

    if wa_last4 is not None and wa_last4.strip():
        clean_last4 = re.sub(r"\D", "", wa_last4.strip())
        if len(clean_last4) != 4:
            raise HTTPException(
                status_code=400,
                detail="Verifikasi nomor WhatsApp harus berupa 4 digit angka terakhir.",
            )
        orders = [
            o
            for o in orders
            if normalize_whatsapp(o.client_whatsapp).endswith(clean_last4)
        ]

    if not orders:
        raise HTTPException(
            status_code=404,
            detail="Order tidak ditemukan. Pastikan Kode Order dan Nomor WhatsApp sudah benar.",
        )

    results = []
    for o in orders:
        fin = compute_order_financials(o)
        public_logs = [
            OrderTimelineResponse.model_validate(log)
            for log in (o.timeline_logs or [])
            if log.is_public
        ]
        results.append(
            OrderTrackResponse(
                order_code=o.order_code,
                client_name=mask_client_name(o.client_name),
                service_type=o.service_type,
                title=o.title,
                deadline=o.deadline,
                status=o.status,
                progress_percent=o.progress_percent,
                current_stage=resolve_current_stage(o),
                demo_url=o.demo_url,
                price_estimate=o.price_estimate or 0,
                final_price=o.final_price or 0,
                discount_amount=o.discount_amount or 0,
                effective_bill=fin["effective_bill"],
                total_paid=fin["total_paid"],
                remaining_balance=fin["remaining_balance"],
                payment_status=fin["payment_status"],
                created_at=o.created_at,
                files_count=len(o.files),
                revisions=[RevisionResponse.model_validate(r) for r in o.revisions],
                milestones=[
                    OrderMilestoneResponse.model_validate(m) for m in o.milestones
                ],
                timeline_logs=public_logs,
                payments=[
                    OrderPaymentResponse.model_validate(p)
                    for p in o.payments
                    if p.status == "verified"
                ],
            )
        )
    return results


# =====================================================================
# 3. MANAJEMEN ORDER ADMIN (MODUL M5)
# =====================================================================

@router.get("/", response_model=List[OrderResponse])
def get_all_orders(
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    q: Optional[str] = Query(
        default=None, description="Pencarian kode order, nama klien, atau judul proyek"
    ),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    List semua order untuk dashboard admin dengan dukungan filter status, layanan,
    dan kata kunci pencarian `q` (Modul M5-01).
    """
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if service_type:
        query = query.filter(Order.service_type == service_type)
    if q and q.strip():
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Order.order_code.ilike(keyword),
                Order.client_name.ilike(keyword),
                Order.title.ilike(keyword),
            )
        )

    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order_admin(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_detail(
    order_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Detail lengkap order beserta milestone, timeline, pembayaran, dan revisi."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    return serialize_order_admin(order)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Update data order, status, progres, tahapan/bab aktif (`timeline_message`),
    harga deal (`final_price`), diskon, DP, atau PIC order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    old_status = order.status

    if data.client_name is not None and data.client_name.strip():
        order.client_name = data.client_name.strip()
    if data.client_whatsapp is not None and data.client_whatsapp.strip():
        order.client_whatsapp = normalize_whatsapp(data.client_whatsapp)
    if data.campus_or_company is not None:
        order.campus_or_company = data.campus_or_company.strip()
    if data.service_type is not None and data.service_type.strip():
        order.service_type = data.service_type.lower().strip()
    if data.tech_stack is not None:
        order.tech_stack = data.tech_stack.strip()
    if data.title is not None:
        order.title = data.title.strip()
    if data.description is not None:
        order.description = data.description.strip()
    if data.deadline is not None:
        order.deadline = data.deadline.strip()
    if data.final_price is not None:
        order.final_price = max(0, data.final_price)
    if data.discount_amount is not None:
        order.discount_amount = max(0, data.discount_amount)
    if data.dp_amount is not None:
        order.dp_amount = max(0, data.dp_amount)
    if data.demo_url is not None:
        order.demo_url = data.demo_url
    if data.assigned_to is not None:
        order.assigned_to = data.assigned_to
    if data.internal_notes is not None:
        order.internal_notes = data.internal_notes
    if data.cancel_reason is not None:
        order.cancel_reason = data.cancel_reason

    if data.progress_percent is not None:
        order.progress_percent = max(0, min(100, data.progress_percent))

    if data.status is not None:
        order.status = data.status
        if data.status == "completed" and order.completed_at is None:
            order.completed_at = utc_now()
            order.progress_percent = 100

    # Otomatis buat catatan Timeline jika status berubah atau admin menyertakan pesan timeline
    status_changed = data.status is not None and data.status != old_status
    if status_changed or (data.timeline_message and data.timeline_message.strip()):
        status_labels = {
            "pending": "Menunggu Konfirmasi",
            "confirmed": "Harga Disepakati",
            "dp_received": "DP Diterima & Terverifikasi",
            "in_progress": "Sedang Dikerjakan Tim Teknis",
            "review": "Demo Aplikasi Siap Diuji (Review)",
            "revision": "Dalam Pengerjaan Revisi",
            "completed": "Proyek Selesai 100%",
            "cancelled": "Pesanan Dibatalkan",
        }
        new_label = status_labels.get(order.status, order.status)
        log_title = (
            f"Status Diperbarui: {new_label}"
            if status_changed
            else f"Update Progres ({order.progress_percent}%)"
        )
        db.add(
            OrderTimelineLog(
                order_id=order.id,
                title=log_title,
                message=data.timeline_message.strip() if data.timeline_message else None,
                progress_percent=order.progress_percent,
                is_public=True,
                created_by=current_admin.name,
            )
        )

    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Menghapus data order (Wajib Login JWT)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    code = order.order_code
    db.delete(order)
    db.commit()
    return {"message": f"Order {code} berhasil dihapus."}


# =====================================================================
# 4. CHECKLIST MILESTONE & TIMELINE PROGRES (MODUL M6)
# =====================================================================

@router.post(
    "/{order_id}/milestones",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_order_milestone(
    order_id: int,
    data: OrderMilestoneCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menambahkan tahapan checklist milestone baru pada order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    milestone = OrderMilestone(
        order_id=order.id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        weight_percent=data.weight_percent,
        is_completed=data.is_completed,
        completed_at=utc_now() if data.is_completed else None,
        display_order=data.display_order,
    )
    db.add(milestone)
    db.flush()
    db.refresh(order)
    recalculate_milestone_progress(order)
    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


@router.patch("/{order_id}/milestones/{milestone_id}", response_model=OrderResponse)
def update_order_milestone(
    order_id: int,
    milestone_id: int,
    data: OrderMilestoneUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin: Mencentang/mengubah milestone pengerjaan.
    Otomatis menghitung ulang persentase progres order dan mencatatnya ke Timeline klien!
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    milestone = (
        db.query(OrderMilestone)
        .filter(
            OrderMilestone.id == milestone_id,
            OrderMilestone.order_id == order.id,
        )
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone tidak ditemukan")

    was_completed = milestone.is_completed

    if data.title is not None:
        milestone.title = data.title.strip()
    if data.description is not None:
        milestone.description = data.description.strip()
    if data.weight_percent is not None:
        milestone.weight_percent = data.weight_percent
    if data.display_order is not None:
        milestone.display_order = data.display_order

    if data.is_completed is not None:
        milestone.is_completed = data.is_completed
        milestone.completed_at = utc_now() if data.is_completed else None

    db.flush()
    db.refresh(order)
    new_pct = recalculate_milestone_progress(order)

    # Jika milestone baru saja diselesaikan (dicentang), tambahkan kabar otomatis ke Timeline!
    if data.is_completed is True and not was_completed:
        if order.status in ["pending", "confirmed", "dp_received"]:
            order.status = "in_progress"
        db.add(
            OrderTimelineLog(
                order_id=order.id,
                title=f"Tahap Selesai: {milestone.title}",
                message=milestone.description,
                progress_percent=new_pct,
                is_public=True,
                created_by=current_admin.name,
            )
        )

    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


@router.delete("/{order_id}/milestones/{milestone_id}", response_model=OrderResponse)
def delete_order_milestone(
    order_id: int,
    milestone_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menghapus salah satu item milestone dan menghitung ulang progres."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    milestone = (
        db.query(OrderMilestone)
        .filter(
            OrderMilestone.id == milestone_id,
            OrderMilestone.order_id == order.id,
        )
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone tidak ditemukan")

    db.delete(milestone)
    db.flush()
    db.refresh(order)
    recalculate_milestone_progress(order)
    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


@router.post(
    "/{order_id}/timeline",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_order_timeline_log(
    order_id: int,
    data: OrderTimelineCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menambahkan kabar/update progres baru ke Timeline pesanan."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    if data.progress_percent is not None:
        order.progress_percent = data.progress_percent

    log = OrderTimelineLog(
        order_id=order.id,
        title=data.title.strip(),
        message=data.message.strip() if data.message else None,
        progress_percent=order.progress_percent,
        is_public=data.is_public,
        created_by=current_admin.name,
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


# =====================================================================
# 5. BUKU KAS PEMBAYARAN & SISA TAGIHAN (MODUL M8)
# =====================================================================

@router.post(
    "/{order_id}/payments",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_order_payment(
    order_id: int,
    data: OrderPaymentCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin: Mencatat transaksi pembayaran (DP, Cicilan, Pelunasan, Extra, atau Refund).
    Otomatis memperbarui `dp_amount` (total pembayaran masuk), meng-update status order
    bila DP telah diterima, dan mencatat ke Timeline!
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    payment = OrderPayment(
        order_id=order.id,
        payment_type=data.payment_type,
        amount=data.amount,
        method=data.method,
        reference_note=data.reference_note.strip() if data.reference_note else None,
        status=data.status,
        verified_by=current_admin.name if data.status == "verified" else None,
    )
    db.add(payment)
    db.flush()
    db.refresh(order)

    fin = compute_order_financials(order)
    order.dp_amount = fin["total_paid"]

    if data.status == "verified" and data.payment_type != "refund":
        if order.status in ["pending", "confirmed"] and data.payment_type == "dp":
            order.status = "dp_received"
            if order.progress_percent < 15:
                order.progress_percent = 15

        type_labels = {
            "dp": "Pembayaran DP (Uang Muka)",
            "installment": "Pembayaran Termin / Cicilan",
            "final": "Pelunasan Akhir",
            "extra": "Pembayaran Fitur Tambahan",
        }
        label = type_labels.get(data.payment_type, "Pembayaran")
        db.add(
            OrderTimelineLog(
                order_id=order.id,
                title=f"{label} Diterima: Rp {data.amount:,}".replace(",", "."),
                message=(
                    f"Metode: {data.method.upper()}. "
                    f"Sisa tagihan saat ini: Rp {fin['remaining_balance']:,}".replace(",", ".")
                ),
                progress_percent=order.progress_percent,
                is_public=True,
                created_by=current_admin.name,
            )
        )

    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


@router.delete("/{order_id}/payments/{payment_id}", response_model=OrderResponse)
def delete_order_payment(
    order_id: int,
    payment_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin: Menghapus catatan pembayaran yang salah input & menghitung ulang tagihan."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    payment = (
        db.query(OrderPayment)
        .filter(
            OrderPayment.id == payment_id,
            OrderPayment.order_id == order.id,
        )
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Catatan pembayaran tidak ditemukan")

    db.delete(payment)
    db.flush()
    db.refresh(order)
    fin = compute_order_financials(order)
    order.dp_amount = fin["total_paid"]
    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)


# =====================================================================
# 6. SIKLUS REVISI KLIEN & BALASAN ADMIN (MODUL M7)
# =====================================================================

@router.post("/{order_code}/revision", response_model=RevisionResponse)
def submit_revision(
    order_code: str, data: RevisionCreate, db: Session = Depends(get_db)
):
    """
    Klien mengajukan permintaan revisi berdasarkan Kode Order yang presisi
    (opsional diverifikasi dengan 4 digit terakhir WA).
    Otomatis mengubah status order menjadi `revision` dan mencatat ke Timeline.
    """
    order = (
        db.query(Order)
        .filter(func.upper(Order.order_code) == order_code.strip().upper())
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    if data.wa_last4 and data.wa_last4.strip():
        clean_last4 = re.sub(r"\D", "", data.wa_last4.strip())
        if not normalize_whatsapp(order.client_whatsapp).endswith(clean_last4):
            raise HTTPException(
                status_code=403,
                detail="4 digit terakhir Nomor WhatsApp tidak cocok dengan data pemesan.",
            )

    rev = Revision(
        order_id=order.id,
        notes=data.notes.strip(),
        status="submitted",
    )
    order.status = "revision"
    db.add(rev)

    db.add(
        OrderTimelineLog(
            order_id=order.id,
            title="Permintaan Revisi Baru Diajukan Klien",
            message=data.notes.strip(),
            progress_percent=order.progress_percent,
            is_public=True,
            created_by="Klien",
        )
    )

    db.commit()
    db.refresh(rev)
    return rev


@router.patch("/{order_id}/revisions/{revision_id}", response_model=OrderResponse)
def update_revision_admin(
    order_id: int,
    revision_id: int,
    data: RevisionAdminUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin: Membalas catatan revisi klien (`admin_response`), mengubah status revisi
    (`in_progress` / `completed` / `rejected`), atau menandai `is_out_of_scope` + `extra_cost`.
    Jika revisi selesai (`completed`), status order dikembalikan ke `review` dan tercatat di Timeline.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    rev = (
        db.query(Revision)
        .filter(Revision.id == revision_id, Revision.order_id == order.id)
        .first()
    )
    if not rev:
        raise HTTPException(status_code=404, detail="Data revisi tidak ditemukan")

    if data.admin_response is not None:
        rev.admin_response = data.admin_response.strip()
    if data.is_out_of_scope is not None:
        rev.is_out_of_scope = data.is_out_of_scope
    if data.extra_cost is not None:
        rev.extra_cost = data.extra_cost

    if data.status is not None:
        rev.status = data.status
        if data.status == "completed":
            rev.resolved_at = utc_now()
            # Jika semua revisi sudah selesai, kembalikan status order ke review
            pending_revs = [
                r
                for r in order.revisions
                if r.id != rev.id and r.status in ["submitted", "in_progress"]
            ]
            if not pending_revs and order.status == "revision":
                order.status = "review"

            db.add(
                OrderTimelineLog(
                    order_id=order.id,
                    title=f"Revisi #{rev.id} Telah Diselesaikan Tim Teknis",
                    message=rev.admin_response or "Perbaikan sesuai catatan revisi telah selesai.",
                    progress_percent=order.progress_percent,
                    is_public=True,
                    created_by=current_admin.name,
                )
            )

    db.commit()
    db.refresh(order)
    return serialize_order_admin(order)
