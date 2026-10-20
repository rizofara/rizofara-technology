import React, { useState } from 'react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  CreditCard,
  GitCommit,
  MessageSquareWarning,
  Settings,
  CheckCircle2,
  Clock,
  Save,
  Send,
  X,
  Copy,
  ExternalLink,
  Share2,
} from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.origin.includes('5173')
    ? 'http://127.0.0.1:8000/api/v1'
    : '/api/v1');

export default function AdminOrderDetailModal({
  order,
  token,
  teamUsers,
  onClose,
  onOrderUpdated,
  showToast,
  adminUser,
}) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'milestones' | 'payments' | 'revisions'
  const [currentOrder, setCurrentOrder] = useState(order);

  const canViewPayments =
    !adminUser ||
    adminUser.role === 'superadmin' ||
    adminUser.role === 'admin' ||
    (adminUser.permissions && adminUser.permissions.includes('payments.view'));
  const isFreelance = adminUser?.role === 'freelance';

  // State Tab 1: General, Data Klien/Proyek, Bab Aktif & Harga Deal
  const [generalForm, setGeneralForm] = useState({
    client_name: order.client_name || '',
    client_whatsapp: order.client_whatsapp || '',
    campus_or_company: order.campus_or_company || '',
    service_type: order.service_type || 'skripsi',
    title: order.title || '',
    tech_stack: order.tech_stack || '',
    deadline: order.deadline || '',
    description: order.description || '',
    status: order.status || 'pending',
    progress_percent: order.progress_percent || 0,
    final_price: order.final_price || 0,
    discount_amount: order.discount_amount || 0,
    demo_url: order.demo_url || '',
    assigned_to: order.assigned_to || '',
    internal_notes: order.internal_notes || '',
    timeline_message: '',
  });
  const [savingGeneral, setSavingGeneral] = useState(false);

  // State Tab 2: Tambah Milestone & Tambah Timeline
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    weight_percent: 20,
  });
  const [newTimeline, setNewTimeline] = useState({
    title: '',
    message: '',
    is_public: true,
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false,
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // State Tab 3: Catat Pembayaran Baru
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'dp',
    amount: '',
    method: 'transfer_bank',
    reference_note: '',
    status: 'verified',
    paid_at: new Date().toISOString().split('T')[0],
  });

  // State Tab 4: Edit Balasan Revisi
  const [revEdits, setRevEdits] = useState({});

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const syncUpdatedOrder = (updatedData) => {
    setCurrentOrder(updatedData);
    setGeneralForm((prev) => ({
      ...prev,
      client_name: updatedData.client_name || '',
      client_whatsapp: updatedData.client_whatsapp || '',
      campus_or_company: updatedData.campus_or_company || '',
      service_type: updatedData.service_type || 'skripsi',
      title: updatedData.title || '',
      tech_stack: updatedData.tech_stack || '',
      deadline: updatedData.deadline || '',
      description: updatedData.description || '',
      status: updatedData.status,
      progress_percent: updatedData.progress_percent,
      final_price: updatedData.final_price || 0,
      discount_amount: updatedData.discount_amount || 0,
      demo_url: updatedData.demo_url || '',
      assigned_to: updatedData.assigned_to || '',
      internal_notes: updatedData.internal_notes || '',
      timeline_message: '',
    }));
    if (onOrderUpdated) onOrderUpdated(updatedData);
  };

  // ===================================================================
  // TAB 1: SIMPAN INFO UMUM, DATA PROYEK, BAB AKTIF, HARGA DEAL & STATUS
  // ===================================================================
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const res = await axios.patch(
        `${API_BASE}/orders/${currentOrder.id}/status`,
        {
          client_name: generalForm.client_name,
          client_whatsapp: generalForm.client_whatsapp,
          campus_or_company: generalForm.campus_or_company || null,
          service_type: generalForm.service_type,
          title: generalForm.title,
          tech_stack: generalForm.tech_stack || null,
          deadline: generalForm.deadline,
          description: generalForm.description || null,
          status: generalForm.status,
          progress_percent: parseInt(generalForm.progress_percent) || 0,
          final_price: parseInt(generalForm.final_price) || 0,
          discount_amount: parseInt(generalForm.discount_amount) || 0,
          demo_url: generalForm.demo_url || null,
          assigned_to: generalForm.assigned_to || null,
          internal_notes: generalForm.internal_notes || null,
          timeline_message: generalForm.timeline_message || null,
        },
        authHeaders
      );
      syncUpdatedOrder(res.data);
      showToast('success', `Order ${currentOrder.order_code} berhasil diperbarui!`);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan perubahan order.');
    } finally {
      setSavingGeneral(false);
    }
  };

  // ===================================================================
  // TAB 2: HANDLER CHECKLIST MILESTONE & TIMELINE
  // ===================================================================
  const handleToggleMilestone = async (m) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/orders/${currentOrder.id}/milestones/${m.id}`,
        { is_completed: !m.is_completed },
        authHeaders
      );
      syncUpdatedOrder(res.data);
      showToast(
        'success',
        `Milestone "${m.title}" ditandai ${!m.is_completed ? 'Selesai' : 'Belum Selesai'} (Progres: ${res.data.progress_percent}%).`
      );
    } catch (err) {
      showToast('error', 'Gagal memperbarui milestone.');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;
    try {
      const res = await axios.post(
        `${API_BASE}/orders/${currentOrder.id}/milestones`,
        {
          title: newMilestone.title,
          description: newMilestone.description || null,
          weight_percent: parseInt(newMilestone.weight_percent) || 20,
          is_completed: false,
          display_order: (currentOrder.milestones?.length || 0) + 1,
        },
        authHeaders
      );
      syncUpdatedOrder(res.data);
      setNewMilestone({ title: '', description: '', weight_percent: 20 });
      showToast('success', 'Tahapan milestone baru berhasil ditambahkan!');
    } catch (err) {
      showToast('error', 'Gagal menambah milestone.');
    }
  };

  const handleDeleteMilestone = (m) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Tahapan Milestone',
      message: `Apakah Anda yakin ingin menghapus tahapan "${m.title}"? Persentase progres akan dihitung ulang.`,
      onConfirm: async () => {
        setDeleteConfirm((prev) => ({ ...prev, loading: true }));
        try {
          const res = await axios.delete(
            `${API_BASE}/orders/${currentOrder.id}/milestones/${m.id}`,
            authHeaders
          );
          syncUpdatedOrder(res.data);
          showToast('success', 'Milestone berhasil dihapus.');
        } catch (err) {
          showToast('error', 'Gagal menghapus milestone.');
        } finally {
          setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: null, loading: false });
        }
      },
    });
  };

  const handleAddTimelineLog = async (e) => {
    e.preventDefault();
    if (!newTimeline.title.trim()) return;
    try {
      const res = await axios.post(
        `${API_BASE}/orders/${currentOrder.id}/timeline`,
        newTimeline,
        authHeaders
      );
      syncUpdatedOrder(res.data);
      setNewTimeline({ title: '', message: '', is_public: true });
      showToast('success', 'Kabar progres berhasil ditambahkan ke Timeline klien!');
    } catch (err) {
      showToast('error', 'Gagal menambahkan log timeline.');
    }
  };

  // ===================================================================
  // TAB 3: HANDLER BUKU KAS PEMBAYARAN (DP, CICILAN, PELUNASAN)
  // ===================================================================
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amountNum = parseInt(paymentForm.amount) || 0;
    if (amountNum <= 0) return;
    setSavingPayment(true);
    try {
      const payload = {
        payment_type: paymentForm.payment_type,
        amount: amountNum,
        method: paymentForm.method,
        reference_note: paymentForm.reference_note || null,
        status: paymentForm.status,
      };
      if (paymentForm.paid_at) {
        payload.paid_at = new Date(paymentForm.paid_at).toISOString();
      }
      const res = await axios.post(
        `${API_BASE}/orders/${currentOrder.id}/payments`,
        payload,
        authHeaders
      );
      syncUpdatedOrder(res.data);
      setPaymentForm({
        payment_type: 'installment',
        amount: '',
        method: 'transfer_bank',
        reference_note: '',
        status: 'verified',
        paid_at: new Date().toISOString().split('T')[0],
      });
      showToast('success', 'Pembayaran berhasil dicatat dan tagihan diperbarui!');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal mencatat pembayaran.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = (p) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Catatan Pembayaran',
      message: `Apakah Anda yakin ingin menghapus catatan pembayaran Rp ${p.amount.toLocaleString('id-ID')} (${p.payment_type.toUpperCase()})? Sisa tagihan akan dihitung ulang.`,
      onConfirm: async () => {
        setDeleteConfirm((prev) => ({ ...prev, loading: true }));
        try {
          const res = await axios.delete(
            `${API_BASE}/orders/${currentOrder.id}/payments/${p.id}`,
            authHeaders
          );
          syncUpdatedOrder(res.data);
          showToast('success', 'Catatan pembayaran berhasil dihapus.');
        } catch (err) {
          showToast('error', 'Gagal menghapus pembayaran.');
        } finally {
          setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: null, loading: false });
        }
      },
    });
  };

  // ===================================================================
  // TAB 4: HANDLER REVISI KLIEN & BALASAN ADMIN
  // ===================================================================
  const getRevState = (rev) => {
    return (
      revEdits[rev.id] || {
        status: rev.status || 'submitted',
        admin_response: rev.admin_response || '',
        is_out_of_scope: rev.is_out_of_scope || false,
        extra_cost: rev.extra_cost || 0,
      }
    );
  };

  const updateRevState = (revId, field, value, originalRev) => {
    const prev = getRevState(originalRev);
    setRevEdits({
      ...revEdits,
      [revId]: { ...prev, [field]: value },
    });
  };

  const handleSaveRevision = async (rev) => {
    const state = getRevState(rev);
    try {
      const res = await axios.patch(
        `${API_BASE}/orders/${currentOrder.id}/revisions/${rev.id}`,
        {
          status: state.status,
          admin_response: state.admin_response,
          is_out_of_scope: state.is_out_of_scope,
          extra_cost: parseInt(state.extra_cost) || 0,
        },
        authHeaders
      );
      syncUpdatedOrder(res.data);
      showToast('success', `Revisi #${rev.id} berhasil diperbarui!`);
    } catch (err) {
      showToast('error', 'Gagal memperbarui status revisi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header Permanen di Atas dengan Tombol X yang Selalu Terlihat */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 dark:border-[#183247] flex items-start justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-[#0093E3]">
                {currentOrder.order_code}
              </span>
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                {currentOrder.service_type}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                Status: {currentOrder.status} ({currentOrder.progress_percent}%)
              </span>
              <span
                className={`text-xs uppercase font-bold px-2 py-0.5 rounded-lg ${
                  currentOrder.payment_status === 'paid'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : currentOrder.payment_status === 'partial'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                Tagihan:{' '}
                {currentOrder.payment_status === 'paid'
                  ? 'LUNAS'
                  : currentOrder.payment_status === 'partial'
                  ? 'DP / CICILAN'
                  : 'BELUM BAYAR'}
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F1F5F9] mt-1 truncate">{currentOrder.title}</h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Klien: <strong className="text-slate-800">{currentOrder.client_name}</strong> (WA:{' '}
              {currentOrder.client_whatsapp})
              {currentOrder.campus_or_company ? ` • ${currentOrder.campus_or_company}` : ''} • Deadline:{' '}
              {currentOrder.deadline}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] text-slate-600 dark:text-[#F1F5F9] hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Banner Bab / Tahapan yang sedang dikerjakan saat ini */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-[#06111F] border border-emerald-200 dark:border-[#183247] text-xs text-emerald-800 dark:text-[#07C995] flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 block">
                Tahapan / Bab yang Sedang Dikerjakan Saat Ini:
              </span>
              <span className="font-semibold text-slate-900 dark:text-[#F1F5F9] text-sm">
                {currentOrder.current_stage || 'Menunggu update tahapan pengerjaan'}
              </span>
            </div>
            <span className="font-mono font-extrabold text-base text-emerald-700 shrink-0">
              {currentOrder.progress_percent}%
            </span>
          </div>

          {/* Banner Kode Lacak Progres & Tombol Share ke Klien */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-[#06111F] border border-sky-200 dark:border-[#183247] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/50 text-[#0093E3] border border-sky-200 dark:border-sky-800">
                  Kode Lacak Otomatis
                </span>
                <span className="font-mono font-black text-sm text-[#005CDF] dark:text-[#00C4D7]">
                  {currentOrder.order_code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                Kode ini otomatis dibuat saat order dibuat dan dapat langsung dibagikan ke klien untuk tracking progres di website.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentOrder.order_code);
                  showToast('success', `Kode lacak ${currentOrder.order_code} disalin ke clipboard!`);
                }}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-white dark:bg-[#0B1929] hover:bg-sky-50 dark:hover:bg-[#183247] text-slate-700 dark:text-[#F1F5F9] border border-sky-200 dark:border-[#183247] font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#0093E3]" />
                <span>Salin Kode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const trackUrl = `${window.location.origin}/?track=${currentOrder.order_code}`;
                  navigator.clipboard.writeText(trackUrl);
                  showToast('success', 'Link halaman lacak klien disalin ke clipboard!');
                }}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-white dark:bg-[#0B1929] hover:bg-sky-50 dark:hover:bg-[#183247] text-slate-700 dark:text-[#F1F5F9] border border-sky-200 dark:border-[#183247] font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-500" />
                <span>Salin Link</span>
              </button>
              <a
                href={`https://wa.me/${(currentOrder.client_whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Halo Kak ${currentOrder.client_name}, ini link pelacakan resmi untuk pesanan "${currentOrder.title}" di Rizofara Technology:\n\n👉 Kode Tracking: *${currentOrder.order_code}*\n👉 Cek Progres Real-Time: ${window.location.origin}/?track=${currentOrder.order_code}\n\nTerima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share WA</span>
              </a>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 font-extrabold shadow-sm'
                : 'bg-slate-50 dark:bg-[#06111F] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#183247] hover:bg-slate-100 dark:hover:bg-[#183247] dark:hover:text-[#F1F5F9]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            1. Edit Order, Bab Aktif & Status
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'milestones'
                ? 'bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 font-extrabold shadow-sm'
                : 'bg-slate-50 dark:bg-[#06111F] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#183247] hover:bg-slate-100 dark:hover:bg-[#183247] dark:hover:text-[#F1F5F9]'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            2. Checklist Bab & Timeline ({currentOrder.milestones?.length || 0})
          </button>
          {canViewPayments && (
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'payments'
                  ? 'bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 font-extrabold shadow-sm'
                  : 'bg-slate-50 dark:bg-[#06111F] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#183247] hover:bg-slate-100 dark:hover:bg-[#183247] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              3. Pembayaran & Sisa Tagihan ({currentOrder.payments?.length || 0})
            </button>
          )}
          <button
            onClick={() => setActiveTab('revisions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'revisions'
                ? 'bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 font-extrabold shadow-sm'
                : 'bg-slate-50 dark:bg-[#06111F] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#183247] hover:bg-slate-100 dark:hover:bg-[#183247] dark:hover:text-[#F1F5F9]'
            }`}
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            4. Revisi Klien ({currentOrder.revisions?.length || 0})
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: CRUD DATA KLIEN/PROYEK, UPDATE BAB PENGERJAAN & HARGA DEAL */}
        {/* ================================================================= */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
            {canViewPayments ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247]">
                <div>
                  <div className="text-[10px] text-slate-500">Estimasi Awal Kalkulator</div>
                  <div className="font-bold text-slate-800 dark:text-[#F1F5F9] text-sm mt-0.5">
                    Rp {(currentOrder.price_estimate || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Total Tagihan Efektif</div>
                  <div className="font-extrabold text-teal-400 text-sm mt-0.5">
                    Rp {(currentOrder.effective_bill || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Sisa Tagihan Belum Dibayar</div>
                  <div className="font-extrabold text-amber-400 text-sm mt-0.5">
                    Rp {(currentOrder.remaining_balance || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Hak Akses Freelance:</strong> Anda dapat memperbarui persentase progres, catatan tahapan Bab, serta menambah/mengedit checklist milestone pada Tab 2.
                </span>
              </div>
            )}

            {/* Bagian Highlight: Update Bab / Tahapan yang sedang dikerjakan */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#06111F] border border-emerald-200 dark:border-[#183247] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-emerald-700 font-extrabold text-xs">
                  Update Bab / Tahapan yang Sedang Dikerjakan (Langsung Tampil di Tabel & Cek Order Klien)
                </label>
                <span className="text-[10px] text-slate-500">Pilih cepat Bab/Tahap:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: 'Sedang Kerjakan Bab 1 & 2 (20%)',
                    pct: 20,
                    status: 'in_progress',
                    msg: 'Sedang mengerjakan Bab 1 & 2: Penyusunan latar belakang, kajian literatur & persiapan dataset',
                  },
                  {
                    label: 'Sedang Kerjakan Bab 3 (40%)',
                    pct: 40,
                    status: 'in_progress',
                    msg: 'Sedang mengerjakan Bab 3: Perancangan metodologi penelitian, flowchart, ERD/UML & arsitektur sistem',
                  },
                  {
                    label: 'Sedang Kerjakan Bab 4 Koding & Uji (70%)',
                    pct: 70,
                    status: 'in_progress',
                    msg: 'Sedang mengerjakan Bab 4: Implementasi source code, pelatihan model AI/Web & pengujian akurasi / Blackbox',
                  },
                  {
                    label: 'Sedang Kerjakan Bab 5 & Demo (90%)',
                    pct: 90,
                    status: 'review',
                    msg: 'Sedang mengerjakan Bab 5: Penyusunan kesimpulan laporan akhir, pengecekan plagiasi & persiapan demo sidang',
                  },
                  {
                    label: 'Selesai Bab 1-5 & Serah Terima (100%)',
                    pct: 100,
                    status: 'completed',
                    msg: 'Seluruh pengerjaan Bab 1-5 dan source code selesai 100% serta siap diserahterimakan',
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setGeneralForm({
                        ...generalForm,
                        status: preset.status,
                        progress_percent: preset.pct,
                        timeline_message: preset.msg,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B1929] hover:bg-teal-500/20 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] hover:border-emerald-200 text-emerald-700 dark:text-[#07C995] font-semibold text-[11px] transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={generalForm.timeline_message}
                onChange={(e) =>
                  setGeneralForm({ ...generalForm, timeline_message: e.target.value })
                }
                placeholder="Ketik progres Bab/Tahapan terbaru (Contoh: Sedang mengerjakan Bab 4: Integrasi model CNN & tabel pengujian)..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Edit Data Klien & Judul Proyek */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Nama Klien *</label>
                <input
                  type="text"
                  required
                  value={generalForm.client_name}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, client_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">WhatsApp Klien *</label>
                <input
                  type="text"
                  required
                  value={generalForm.client_whatsapp}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, client_whatsapp: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Kampus / Instansi</label>
                <input
                  type="text"
                  value={generalForm.campus_or_company}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, campus_or_company: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Kategori Layanan</label>
                <select
                  value={generalForm.service_type}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, service_type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                >
                  <option value="skripsi">Skripsi / Tugas Akhir</option>
                  <option value="website">Pembuatan Website / Sistem</option>
                  <option value="chatbot">AI Chatbot / Machine Learning</option>
                  <option value="tugas">Tugas Kuliah / Praktikum</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Tech Stack / Metode</label>
                <input
                  type="text"
                  value={generalForm.tech_stack}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, tech_stack: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Deadline *</label>
                <input
                  type="text"
                  required
                  value={generalForm.deadline}
                  onChange={(e) => setGeneralForm({ ...generalForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                Judul Skripsi / Proyek Sistem *
              </label>
              <input
                type="text"
                required
                value={generalForm.title}
                onChange={(e) => setGeneralForm({ ...generalForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
              />
            </div>

            {canViewPayments && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                    Harga Deal Final (Rp) - Isi 0 jika masih pakai estimasi
                  </label>
                  <input
                    type="number"
                    value={generalForm.final_price}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, final_price: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                    Potongan Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    value={generalForm.discount_amount}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, discount_amount: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Status Order</label>
                <select
                  value={generalForm.status}
                  onChange={(e) => setGeneralForm({ ...generalForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                >
                  <option value="pending">pending (Menunggu Konfirmasi)</option>
                  <option value="confirmed">confirmed (Harga Disepakati)</option>
                  <option value="dp_received">dp_received (DP Diterima)</option>
                  <option value="in_progress">in_progress (Sedang Dikerjakan)</option>
                  <option value="review">review (Demo & Review)</option>
                  <option value="revision">revision (Revisi)</option>
                  <option value="completed">completed (Selesai 100%)</option>
                  <option value="cancelled">cancelled (Dibatalkan)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                  Persentase Progres ({generalForm.progress_percent}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={generalForm.progress_percent}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, progress_percent: e.target.value })
                  }
                  className="w-full mt-2 accent-teal-400"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                  PIC / Ditugaskan Ke
                </label>
                <select
                  value={generalForm.assigned_to}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, assigned_to: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {(teamUsers || []).map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                URL Demo Aplikasi / Link Hasil Kerja (Tampil ke Klien)
              </label>
              <input
                type="text"
                value={generalForm.demo_url}
                onChange={(e) => setGeneralForm({ ...generalForm, demo_url: e.target.value })}
                placeholder="https://demo.rizofara.com/..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                Catatan Internal Tim (Rahasia - Tidak pernah tampil ke klien)
              </label>
              <textarea
                rows={2}
                value={generalForm.internal_notes}
                onChange={(e) =>
                  setGeneralForm({ ...generalForm, internal_notes: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingGeneral}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingGeneral ? 'Menyimpan...' : 'Simpan Perubahan Data Order, Progres Bab & Harga'}
            </button>
          </form>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CHECKLIST MILESTONE & TIMELINE PROGRES (MODUL M6) */}
        {/* ================================================================= */}
        {activeTab === 'milestones' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            {/* Kolom Kiri: Checklist Milestone */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Checklist Tahapan Pengerjaan (Milestones)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Klik kotak centang untuk menandai tahap selesai. Persentase progres order ({currentOrder.progress_percent}%) akan dihitung otomatis!
                </p>
              </div>

              <div className="space-y-2">
                {(currentOrder.milestones || []).map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition ${
                      m.is_completed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleMilestone(m)}
                      className="flex items-start gap-2.5 text-left flex-1"
                    >
                      {m.is_completed ? (
                        <CheckSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div
                          className={`font-bold ${
                            m.is_completed ? 'text-emerald-700 line-through' : 'text-slate-900'
                          }`}
                        >
                          {m.title}
                        </div>
                        {m.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {m.description}
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-emerald-700 font-mono text-[10px] font-bold">
                        {m.weight_percent}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(m)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Tambah Milestone */}
              <form
                onSubmit={handleAddMilestone}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="font-bold text-slate-700">Tambah Tahapan Milestone Kustom</div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={newMilestone.title}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, title: e.target.value })
                    }
                    placeholder="Nama tahapan..."
                    className="col-span-3 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="number"
                    required
                    value={newMilestone.weight_percent}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, weight_percent: e.target.value })
                    }
                    placeholder="Bobot %"
                    className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-teal-400 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Milestone
                </button>
              </form>
            </div>

            {/* Kolom Kanan: Timeline Kabar Progres */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Timeline Riwayat Update Progres
                </h4>
                <p className="text-[11px] text-slate-500">
                  Kirim kabar progres terbaru agar klien tenang dan percaya.
                </p>
              </div>

              <form
                onSubmit={handleAddTimelineLog}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <input
                  type="text"
                  required
                  value={newTimeline.title}
                  onChange={(e) => setNewTimeline({ ...newTimeline, title: e.target.value })}
                  placeholder="Judul kabar (misal: Model CNN Selesai Dilatih)"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
                <textarea
                  rows={2}
                  value={newTimeline.message}
                  onChange={(e) =>
                    setNewTimeline({ ...newTimeline, message: e.target.value })
                  }
                  placeholder="Detail penjelasan untuk klien..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Kabar ke Timeline
                </button>
              </form>

              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {(currentOrder.timeline_logs || []).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-teal-400 font-bold">
                      <span>{log.title}</span>
                      <span>{log.progress_percent}%</span>
                    </div>
                    {log.message && <p className="text-[11px] text-slate-700">{log.message}</p>}
                    <div className="text-[10px] text-slate-500">
                      Oleh {log.created_by || 'Admin'} •{' '}
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: BUKU KAS PEMBAYARAN & SISA TAGIHAN (MODUL M8) */}
        {/* ================================================================= */}
        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tagihan Efektif:</span>
                  <span className="font-bold text-slate-900">
                    Rp {(currentOrder.effective_bill || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sudah Dibayar (Verified):</span>
                  <span className="font-bold text-emerald-400">
                    Rp {(currentOrder.total_paid || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                  <span className="font-bold text-slate-800">Sisa Tagihan:</span>
                  <span className="font-extrabold text-amber-400">
                    Rp {(currentOrder.remaining_balance || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleRecordPayment}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <h4 className="font-extrabold text-sm text-slate-900">Catat Pembayaran Masuk</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-500 mb-1">Tipe Pembayaran</label>
                    <select
                      value={paymentForm.payment_type}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, payment_type: e.target.value })
                      }
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                    >
                      <option value="dp">DP (Uang Muka)</option>
                      <option value="installment">Termin / Cicilan</option>
                      <option value="final">Pelunasan Akhir</option>
                      <option value="extra">Biaya Tambahan</option>
                      <option value="refund">Refund / Pengembalian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Metode</label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, method: e.target.value })
                      }
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                    >
                      <option value="transfer_bank">Transfer Bank</option>
                      <option value="qris">QRIS</option>
                      <option value="ewallet">E-Wallet (Dana/Gopay/OVO)</option>
                      <option value="cash">Tunai / Cash</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-500 mb-1">Nominal Rupiah (Rp) *</label>
                    <input
                      type="number"
                      required
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, amount: e.target.value })
                      }
                      placeholder="Contoh: 500000"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Tanggal Transaksi *</label>
                    <input
                      type="date"
                      required
                      value={paymentForm.paid_at}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, paid_at: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Catatan Referensi / Bukti Transfer</label>
                  <input
                    type="text"
                    value={paymentForm.reference_note}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, reference_note: e.target.value })
                    }
                    placeholder="Contoh: Transfer BCA a.n. Siti Rahmawati / Bukti #123"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPayment}
                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-500/20"
                >
                  <Save className="w-4 h-4" />
                  {savingPayment ? 'Menyimpan Transaksi...' : 'Simpan Catatan Pembayaran'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900">
                Riwayat Transaksi Pembayaran ({currentOrder.payments?.length || 0})
              </h4>
              {(currentOrder.payments || []).length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                  Belum ada transaksi pembayaran yang tercatat pada order ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentOrder.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/15 text-emerald-700">
                            {p.payment_type}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">
                            Rp {p.amount.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">
                            via {p.method}
                          </span>
                        </div>
                        {p.reference_note && (
                          <div className="text-[11px] text-slate-700 mt-1">
                            {p.reference_note}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Diverifikasi oleh {p.verified_by || 'Admin'} •{' '}
                          {new Date(p.paid_at).toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePayment(p)}
                        className="p-1.5 rounded-lg bg-white hover:bg-red-950 text-red-400"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: PENANGANAN REVISI KLIEN (MODUL M7) */}
        {/* ================================================================= */}
        {activeTab === 'revisions' && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Daftar Permintaan Revisi dari Klien
              </h4>
              <p className="text-[11px] text-slate-500">
                Berikan balasan resmi tim teknis (`admin_response`) dan ubah status revisi menjadi Selesai (`completed`) agar tampil di halaman tracking klien.
              </p>
            </div>

            {(currentOrder.revisions || []).length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                Belum ada pengajuan revisi dari klien untuk pesanan ini.
              </div>
            ) : (
              <div className="space-y-4">
                {currentOrder.revisions.map((rev) => {
                  const st = getRevState(rev);
                  return (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase">
                            Revisi #{rev.id} • Diajukan{' '}
                            {new Date(rev.created_at).toLocaleString('id-ID')}
                          </span>
                          <p className="text-slate-900 font-semibold mt-1">{rev.notes}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-slate-100 text-emerald-700 font-bold text-[10px] uppercase">
                          {rev.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block text-slate-500 mb-1">Status Revisi</label>
                          <select
                            value={st.status}
                            onChange={(e) =>
                              updateRevState(rev.id, 'status', e.target.value, rev)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                          >
                            <option value="submitted">submitted (Baru Masuk)</option>
                            <option value="in_progress">in_progress (Dikerjakan)</option>
                            <option value="completed">completed (Selesai)</option>
                            <option value="rejected">rejected (Ditolak)</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.is_out_of_scope}
                              onChange={(e) =>
                                updateRevState(
                                  rev.id,
                                  'is_out_of_scope',
                                  e.target.checked,
                                  rev
                                )
                              }
                            />
                            <span className="text-slate-700">
                              Di Luar Scope Awal (Biaya Tambahan)
                            </span>
                          </label>
                        </div>
                        {st.is_out_of_scope && (
                          <div>
                            <label className="block text-slate-500 mb-1">
                              Biaya Tambahan Revisi (Rp)
                            </label>
                            <input
                              type="number"
                              value={st.extra_cost}
                              onChange={(e) =>
                                updateRevState(rev.id, 'extra_cost', e.target.value, rev)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">
                          Balasan Tim Teknis untuk Klien (`admin_response`)
                        </label>
                        <textarea
                          rows={2}
                          value={st.admin_response}
                          onChange={(e) =>
                            updateRevState(rev.id, 'admin_response', e.target.value, rev)
                          }
                          placeholder="Contoh: Bug pada halaman laporan sudah diperbaiki dan di-deploy ke link demo."
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSaveRevision(rev)}
                          className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                        >
                          Simpan Status & Balasan Revisi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Custom Modal Konfirmasi Hapus */}
    <ConfirmModal
      isOpen={deleteConfirm.isOpen}
      title={deleteConfirm.title}
      message={deleteConfirm.message}
      loading={deleteConfirm.loading}
      onConfirm={deleteConfirm.onConfirm}
      onClose={() =>
        setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: null, loading: false })
      }
    />
  </div>
  );
}
