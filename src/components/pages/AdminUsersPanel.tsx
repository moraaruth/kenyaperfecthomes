import React, { useCallback, useEffect, useState } from 'react';
import { Users, Plus, Trash2, Link2, RefreshCw, Save, X, Copy } from 'lucide-react';
import {
  ManagedUser,
  StaffRole,
  AccountStatus,
  listManagedUsers,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  createManagedUserResetLink,
} from '../../lib/authClient';

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'user', label: 'User (no staff access)' },
  { value: 'agent', label: 'Agent (manage listings)' },
  { value: 'admin', label: 'Admin (full access)' },
];

const STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'disabled', label: 'Disabled' },
];

const fieldClass =
  'px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-900';

const emptyDraft = {
  name: '',
  email: '',
  password: '',
  role: 'user' as StaffRole,
  status: 'active' as AccountStatus,
};

interface AdminUsersPanelProps {
  currentEmail: string;
}

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({ currentEmail }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: '',
    role: 'user' as StaffRole,
    status: 'active' as AccountStatus,
    password: '',
  });
  const [resetLink, setResetLink] = useState<{ email: string; url: string; expiresAt: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await listManagedUsers({ search: search.trim(), role: roleFilter, status: statusFilter });
    setIsLoading(false);
    if (res.ok) setUsers(res.data);
    else setError(res.error);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await createManagedUser(draft);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(`Created account for ${res.data.email}.`);
    setDraft(emptyDraft);
    setShowCreate(false);
    load();
  };

  const startEdit = (u: ManagedUser) => {
    setEditingId(u.id);
    setEditDraft({ name: u.name, role: u.role, status: u.status, password: '' });
    setError(null);
  };

  const handleSaveEdit = async (u: ManagedUser) => {
    setError(null);
    const payload: { name: string; role: StaffRole; status: AccountStatus; password?: string } = {
      name: editDraft.name,
      role: editDraft.role,
      status: editDraft.status,
    };
    if (editDraft.password) payload.password = editDraft.password;

    const res = await updateManagedUser(u.id, payload);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(`Updated ${u.email}.`);
    setEditingId(null);
    load();
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!window.confirm(`Delete the account for ${u.email}? This cannot be undone.`)) return;
    setError(null);
    const res = await deleteManagedUser(u.id);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(`Deleted ${u.email}.`);
    load();
  };

  const handleResetLink = async (u: ManagedUser) => {
    setError(null);
    const res = await createManagedUserResetLink(u.id);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResetLink({ email: u.email, url: res.data.resetUrl, expiresAt: res.data.expiresAt });
  };

  const copyResetLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink.url);
      setNotice('Reset link copied to clipboard.');
    } catch {
      setError('Could not copy automatically. Select the link and copy it manually.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-700" />
              <span>User Accounts</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Agents can manage listings. Admins can also manage accounts. Users have no staff access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-800 hover:bg-brand-900 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCreate ? 'Close' : 'New Account'}</span>
            </button>
          </div>
        </div>

        {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{error}</div>}
        {notice && !error && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">{notice}</div>
        )}

        {resetLink && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <p className="font-bold">One-time reset link for {resetLink.email}</p>
            <p className="text-[11px]">
              Share this link privately. It expires {new Date(resetLink.expiresAt).toLocaleString()} and works once.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input readOnly value={resetLink.url} onFocus={(e) => e.currentTarget.select()} className={`${fieldClass} flex-1 font-mono`} />
              <button onClick={copyResetLink} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white">
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button onClick={() => setResetLink(null)} className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <input required placeholder="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={fieldClass} />
            <input required type="email" placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={fieldClass} />
            <input required type="password" minLength={8} placeholder="Temporary password (min 8 characters)" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} className={fieldClass} />
            <div className="grid grid-cols-2 gap-3">
              <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as StaffRole })} className={fieldClass}>
                {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as AccountStatus })} className={fieldClass}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-brand-800 hover:bg-brand-900 text-white">
                <Save className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className={fieldClass} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={fieldClass}>
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={fieldClass}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {users.length === 0 ? (
          <p className="py-10 text-center text-xs text-neutral-500">No accounts match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-500 uppercase tracking-wider text-[10px] border-b border-neutral-100">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Last login</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.email === currentEmail;
                  const isEditing = editingId === u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <tr className="border-b border-neutral-100">
                        <td className="py-3 pr-3 font-semibold text-neutral-900">
                          {u.name} {isSelf && <span className="ml-1 text-[10px] text-brand-700">(you)</span>}
                        </td>
                        <td className="py-3 pr-3 font-mono text-neutral-600">{u.email}</td>
                        <td className="py-3 pr-3 capitalize">{u.role}</td>
                        <td className="py-3 pr-3 capitalize">{u.status}</td>
                        <td className="py-3 pr-3 text-neutral-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                        <td className="py-3 text-right whitespace-nowrap space-x-2">
                          <button onClick={() => (isEditing ? setEditingId(null) : startEdit(u))} className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 font-semibold text-neutral-700">
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                          <button onClick={() => handleResetLink(u)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 font-semibold text-neutral-700">
                            <Link2 className="w-3 h-3" />
                            <span>Reset link</span>
                          </button>
                          {!isSelf && (
                            <button onClick={() => handleDelete(u)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 font-semibold text-rose-700">
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                      {isEditing && (
                        <tr className="border-b border-neutral-100 bg-neutral-50">
                          <td colSpan={6} className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                              <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="Name" className={fieldClass} />
                              <select value={editDraft.role} onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value as StaffRole })} className={fieldClass} disabled={isSelf}>
                                {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <select value={editDraft.status} onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value as AccountStatus })} className={fieldClass} disabled={isSelf}>
                                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <input type="password" minLength={8} value={editDraft.password} onChange={(e) => setEditDraft({ ...editDraft, password: e.target.value })} placeholder="New password (optional)" className={fieldClass} />
                            </div>
                            <div className="flex justify-end mt-3">
                              <button onClick={() => handleSaveEdit(u)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-800 hover:bg-brand-900 text-white">
                                <Save className="w-3.5 h-3.5" />
                                <span>Save changes</span>
                              </button>
                              <button onClick={() => setEditingId(null)} className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-neutral-300 text-neutral-700">
                                <X className="w-3.5 h-3.5" />
                                <span>Close</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
