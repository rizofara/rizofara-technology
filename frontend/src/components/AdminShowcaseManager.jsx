import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit3,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Briefcase,
  MessageSquare,
  Save,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const API_BASE = window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

export default function AdminShowcaseManager({ token, showToast, onShowcaseUpdated }) {
  const [subTab, setSubTab] = useState('testimonials'); // 'testimonials' | 'portfolio'
  const [testimonials, setTestimonials] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal Form States
  const [testimonialModal, setTestimonialModal] = useState(null);
  const [portfolioModal, setPortfolioModal] = useState(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (token) {
      fetchShowcaseData();
    }
  }, [token]);

  const fetchShowcaseData = async () => {
    setLoading(true);
    try {
      const [testiRes, portRes] = await Promise.all([
        axios.get(`${API_BASE}/showcase/testimonials`, authHeaders),
        axios.get(`${API_BASE}/showcase/portfolio`, authHeaders),
      ]);
      setTestimonials(testiRes.data);
      setPortfolioItems(portRes.data);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Gagal memuat data portofolio & testimoni', 'error');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HANDLERS TESTIMONI (Modul M9)
  // =====================================================
  const openCreateTestimonial = () => {
    setTestimonialModal({
      isEdit: false,
      client_name: '',
      client_role: 'Mahasiswa Teknik Informatika',
      project_label: '',
      tag: 'Lulus Sidang Nilai A',
      comment: '',
      rating: 5,
      avatar_color: 'from-teal-500 to-emerald-600',
      status: 'approved',
      is_featured: true,
      consent_publish: true,
      display_order: testimonials.length + 1,
    });
  };

  const openEditTestimonial = (item) => {
    setTestimonialModal({
      ...item,
      isEdit: true,
    });
  };

  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    try {
      if (testimonialModal.isEdit) {
        await axios.patch(
          `${API_BASE}/showcase/testimonials/${testimonialModal.id}`,
          testimonialModal,
          authHeaders
        );
        showToast('Testimoni berhasil diperbarui!');
      } else {
        await axios.post(`${API_BASE}/showcase/testimonials`, testimonialModal, authHeaders);
        showToast('Testimoni baru berhasil ditambahkan!');
      }
      setTestimonialModal(null);
      fetchShowcaseData();
      if (onShowcaseUpdated) onShowcaseUpdated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Gagal menyimpan testimoni', 'error');
    }
  };

  const handleModerateTestimonial = async (id, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/showcase/testimonials/${id}`,
        { status: newStatus },
        authHeaders
      );
      showToast(
        newStatus === 'approved'
          ? 'Testimoni disetujui & tampil di halaman utama!'
          : 'Testimoni ditolak / disembunyikan.'
      );
      fetchShowcaseData();
      if (onShowcaseUpdated) onShowcaseUpdated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Gagal memoderasi testimoni', 'error');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Hapus testimoni ini secara permanen?')) return;
    try {
      await axios.delete(`${API_BASE}/showcase/testimonials/${id}`, authHeaders);
      showToast('Testimoni dihapus.');
      fetchShowcaseData();
      if (onShowcaseUpdated) onShowcaseUpdated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Gagal menghapus testimoni', 'error');
    }
  };

  // =====================================================
  // HANDLERS PORTOFOLIO (Modul M10)
  // =====================================================
  const openCreatePortfolio = () => {
    setPortfolioModal({
      isEdit: false,
      title: '',
      slug: '',
      category: 'Skripsi AI & Machine Learning',
      badge_color: 'teal',
      summary: '',
      content: '',
      tech_tags_input: 'Python, FastAPI, React',
      highlight_metric: 'Akurasi > 90%',
      demo_url: '',
      repo_url: '',
      client_consent: true,
      is_published: true,
      is_featured: true,
      display_order: portfolioItems.length + 1,
    });
  };

  const openEditPortfolio = (item) => {
    setPortfolioModal({
      ...item,
      isEdit: true,
      tech_tags_input: Array.isArray(item.tech_tags) ? item.tech_tags.join(', ') : '',
    });
  };

  const handleSavePortfolio = async (e) => {
    e.preventDefault();
    const payload = {
      title: portfolioModal.title,
      slug: portfolioModal.slug || undefined,
      category: portfolioModal.category,
      badge_color: portfolioModal.badge_color || 'teal',
      summary: portfolioModal.summary,
      content: portfolioModal.content || null,
      tech_tags: (portfolioModal.tech_tags_input || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      highlight_metric: portfolioModal.highlight_metric || null,
      demo_url: portfolioModal.demo_url || null,
      repo_url: portfolioModal.repo_url || null,
      client_consent: Boolean(portfolioModal.client_consent),
      is_published: Boolean(portfolioModal.is_published),
      is_featured: Boolean(portfolioModal.is_featured),
      display_order: Number(portfolioModal.display_order || 0),
    };

    try {
      if (portfolioModal.isEdit) {
        await axios.patch(
          `${API_BASE}/showcase/portfolio/${portfolioModal.id}`,
          payload,
          authHeaders
        );
        showToast('Portofolio berhasil diperbarui!');
      } else {
        await axios.post(`${API_BASE}/showcase/portfolio`, payload, authHeaders);
        showToast('Portofolio baru berhasil ditambahkan!');
      }
      setPortfolioModal(null);
      fetchShowcaseData();
      if (onShowcaseUpdated) onShowcaseUpdated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Gagal menyimpan portofolio', 'error');
    }
  };

  const handleDeletePortfolio = async (id) => {
    if (!window.confirm('Hapus item portofolio ini secara permanen?')) return;
    try {
      await axios.delete(`${API_BASE}/showcase/portfolio/${id}`, authHeaders);
      showToast('Item portofolio dihapus.');
      fetchShowcaseData();
      if (onShowcaseUpdated) onShowcaseUpdated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Gagal menghapus portofolio', 'error');
    }
  };

  const pendingTestimonialsCount = testimonials.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <h3 className="text-lg font-extrabold text-white">
            Manajemen Testimoni & Portofolio
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Moderasi ulasan dari klien terverifikasi serta kelola studi kasus project yang tampil di halaman utama.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubTab('testimonials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              subTab === 'testimonials'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Testimoni ({testimonials.length})</span>
            {pendingTestimonialsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-slate-950 font-extrabold">
                {pendingTestimonialsCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('portfolio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              subTab === 'portfolio'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Portofolio ({portfolioItems.length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          SUB-TAB 1: TESTIMONI & MODERASI (M9)
          ===================================================== */}
      {subTab === 'testimonials' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h4 className="font-bold text-white text-sm">Daftar Ulasan & Moderasi Klien</h4>
              <p className="text-xs text-slate-400">
                Ulasan yang dikirim klien dari halaman tracking akan berstatus <b>pending</b> sampai Anda menyetujuinya.
              </p>
            </div>
            <button
              onClick={openCreateTestimonial}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Testimoni Manual
            </button>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 py-8 text-center">Memuat data testimoni...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                    t.status === 'pending'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : t.status === 'approved'
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-red-950/15 border-red-500/30 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            t.status === 'approved'
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : t.status === 'pending'
                              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                              : 'bg-red-950/60 border-red-500/40 text-red-300'
                          }`}
                        >
                          {t.status}
                        </span>
                        {t.source === 'client' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Order: {t.order_code}
                          </span>
                        )}
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 italic leading-relaxed mb-3">
                      "{t.comment}"
                    </p>

                    <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-3">
                      <div>
                        <div className="font-bold text-white">{t.client_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {t.client_role} • <span className="text-teal-400">{t.project_label}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {t.tag}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      {t.status !== 'approved' && (
                        <button
                          onClick={() => handleModerateTestimonial(t.id, 'approved')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                      {t.status !== 'rejected' && (
                        <button
                          onClick={() => handleModerateTestimonial(t.id, 'rejected')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Sembunyikan
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditTestimonial(t)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Edit Testimoni"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 transition"
                        title="Hapus Testimoni"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          SUB-TAB 2: PORTOFOLIO & STUDI KASUS (M10)
          ===================================================== */}
      {subTab === 'portfolio' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h4 className="font-bold text-white text-sm">Katalog Portofolio & Studi Kasus</h4>
              <p className="text-xs text-slate-400">
                Sesuai komitmen privasi di FAQ, portofolio hanya tampil di publik jika <b>Izin Klien (Client Consent)</b> dicentang.
              </p>
            </div>
            <button
              onClick={openCreatePortfolio}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Portofolio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {portfolioItems.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      {p.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.is_published && p.client_consent
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.is_published && p.client_consent ? 'Published' : 'Draft / Privat'}
                    </span>
                  </div>

                  <h5 className="font-bold text-sm text-white mt-2">{p.title}</h5>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">/{p.slug}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.summary}</p>

                  {p.highlight_metric && (
                    <div className="mt-3 inline-block text-[11px] font-bold text-amber-300 bg-amber-950/30 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                      {p.highlight_metric}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.tech_tags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Urutan: #{p.display_order}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditPortfolio(p)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePortfolio(p.id)}
                      className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL FORM TESTIMONI
          ===================================================== */}
      {testimonialModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-base font-extrabold text-white mb-4">
              {testimonialModal.isEdit ? 'Edit Testimoni' : 'Tambah Testimoni Baru'}
            </h4>
            <form onSubmit={handleSaveTestimonial} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Klien *</label>
                  <input
                    type="text"
                    required
                    value={testimonialModal.client_name}
                    onChange={(e) =>
                      setTestimonialModal({ ...testimonialModal, client_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Peran / Kampus / Instansi *</label>
                  <input
                    type="text"
                    required
                    value={testimonialModal.client_role}
                    onChange={(e) =>
                      setTestimonialModal({ ...testimonialModal, client_role: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Judul Project</label>
                  <input
                    type="text"
                    value={testimonialModal.project_label || ''}
                    onChange={(e) =>
                      setTestimonialModal({ ...testimonialModal, project_label: e.target.value })
                    }
                    placeholder="Contoh: Skripsi AI CNN"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Label Badge</label>
                  <input
                    type="text"
                    value={testimonialModal.tag || ''}
                    onChange={(e) =>
                      setTestimonialModal({ ...testimonialModal, tag: e.target.value })
                    }
                    placeholder="Lulus Sidang Nilai A"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Isi Komentar / Testimoni *</label>
                <textarea
                  rows={3}
                  required
                  value={testimonialModal.comment}
                  onChange={(e) =>
                    setTestimonialModal({ ...testimonialModal, comment: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Rating (1-5)</label>
                  <select
                    value={testimonialModal.rating}
                    onChange={(e) =>
                      setTestimonialModal({
                        ...testimonialModal,
                        rating: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} Bintang
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status Moderasi</label>
                  <select
                    value={testimonialModal.status}
                    onChange={(e) =>
                      setTestimonialModal({ ...testimonialModal, status: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="approved">Approved (Tampil)</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Urutan Tampil</label>
                  <input
                    type="number"
                    value={testimonialModal.display_order}
                    onChange={(e) =>
                      setTestimonialModal({
                        ...testimonialModal,
                        display_order: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTestimonialModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Testimoni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL FORM PORTOFOLIO
          ===================================================== */}
      {portfolioModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-base font-extrabold text-white mb-4">
              {portfolioModal.isEdit ? 'Edit Item Portofolio' : 'Tambah Item Portofolio'}
            </h4>
            <form onSubmit={handleSavePortfolio} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Judul Studi Kasus / Project *</label>
                <input
                  type="text"
                  required
                  value={portfolioModal.title}
                  onChange={(e) =>
                    setPortfolioModal({ ...portfolioModal, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Kategori *</label>
                  <input
                    type="text"
                    required
                    value={portfolioModal.category}
                    onChange={(e) =>
                      setPortfolioModal({ ...portfolioModal, category: e.target.value })
                    }
                    placeholder="Skripsi AI & Machine Learning"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Metrik Highlight</label>
                  <input
                    type="text"
                    value={portfolioModal.highlight_metric || ''}
                    onChange={(e) =>
                      setPortfolioModal({ ...portfolioModal, highlight_metric: e.target.value })
                    }
                    placeholder="Contoh: Akurasi 94.2%"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ringkasan Singkat (Summary) *</label>
                <textarea
                  rows={2}
                  required
                  value={portfolioModal.summary}
                  onChange={(e) =>
                    setPortfolioModal({ ...portfolioModal, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Tech Stack Tags (pisahkan dengan koma) *
                </label>
                <input
                  type="text"
                  required
                  value={portfolioModal.tech_tags_input}
                  onChange={(e) =>
                    setPortfolioModal({ ...portfolioModal, tech_tags_input: e.target.value })
                  }
                  placeholder="Python, PyTorch, FastAPI, React"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Warna Badge</label>
                  <select
                    value={portfolioModal.badge_color}
                    onChange={(e) =>
                      setPortfolioModal({ ...portfolioModal, badge_color: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="teal">Teal</option>
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="sky">Sky</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Urutan Tampil</label>
                  <input
                    type="number"
                    value={portfolioModal.display_order}
                    onChange={(e) =>
                      setPortfolioModal({
                        ...portfolioModal,
                        display_order: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={portfolioModal.client_consent}
                    onChange={(e) =>
                      setPortfolioModal({ ...portfolioModal, client_consent: e.target.checked })
                    }
                    className="rounded border-slate-700"
                  />
                  <span className="text-slate-200 font-semibold">
                    Klien menyetujui studi kasus ini ditampilkan (Client Consent)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={portfolioModal.is_published}
                    onChange={(e) =>
                      setPortfolioModal({ ...portfolioModal, is_published: e.target.checked })
                    }
                    className="rounded border-slate-700"
                  />
                  <span className="text-slate-200">Publikasikan di halaman utama (Published)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortfolioModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Portofolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
