import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.order import Order, OrderFile, Revision
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderTrackResponse,
    OrderStatusUpdate,
    RevisionCreate,
    RevisionResponse
)
from app.core.config import settings

router = APIRouter()

def generate_order_code() -> str:
    """Generate kode order unik, contoh: JT-2610-A1B2"""
    date_str = datetime.datetime.now().strftime("%y%m")
    random_part = uuid.uuid4().hex[:4].upper()
    return f"JT-{date_str}-{random_part}"

@router.post("/", response_model=OrderResponse)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    """Buat order baru dari klien"""
    order_code = generate_order_code()
    
    order = Order(
        order_code=order_code,
        client_name=data.client_name,
        client_whatsapp=data.client_whatsapp,
        client_email=data.client_email,
        campus_or_company=data.campus_or_company,
        service_type=data.service_type,
        tech_stack=data.tech_stack,
        title=data.title,
        description=data.description,
        deadline=data.deadline,
        price_estimate=data.price_estimate or 0,
        status="pending",
        progress_percent=10
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.post("/{order_id}/upload-file")
async def upload_order_file(
    order_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload file panduan tugas, jurnal acuan, atau dokumen skripsi"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    # Generate safe unique filename
    file_ext = os.path.splitext(file.filename)[1]
    safe_name = f"{order.order_code}_{uuid.uuid4().hex[:6]}{file_ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    order_file = OrderFile(
        order_id=order.id,
        file_name=file.filename,
        file_path=dest_path,
        file_size=len(content)
    )
    db.add(order_file)
    db.commit()
    return {"message": "File berhasil diunggah", "file_name": file.filename}

@router.get("/track/{identifier}", response_model=List[OrderTrackResponse])
def track_order(identifier: str, db: Session = Depends(get_db)):
    """
    Pelacakan order untuk klien berdasarkan Kode Order (misal JT-2610-A1B2)
    atau Nomor WhatsApp klien.
    """
    clean_id = identifier.strip()
    orders = db.query(Order).filter(
        or_(
            Order.order_code.ilike(f"%{clean_id}%"),
            Order.client_whatsapp.ilike(f"%{clean_id}%")
        )
    ).all()

    if not orders:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan. Pastikan Kode Order atau Nomor WhatsApp benar.")

    results = []
    for o in orders:
        results.append(
            OrderTrackResponse(
                order_code=o.order_code,
                client_name=o.client_name,
                service_type=o.service_type,
                title=o.title,
                deadline=o.deadline,
                status=o.status,
                progress_percent=o.progress_percent,
                demo_url=o.demo_url,
                created_at=o.created_at,
                files_count=len(o.files),
                revisions=[RevisionResponse.model_validate(r) for r in o.revisions]
            )
        )
    return results

@router.get("/", response_model=List[OrderResponse])
def get_all_orders(
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List semua order untuk dashboard admin (Founder A & B)"""
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if service_type:
        query = query.filter(Order.service_type == service_type)
    return query.order_by(Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)):
    """Update status, progres, atau assignee order oleh tim internal"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    if data.status is not None:
        order.status = data.status
    if data.progress_percent is not None:
        order.progress_percent = data.progress_percent
    if data.dp_amount is not None:
        order.dp_amount = data.dp_amount
    if data.demo_url is not None:
        order.demo_url = data.demo_url
    if data.assigned_to is not None:
        order.assigned_to = data.assigned_to
    if data.internal_notes is not None:
        order.internal_notes = data.internal_notes

    db.commit()
    db.refresh(order)
    return order

@router.post("/{order_code}/revision", response_model=RevisionResponse)
def submit_revision(order_code: str, data: RevisionCreate, db: Session = Depends(get_db)):
    """Klien mengajukan permintaan revisi"""
    order = db.query(Order).filter(Order.order_code == order_code).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    rev = Revision(
        order_id=order.id,
        notes=data.notes,
        status="submitted"
    )
    # Ubah status order menjadi review/revision
    order.status = "revision"
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev
