import React, { useState } from 'react';
import axios from 'axios';
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
} from 'lucide-react';

const API_BASE = window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

export default function AdminOrderDetailModal({
  order,
  token,
  teamUsers,
  onClose,
  onOrderUpdated,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'milestones' | 'payments' | 'revisions'
  const [currentOrder, setCurrentOrder] = useState(order);

  // State Tab 1: General & Harga Deal
  const [generalForm, setGeneralForm] = useState({
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

  // State Tab 3: Catat Pembayaran Baru
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'dp',
    amount: '',
    method: 'transfer_bank',
    reference_note: '',
    status: 'verified',
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
  // TAB 1: SIMPAN INFO UMUM, HARGA DEAL & STATUS
  // ===================================================================
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const res = await axios.patch(
        `${API_BASE}/orders/${currentOrder.id}/status`,
        {
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

  const handleDeleteMilestone = async (m) => {
    if (!window.confirm(`Hapus tahapan "${m.title}"?`)) return;
    try {
      const res = await axios.delete(
        `${API_BASE}/orders/${currentOrder.id}/milestones/${m.id}`,
        authHeaders
      );
      syncUpdatedOrder(res.data);
      showToast('success', 'Milestone dihapus.');
    } catch (err) {
      showToast('error', 'Gagal menghapus milestone.');
    }
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
    try {
      const res = await axios.post(
        `${API_BASE}/orders/${currentOrder.id}/payments`,
        {
          payment_type: paymentForm.payment_type,
          amount: amountNum,
          method: paymentForm.method,
          reference_note: paymentForm.reference_note || null,
          status: paymentForm.status,
        },
        authHeaders
      );
      syncUpdatedOrder(res.data);
      setPaymentForm({
        payment_type: 'final',
        amount: '',
        method: 'transfer_bank',
        reference_note: '',
        status: 'verified',
      });
      showToast('success', 'Pembayaran berhasil dicatat dan tagihan diperbarui!');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal mencatat pembayaran.');
    }
  };

  const handleDeletePayment = async (p) => {
    if (!window.confirm(`Hapus catatan pembayaran Rp ${p.amount.toLocaleString('id-ID')}?`))
      return;
    try {
      const res = await axios.delete(
        `${API_BASE}/orders/${currentOrder.id}/payments/${p.id}`,
        authHeaders
      );
      syncUpdatedOrder(res.data);
      showToast('success', 'Catatan pembayaran dihapus.');
    } catch (err) {
      showToast('error', 'Gagal menghapus pembayaran.');
    }
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 relative shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Tutup modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Info Order */}
        <div className="border-b border-slate-800 pb-4 mb-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono font-extrabold text-base px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
              {currentOrder.order_code}
            </span>
            <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300">
              {currentOrder.service_type}
            </span>
            <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300">
              Status: {currentOrder.status} ({currentOrder.progress_percent}%)
            </span>
            <span
              className={`text-xs uppercase font-bold px-2.5 py-1 rounded-lg ${
                currentOrder.payment_status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : currentOrder.payment_status === 'partial'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-red-500/20 text-red-300'
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
          <h3 className="font-extrabold text-lg text-white mt-2">{currentOrder.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Klien: <strong className="text-slate-200">{currentOrder.client_name}</strong> (WA:{' '}
            {currentOrder.client_whatsapp}) • Deadline: {currentOrder.deadline}
          </p>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'general'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            1. Status & Harga Deal
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'milestones'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            2. Milestone & Timeline ({currentOrder.milestones?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'payments'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            3. Pembayaran & Sisa Tagihan ({currentOrder.payments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('revisions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'revisions'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            4. Revisi Klien ({currentOrder.revisions?.length || 0})
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: STATUS, HARGA DEAL, PIC & LINK DEMO */}
        {/* ================================================================= */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400">Estimasi Awal Kalkulator</div>
                <div className="font-bold text-slate-200 text-sm mt-0.5">
                  Rp {(currentOrder.price_estimate || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Total Tagihan Efektif</div>
                <div className="font-extrabold text-teal-400 text-sm mt-0.5">
                  Rp {(currentOrder.effective_bill || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Sisa Tagihan Belum Dibayar</div>
                <div className="font-extrabold text-amber-400 text-sm mt-0.5">
                  Rp {(currentOrder.remaining_balance || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Harga Deal Final (Rp) — Isi 0 jika masih pakai estimasi
                </label>
                <input
                  type="number"
                  value={generalForm.final_price}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, final_price: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Potongan Diskon (Rp)
                </label>
                <input
                  type="number"
                  value={generalForm.discount_amount}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, discount_amount: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status Order</label>
                <select
                  value={generalForm.status}
                  onChange={(e) => setGeneralForm({ ...generalForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
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
                <label className="block text-slate-300 font-semibold mb-1">
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
                <label className="block text-slate-300 font-semibold mb-1">
                  PIC / Ditugaskan Ke
                </label>
                <select
                  value={generalForm.assigned_to}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, assigned_to: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
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
              <label className="block text-slate-300 font-semibold mb-1">
                URL Demo Aplikasi / Link Hasil Kerja (Tampil ke Klien)
              </label>
              <input
                type="text"
                value={generalForm.demo_url}
                onChange={(e) => setGeneralForm({ ...generalForm, demo_url: e.target.value })}
                placeholder="https://demo.rizofara.com/..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Pesan Update Timeline untuk Klien (Opsional saat simpan status)
              </label>
              <input
                type="text"
                value={generalForm.timeline_message}
                onChange={(e) =>
                  setGeneralForm({ ...generalForm, timeline_message: e.target.value })
                }
                placeholder="Contoh: Modul autentikasi & database selesai dirakit."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Catatan Internal Tim (Rahasia — Tidak pernah tampil ke klien)
              </label>
              <textarea
                rows={2}
                value={generalForm.internal_notes}
                onChange={(e) =>
                  setGeneralForm({ ...generalForm, internal_notes: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingGeneral}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingGeneral ? 'Menyimpan...' : 'Simpan Perubahan Info & Harga Order'}
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
                <h4 className="font-extrabold text-sm text-white">
                  Checklist Tahapan Pengerjaan (Milestones)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Klik kotak centang untuk menandai tahap selesai. Persentase progres order ({currentOrder.progress_percent}%) akan dihitung otomatis!
                </p>
              </div>

              <div className="space-y-2">
                {(currentOrder.milestones || []).map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition ${
                      m.is_completed
                        ? 'bg-teal-950/20 border-teal-500/40'
                        : 'bg-slate-950 border-slate-800'
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
                            m.is_completed ? 'text-teal-300 line-through' : 'text-white'
                          }`}
                        >
                          {m.title}
                        </div>
                        {m.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {m.description}
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-[10px] font-bold">
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
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
              >
                <div className="font-bold text-slate-300">Tambah Tahapan Milestone Kustom</div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={newMilestone.title}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, title: e.target.value })
                    }
                    placeholder="Nama tahapan..."
                    className="col-span-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                  <input
                    type="number"
                    required
                    value={newMilestone.weight_percent}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, weight_percent: e.target.value })
                    }
                    placeholder="Bobot %"
                    className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Milestone
                </button>
              </form>
            </div>

            {/* Kolom Kanan: Timeline Kabar Progres */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  Timeline Riwayat Update Progres
                </h4>
                <p className="text-[11px] text-slate-400">
                  Kirim kabar progres terbaru agar klien tenang dan percaya.
                </p>
              </div>

              <form
                onSubmit={handleAddTimelineLog}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
              >
                <input
                  type="text"
                  required
                  value={newTimeline.title}
                  onChange={(e) => setNewTimeline({ ...newTimeline, title: e.target.value })}
                  placeholder="Judul kabar (misal: Model CNN Selesai Dilatih)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
                <textarea
                  rows={2}
                  value={newTimeline.message}
                  onChange={(e) =>
                    setNewTimeline({ ...newTimeline, message: e.target.value })
                  }
                  placeholder="Detail penjelasan untuk klien..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
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
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-teal-400 font-bold">
                      <span>{log.title}</span>
                      <span>{log.progress_percent}%</span>
                    </div>
                    {log.message && <p className="text-[11px] text-slate-300">{log.message}</p>}
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
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Tagihan Efektif:</span>
                  <span className="font-bold text-white">
                    Rp {(currentOrder.effective_bill || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sudah Dibayar (Verified):</span>
                  <span className="font-bold text-emerald-400">
                    Rp {(currentOrder.total_paid || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                  <span className="font-bold text-slate-200">Sisa Tagihan:</span>
                  <span className="font-extrabold text-amber-400">
                    Rp {(currentOrder.remaining_balance || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleRecordPayment}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <h4 className="font-extrabold text-sm text-white">Catat Pembayaran Masuk</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1">Tipe Pembayaran</label>
                    <select
                      value={paymentForm.payment_type}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, payment_type: e.target.value })
                      }
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="dp">DP (Uang Muka)</option>
                      <option value="installment">Termin / Cicilan</option>
                      <option value="final">Pelunasan Akhir</option>
                      <option value="extra">Biaya Tambahan</option>
                      <option value="refund">Refund / Pengembalian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Metode</label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, method: e.target.value })
                      }
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="transfer_bank">Transfer Bank</option>
                      <option value="qris">QRIS</option>
                      <option value="ewallet">E-Wallet (Dana/Gopay/OVO)</option>
                      <option value="cash">Tunai / Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nominal Rupiah (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    placeholder="Contoh: 1200000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Catatan Referensi / Bank</label>
                  <input
                    type="text"
                    value={paymentForm.reference_note}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, reference_note: e.target.value })
                    }
                    placeholder="Contoh: BCA a.n. Budi Santoso"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                >
                  Simpan Catatan Pembayaran
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h4 className="font-extrabold text-sm text-white">
                Riwayat Transaksi Pembayaran ({currentOrder.payments?.length || 0})
              </h4>
              {(currentOrder.payments || []).length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400">
                  Belum ada transaksi pembayaran yang tercatat pada order ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentOrder.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300">
                            {p.payment_type}
                          </span>
                          <span className="font-extrabold text-sm text-white">
                            Rp {p.amount.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            via {p.method}
                          </span>
                        </div>
                        {p.reference_note && (
                          <div className="text-[11px] text-slate-300 mt-1">
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
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-red-400"
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
              <h4 className="font-extrabold text-sm text-white">
                Daftar Permintaan Revisi dari Klien
              </h4>
              <p className="text-[11px] text-slate-400">
                Berikan balasan resmi tim teknis (`admin_response`) dan ubah status revisi menjadi Selesai (`completed`) agar tampil di halaman tracking klien.
              </p>
            </div>

            {(currentOrder.revisions || []).length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400">
                Belum ada pengajuan revisi dari klien untuk pesanan ini.
              </div>
            ) : (
              <div className="space-y-4">
                {currentOrder.revisions.map((rev) => {
                  const st = getRevState(rev);
                  return (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase">
                            Revisi #{rev.id} • Diajukan{' '}
                            {new Date(rev.created_at).toLocaleString('id-ID')}
                          </span>
                          <p className="text-slate-100 font-semibold mt-1">{rev.notes}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-teal-300 font-bold text-[10px] uppercase">
                          {rev.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                        <div>
                          <label className="block text-slate-400 mb-1">Status Revisi</label>
                          <select
                            value={st.status}
                            onChange={(e) =>
                              updateRevState(rev.id, 'status', e.target.value, rev)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
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
                            <span className="text-slate-300">
                              Di Luar Scope Awal (Biaya Tambahan)
                            </span>
                          </label>
                        </div>
                        {st.is_out_of_scope && (
                          <div>
                            <label className="block text-slate-400 mb-1">
                              Biaya Tambahan Revisi (Rp)
                            </label>
                            <input
                              type="number"
                              value={st.extra_cost}
                              onChange={(e) =>
                                updateRevState(rev.id, 'extra_cost', e.target.value, rev)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">
                          Balasan Tim Teknis untuk Klien (`admin_response`)
                        </label>
                        <textarea
                          rows={2}
                          value={st.admin_response}
                          onChange={(e) =>
                            updateRevState(rev.id, 'admin_response', e.target.value, rev)
                          }
                          placeholder="Contoh: Bug pada halaman laporan sudah diperbaiki dan di-deploy ke link demo."
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
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
  );
}
