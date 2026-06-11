import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useClientPagination } from '../../hooks/useClientPagination.js'
import { logAudit } from '../../lib/audit.js'
import { dataTable, formFieldInput, formFieldSelect, tableWrap } from '../../lib/formStyles.js'
import { createUserAccount, fetchUsers, updateUserProfile } from '../../lib/users.js'

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'officer',
  department: ''
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await fetchUsers()
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setUsers(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const { page, setPage, paginatedItems, totalCount, pageSize } = useClientPagination(users)

  function openCreate() {
    setForm(emptyForm)
    setCreateOpen(true)
    setMsg('')
    setError('')
  }

  function openEdit(u) {
    setEditUser(u)
    setForm({
      fullName: u.full_name,
      email: u.email,
      password: '',
      role: u.role,
      department: u.department ?? ''
    })
    setMsg('')
    setError('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createUserAccount({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: form.role,
        department: form.department.trim() || null
      })

      await logAudit({
        userId: user.id,
        action: 'user_created',
        entityType: 'profiles',
        details: { email: form.email.trim(), role: form.role }
      })

      setCreateOpen(false)
      setMsg('User account created successfully.')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to create user. Ensure the create-user Edge Function is deployed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editUser) return

    const adminCount = users.filter((u) => u.role === 'admin' && u.is_active).length
    if (editUser.role === 'admin' && form.role !== 'admin' && adminCount <= 1) {
      setError('Cannot change role. At least one active administrator must remain.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { error: updateError } = await updateUserProfile(editUser.id, {
        full_name: form.fullName.trim(),
        role: form.role,
        department: form.department.trim() || null
      })
      if (updateError) throw updateError

      await logAudit({
        userId: user.id,
        action: 'user_role_updated',
        entityType: 'profiles',
        entityId: editUser.id,
        details: { email: editUser.email, role: form.role }
      })

      setEditUser(null)
      setMsg('User updated successfully.')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to update user.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeactivate(target) {
    if (!window.confirm(`Deactivate ${target.full_name}? They will no longer be able to sign in.`)) return

    const adminCount = users.filter((u) => u.role === 'admin' && u.is_active).length
    if (target.role === 'admin' && adminCount <= 1) {
      setError('Cannot deactivate the only active administrator.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { error: updateError } = await updateUserProfile(target.id, { is_active: false })
      if (updateError) throw updateError

      await logAudit({
        userId: user.id,
        action: 'user_deactivated',
        entityType: 'profiles',
        entityId: target.id,
        details: { email: target.email }
      })

      setMsg(`${target.full_name} has been deactivated.`)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to deactivate user.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReactivate(target) {
    setBusy(true)
    setError('')
    try {
      const { error: updateError } = await updateUserProfile(target.id, { is_active: true })
      if (updateError) throw updateError

      await logAudit({
        userId: user.id,
        action: 'user_reactivated',
        entityType: 'profiles',
        entityId: target.id,
        details: { email: target.email }
      })

      setMsg(`${target.full_name} has been reactivated.`)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to reactivate user.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create accounts, assign roles, and manage access for ICT staff."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400"
          >
            Add User
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {msg}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={tableWrap}>
          <table className={dataTable}>
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    Loading users…
                  </td>
                </tr>
              )}
              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    No users found.
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedItems.map((u) => (
                  <tr key={u.id} className="border-t border-white/10 text-white/85">
                    <td className="px-4 py-3">{u.full_name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="px-4 py-3">{u.department || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={u.is_active ? 'text-emerald-300' : 'text-white/50'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                        >
                          Edit
                        </button>
                        {u.is_active ? (
                          <button
                            type="button"
                            disabled={busy || u.id === user.id}
                            onClick={() => handleDeactivate(u)}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleReactivate(u)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && totalCount > 0 && (
          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        )}
      </div>

      <Modal
        open={createOpen}
        title="Add User"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-user-form"
              disabled={busy}
              className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {busy ? 'Creating…' : 'Create User'}
            </button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-white/70">Full name</label>
            <input className={formFieldInput} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Email</label>
            <input type="email" className={formFieldInput} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Password</label>
            <input type="password" className={formFieldInput} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Role</label>
            <select className={formFieldSelect} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="officer">ICT Officer</option>
              <option value="admin">ICT Administrator</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/70">Department</label>
            <input className={formFieldInput} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editUser)}
        title="Edit User"
        onClose={() => setEditUser(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditUser(null)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-user-form"
              disabled={busy}
              className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-xs text-white/70">Full name</label>
            <input className={formFieldInput} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Email</label>
            <input className={formFieldInput} value={form.email} disabled />
          </div>
          <div>
            <label className="text-xs text-white/70">Role</label>
            <select className={formFieldSelect} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="officer">ICT Officer</option>
              <option value="admin">ICT Administrator</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/70">Department</label>
            <input className={formFieldInput} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
