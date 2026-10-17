import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)
    
    # Klien Info
    client_name = Column(String(100), nullable=False)
    client_whatsapp = Column(String(30), nullable=False, index=True)
    client_email = Column(String(100), nullable=True)
    campus_or_company = Column(String(100), nullable=True)

    # Detail Project
    service_type = Column(String(50), nullable=False)  # skripsi, tugas, website, chatbot
    tech_stack = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(String(50), nullable=False)
    
    # Finansial & Progres
    price_estimate = Column(Integer, default=0)
    dp_amount = Column(Integer, default=0)
    status = Column(String(30), default="pending")  # pending, dp_received, in_progress, review, completed
    progress_percent = Column(Integer, default=10)
    
    # Deliverables & Links
    demo_url = Column(String(255), nullable=True)
    assigned_to = Column(String(50), nullable=True)  # Founder A atau Founder B
    internal_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    files = relationship("OrderFile", back_populates="order", cascade="all, delete-orphan")
    revisions = relationship("Revision", back_populates="order", cascade="all, delete-orphan")


class OrderFile(Base):
    __tablename__ = "order_files"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="files")


class Revision(Base):
    __tablename__ = "revisions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    notes = Column(Text, nullable=False)
    status = Column(String(30), default="submitted")  # submitted, in_progress, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="revisions")
