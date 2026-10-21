import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Activity,
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
  Menu,
  BookOpen,
  ArrowRight,
  Shield,
  Copy,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import AdminPricingManager from './AdminPricingManager';
import AdminOrderDetailModal from './AdminOrderDetailModal';
import AdminShowcaseManager from './AdminShowcaseManager';
import AdminCmsManager from './AdminCmsManager';
import AdminRoleManager from './AdminRoleManager';
import ConfirmModal from './ConfirmModal';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.origin.includes('5173')
    ? 'http://127.0.0.1:8000/api/v1'
    : '/api/v1');

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

  // Navigasi Menu Admin ('dashboard' | 'orders' | 'pricing' | 'showcase' | 'cms' | 'profile' | 'users')
  const [adminTab, setAdminTab] = useState('dashboard');
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false,
  });
  const [mobileAdminNavOpen, setMobileAdminNavOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // State Statistik Dashboard (Modul M12)
  const [dashboardSummary, setDashboardSummary] = useState(null);

  // State Kelola Order (Terproteksi JWT)
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    client_name: '',
    client_whatsapp: '',
    campus_or_company: '',
    service_type: 'skripsi',
    title: '',
    tech_stack: 'Python, FastAPI, React',
    deadline: '3 Minggu',
    description: '',
    final_price: 2500000,
    dp_amount: 1000000,
    status: 'in_progress',
    progress_percent: 25,
    assigned_to: 'Rizofara (Lead Tech & AI)',
    current_stage_note: 'Sedang mengerjakan Bab 1 & 2: Studi literatur, rumusan masalah & persiapan dataset',
  });

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

  // State Manajemen Tim Admin (RBAC) & Role CRUD
  const [teamUsers, setTeamUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    title: '',
    whatsapp: '',
  });
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Dark mode state
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rizofara_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rizofara_theme', 'light');
    }
  };

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const hasPerm = (perm) => {
    if (!adminUser) return false;
    if (adminUser.role === 'superadmin') return true;
    if (adminUser.role === 'admin' && (!adminUser.permissions || adminUser.permissions.length === 0)) {
      if (perm === 'users.manage' || perm === 'roles.manage') return false;
      return true;
    }
    if (adminUser.role === 'freelance' && (!adminUser.permissions || adminUser.permissions.length === 0)) {
      return perm === 'orders.view_assigned' || perm === 'orders.update_progress';
    }
    return (adminUser.permissions || []).includes(perm);
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

  const fetchAvailableRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/roles/`, authHeaders);
      setAvailableRoles(res.data);
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
      fetchAvailableRoles();
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
      if (!err.response) {
        setLoginError('Tidak dapat terhubung ke server backend (port 8000). Pastikan server backend sudah dijalankan.');
      } else {
        setLoginError(
          err.response?.data?.detail || 'Gagal login. Periksa kembali email & password Anda.'
        );
      }
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

  // Handler CRUD Tambah Order Baru dari Admin (Termasuk Bab/Tahapan yang sedang dikerjakan)
  const handleCreateOrderFromAdmin = async (e) => {
    e.preventDefault();
    setCreatingOrder(true);
    try {
      const priceVal = parseInt(newOrderForm.final_price) || 0;
      const dpVal = parseInt(newOrderForm.dp_amount) || 0;
      const res = await axios.post(`${API_BASE}/orders/`, {
        client_name: newOrderForm.client_name,
        client_whatsapp: newOrderForm.client_whatsapp,
        campus_or_company: newOrderForm.campus_or_company || null,
        service_type: newOrderForm.service_type,
        title: newOrderForm.title,
        tech_stack: newOrderForm.tech_stack || null,
        deadline: newOrderForm.deadline || '3 Minggu',
        description: newOrderForm.description || null,
        price_estimate: priceVal,
        final_price: priceVal,
        dp_amount: dpVal,
        status: newOrderForm.status || 'in_progress',
        progress_percent: parseInt(newOrderForm.progress_percent) || 0,
        assigned_to: newOrderForm.assigned_to || null,
        current_stage_note: newOrderForm.current_stage_note || null,
        source: 'admin_manual',
      });
      showToast('success', `Order baru ${res.data.order_code} berhasil dibuat!`);
      setShowCreateOrderModal(false);
      setNewOrderForm({
        client_name: '',
        client_whatsapp: '',
        campus_or_company: '',
        service_type: 'skripsi',
        title: '',
        tech_stack: 'Python, FastAPI, React',
        deadline: '3 Minggu',
        description: '',
        final_price: 2500000,
        dp_amount: 1000000,
        status: 'in_progress',
        progress_percent: 25,
        assigned_to: adminUser?.name || 'M. Luthfi (Lead Tech & AI)',
        current_stage_note:
          'Sedang mengerjakan Bab 1 & 2: Studi literatur, rumusan masalah & persiapan dataset',
      });
      fetchOrders();
      fetchDashboardSummary();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal membuat order baru.');
    } finally {
      setCreatingOrder(false);
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
      fetchDashboardSummary();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal memperbarui order.');
    }
  };

  const handleDeleteOrder = (order) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Pesanan Klien',
      message: `Apakah Anda yakin ingin menghapus order ${order.order_code} milik ${order.client_name}? Seluruh checklist bab, timeline, dan data pembayaran akan dihapus permanen.`,
      onConfirm: async () => {
        setDeleteConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await axios.delete(`${API_BASE}/orders/${order.id}`, authHeaders);
          showToast('success', `Order ${order.order_code} berhasil dihapus.`);
          fetchOrders();
          fetchDashboardSummary();
        } catch (err) {
          showToast('error', err.response?.data?.detail || 'Gagal menghapus order.');
        } finally {
          setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: null, loading: false });
        }
      },
    });
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

  const handleDeleteAdminUser = (u) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Akun Admin',
      message: `Apakah Anda yakin ingin menghapus akun admin ${u.name} (${u.email})? Pengguna ini tidak akan dapat login lagi ke portal.`,
      onConfirm: async () => {
        setDeleteConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await axios.delete(`${API_BASE}/auth/users/${u.id}`, authHeaders);
          showToast('success', `Akun admin ${u.name} berhasil dihapus.`);
          fetchTeamUsers();
        } catch (err) {
          showToast('error', err.response?.data?.detail || 'Gagal menghapus akun admin.');
        } finally {
          setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: null, loading: false });
        }
      },
    });
  };

  const adminNavItems = [
    hasPerm('dashboard.view') && {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    (hasPerm('orders.view_all') || hasPerm('orders.view_assigned')) && {
      id: 'orders',
      label: adminUser?.role === 'freelance' ? `Tugas Saya (${orders.length})` : `Kelola Order (${orders.length})`,
      icon: ClipboardList,
    },
    hasPerm('pricing.manage') && {
      id: 'pricing',
      label: 'Layanan & Harga',
      icon: Calculator,
    },
    hasPerm('showcase.manage') && {
      id: 'showcase',
      label: 'Portofolio & Testimoni',
      icon: Star,
    },
    hasPerm('cms.manage') && {
      id: 'cms',
      label: 'CMS & Pengaturan',
      icon: Settings,
    },
    {
      id: 'profile',
      label: 'Profil Saya',
      icon: User,
    },
    hasPerm('users.manage') && {
      id: 'users',
      label: `Tim Admin (${teamUsers.length})`,
      icon: Users,
    },
    (hasPerm('roles.manage') || adminUser?.role === 'superadmin') && {
      id: 'roles',
      label: `Kelola Role (${availableRoles.length || 3})`,
      icon: ShieldCheck,
    },
  ].filter(Boolean);

  // --- TAMPILAN 1: BELUM LOGIN (HALAMAN LOGIN ADMIN BERSIH TANPA TEKS DEMO) ---
  if (!token || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020B18] text-slate-900 dark:text-[#F1F5F9] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-[#183247]">
            <div className="flex items-center gap-3">
              <img
                src="/logo-icon.png"
                alt="Rizofara Logo"
                className="w-10 h-10 rounded-xl object-contain bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] p-1"
              />
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-[#F1F5F9] tracking-tight">Portal Admin</h2>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">Rizofara Technology Internal System</p>
              </div>
            </div>
            <button
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#06111F] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-xs text-slate-700 dark:text-[#F1F5F9] hover:text-teal-400 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
              Beranda
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1.5">Email Admin</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Masukkan alamat email admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1.5">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Masukkan password akun"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#07C995] to-[#00C4D7] hover:opacity-95 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              {loginLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Dashboard Admin'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#183247] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Otorisasi JWT & Enkripsi Bcrypt
            </span>
            <span>Rizofara v2.0</span>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: SUDAH LOGIN (DASHBOARD SHELL) ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020B18] text-slate-900 dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-200">
      {/* Topbar & Navbar Admin (Responsif Desktop & Mobile) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#183247]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/logo-icon.png"
              alt="Rizofara Logo"
              className="w-8 h-8 rounded-lg object-contain bg-slate-50 dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-emerald-200 dark:border-[#183247] text-teal-500 dark:text-[#00C4D7] font-extrabold text-[10px] tracking-wider uppercase">
                  ADMIN PORTAL
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-[#0093E3] dark:text-[#00C4D7] border border-sky-200 dark:border-[#183247] hidden sm:inline-block">
                  {adminUser.role}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-800 dark:text-[#F1F5F9] truncate mt-0.5">
                {adminUser.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1929] dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-slate-800 dark:text-[#F1F5F9] transition cursor-pointer"
              title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <button
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1929] dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-slate-800 dark:text-[#F1F5F9] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Lihat Website</span>
              <span className="sm:hidden">Web</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileAdminNavOpen(!mobileAdminNavOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1929] dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-slate-800 dark:text-[#F1F5F9]"
              aria-label="Menu Navigasi Admin"
            >
              {mobileAdminNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer untuk Admin */}
        {mobileAdminNavOpen && (
          <div className="md:hidden bg-slate-50 dark:bg-[#06111F] border-t border-slate-200 dark:border-[#183247] px-4 py-3 grid grid-cols-2 gap-2">
            {adminNavItems.map((item) => {
              const IconComp = item.icon;
              const isActive = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setAdminTab(item.id);
                    setMobileAdminNavOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 shadow-md shadow-teal-500/20'
                      : 'bg-white dark:bg-[#0B1929] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#183247]'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Notifikasi Toast */}
        {feedback.message && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
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



        {/* Navigation Tabs (Desktop Pill Container) */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] mb-8">
          {adminNavItems.map((item) => {
            const IconComp = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAdminTab(item.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 shadow-lg shadow-teal-500/20'
                    : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#0B1929]'
                }`}
              >
                <IconComp className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* TAB 0: DASHBOARD OPERASIONAL, STATISTIK & GRAFIK (MODUL M12) */}
        {/* ================================================================= */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header Dashboard & Salam Pembuka */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#0B1929] dark:to-[#06111F] border border-transparent dark:border-[#183247] text-white shadow-md">
              <div>
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold uppercase tracking-wider">
                  Sistem Informasi Manajemen
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight mt-2 text-[#F1F5F9]">
                  Selamat Datang, {adminUser.name}!
                </h2>
                <p className="text-xs text-slate-300 dark:text-[#94A3B8] mt-1">
                  Pantau performa proyek, arus kas masuk, sisa piutang, dan aktivitas tim teknis secara real-time.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchDashboardSummary();
                    fetchOrders();
                    showToast('Data dashboard telah diperbarui!', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-[#06111F] dark:hover:bg-[#183247] text-slate-200 dark:text-[#F1F5F9] border border-slate-700 dark:border-[#183247] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                  <span>Refresh Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('orders');
                    setShowCreateOrderModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Order Baru</span>
                </button>
              </div>
            </div>

            {/* 6 KARTU KPI UTAMA DASHBOARD */}
            {dashboardSummary && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. Order Aktif / Total */}
                <div
                  onClick={() => setAdminTab('orders')}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] shadow-xs hover:border-teal-500/50 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8]">Order Aktif</span>
                    <ClipboardList className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-[#F1F5F9] mt-2">
                    {dashboardSummary.active_orders}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                    Total: <span className="font-bold text-slate-700 dark:text-[#F1F5F9]">{dashboardSummary.total_orders} Order</span>
                  </div>
                </div>

                {/* 2. Order Selesai */}
                <div
                  onClick={() => {
                    setAdminTab('orders');
                    setStatusFilter('completed');
                    fetchOrders('completed');
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] shadow-xs hover:border-emerald-500/50 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-[#07C995]">Selesai 100%</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-[#07C995]" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-[#07C995] mt-2">
                    {dashboardSummary.completed_orders}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                    Konversi: <span className="font-bold text-emerald-600 dark:text-[#07C995]">{dashboardSummary.conversion_rate_percent}%</span>
                  </div>
                </div>

                {/* 3. Pemasukan Masuk (Verified) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-[#0B1929] dark:to-[#06111F] border border-emerald-200/90 dark:border-[#183247] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-[#07C995]">Pemasukan</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-[#07C995]" />
                  </div>
                  <div className="text-lg font-black text-emerald-700 dark:text-[#07C995] mt-2 truncate" title={`Rp ${(dashboardSummary.total_verified_revenue || 0).toLocaleString('id-ID')}`}>
                    Rp {(dashboardSummary.total_verified_revenue || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-emerald-600/80 dark:text-[#94A3B8] mt-0.5 font-medium">
                    Kas Masuk Terverifikasi
                  </div>
                </div>

                {/* 4. Sisa Piutang */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-[#0B1929] dark:to-[#06111F] border border-amber-200/90 dark:border-[#183247] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">Sisa Piutang</span>
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-2 truncate" title={`Rp ${(dashboardSummary.total_outstanding_receivables || 0).toLocaleString('id-ID')}`}>
                    Rp {(dashboardSummary.total_outstanding_receivables || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-amber-600/80 dark:text-[#94A3B8] mt-0.5 font-medium">
                    Menunggu Pelunasan
                  </div>
                </div>

                {/* 5. Revisi Menunggu */}
                <div
                  onClick={() => setAdminTab('orders')}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] shadow-xs hover:border-indigo-500/50 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-[#00C4D7]">Revisi Menunggu</span>
                    <AlertCircle className="w-4 h-4 text-indigo-500 dark:text-[#00C4D7]" />
                  </div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-[#00C4D7] mt-2">
                    {dashboardSummary.pending_revisions_count}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                    Catatan Dosen / Klien
                  </div>
                </div>

                {/* 6. Ulasan Pending */}
                <div
                  onClick={() => setAdminTab('showcase')}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] shadow-xs hover:border-amber-500/50 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-[#FACC15]">Ulasan Pending</span>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400 dark:text-[#FACC15] dark:fill-[#FACC15]" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-[#FACC15] mt-2">
                    {dashboardSummary.pending_testimonials_count}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                    Perlu Moderasi Admin
                  </div>
                </div>
              </div>
            )}

            {/* VISUALISASI ARUS KAS & GRAFIK PROGRESS */}
            {dashboardSummary && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Realisasi Keuangan: Pemasukan vs Piutang */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0B1929] p-5 rounded-3xl border border-slate-200 dark:border-[#183247] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-[#F1F5F9]">Realisasi Keuangan & Arus Kas</h3>
                      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">Perbandingan kas masuk terverifikasi dan sisa piutang order</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-[#94A3B8]">
                      Total Omset: Rp {((dashboardSummary.total_verified_revenue || 0) + (dashboardSummary.total_outstanding_receivables || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  {(() => {
                    const totalRevenue = (dashboardSummary.total_verified_revenue || 0) + (dashboardSummary.total_outstanding_receivables || 0);
                    const paidPct = totalRevenue > 0 ? Math.round(((dashboardSummary.total_verified_revenue || 0) / totalRevenue) * 100) : 0;
                    const receivablePct = 100 - paidPct;
                    return (
                      <div className="space-y-2">
                        <div className="w-full bg-slate-100 dark:bg-[#183247] h-4 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${paidPct}%` }}
                            className="bg-emerald-500 dark:bg-[#07C995] h-full transition-all duration-500"
                            title={`Sudah Dibayar: ${paidPct}%`}
                          />
                          <div
                            style={{ width: `${receivablePct}%` }}
                            className="bg-amber-400 dark:bg-[#FACC15] h-full transition-all duration-500"
                            title={`Sisa Piutang: ${receivablePct}%`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-emerald-500 dark:bg-[#07C995] inline-block" />
                            <span className="font-bold text-slate-800 dark:text-[#F1F5F9]">Kas Masuk: Rp {(dashboardSummary.total_verified_revenue || 0).toLocaleString('id-ID')} ({paidPct}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-amber-400 dark:bg-[#FACC15] inline-block" />
                            <span className="font-bold text-slate-800 dark:text-[#F1F5F9]">Piutang: Rp {(dashboardSummary.total_outstanding_receivables || 0).toLocaleString('id-ID')} ({receivablePct}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3 Quick Action Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setAdminTab('orders')}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#06111F] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-left transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-teal-600 dark:text-[#07C995] uppercase">Kelola Order</div>
                      <div className="font-bold text-xs text-slate-900 dark:text-[#F1F5F9] mt-1">Cek Tahapan Bab</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-0.5">Pantau progres pengerjaan</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('pricing')}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#06111F] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-left transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-[#0093E3] dark:text-[#00C4D7] uppercase">Pricing Engine</div>
                      <div className="font-bold text-xs text-slate-900 dark:text-[#F1F5F9] mt-1">Layanan & Harga</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-0.5">Atur skema & add-on</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('showcase')}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#06111F] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-left transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-amber-600 dark:text-[#FACC15] uppercase">Showcase</div>
                      <div className="font-bold text-xs text-slate-900 dark:text-[#F1F5F9] mt-1">Portofolio & Review</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-0.5">Moderasi ulasan klien</div>
                    </button>
                  </div>
                </div>

                {/* Distribusi Pesanan per Layanan */}
                <div className="lg:col-span-5 bg-white dark:bg-[#0B1929] p-5 rounded-3xl border border-slate-200 dark:border-[#183247] shadow-xs space-y-3.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-[#F1F5F9]">Distribusi Kategori Layanan</h3>
                  <div className="space-y-2.5">
                    {[
                      { key: 'skripsi', label: 'Program Skripsi & Tugas Akhir', color: 'bg-indigo-500', text: 'text-indigo-600' },
                      { key: 'website', label: 'Jasa Pembuatan Website', color: 'bg-emerald-500', text: 'text-emerald-600' },
                      { key: 'chatbot', label: 'Jasa Chatbot AI & WhatsApp', color: 'bg-teal-500', text: 'text-teal-600' },
                      { key: 'tugas', label: 'Tugas Kuliah Pemrograman', color: 'bg-amber-500', text: 'text-amber-600' },
                    ].map((svc) => {
                      const count = (orders || []).filter((o) => (o.service_type || '').toLowerCase() === svc.key).length;
                      const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                      return (
                        <div key={svc.key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-100 dark:border-[#183247]">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-slate-800 dark:text-[#F1F5F9]">{svc.label}</span>
                            <span className={`font-mono font-bold ${svc.text}`}>{count} Order ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-[#183247] h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }} className={`h-full ${svc.color} rounded-full`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TABEL RINGKASAN ORDER TERBARU */}
            <div className="bg-white dark:bg-[#0B1929] rounded-3xl border border-slate-200 dark:border-[#183247] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-[#F1F5F9]">Order Terkini</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">5 pesanan terbaru yang masuk ke dalam sistem</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminTab('orders')}
                  className="text-xs font-bold text-teal-600 dark:text-[#00C4D7] hover:text-teal-700 dark:hover:underline flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Lihat Seluruh Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#06111F] text-slate-500 dark:text-[#94A3B8] uppercase text-[10px] border-b border-slate-200 dark:border-[#183247]">
                    <tr>
                      <th className="py-2.5 px-3">Kode Order</th>
                      <th className="py-2.5 px-3">Klien & Proyek</th>
                      <th className="py-2.5 px-3">Status & Progres</th>
                      <th className="py-2.5 px-3">Tagihan & Sisa</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#183247]">
                    {(orders || []).slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-[#06111F]/50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-teal-600 dark:text-[#00C4D7]">
                          {o.order_code}
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-normal">{o.deadline || 'Deadline -'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-[#F1F5F9]">{o.client_name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] truncate max-w-xs">{o.title}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-[#06111F] text-slate-700 dark:text-[#F1F5F9] border border-slate-200 dark:border-[#183247] inline-block mb-1">
                            {o.status}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-[#94A3B8]">
                            <div className="w-16 bg-slate-200 dark:bg-[#183247] h-1.5 rounded-full overflow-hidden">
                              <div style={{ width: `${o.progress_percent || 0}%` }} className="bg-teal-500 h-full rounded-full" />
                            </div>
                            <span>{o.progress_percent || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-[#F1F5F9]">
                            Deal: Rp {(o.effective_bill || o.final_price || o.price_estimate || 0).toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            Sisa: Rp {(o.remaining_balance || 0).toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingOrder({ ...o })}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-[#06111F] hover:bg-teal-100 dark:hover:bg-[#183247] text-teal-700 dark:text-[#00C4D7] border border-teal-200 dark:border-[#183247] text-[11px] font-bold transition cursor-pointer"
                          >
                            Buka Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: KELOLA ORDER (CRUD LENGKAP + ALUR PROGRES BAB) */}
        {adminTab === 'orders' && (
          <div className="space-y-6">
            {/* Alur Siklus Pengerjaan Order (5-Stage Interactive Workflow) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-400">
                    Alur Kerja & Siklus Pengerjaan Order (Klik Tahap untuk Filter)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Setiap pesanan melalui 5 tahapan standar dari kesepakatan harga hingga serah terima kode & laporan Bab 1-5.
                  </p>
                </div>
                {statusFilter && (
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      fetchOrders('', searchQuery);
                    }}
                    className="text-[11px] text-teal-400 hover:underline font-bold self-start sm:self-auto"
                  >
                    Tampilkan Semua Status
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {[
                  {
                    step: 'Tahap 1',
                    title: 'Order Masuk & Deal',
                    desc: 'Konsultasi scope, Bab/Fitur & penentuan harga deal',
                    filterVal: 'pending',
                    count: orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
                  },
                  {
                    step: 'Tahap 2',
                    title: 'DP Diterima',
                    desc: 'Verifikasi DP awal & pembagian PIC teknis',
                    filterVal: 'dp_received',
                    count: orders.filter((o) => o.status === 'dp_received').length,
                  },
                  {
                    step: 'Tahap 3',
                    title: 'Pengerjaan Bab / Koding',
                    desc: 'Eksekusi Bab 1-5 / modul web & update progres berkala',
                    filterVal: 'in_progress',
                    count: orders.filter((o) => o.status === 'in_progress').length,
                  },
                  {
                    step: 'Tahap 4',
                    title: 'Demo & Revisi',
                    desc: 'Uji coba demo bersama klien & pengerjaan revisi',
                    filterVal: 'review',
                    count: orders.filter((o) => o.status === 'review' || o.status === 'revision').length,
                  },
                  {
                    step: 'Tahap 5',
                    title: 'Lunas & Serah Terima',
                    desc: 'Pelunasan akhir, kirim full source code & bimbingan',
                    filterVal: 'completed',
                    count: orders.filter((o) => o.status === 'completed').length,
                  },
                ].map((stage, idx) => {
                  const active = statusFilter === stage.filterVal;
                  return (
                    <button
                      key={stage.step}
                      type="button"
                      onClick={() => {
                        const nextFilter = active ? '' : stage.filterVal;
                        setStatusFilter(nextFilter);
                        fetchOrders(nextFilter, searchQuery);
                      }}
                      className={`text-left p-3 rounded-xl border transition relative ${
                        active
                          ? 'bg-teal-50 dark:bg-[#06111F] border-teal-500 dark:border-[#07C995] text-teal-900 dark:text-[#07C995] shadow-xs'
                          : 'bg-white dark:bg-[#06111F] border-slate-200 dark:border-[#183247] hover:border-slate-300 dark:hover:border-[#00C4D7]/40 text-slate-700 dark:text-[#94A3B8]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-teal-700 mb-1">
                        <span>{stage.step}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] text-slate-800 dark:text-[#F1F5F9]">
                          {stage.count} Order
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 dark:text-[#F1F5F9]">{stage.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                        {stage.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Header Daftar Order */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#F1F5F9]">Daftar Order & Progres Bab Pengerjaan</h2>
                <p className="text-xs text-slate-500">
                  Pantau sedang mengerjakan Bab/Tahapan berapa untuk setiap pesanan, catat pembayaran, atau input order baru.
                </p>
              </div>
            </div>

            {/* Toolbar Sejajar: Cari Order, Filter Status, Refresh & Tambah Order Baru */}
            <div className="bg-white dark:bg-[#0B1929] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-[#183247] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchOrders(statusFilter, e.target.value);
                    }}
                    placeholder="Cari kode order, nama klien, judul proyek..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-xs text-slate-800 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    fetchOrders(e.target.value, searchQuery);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-xs text-slate-800 dark:text-[#F1F5F9] font-medium shrink-0 cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Tahap 1: Pending</option>
                  <option value="confirmed">Tahap 1: Harga Deal</option>
                  <option value="dp_received">Tahap 2: DP Diterima</option>
                  <option value="in_progress">Tahap 3: Dikerjakan</option>
                  <option value="review">Tahap 4: Demo & Review</option>
                  <option value="revision">Tahap 4: Revisi</option>
                  <option value="completed">Tahap 5: Selesai</option>
                </select>
                <button
                  type="button"
                  onClick={() => fetchOrders()}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-[#06111F] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-slate-700 dark:text-[#F1F5F9] shrink-0 transition cursor-pointer"
                  title="Refresh Data Order"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {hasPerm('orders.create') && (
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-teal-500/20 transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Order Baru</span>
                </button>
              )}
            </div>

            {ordersLoading ? (
              <div className="text-center py-12 text-xs text-slate-500">Memuat data order...</div>
            ) : orders.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Belum ada data order yang sesuai filter. Klik <strong>+ Tambah Order Baru</strong> untuk memasukkan pesanan.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#183247] bg-white dark:bg-[#0B1929]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#06111F] text-slate-500 dark:text-[#94A3B8] uppercase text-[10px] border-b border-slate-200 dark:border-[#183247]">
                    <tr>
                      <th className="py-3.5 px-4">Kode & Deadline</th>
                      <th className="py-3.5 px-4">Klien & Kampus</th>
                      <th className="py-3.5 px-4">Layanan & Judul Proyek</th>
                      <th className="py-3.5 px-4">Tahapan / Bab Sedang Dikerjakan</th>
                      <th className="py-3.5 px-4">Tagihan & Pembayaran</th>
                      <th className="py-3.5 px-4 text-right">Aksi CRUD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {orders.map((o) => {
                      const completedMilestones = (o.milestones || []).filter(
                        (m) => m.is_completed
                      ).length;
                      const totalMilestones = (o.milestones || []).length;
                      return (
                        <tr key={o.id} className="hover:bg-slate-100/40 transition align-top">
                          <td className="py-4 px-4 font-mono font-bold text-teal-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{o.order_code}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(o.order_code);
                                  showToast('success', `Kode lacak ${o.order_code} disalin!`);
                                }}
                                title="Salin Kode Lacak"
                                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-teal-400 transition cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans font-normal mt-1">
                              Deadline: <span className="text-slate-800 font-semibold">{o.deadline}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                              PIC: {o.assigned_to || 'Tim Teknis'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 dark:text-[#F1F5F9]">{o.client_name}</div>
                            <div className="text-teal-400 font-mono text-[11px] mt-0.5">
                              {o.client_whatsapp}
                            </div>
                            {o.campus_or_company && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                {o.campus_or_company}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-emerald-700 font-bold">
                              {o.service_type}
                            </span>
                            <div className="font-bold text-slate-900 mt-1.5 leading-snug">
                              {o.title}
                            </div>
                            {o.tech_stack && (
                              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                Stack: {o.tech_stack}
                              </div>
                            )}
                            {o.revisions?.length > 0 && (
                              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-200 text-amber-800 font-semibold">
                                {o.revisions.length} Revisi ({o.revisions.filter((r) => r.status === 'submitted').length} Menunggu)
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 min-w-[260px] max-w-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-[#0093E3] border border-sky-200">
                                {o.status.replaceAll('_', ' ')}
                              </span>
                              <span className="text-[11px] font-extrabold text-teal-400">
                                {o.progress_percent}% ({completedMilestones}/{totalMilestones} Bab/Tahap)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                              <div
                                className="bg-teal-400 h-full transition-all"
                                style={{ width: `${o.progress_percent}%` }}
                              />
                            </div>
                            {/* Box Bab / Tahapan yang sedang dikerjakan */}
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-800 leading-relaxed flex items-start gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-teal-400 block">
                                  Progres Bab / Tahap Aktif:
                                </span>
                                {o.current_stage || 'Menunggu update tahapan pengerjaan'}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {hasPerm('payments.view') ? (
                              <>
                                <div className="text-slate-800 font-bold">
                                  Deal: Rp {(o.effective_bill ?? o.price_estimate ?? 0).toLocaleString('id-ID')}
                                </div>
                                <div className="text-[11px] text-emerald-400 mt-0.5">
                                  Masuk: Rp {(o.total_paid ?? o.dp_amount ?? 0).toLocaleString('id-ID')}
                                </div>
                                <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                                  Sisa: Rp {(o.remaining_balance ?? 0).toLocaleString('id-ID')}
                                </div>
                              </>
                            ) : (
                              <div className="text-slate-400 italic text-[11px]">
                                Akses Terbatas (Freelance)
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => setEditingOrder({ ...o })}
                              className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-emerald-200 text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer"
                              title="Update Bab Pengerjaan, Checklist Milestone, Pembayaran & Revisi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Update Bab & Detail
                            </button>
                            {hasPerm('orders.delete') && (
                              <button
                                onClick={() => handleDeleteOrder(o)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-950 text-red-400 transition cursor-pointer"
                                title="Hapus Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
            <div className="lg:col-span-7 bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#F1F5F9] mb-1">
                Profil Akun Admin
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Perbarui identitas, jabatan Co-Founder, bio keahlian, dan nomor WhatsApp Anda.
              </p>

              <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Email Login *</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Jabatan / Role Title</label>
                    <input
                      type="text"
                      value={profileForm.title}
                      onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                      placeholder="Contoh: Co-Founder - Lead Tech & AI"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      placeholder="6285141396021"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Bio / Fokus Keahlian</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
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
            <div className="lg:col-span-5 bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#F1F5F9]">Ganti Password</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Password dienkripsi menggunakan algoritma bcrypt 12-rounds.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Password Saat Ini *</label>
                  <input
                    type="password"
                    required
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Password Baru (Min. 8 Karakter) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Ulangi Password Baru *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={pwForm.confirm_password}
                    onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
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
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#F1F5F9]">Manajemen Tim & Co-Founders</h2>
                <p className="text-xs text-slate-500">
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
                  className="p-5 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">{u.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-[#0093E3] border border-sky-200">
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
                    <div className="text-xs text-slate-500 mt-1">{u.email}</div>
                    {u.bio && <p className="text-[11px] text-slate-500 mt-2">{u.bio}</p>}
                  </div>

                  {adminUser.role === 'superadmin' && u.id !== adminUser.id && (
                    <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleAdminActive(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-800"
                      >
                        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDeleteAdminUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-red-900 text-xs text-rose-700"
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
        {/* TAB 4: MANAJEMEN ROLE & HAK AKSES (CRUD ROLE) */}
        {adminTab === 'roles' && (hasPerm('roles.manage') || adminUser.role === 'superadmin') && (
          <AdminRoleManager
            token={token}
            showToast={showToast}
            currentAdmin={adminUser}
          />
        )}
      </div>

      {/* MODAL KELOLA DETAIL ORDER (PROGRES MILESTONE, PEMBAYARAN & REVISI - FASE 3) */}
      {editingOrder && (
        <AdminOrderDetailModal
          order={editingOrder}
          token={token}
          teamUsers={teamUsers}
          adminUser={adminUser}
          onClose={() => setEditingOrder(null)}
          onOrderUpdated={(updated) => {
            setEditingOrder(updated);
            fetchOrders();
            fetchDashboardSummary();
          }}
          showToast={showToast}
        />
      )}

      {/* MODAL TAMBAH ORDER BARU (CRUD CREATE ORDER DARI ADMIN + PROGRES BAB) */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Sticky dengan Tombol X Permanen di Atas */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 dark:border-[#183247] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Tambah Order Baru (Input Manual Admin)
                </h3>
                <p className="text-xs text-slate-500">
                  Catat proyek klien (Skripsi / Website / AI) beserta Bab atau Tahapan pengerjaan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateOrderModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleCreateOrderFromAdmin} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Nama Klien *</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.client_name}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, client_name: e.target.value })
                    }
                    placeholder="Contoh: Raka Pratama"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.client_whatsapp}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, client_whatsapp: e.target.value })
                    }
                    placeholder="6281234567890"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Kampus / Instansi</label>
                  <input
                    type="text"
                    value={newOrderForm.campus_or_company}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, campus_or_company: e.target.value })
                    }
                    placeholder="Contoh: Teknik Informatika - UB"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Kategori Layanan *</label>
                  <select
                    value={newOrderForm.service_type}
                    onChange={(e) => {
                      const st = e.target.value;
                      setNewOrderForm({
                        ...newOrderForm,
                        service_type: st,
                        current_stage_note:
                          st === 'skripsi' || st === 'tugas'
                            ? 'Sedang mengerjakan Bab 1 & 2: Studi literatur, rumusan masalah & persiapan dataset'
                            : 'Sedang mengerjakan Tahap 1: Perancangan arsitektur sistem, UI/UX & skema database',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  >
                    <option value="skripsi">Skripsi / Tugas Akhir (Bab 1-5 + Program)</option>
                    <option value="website">Pembuatan Website / Sistem Informasi</option>
                    <option value="chatbot">AI Chatbot / Machine Learning</option>
                    <option value="tugas">Tugas Kuliah / Praktikum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Tech Stack / Metode</label>
                  <input
                    type="text"
                    value={newOrderForm.tech_stack}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, tech_stack: e.target.value })
                    }
                    placeholder="Python, YOLOv8, FastAPI, React"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Target Deadline *</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.deadline}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, deadline: e.target.value })
                    }
                    placeholder="Contoh: 3 Minggu"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                  Judul Skripsi / Nama Proyek Sistem *
                </label>
                <input
                  type="text"
                  required
                  value={newOrderForm.title}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, title: e.target.value })}
                  placeholder="Contoh: Sistem Klasifikasi Penyakit Tanaman Padi dengan CNN MobileNetV2"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-emerald-700 font-extrabold">
                    Sedang Mengerjakan Bab / Tahapan Berapa Saat Ini? *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Klik tombol cepat di bawah atau ketik detail progres Bab:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: 'Bab 1 & 2 (20%)',
                      pct: 20,
                      text: 'Sedang mengerjakan Bab 1 & 2: Penyusunan latar belakang, studi literatur & persiapan dataset penelitian',
                    },
                    {
                      label: 'Bab 3 Perancangan (40%)',
                      pct: 40,
                      text: 'Sedang mengerjakan Bab 3: Perancangan metodologi penelitian, flowchart, ERD/UML & arsitektur model',
                    },
                    {
                      label: 'Bab 4 Koding & Uji (70%)',
                      pct: 70,
                      text: 'Sedang mengerjakan Bab 4: Implementasi source code, pelatihan model AI/Web & pengujian akurasi / Blackbox',
                    },
                    {
                      label: 'Bab 5 & Sidang (90%)',
                      pct: 90,
                      text: 'Sedang mengerjakan Bab 5: Penyusunan kesimpulan laporan akhir, pengecekan plagiasi & persiapan demo sidang',
                    },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setNewOrderForm({
                          ...newOrderForm,
                          progress_percent: preset.pct,
                          current_stage_note: preset.text,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-500/20 border border-slate-200 hover:border-emerald-200 text-emerald-700 font-semibold text-[11px] transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={newOrderForm.current_stage_note}
                  onChange={(e) =>
                    setNewOrderForm({ ...newOrderForm, current_stage_note: e.target.value })
                  }
                  placeholder="Contoh: Sedang mengerjakan Bab 4: Integrasi model CNN & pengujian sistem..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Harga Deal (Rp)</label>
                  <input
                    type="number"
                    value={newOrderForm.final_price}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, final_price: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">DP Masuk Awal (Rp)</label>
                  <input
                    type="number"
                    value={newOrderForm.dp_amount}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, dp_amount: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Status Awal</label>
                  <select
                    value={newOrderForm.status}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  >
                    <option value="pending">pending (Baru Masuk)</option>
                    <option value="confirmed">confirmed (Harga Deal)</option>
                    <option value="dp_received">dp_received (DP Masuk)</option>
                    <option value="in_progress">in_progress (Dikerjakan)</option>
                    <option value="review">review (Demo & Review)</option>
                    <option value="completed">completed (Selesai 100%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                    Progres ({newOrderForm.progress_percent}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={newOrderForm.progress_percent}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, progress_percent: e.target.value })
                    }
                    className="w-full mt-2 accent-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">PIC Tim Teknis</label>
                  <input
                    type="text"
                    value={newOrderForm.assigned_to}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, assigned_to: e.target.value })
                    }
                    placeholder="M. Luthfi (Lead Tech & AI)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                    Catatan Spesifikasi / Kebutuhan Klien
                  </label>
                  <input
                    type="text"
                    value={newOrderForm.description}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, description: e.target.value })
                    }
                    placeholder="Rincian dataset, fitur utama, atau aturan kampus..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                >
                  <Save className="w-4 h-4" />
                  {creatingOrder ? 'Menyimpan Order...' : 'Simpan Order & Buat Checklist Bab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

      {/* MODAL TAMBAH ADMIN BARU */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Sticky dengan Tombol X Permanen di Atas */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 dark:border-[#183247] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Tambah Akun Admin Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Akses internal tim pengembang Rizofara
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleCreateAdminUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Email Login *</label>
                <input
                  type="email"
                  required
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Password Awal *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Role *</label>
                  <select
                    value={newAdminForm.role}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {availableRoles.length > 0 ? (
                      availableRoles
                        .filter((r) => r.is_active)
                        .map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.display_name} ({r.name})
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="admin">Admin</option>
                        <option value="freelance">Freelance</option>
                        <option value="superadmin">Superadmin</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Jabatan / Spesialisasi</label>
                <input
                  type="text"
                  value={newAdminForm.title}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs mt-2 shadow-md shadow-teal-500/20"
              >
                Buat Akun Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    )}

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
