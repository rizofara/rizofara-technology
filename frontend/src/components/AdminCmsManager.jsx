import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Settings,
  HelpCircle,
  Code2,
  Plus,
  Edit3,
  Trash2,
  Save,
  ShieldAlert,
  X,
} from 'lucide-react';

const API_BASE = window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

export default function AdminCmsManager({ token, adminRole, showToast, onCmsUpdated }) {
  const [subTab, setSubTab] = useState('settings'); // 'settings' | 'faqs' | 'techs'
  const [settingsForm, setSettingsForm] = useState({
    brand_name: 'Rizofara Technology',
    tagline: 'Digital Roots for a Brighter Tomorrow',
    whatsapp_number: '6285692390483',
    hero_badge: 'Asistensi Kode Bersih • Bebas Plagiasi • Wireframe Balsamiq & Video Panduan',
    hero_title: 'Solusi Skripsi IT, Pembuatan',
    hero_highlight: 'Website & Chatbot AI',
    hero_subtitle:
      'Dikerjakan langsung oleh tim software engineer berpengalaman. Bukan hanya menyerahkan file kodingan, kami bantu jelaskan logika dan alur algoritma sistemnya sampai Anda benar-benar paham.',
    payment_bank_info:
      'BCA / Mandiri / Gopay / Dana / QRIS (Hubungi Admin untuk Nomor Rekening Resmi)',
  });
  const [faqs, setFaqs] = useState([]);
  const [techStacks, setTechStacks] = useState([]);
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [faqModal, setFaqModal] = useState(null);
  const [techModal, setTechModal] = useState(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (token) {
      fetchCmsAdminData();
      if (adminRole === 'superadmin') {
        fetchBackups();
      }
    }
  }, [token, adminRole]);

  const fetchBackups = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cms/backups`, authHeaders);
      setBackups(res.data || []);
    } catch (err) {
      // Abaikan jika bukan superadmin
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/cms/backups`, {}, authHeaders);
      showToast('success', `Snapshot database (${res.data.filename}) berhasil dibuat.`);
      fetchBackups();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal membuat backup database.');
    } finally {
      setBackupLoading(false);
    }
  };

  const fetchCmsAdminData = async () => {
    setLoading(true);
    try {
      const [setRes, faqRes, techRes] = await Promise.all([
        axios.get(`${API_BASE}/cms/settings`, authHeaders),
        axios.get(`${API_BASE}/cms/faqs`, authHeaders),
        axios.get(`${API_BASE}/cms/tech-stacks`, authHeaders),
      ]);

      const mapObj = {};
      (setRes.data || []).forEach((row) => {
        mapObj[row.key] = row.value;
      });
      setSettingsForm((prev) => ({ ...prev, ...mapObj }));
      setFaqs(faqRes.data || []);
      setTechStacks(techRes.data || []);
    } catch (err) {
      showToast('error', 'Gagal memuat data CMS & Pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 1. HANDLER SIMPAN SITE SETTINGS (Modul M2.A)
  // =====================================================
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API_BASE}/cms/settings`,
        { settings: settingsForm },
        authHeaders
      );
      setSettingsForm((prev) => ({ ...prev, ...res.data }));
      showToast('success', 'Pengaturan Profil Bisnis & Hero berhasil disimpan.');
      if (onCmsUpdated) onCmsUpdated();
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.detail || 'Gagal menyimpan pengaturan (Hanya Superadmin).'
      );
    }
  };

  // =====================================================
  // 2. HANDLER CRUD FAQ (Modul M11)
  // =====================================================
  const openCreateFaq = () => {
    setFaqModal({
      isEdit: false,
      question: '',
      answer: '',
      category: 'umum',
      is_published: true,
      display_order: faqs.length + 1,
    });
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    try {
      if (faqModal.isEdit) {
        await axios.patch(`${API_BASE}/cms/faqs/${faqModal.id}`, faqModal, authHeaders);
        showToast('success', 'FAQ berhasil diperbarui!');
      } else {
        await axios.post(`${API_BASE}/cms/faqs`, faqModal, authHeaders);
        showToast('success', 'FAQ baru berhasil ditambahkan!');
      }
      setFaqModal(null);
      fetchCmsAdminData();
      if (onCmsUpdated) onCmsUpdated();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan FAQ.');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Hapus item FAQ ini?')) return;
    try {
      await axios.delete(`${API_BASE}/cms/faqs/${id}`, authHeaders);
      showToast('success', 'FAQ dihapus.');
      fetchCmsAdminData();
      if (onCmsUpdated) onCmsUpdated();
    } catch (err) {
      showToast('error', 'Gagal menghapus FAQ.');
    }
  };

  // =====================================================
  // 3. HANDLER CRUD TECH STACK (Modul M11)
  // =====================================================
  const openCreateTech = () => {
    setTechModal({
      isEdit: false,
      name: '',
      emoji: 'CODE',
      color: 'text-teal-400',
      is_highlighted: false,
      is_published: true,
      display_order: techStacks.length + 1,
    });
  };

  const handleSaveTech = async (e) => {
    e.preventDefault();
    try {
      if (techModal.isEdit) {
        await axios.patch(
          `${API_BASE}/cms/tech-stacks/${techModal.id}`,
          techModal,
          authHeaders
        );
        showToast('success', 'Tech Stack berhasil diperbarui.');
      } else {
        await axios.post(`${API_BASE}/cms/tech-stacks`, techModal, authHeaders);
        showToast('success', 'Tech Stack baru berhasil ditambahkan.');
      }
      setTechModal(null);
      fetchCmsAdminData();
      if (onCmsUpdated) onCmsUpdated();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan Tech Stack.');
    }
  };

  const handleDeleteTech = async (id) => {
    if (!window.confirm('Hapus item Tech Stack ini?')) return;
    try {
      await axios.delete(`${API_BASE}/cms/tech-stacks/${id}`, authHeaders);
      showToast('success', 'Tech Stack dihapus.');
      fetchCmsAdminData();
      if (onCmsUpdated) onCmsUpdated();
    } catch (err) {
      showToast('error', 'Gagal menghapus Tech Stack.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Pengaturan Identitas Bisnis, FAQ & Tech Stack
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ubah identitas brand, nomor WhatsApp utama, teks Hero, daftar FAQ, dan daftar keahlian teknologi secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              subTab === 'settings'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Profil Bisnis & Hero
          </button>

          <button
            onClick={() => setSubTab('faqs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              subTab === 'faqs'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            FAQ ({faqs.length})
          </button>

          <button
            onClick={() => setSubTab('techs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              subTab === 'techs'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Tech Stack ({techStacks.length})
          </button>
        </div>
      </div>

      {/* =====================================================
          SUB-TAB 1: PROFIL BISNIS & HERO SETTINGS (M2.A)
          ===================================================== */}
      {subTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          {adminRole !== 'superadmin' && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Perhatian: Sesuai aturan hak akses (RBAC), hanya akun ber-role <b>superadmin</b> yang dapat menyimpan perubahan Pengaturan Bisnis global.
              </span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Brand Utama *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.brand_name || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, brand_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tagline / Slogan Header *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.tagline || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, tagline: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nomor WhatsApp Utama (Otomatis 628xx) *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.whatsapp_number || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Lencana Atas Hero (Hero Badge)
              </label>
              <input
                type="text"
                value={settingsForm.hero_badge || ''}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, hero_badge: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Judul Hero (Teks Putih)
                </label>
                <input
                  type="text"
                  value={settingsForm.hero_title || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, hero_title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Judul Hero Highlight (Teks Gradien)
                </label>
                <input
                  type="text"
                  value={settingsForm.hero_highlight || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, hero_highlight: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Paragraf Sub-Judul Hero
              </label>
              <textarea
                rows={2}
                value={settingsForm.hero_subtitle || ''}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Info Metode Pembayaran / Rekening Resmi
              </label>
              <input
                type="text"
                value={settingsForm.payment_bank_info || ''}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, payment_bank_info: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={adminRole !== 'superadmin'}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" />
                Simpan Pengaturan Situs
              </button>
            </div>
          </form>

          {/* Panel Backup Database SQLite (Fase 6 - PRD §11) */}
          {adminRole === 'superadmin' && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Cadangan Database (Hot-Backup SQLite)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Simpan salinan utuh database ke folder <code className="text-slate-700">storage/backups/</code> dengan retensi otomatis maksimal 14 snapshot terbaru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={backupLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-emerald-700 font-bold text-xs transition shrink-0"
                >
                  {backupLoading ? 'Membuat Snapshot...' : 'Buat Snapshot Backup Sekarang'}
                </button>
              </div>

              {backups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {backups.slice(0, 6).map((b) => (
                    <div
                      key={b.filename}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="font-mono text-[11px] text-slate-800 truncate">
                          {b.filename}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {(b.size_bytes / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 shrink-0">
                        Tersimpan
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Belum ada file snapshot backup yang dibuat.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          SUB-TAB 2: CRUD FAQ (Modul M11)
          ===================================================== */}
      {subTab === 'faqs' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Daftar Pertanyaan Umum (FAQ)</h4>
              <p className="text-xs text-slate-500">
                Kelola pertanyaan & jawaban yang tampil di bagian bawah landing page.
              </p>
            </div>
            <button
              onClick={openCreateFaq}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tambah FAQ
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-emerald-200">
                      {f.category}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{f.question}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.answer}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setFaqModal({ ...f, isEdit: true })}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(f.id)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-red-900/60 text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================
          SUB-TAB 3: CRUD TECH STACK (Modul M11)
          ===================================================== */}
      {subTab === 'techs' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Badge Bahasa Pemrograman & Tools</h4>
              <p className="text-xs text-slate-500">
                Daftar keahlian teknologi yang tampil di pita bawah Hero.
              </p>
            </div>
            <button
              onClick={openCreateTech}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tambah Tech Stack
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {techStacks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-white border border-slate-200 text-slate-700">
                    {(t.emoji || '').replace(/[^\x20-\x7E]/g, '').trim() || 'CODE'}
                  </span>
                  <div>
                    <div className={`text-xs font-bold ${t.color}`}>{t.name}</div>
                    <div className="text-[10px] text-slate-500">
                      Urutan #{t.display_order} {t.is_highlighted ? '• Highlighted' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTechModal({ ...t, isEdit: true })}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTech(t.id)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-red-900/60 text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL FAQ */}
      {faqModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Sticky dengan Tombol X Permanen di Atas */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {faqModal.isEdit ? 'Edit Pertanyaan FAQ' : 'Tambah Pertanyaan FAQ'}
                </h4>
                <p className="text-xs text-slate-500">
                  Tanya-jawab seputar pengerjaan, bab, revisi & garansi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFaqModal(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSaveFaq} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Pertanyaan *</label>
                <input
                  type="text"
                  required
                  value={faqModal.question}
                  onChange={(e) => setFaqModal({ ...faqModal, question: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Jawaban *</label>
                <textarea
                  rows={3}
                  required
                  value={faqModal.answer}
                  onChange={(e) => setFaqModal({ ...faqModal, answer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Kategori</label>
                  <select
                    value={faqModal.category}
                    onChange={(e) => setFaqModal({ ...faqModal, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  >
                    <option value="umum">Umum</option>
                    <option value="pembayaran">Pembayaran</option>
                    <option value="revisi">Revisi</option>
                    <option value="privasi">Privasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Urutan Tampil</label>
                  <input
                    type="number"
                    value={faqModal.display_order}
                    onChange={(e) =>
                      setFaqModal({ ...faqModal, display_order: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setFaqModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold"
                >
                  Simpan FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

      {/* MODAL TECH STACK */}
      {techModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Sticky dengan Tombol X Permanen di Atas */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {techModal.isEdit ? 'Edit Tech Stack' : 'Tambah Tech Stack'}
                </h4>
                <p className="text-xs text-slate-500">
                  Badge teknologi, bahasa pemrograman & framework
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTechModal(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSaveTech} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Kode Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="PY"
                    value={techModal.emoji}
                    onChange={(e) => setTechModal({ ...techModal, emoji: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 text-center font-mono uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Nama Bahasa / Tool *</label>
                  <input
                    type="text"
                    required
                    value={techModal.name}
                    onChange={(e) => setTechModal({ ...techModal, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Warna Teks</label>
                  <select
                    value={techModal.color}
                    onChange={(e) => setTechModal({ ...techModal, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  >
                    <option value="text-teal-400">Teal</option>
                    <option value="text-sky-400">Sky Blue</option>
                    <option value="text-indigo-400">Indigo</option>
                    <option value="text-emerald-400">Emerald</option>
                    <option value="text-amber-400">Amber</option>
                    <option value="text-red-400">Red</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={techModal.display_order}
                    onChange={(e) =>
                      setTechModal({ ...techModal, display_order: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-slate-800 pt-1">
                <input
                  type="checkbox"
                  checked={techModal.is_highlighted}
                  onChange={(e) =>
                    setTechModal({ ...techModal, is_highlighted: e.target.checked })
                  }
                />
                <span>Beri border highlight khusus (seperti Balsamiq)</span>
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTechModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
