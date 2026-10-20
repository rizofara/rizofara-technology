import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Lock,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.origin.includes('5173')
    ? 'http://127.0.0.1:8000/api/v1'
    : '/api/v1');

export default function AdminRoleManager({ token, showToast, currentAdmin }) {
  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roleForm, setRoleForm] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
    is_active: true,
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false,
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        axios.get(`${API_BASE}/roles/`, authHeaders),
        axios.get(`${API_BASE}/roles/permissions`, authHeaders),
      ]);
      setRoles(rolesRes.data);
      setPermissionsList(permsRes.data);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal memuat daftar role.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRoles();
  }, [token]);

  // Group permissions by group name
  const groupedPermissions = permissionsList.reduce((acc, p) => {
    const g = p.group || 'Lainnya';
    if (!acc[g]) acc[g] = [];
    acc[g].push(p);
    return acc;
  }, {});

  const handleOpenAddModal = () => {
    setRoleForm({
      name: '',
      display_name: '',
      description: '',
      permissions: ['dashboard.view', 'orders.view_assigned', 'progress.view'],
      is_active: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (r) => {
    setEditingRole(r);
    setRoleForm({
      name: r.name,
      display_name: r.display_name,
      description: r.description || '',
      permissions: [...(r.permissions || [])],
      is_active: r.is_active,
    });
  };

  const togglePermission = (code) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(code);
      const next = exists
        ? prev.permissions.filter((p) => p !== code)
        : [...prev.permissions, code];
      return { ...prev, permissions: next };
    });
  };

  const toggleGroupAll = (groupName) => {
    const groupPerms = (groupedPermissions[groupName] || []).map((p) => p.code);
    const allSelected = groupPerms.every((code) => roleForm.permissions.includes(code));
    setRoleForm((prev) => {
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter((code) => !groupPerms.includes(code)),
        };
      } else {
        const set = new Set([...prev.permissions, ...groupPerms]);
        return { ...prev, permissions: Array.from(set) };
      }
    });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRole) {
        const payload = {
          display_name: roleForm.display_name,
          description: roleForm.description,
          permissions: roleForm.permissions,
          is_active: roleForm.is_active,
        };
        await axios.patch(`${API_BASE}/roles/${editingRole.id}`, payload, authHeaders);
        showToast('success', `Role "${roleForm.display_name}" berhasil diperbarui!`);
        setEditingRole(null);
      } else {
        await axios.post(`${API_BASE}/roles/`, roleForm, authHeaders);
        showToast('success', `Role "${roleForm.display_name}" berhasil ditambahkan!`);
        setShowAddModal(false);
      }
      fetchRoles();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Gagal menyimpan role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (r) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Role Akses',
      message: `Apakah Anda yakin ingin menghapus role "${r.display_name}"? Role ini tidak dapat dipulihkan.`,
      onConfirm: async () => {
        setDeleteConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await axios.delete(`${API_BASE}/roles/${r.id}`, authHeaders);
          showToast('success', `Role "${r.display_name}" berhasil dihapus.`);
          fetchRoles();
        } catch (err) {
          showToast('error', err.response?.data?.detail || 'Gagal menghapus role.');
        } finally {
          setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: null, loading: false });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#F1F5F9]">
              Manajemen Role & Hak Akses (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            Kelola peran pengguna sistem: Super Admin, Admin, Freelance, atau buat role kustom baru dengan izin akses spesifik.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRoles}
            className="p-2 rounded-xl bg-slate-50 dark:bg-[#06111F] hover:bg-slate-100 dark:hover:bg-[#0B1929] border border-slate-200 dark:border-[#183247] text-slate-700 dark:text-[#94A3B8] transition cursor-pointer"
            title="Refresh Role"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Role Baru</span>
          </button>
        </div>
      </div>

      {/* Daftar Role Cards */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500 dark:text-[#94A3B8]">
          Memuat daftar role & hak akses...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => {
            const isSuperadmin = r.name === 'superadmin';
            const isFreelance = r.name === 'freelance';
            const isAdmin = r.name === 'admin';

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] shadow-xs flex flex-col justify-between hover:border-teal-500/40 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-[#F1F5F9]">
                          {r.display_name}
                        </span>
                        {r.is_system && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#06111F] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#183247]">
                            Sistem
                          </span>
                        )}
                        {!r.is_active && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-teal-600 dark:text-[#00C4D7] mt-0.5 block">
                        @{r.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] bg-slate-50 dark:bg-[#06111F] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#183247]">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.user_count} User</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-2.5 line-clamp-2 min-h-[32px]">
                    {r.description || 'Tidak ada deskripsi.'}
                  </p>

                  {/* Ringkasan Permissions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#183247]">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2 flex items-center justify-between">
                      <span>Hak Akses ({r.permissions?.length || 0})</span>
                      {isSuperadmin && (
                        <span className="text-teal-600 dark:text-[#00C4D7] font-extrabold">Semua Akses</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                      {(r.permissions || []).map((code) => {
                        const perm = permissionsList.find((p) => p.code === code);
                        return (
                          <span
                            key={code}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#06111F] text-slate-700 dark:text-[#F1F5F9] border border-slate-200/60 dark:border-[#183247]"
                            title={code}
                          >
                            {perm?.label || code}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Aksi */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#183247] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(r)}
                    disabled={isSuperadmin}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
                      isSuperadmin
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-[#06111F] text-slate-400'
                        : 'bg-teal-50 dark:bg-[#06111F] hover:bg-teal-100 text-teal-700 dark:text-[#00C4D7] border border-teal-200 dark:border-[#183247] cursor-pointer'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Role</span>
                  </button>

                  {!r.is_system && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(r)}
                      disabled={r.user_count > 0}
                      className={`p-1.5 rounded-xl text-xs transition ${
                        r.user_count > 0
                          ? 'opacity-30 cursor-not-allowed text-slate-400'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer'
                      }`}
                      title={
                        r.user_count > 0
                          ? 'Tidak bisa dihapus karena masih digunakan user'
                          : 'Hapus Role'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Role */}
      {(showAddModal || editingRole) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#183247] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-[#F1F5F9]">
                  {editingRole ? `Edit Role: ${editingRole.display_name}` : 'Tambah Role Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRole(null);
                }}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] text-slate-600 dark:text-[#94A3B8] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#F1F5F9] mb-1">
                    Nama Tampilan Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.display_name}
                    onChange={(e) => setRoleForm({ ...roleForm, display_name: e.target.value })}
                    placeholder="Contoh: Freelance Tech"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-xs text-slate-800 dark:text-[#F1F5F9] focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#F1F5F9] mb-1">
                    Kode Identitas (Slug) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole}
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="Contoh: freelance_tech"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-xs text-slate-800 dark:text-[#F1F5F9] font-mono focus:outline-none focus:border-teal-500 disabled:opacity-50"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Huruf kecil, angka, atau garis bawah tanpa spasi.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#F1F5F9] mb-1">
                  Deskripsi / Tugas Role
                </label>
                <textarea
                  rows={2}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Jelaskan ruang lingkup hak akses dari role ini..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-xs text-slate-800 dark:text-[#F1F5F9] focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="role_is_active"
                  checked={roleForm.is_active}
                  onChange={(e) => setRoleForm({ ...roleForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-teal-500 focus:ring-teal-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="role_is_active" className="text-xs font-bold text-slate-700 dark:text-[#F1F5F9] cursor-pointer">
                  Role Aktif (bisa dipilih saat membuat atau mengubah akun)
                </label>
              </div>

              {/* Checklist Hak Akses (Grouped) */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#183247]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-[#00C4D7]">
                    Pilih Hak Akses (Permissions)
                  </label>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#94A3B8]">
                    {roleForm.permissions.length} dipilih
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(groupedPermissions).map(([groupName, perms]) => {
                    const allInGroup = perms.every((p) => roleForm.permissions.includes(p.code));
                    return (
                      <div
                        key={groupName}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247]"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-[#183247]">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-[#F1F5F9]">
                            Modul: {groupName}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleGroupAll(groupName)}
                            className="text-[11px] font-bold text-teal-600 dark:text-[#00C4D7] hover:underline cursor-pointer"
                          >
                            {allInGroup ? 'Batal Semua' : 'Pilih Semua'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isChecked = roleForm.permissions.includes(p.code);
                            return (
                              <label
                                key={p.code}
                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-teal-500/10 border-teal-500/40 text-slate-900 dark:text-[#F1F5F9]'
                                    : 'bg-white dark:bg-[#0B1929] border-slate-200 dark:border-[#183247] text-slate-600 dark:text-[#94A3B8] hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(p.code)}
                                  className="mt-0.5 rounded border-slate-300 text-teal-500 focus:ring-teal-400 cursor-pointer"
                                />
                                <div>
                                  <div className="font-semibold">{p.label}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{p.code}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#183247] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRole(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] text-slate-700 dark:text-[#94A3B8] text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#07C995] to-[#00C4D7] text-slate-950 text-xs font-extrabold hover:opacity-95 shadow-md shadow-teal-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingRole ? 'Simpan Perubahan' : 'Buat Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: null, loading: false })
        }
        loading={deleteConfirm.loading}
      />
    </div>
  );
}
