import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Lock,
  LogOut,
  User,
  Users,
  ClipboardList,
  ShieldCheck,
  KeyRound,
  Save,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Calculator,
  Search,
  Star,
  Settings,
  X,
} from 'lucide-react';
import AdminPricingManager from './AdminPricingManager';
import AdminOrderDetailModal from './AdminOrderDetailModal';
import AdminShowcaseManager from './AdminShowcaseManager';
import AdminCmsManager from './AdminCmsManager';

const API_BASE = window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

export default function AdminPortal({
  onBackToPublic,
  onConfigUpdated,
  onShowcaseUpdated,
  onCmsUpdated,
}) {
  // State Autentikasi
  const [token, setToken] = useState(() => localStorage.getItem('rizofara_token') || '');
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('rizofara_admin');
    return saved ? JSON.parse(saved) : null;
  });

  // State Form Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Navigasi Menu Admin ('orders' | 'pricing' | 'showcase' | 'cms' | 'profile' | 'users')
  const [adminTab, setAdminTab] = useState('orders');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // State Statistik Dashboard (Modul M12)
  const [dashboardSummary, setDashboardSummary] = useState(null);

  // State Kelola Order (Terproteksi JWT)
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);

  // State CRUD Profil Saya
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    title: '',
    bio: '',
    whatsapp: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // State Ganti Password
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwSaving, setPwSaving] = useState(false);

  // State Manajemen Tim Admin (RBAC)
  const [teamUsers, setTeamUsers] = useState([]);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    title: '',
    whatsapp: '',
  });
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const showToast = (arg1, arg2 = 'success') => {
    if (arg1 === 'success' || arg1 === 'error') {
      setFeedback({ type: arg1, message: arg2 });
    } else {
      setFeedback({ type: arg2 === 'error' ? 'error' : 'success', message: arg1 });
    }
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const fetchDashboardSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cms/dashboard-summary`, authHeaders);
      setDashboardSummary(res.data);
    } catch (err) {
      // Abaikan jika gagal
    }
  };

  // Sinkronisasi profil saat sudah login
  useEffect(() => {
    if (token) {
      fetchMyProfile();
      fetchOrders();
      fetchTeamUsers();
      fetchDashboardSummary();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      const { access_token, admin } = res.data;
      localStorage.setItem('rizofara_token', access_token);
      localStorage.setItem('rizofara_admin', JSON.stringify(admin));
      setToken(access_token);
      setAdminUser(admin);
      setProfileForm({
        name: admin.name || '',
        email: admin.email || '',
        title: admin.title || '',
        bio: admin.bio || '',
        whatsapp: admin.whatsapp || '',
      });
    } catch (err) {
      setLoginError(
        err.response?.data?.detail || 'Gagal login. Periksa kembali email & password Anda.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rizofara_token');
    localStorage.removeItem('rizofara_admin');
    setToken('');
    setAdminUser(null);
  };

  const fetchMyProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, authHeaders);
      setAdminUser(res.data);
      localStorage.setItem('rizofara_admin', JSON.stringify(res.data));
      setProfileForm({
        name: res.data.name || '',
        email: res.data.email || '',
        title: res.data.title || '',
        bio: res.data.bio || '',
        whatsapp: res.data.whatsapp || '',
      });
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchOrders = async (filterStatus = statusFilter, q = searchQuery) => {
    setOrdersLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (q && q.trim()) params.q = q.trim();
      const res = await axios.get(`${API_BASE}/orders/`, {
        ...authHeaders,
        params,
      });
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchTeamUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/users`, authHeaders);
      setTeamUsers(res.data);
    } catch (err) {
      // Abaikan jika gagal
    }
  };

  // Handler CRUD Update Order Status & Progres
  const handleSaveOrderUpdate = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await axios.patch(
        `${API_BASE}/orders/${editingOrder.id}/status`,
        {
          status: editingOrder.status,
          progress_percent: parseInt(editingOrder.progress_percent) || 0,
          dp_amount: parseInt(editingOrder.dp_amount) || 0,
          demo_url: editingOrder.demo_url || null,
          assigned_to: editingOrder.assigned_to || null,
          internal_notes: editingOrder.internal_notes || null,
        },
        authHeaders
      );
      showToast('success', `Order ${editingOrder.order_code} berhasil diperbarui!`);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal memperbarui order.');
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Hapus order ${order.order_code} milik ${order.client_name}?`)) return;
    try {
      await axios.delete(`${API_BASE}/orders/${order.id}`, authHeaders);
      showToast('success', `Order ${order.order_code} berhasil dihapus.`);
      fetchOrders();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menghapus order.');
    }
  };

  // Handler CRUD Update Profil Saya
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await axios.patch(`${API_BASE}/auth/me`, profileForm, authHeaders);
      setAdminUser(res.data);
      localStorage.setItem('rizofara_admin', JSON.stringify(res.data));
      showToast('success', 'Profil Anda berhasil diperbarui!');
      fetchTeamUsers();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handler Ganti Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    try {
      await axios.post(`${API_BASE}/auth/change-password`, pwForm, authHeaders);
      showToast('success', 'Password berhasil diperbarui!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal mengganti password.');
    } finally {
      setPwSaving(false);
    }
  };

  // Handler Tambah Admin Baru (Superadmin)
  const handleCreateAdminUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/auth/users`, newAdminForm, authHeaders);
      showToast('success', `Akun admin ${newAdminForm.name} berhasil ditambahkan!`);
      setShowAddAdminModal(false);
      setNewAdminForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        title: '',
        whatsapp: '',
      });
      fetchTeamUsers();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menambah akun admin.');
    }
  };

  const handleToggleAdminActive = async (u) => {
    try {
      await axios.patch(
        `${API_BASE}/auth/users/${u.id}`,
        { is_active: !u.is_active },
        authHeaders
      );
      showToast(
        'success',
        `Status akun ${u.name} diubah menjadi ${!u.is_active ? 'Aktif' : 'Nonaktif'}.`
      );
      fetchTeamUsers();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal mengubah status admin.');
    }
  };

  const handleDeleteAdminUser = async (u) => {
    if (!window.confirm(`Hapus akun admin ${u.name} (${u.email})?`)) return;
    try {
      await axios.delete(`${API_BASE}/auth/users/${u.id}`, authHeaders);
      showToast('success', `Akun ${u.name} berhasil dihapus.`);
      fetchTeamUsers();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menghapus akun admin.');
    }
  };

  // --- TAMPILAN 1: BELUM LOGIN (HALAMAN LOGIN ADMIN) ---
  if (!token || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="Rizofara Logo"
                className="w-10 h-10 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1"
              />
              <div>
                <h2 className="font-extrabold text-lg text-white">Portal Admin</h2>
                <p className="text-[11px] text-slate-400">Rizofara Technology Management</p>
              </div>
            </div>
            <button
              onClick={onBackToPublic}
              className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Beranda
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Admin</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@rizofara.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition"
            >
              {loginLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Dashboard Admin'}
            </button>
          </form>

          {/* Info Akun Default Seeder untuk Belajar/Testing */}
          <div className="mt-6 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-teal-400">Akun Default Co-Founder:</div>
            <div>• Superadmin: <code className="text-slate-200">admin@rizofara.com</code> / <code className="text-slate-200">Admin123!</code></div>
            <div>• Admin Ops: <code className="text-slate-200">ops@rizofara.com</code> / <code className="text-slate-200">Admin123!</code></div>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: SUDAH LOGIN (DASHBOARD SHELL) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Topbar Admin */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Rizofara Logo"
              className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-800 p-0.5"
            />
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 font-extrabold text-xs">
              ADMIN PANEL
            </span>
            <span className="font-bold text-sm text-white hidden sm:inline">
              {adminUser.name}
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {adminUser.role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
              Lihat Website
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Notifikasi Toast */}
        {feedback.message && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-teal-950/50 border-teal-500/40 text-teal-300'
                : 'bg-red-950/50 border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Ringkasan Statistik Operasional & Keuangan */}
        {dashboardSummary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Order Aktif / Total</div>
              <div className="text-lg font-extrabold text-white mt-1">
                {dashboardSummary.active_orders}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {dashboardSummary.total_orders}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Order Selesai</div>
              <div className="text-lg font-extrabold text-emerald-300 mt-1">
                {dashboardSummary.completed_orders}{' '}
                <span className="text-[11px] font-semibold text-slate-400">
                  ({dashboardSummary.conversion_rate_percent}%)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-950/25 border border-teal-500/30">
              <div className="text-[10px] uppercase font-bold text-teal-300">Pemasukan Masuk</div>
              <div className="text-sm font-extrabold text-teal-400 mt-1.5">
                Rp {(dashboardSummary.total_verified_revenue || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30">
              <div className="text-[10px] uppercase font-bold text-amber-300">Sisa Piutang</div>
              <div className="text-sm font-extrabold text-amber-400 mt-1.5">
                Rp {(dashboardSummary.total_outstanding_receivables || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-indigo-300">Revisi Menunggu</div>
              <div className="text-lg font-extrabold text-indigo-400 mt-1">
                {dashboardSummary.pending_revisions_count}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-amber-300">Ulasan Pending</div>
              <div className="text-lg font-extrabold text-amber-400 mt-1">
                {dashboardSummary.pending_testimonials_count}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-4">
          <button
            onClick={() => setAdminTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              adminTab === 'orders'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Kelola Order ({orders.length})
          </button>

          <button
            onClick={() => setAdminTab('pricing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              adminTab === 'pricing'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Layanan & Harga
          </button>

          <button
            onClick={() => setAdminTab('showcase')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              adminTab === 'showcase'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Star className="w-4 h-4" />
            Portofolio & Testimoni
          </button>

          <button
            onClick={() => setAdminTab('cms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              adminTab === 'cms'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            CMS & Pengaturan
          </button>

          <button
            onClick={() => setAdminTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              adminTab === 'profile'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Profil Saya
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              adminTab === 'users'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Tim Admin ({teamUsers.length})
          </button>
        </div>

        {/* TAB 1: KELOLA ORDER */}
        {adminTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Daftar Order Masuk</h2>
                <p className="text-xs text-slate-400">
                  Kelola status pengerjaan, checklist milestone, buku kas pembayaran (DP/Lunas), dan balasan revisi klien.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchOrders(statusFilter, e.target.value);
                    }}
                    placeholder="Cari kode, klien, judul..."
                    className="pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    fetchOrders(e.target.value, searchQuery);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Harga Disepakati</option>
                  <option value="dp_received">DP Diterima</option>
                  <option value="in_progress">Sedang Dikerjakan</option>
                  <option value="review">Demo & Review</option>
                  <option value="revision">Revisi</option>
                  <option value="completed">Selesai</option>
                </select>
                <button
                  onClick={() => fetchOrders()}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12 text-xs text-slate-400">Memuat data order...</div>
            ) : orders.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                Belum ada data order yang sesuai filter.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Kode Order</th>
                      <th className="py-3.5 px-4">Klien & WA</th>
                      <th className="py-3.5 px-4">Layanan & Judul</th>
                      <th className="py-3.5 px-4">Tagihan / Terbayar / Sisa</th>
                      <th className="py-3.5 px-4">Status & Progres Milestone</th>
                      <th className="py-3.5 px-4">PIC</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-400">
                          {o.order_code}
                          <div className="text-[10px] text-slate-500 font-sans">
                            Deadline: {o.deadline}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{o.client_name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">
                            {o.client_whatsapp}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-bold">
                            {o.service_type}
                          </span>
                          <div className="font-semibold text-slate-200 mt-1 truncate">
                            {o.title}
                          </div>
                          {o.revisions?.length > 0 && (
                            <span className="inline-block mt-1 text-[10px] text-amber-400 font-semibold">
                              • {o.revisions.length} Revisi ({o.revisions.filter((r) => r.status === 'submitted').length} Baru)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-bold">
                            Tagihan: Rp {(o.effective_bill ?? o.price_estimate ?? 0).toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-emerald-400">
                            Masuk: Rp {(o.total_paid ?? o.dp_amount ?? 0).toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-amber-400 font-semibold">
                            Sisa: Rp {(o.remaining_balance ?? 0).toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="uppercase text-[10px] font-bold text-indigo-300">
                            {o.status.replaceAll('_', ' ')}
                          </span>
                          <div className="w-28 bg-slate-800 h-2 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-teal-400 h-full transition-all"
                              style={{ width: `${o.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {o.progress_percent}% ({(o.milestones || []).filter((m) => m.is_completed).length}/{(o.milestones || []).length} tahap)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {o.assigned_to || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => setEditingOrder({ ...o })}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-bold text-[11px] inline-flex items-center gap-1"
                            title="Kelola Detail, Milestone, Pembayaran & Revisi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Kelola
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(o)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400"
                            title="Hapus Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CRUD LAYANAN, FAKTOR PENGALI & ADD-ON KALKULATOR (FASE 2) */}
        {adminTab === 'pricing' && (
          <AdminPricingManager
            token={token}
            showToast={showToast}
            onConfigUpdated={onConfigUpdated}
          />
        )}

        {/* TAB 2B: CRUD PORTOFOLIO & MODERASI TESTIMONI (FASE 4) */}
        {adminTab === 'showcase' && (
          <AdminShowcaseManager
            token={token}
            showToast={showToast}
            onShowcaseUpdated={() => {
              fetchDashboardSummary();
              if (onShowcaseUpdated) onShowcaseUpdated();
            }}
          />
        )}

        {/* TAB 2C: CMS PENGATURAN BISNIS, FAQ & TECH STACK (FASE 5) */}
        {adminTab === 'cms' && (
          <AdminCmsManager
            token={token}
            adminRole={adminUser.role}
            showToast={showToast}
            onCmsUpdated={onCmsUpdated}
          />
        )}

        {/* TAB 3: CRUD PROFIL SAYA & GANTI PASSWORD */}
        {adminTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-white mb-1">
                Profil Akun Admin
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Perbarui identitas, jabatan Co-Founder, bio keahlian, dan nomor WhatsApp Anda.
              </p>

              <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Login *</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Jabatan / Role Title</label>
                    <input
                      type="text"
                      value={profileForm.title}
                      onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                      placeholder="Contoh: Co-Founder — Lead Tech & AI"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      placeholder="6285692390483"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bio / Fokus Keahlian</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  {profileSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </button>
              </form>
            </div>

            {/* Form Ganti Password */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="text-lg font-extrabold text-white">Ganti Password</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Password dienkripsi menggunakan algoritma bcrypt 12-rounds.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password Saat Ini *</label>
                  <input
                    type="password"
                    required
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password Baru (Min. 8 Karakter) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ulangi Password Baru *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={pwForm.confirm_password}
                    onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwSaving}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  {pwSaving ? 'Memperbarui...' : 'Perbarui Password'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: MANAJEMEN TIM ADMIN (RBAC) */}
        {adminTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-white">Manajemen Tim & Co-Founders</h2>
                <p className="text-xs text-slate-400">
                  Daftar akun pengelola sistem. Hanya Superadmin yang dapat menambah atau menonaktifkan akun.
                </p>
              </div>
              {adminUser.role === 'superadmin' && (
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Admin Baru
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{u.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {u.role}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            u.is_active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-teal-400 font-medium mt-1">{u.title || '-'}</div>
                    <div className="text-xs text-slate-400 mt-1">{u.email}</div>
                    {u.bio && <p className="text-[11px] text-slate-400 mt-2">{u.bio}</p>}
                  </div>

                  {adminUser.role === 'superadmin' && u.id !== adminUser.id && (
                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleAdminActive(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                      >
                        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDeleteAdminUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-xs text-red-300"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL KELOLA DETAIL ORDER (PROGRES MILESTONE, PEMBAYARAN & REVISI — FASE 3) */}
      {editingOrder && (
        <AdminOrderDetailModal
          order={editingOrder}
          token={token}
          teamUsers={teamUsers}
          onClose={() => setEditingOrder(null)}
          onOrderUpdated={(updated) => {
            setEditingOrder(updated);
            fetchOrders();
          }}
          showToast={showToast}
        />
      )}

      {/* MODAL TAMBAH ADMIN BARU */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowAddAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-lg text-white mb-4">Tambah Akun Admin Baru</h3>

            <form onSubmit={handleCreateAdminUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Login *</label>
                <input
                  type="email"
                  required
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password Awal *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role *</label>
                  <select
                    value={newAdminForm.role}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Jabatan / Spesialisasi</label>
                <input
                  type="text"
                  value={newAdminForm.title}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs mt-2"
              >
                Buat Akun Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
