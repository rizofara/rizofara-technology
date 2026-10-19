import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit3,
  Trash2,
  Layers,
  Sliders,
  PackagePlus,
  CheckCircle2,
  XCircle,
  Save,
  X,
} from 'lucide-react';

const API_BASE = window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

export default function AdminPricingManager({ token, showToast, onConfigUpdated }) {
  const [subTab, setSubTab] = useState('services'); // 'services' | 'factors' | 'addons'
  const [services, setServices] = useState([]);
  const [factors, setFactors] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State untuk Layanan
  const [serviceModal, setServiceModal] = useState(null); // null atau objek form
  // Modal State untuk Faktor Pengali
  const [factorModal, setFactorModal] = useState(null);
  // Modal State untuk Add-on
  const [addonModal, setAddonModal] = useState(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    fetchAllPricingData();
  }, [token]);

  const fetchAllPricingData = async () => {
    setLoading(true);
    try {
      const [svcRes, facRes, addRes] = await Promise.all([
        axios.get(`${API_BASE}/services/admin/all`, authHeaders),
        axios.get(`${API_BASE}/services/factors/all`, authHeaders),
        axios.get(`${API_BASE}/services/addons/all`, authHeaders),
      ]);
      setServices(svcRes.data);
      setFactors(facRes.data);
      setAddons(addRes.data);
      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      showToast('error', 'Gagal memuat konfigurasi layanan & harga.');
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // 1. HANDLER CRUD LAYANAN (SERVICES)
  // ===================================================================
  const openCreateService = () => {
    setServiceModal({
      isEdit: false,
      slug: '',
      name: '',
      short_label: '',
      description: '',
      featuresText: 'Full Source Code\nDokumentasi & Panduan Instalasi',
      icon: 'Code2',
      color: 'teal',
      category: 'akademik',
      base_price_min: 1000000,
      base_price_max: 2500000,
      standard_days: 14,
      min_days: 3,
      max_days: 60,
      is_active: true,
      display_order: services.length + 1,
    });
  };

  const openEditService = (s) => {
    setServiceModal({
      isEdit: true,
      id: s.id,
      slug: s.slug,
      name: s.name,
      short_label: s.short_label,
      description: s.description,
      featuresText: (s.features || []).join('\n'),
      icon: s.icon || 'Code2',
      color: s.color || 'teal',
      category: s.category || 'akademik',
      base_price_min: s.base_price_min,
      base_price_max: s.base_price_max,
      standard_days: s.standard_days,
      min_days: s.min_days,
      max_days: s.max_days,
      is_active: s.is_active,
      display_order: s.display_order,
    });
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const payload = {
      slug: serviceModal.slug,
      name: serviceModal.name,
      short_label: serviceModal.short_label,
      description: serviceModal.description,
      features: serviceModal.featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      icon: serviceModal.icon,
      color: serviceModal.color,
      category: serviceModal.category,
      base_price_min: parseInt(serviceModal.base_price_min) || 0,
      base_price_max: parseInt(serviceModal.base_price_max) || 0,
      standard_days: parseInt(serviceModal.standard_days) || 14,
      min_days: parseInt(serviceModal.min_days) || 1,
      max_days: parseInt(serviceModal.max_days) || 60,
      is_active: serviceModal.is_active,
      display_order: parseInt(serviceModal.display_order) || 0,
    };

    try {
      if (serviceModal.isEdit) {
        await axios.patch(`${API_BASE}/services/${serviceModal.id}`, payload, authHeaders);
        showToast('success', `Layanan "${payload.name}" berhasil diperbarui!`);
      } else {
        await axios.post(`${API_BASE}/services/`, payload, authHeaders);
        showToast('success', `Layanan "${payload.name}" berhasil ditambahkan!`);
      }
      setServiceModal(null);
      fetchAllPricingData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan layanan.');
    }
  };

  const handleToggleServiceActive = async (s) => {
    try {
      await axios.patch(
        `${API_BASE}/services/${s.id}`,
        { is_active: !s.is_active },
        authHeaders
      );
      showToast(
        'success',
        `Layanan "${s.name}" ${!s.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      fetchAllPricingData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal mengubah status layanan.');
    }
  };

  const handleDeleteService = async (s) => {
    if (!window.confirm(`Hapus layanan "${s.name}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/services/${s.id}`, authHeaders);
      showToast('success', `Layanan "${s.name}" berhasil dihapus.`);
      fetchAllPricingData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menghapus layanan.');
    }
  };

  // ===================================================================
  // 2. HANDLER CRUD FAKTOR PENGALI (COMPLEXITY & PLATFORM)
  // ===================================================================
  const openCreateFactor = (type = 'complexity') => {
    setFactorModal({
      isEdit: false,
      factor_type: type,
      code: '',
      label: '',
      description: '',
      multiplier: 1.2,
      applicable_services: [],
      is_default: false,
      is_active: true,
      display_order: factors.filter((f) => f.factor_type === type).length + 1,
    });
  };

  const openEditFactor = (f) => {
    setFactorModal({
      isEdit: true,
      id: f.id,
      factor_type: f.factor_type,
      code: f.code,
      label: f.label,
      description: f.description || '',
      multiplier: f.multiplier,
      applicable_services: f.applicable_services || [],
      is_default: f.is_default,
      is_active: f.is_active,
      display_order: f.display_order,
    });
  };

  const handleSaveFactor = async (e) => {
    e.preventDefault();
    const payload = {
      factor_type: factorModal.factor_type,
      code: factorModal.code,
      label: factorModal.label,
      description: factorModal.description || null,
      multiplier: parseFloat(factorModal.multiplier) || 1.0,
      applicable_services:
        factorModal.applicable_services && factorModal.applicable_services.length > 0
          ? factorModal.applicable_services
          : null,
      is_default: factorModal.is_default,
      is_active: factorModal.is_active,
      display_order: parseInt(factorModal.display_order) || 0,
    };

    try {
      if (factorModal.isEdit) {
        await axios.patch(`${API_BASE}/services/factors/${factorModal.id}`, payload, authHeaders);
        showToast('success', `Faktor "${payload.label}" berhasil diperbarui!`);
      } else {
        await axios.post(`${API_BASE}/services/factors`, payload, authHeaders);
        showToast('success', `Faktor "${payload.label}" berhasil ditambahkan!`);
      }
      setFactorModal(null);
      fetchAllPricingData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan faktor pengali.');
    }
  };

  const handleDeleteFactor = async (f) => {
    if (!window.confirm(`Hapus faktor pengali "${f.label}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/services/factors/${f.id}`, authHeaders);
      showToast('success', `Faktor "${f.label}" berhasil dihapus.`);
      fetchAllPricingData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menghapus faktor.');
    }
  };

  // ===================================================================
  // 3. HANDLER CRUD ADD-ONS / FASILITAS TAMBAHAN
  // ===================================================================
  const openCreateAddon = () => {
    setAddonModal({
      isEdit: false,
      code: '',
      label: '',
      description: '',
      price_type: 'fixed',
      price_min: 150000,
      price_max: 300000,
      benefit_text: '',
      applicable_services: [],
      is_default_checked: false,
      is_active: true,
      display_order: addons.length + 1,
    });
  };

  const openEditAddon = (a) => {
    setAddonModal({
      isEdit: true,
      id: a.id,
      code: a.code,
      label: a.label,
      description: a.description || '',
      price_type: a.price_type || 'fixed',
      price_min: a.price_min,
      price_max: a.price_max,
      benefit_text: a.benefit_text,
      applicable_services: a.applicable_services || [],
      is_default_checked: a.is_default_checked,
      is_active: a.is_active,
      display_order: a.display_order,
    });
  };

  const handleSaveAddon = async (e) => {
    e.preventDefault();
    const payload = {
      code: addonModal.code,
      label: addonModal.label,
      description: addonModal.description || null,
      price_type: addonModal.price_type,
      price_min: parseInt(addonModal.price_min) || 0,
      price_max: parseInt(addonModal.price_max) || 0,
      benefit_text: addonModal.benefit_text,
      applicable_services:
        addonModal.applicable_services && addonModal.applicable_services.length > 0
          ? addonModal.applicable_services
          : null,
      is_default_checked: addonModal.is_default_checked,
      is_active: addonModal.is_active,
      display_order: parseInt(addonModal.display_order) || 0,
    };

    try {
      if (addonModal.isEdit) {
        await axios.patch(`${API_BASE}/services/addons/${addonModal.id}`, payload, authHeaders);
        showToast('success', `Add-on "${payload.label}" berhasil diperbarui!`);
      } else {
        await axios.post(`${API_BASE}/services/addons`, payload, authHeaders);
        showToast('success', `Add-on "${payload.label}" berhasil ditambahkan!`);
      }
      setAddonModal(null);
      fetchAllPricingData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan add-on.');
    }
  };

  const handleDeleteAddon = async (a) => {
    if (!window.confirm(`Hapus add-on "${a.label}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/services/addons/${a.id}`, authHeaders);
      showToast('success', `Add-on "${a.label}" berhasil dihapus.`);
      fetchAllPricingData();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menghapus add-on.');
    }
  };

  const toggleApplicableSlug = (currentList, slug, setter, modalState) => {
    const exists = currentList.includes(slug);
    const updated = exists
      ? currentList.filter((item) => item !== slug)
      : [...currentList, slug];
    setter({ ...modalState, applicable_services: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-extrabold text-white">
            Manajemen Layanan, Harga & Kalkulator Dinamis
          </h2>
          <p className="text-xs text-slate-400">
            Seluruh perubahan harga dasar, pengali kompleksitas/platform, dan add-on langsung berlaku di Kalkulator & Katalog secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubTab('services')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              subTab === 'services'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Katalog Layanan ({services.length})
          </button>
          <button
            onClick={() => setSubTab('factors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              subTab === 'factors'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Faktor Pengali ({factors.length})
          </button>
          <button
            onClick={() => setSubTab('addons')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              subTab === 'addons'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            Add-on Tambahan ({addons.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">
          Memuat konfigurasi layanan & harga...
        </div>
      ) : (
        <>
          {/* SUB-TAB 1: KATALOG LAYANAN */}
          {subTab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={openCreateService}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Layanan Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition ${
                      s.is_active
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-slate-900/40 border-slate-800/50 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-bold">
                              slug: {s.slug}
                            </span>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                              {s.category}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                s.is_active
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-red-500/15 text-red-400'
                              }`}
                            >
                              {s.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-base text-white mt-2">
                            {s.name}{' '}
                            <span className="text-xs font-normal text-slate-400">
                              ({s.short_label})
                            </span>
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditService(s)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400"
                            title="Edit Layanan & Harga"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(s)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400"
                            title="Hapus Layanan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{s.description}</p>

                      <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500">Rentang Harga Dasar</div>
                          <div className="font-extrabold text-teal-400">
                            Rp {s.base_price_min.toLocaleString('id-ID')} – Rp{' '}
                            {s.base_price_max.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Durasi Pengerjaan</div>
                          <div className="font-bold text-slate-200">
                            Standar {s.standard_days} hr{' '}
                            <span className="text-slate-400 font-normal">
                              (Min {s.min_days} – Max {s.max_days} hr)
                            </span>
                          </div>
                        </div>
                      </div>

                      {s.features?.length > 0 && (
                        <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
                          {s.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="text-teal-400">•</span> {feat}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Urutan tampil: #{s.display_order}</span>
                      <button
                        onClick={() => handleToggleServiceActive(s)}
                        className="text-xs font-semibold text-slate-300 hover:text-teal-400"
                      >
                        {s.is_active ? 'Nonaktifkan Layanan' : 'Aktifkan Layanan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: FAKTOR PENGALI (KOMPLEKSITAS & PLATFORM) */}
          {subTab === 'factors' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['complexity', 'platform'].map((type) => {
                const list = factors.filter((f) => f.factor_type === type);
                return (
                  <div
                    key={type}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                          {type === 'complexity'
                            ? 'Faktor Tingkat Kompleksitas'
                            : 'Faktor Platform Teknologi'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Pengali terhadap harga dasar layanan (`multiplier`).
                        </p>
                      </div>
                      <button
                        onClick={() => openCreateFactor(type)}
                        className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {list.map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{f.label}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300">
                                {f.code}
                              </span>
                              <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30">
                                {f.multiplier}x
                              </span>
                              {f.is_default && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                                  Default
                                </span>
                              )}
                              {!f.is_active && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            {f.description && (
                              <p className="text-[11px] text-slate-400 mt-1">{f.description}</p>
                            )}
                            {f.applicable_services?.length > 0 && (
                              <div className="text-[10px] text-amber-400 mt-1">
                                Khusus layanan: {f.applicable_services.join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openEditFactor(f)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFactor(f)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUB-TAB 3: ADD-ON / FASILITAS TAMBAHAN */}
          {subTab === 'addons' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={openCreateAddon}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Add-on Kalkulator
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addons.map((a) => (
                  <div
                    key={a.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-bold">
                              code: {a.code}
                            </span>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                              {a.price_type}
                            </span>
                            {a.is_default_checked && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
                                Tercentang Awal
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-sm text-white mt-2">{a.label}</h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditAddon(a)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddon(a)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {a.description && (
                        <p className="text-xs text-slate-400 mt-1">{a.description}</p>
                      )}

                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="text-teal-400 font-bold">
                          {a.price_type === 'percent'
                            ? `+${a.price_min}% s/d +${a.price_max}% dari Subtotal`
                            : `+Rp ${a.price_min.toLocaleString('id-ID')} s/d +Rp ${a.price_max.toLocaleString('id-ID')}`}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-500">Teks Benefit:</span> "{a.benefit_text}"
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Berlaku untuk:{' '}
                          {a.applicable_services?.length > 0
                            ? a.applicable_services.join(', ')
                            : 'Semua Layanan'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL FORM LAYANAN */}
      {serviceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => setServiceModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-lg text-white mb-4">
              {serviceModal.isEdit ? 'Edit Layanan & Harga' : 'Tambah Layanan Baru'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slug Unik *</label>
                  <input
                    type="text"
                    required
                    value={serviceModal.slug}
                    onChange={(e) => setServiceModal({ ...serviceModal, slug: e.target.value })}
                    placeholder="mobile_app"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Label Pendek *</label>
                  <input
                    type="text"
                    required
                    value={serviceModal.short_label}
                    onChange={(e) =>
                      setServiceModal({ ...serviceModal, short_label: e.target.value })
                    }
                    placeholder="Aplikasi Mobile"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori *</label>
                  <select
                    value={serviceModal.category}
                    onChange={(e) =>
                      setServiceModal({ ...serviceModal, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="akademik">Akademik</option>
                    <option value="bisnis">Bisnis / Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Lengkap Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={serviceModal.name}
                  onChange={(e) => setServiceModal({ ...serviceModal, name: e.target.value })}
                  placeholder="Jasa Pembuatan Aplikasi Mobile Android & iOS"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Harga Dasar Min (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceModal.base_price_min}
                    onChange={(e) =>
                      setServiceModal({ ...serviceModal, base_price_min: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Harga Dasar Max (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceModal.base_price_max}
                    onChange={(e) =>
                      setServiceModal({ ...serviceModal, base_price_max: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Hari *</label>
                  <input
                    type="number"
                    required
                    value={serviceModal.min_days}
                    onChange={(e) =>
                      setServiceModal({ ...serviceModal, min_days: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Standar Hari (Normal) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceModal.standard_days}
                    onChange={(e) =>
                      setServiceModal({ ...serviceModal, standard_days: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Hari *</label>
                  <input
                    type="number"
                    required
                    value={serviceModal.max_days}
                    onChange={(e) =>
                      setServiceModal({ ...serviceModal, max_days: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deskripsi *</label>
                <textarea
                  rows={2}
                  required
                  value={serviceModal.description}
                  onChange={(e) =>
                    setServiceModal({ ...serviceModal, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Daftar Fitur Katalog (1 baris = 1 poin fitur)
                </label>
                <textarea
                  rows={3}
                  value={serviceModal.featuresText}
                  onChange={(e) =>
                    setServiceModal({ ...serviceModal, featuresText: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Konfigurasi Layanan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM FAKTOR PENGALI */}
      {factorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setFactorModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-lg text-white mb-4">
              {factorModal.isEdit ? 'Edit Faktor Pengali' : 'Tambah Faktor Pengali'}
            </h3>

            <form onSubmit={handleSaveFactor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipe Faktor</label>
                  <select
                    value={factorModal.factor_type}
                    onChange={(e) =>
                      setFactorModal({ ...factorModal, factor_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="complexity">Kompleksitas</option>
                    <option value="platform">Platform</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode Unik *</label>
                  <input
                    type="text"
                    required
                    value={factorModal.code}
                    onChange={(e) => setFactorModal({ ...factorModal, code: e.target.value })}
                    placeholder="blockchain"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Label Tampilan *</label>
                  <input
                    type="text"
                    required
                    value={factorModal.label}
                    onChange={(e) => setFactorModal({ ...factorModal, label: e.target.value })}
                    placeholder="Web3 / Blockchain"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pengali (Multiplier) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={factorModal.multiplier}
                    onChange={(e) =>
                      setFactorModal({ ...factorModal, multiplier: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={factorModal.description}
                  onChange={(e) =>
                    setFactorModal({ ...factorModal, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Berlaku untuk Layanan (Kosongkan = Semua Layanan)
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {services.map((s) => (
                    <label
                      key={s.slug}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(factorModal.applicable_services || []).includes(s.slug)}
                        onChange={() =>
                          toggleApplicableSlug(
                            factorModal.applicable_services || [],
                            s.slug,
                            setFactorModal,
                            factorModal
                          )
                        }
                      />
                      <span>{s.short_label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factorModal.is_default}
                    onChange={(e) =>
                      setFactorModal({ ...factorModal, is_default: e.target.checked })
                    }
                  />
                  <span>Jadikan Default</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factorModal.is_active}
                    onChange={(e) =>
                      setFactorModal({ ...factorModal, is_active: e.target.checked })
                    }
                  />
                  <span>Status Aktif</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs mt-2"
              >
                Simpan Faktor Pengali
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM ADD-ON */}
      {addonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setAddonModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-lg text-white mb-4">
              {addonModal.isEdit ? 'Edit Add-on Kalkulator' : 'Tambah Add-on Kalkulator'}
            </h3>

            <form onSubmit={handleSaveAddon} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode Add-on *</label>
                  <input
                    type="text"
                    required
                    value={addonModal.code}
                    onChange={(e) => setAddonModal({ ...addonModal, code: e.target.value })}
                    placeholder="ppt_sidang"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipe Biaya *</label>
                  <select
                    value={addonModal.price_type}
                    onChange={(e) =>
                      setAddonModal({ ...addonModal, price_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="fixed">Nominal Tetap (Rupiah)</option>
                    <option value="percent">Persentase Subtotal (%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama / Label Checkbox di Kalkulator *
                </label>
                <input
                  type="text"
                  required
                  value={addonModal.label}
                  onChange={(e) => setAddonModal({ ...addonModal, label: e.target.value })}
                  placeholder="Slide PPT Sidang & Simulasi Tanya-Jawab"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {addonModal.price_type === 'percent' ? 'Persen Min (%)' : 'Biaya Min (Rp)'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={addonModal.price_min}
                    onChange={(e) => setAddonModal({ ...addonModal, price_min: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {addonModal.price_type === 'percent' ? 'Persen Max (%)' : 'Biaya Max (Rp)'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={addonModal.price_max}
                    onChange={(e) => setAddonModal({ ...addonModal, price_max: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Teks Benefit ("Yang Sudah Termasuk" saat dipilih) *
                </label>
                <input
                  type="text"
                  required
                  value={addonModal.benefit_text}
                  onChange={(e) =>
                    setAddonModal({ ...addonModal, benefit_text: e.target.value })
                  }
                  placeholder="Pembuatan Slide PPT Sidang + 1x Sesi Simulasi"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Berlaku untuk Layanan (Kosongkan = Semua Layanan)
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {services.map((s) => (
                    <label
                      key={s.slug}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(addonModal.applicable_services || []).includes(s.slug)}
                        onChange={() =>
                          toggleApplicableSlug(
                            addonModal.applicable_services || [],
                            s.slug,
                            setAddonModal,
                            addonModal
                          )
                        }
                      />
                      <span>{s.short_label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addonModal.is_default_checked}
                    onChange={(e) =>
                      setAddonModal({ ...addonModal, is_default_checked: e.target.checked })
                    }
                  />
                  <span>Tercentang Otomatis di Awal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addonModal.is_active}
                    onChange={(e) =>
                      setAddonModal({ ...addonModal, is_active: e.target.checked })
                    }
                  />
                  <span>Status Aktif</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs mt-2"
              >
                Simpan Add-on Kalkulator
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
