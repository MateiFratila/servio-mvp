import { useState } from 'react'
import { useGetAllUsersQuery, useUpdateUserRoleMutation, useUpdateUserByAdminMutation } from './toolsApi'

const ROLES = ['client', 'consultant', 'admin']

const ROLE_BADGE = {
  client: 'badge badge-grey',
  consultant: 'badge badge-blue',
  admin: 'badge badge-green',
}

export default function UserManagementTab() {
  const { data: users = [], isLoading } = useGetAllUsersQuery()
  const [updateUserRole] = useUpdateUserRoleMutation()
  const [updateUserByAdmin, { isLoading: isUpdating }] = useUpdateUserByAdminMutation()

  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  function requestSort(key) {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  function getSortIcon(key) {
    if (sortConfig.key !== key) {
      return <span style={{ color: 'var(--text-muted)', opacity: 0.4, marginLeft: 6, fontSize: '0.85em' }}>↕</span>
    }
    return <span style={{ color: 'var(--primary-blue, var(--primary))', marginLeft: 6, fontSize: '0.85em' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig.key) return 0
    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]

    if (sortConfig.key === 'createdAt') {
      const aTime = aVal ? new Date(aVal).getTime() : 0
      const bTime = bVal ? new Date(bVal).getTime() : 0
      return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime
    }

    if (sortConfig.key === 'id') {
      const aId = Number(aVal) || 0
      const bId = Number(bVal) || 0
      return sortConfig.direction === 'asc' ? aId - bId : bId - aId
    }

    if (sortConfig.key === 'isDeleted') {
      const aDeleted = aVal ? 1 : 0
      const bDeleted = bVal ? 1 : 0
      return sortConfig.direction === 'asc' ? aDeleted - bDeleted : bDeleted - aDeleted
    }

    const aStr = String(aVal ?? '').toLowerCase()
    const bStr = String(bVal ?? '').toLowerCase()

    if (aStr < bStr) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aStr > bStr) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  async function handleToggleDelete(user) {
    try {
      await updateUserByAdmin({ id: user.id, isDeleted: !user.isDeleted }).unwrap()
    } catch (err) {
      alert(err?.data?.error || 'A apărut o eroare la schimbarea stării utilizatorului.')
    }
  }

  function handleOpenModal(user) {
    setSelectedUser(user)
    setNewPassword('')
    setError('')
    setSuccess('')
  }

  function handleCloseModal() {
    setSelectedUser(null)
    setNewPassword('')
    setError('')
    setSuccess('')
  }

  async function handleSavePassword() {
    if (newPassword.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere.')
      return
    }

    setError('')
    setSuccess('')
    try {
      await updateUserByAdmin({ id: selectedUser.id, password: newPassword }).unwrap()
      setSuccess('Parola utilizatorului a fost actualizată cu succes!')
      setNewPassword('')
      // Keep modal open/success message briefly or close shortly after
      setTimeout(() => {
        handleCloseModal()
      }, 1500)
    } catch (err) {
      setError(err?.data?.error || 'A apărut o eroare la salvarea parolei.')
    }
  }

  return (
    <div className="card">
      <h3 className="section-title">User Management</h3>
      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('id')}>
                  ID {getSortIcon('id')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('email')}>
                  Email {getSortIcon('email')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('role')}>
                  Role {getSortIcon('role')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('isDeleted')}>
                  Status {getSortIcon('isDeleted')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('createdAt')}>
                  Created At {getSortIcon('createdAt')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{u.id}</td>
                  <td>{u.email}</td>
                  <td><span className={ROLE_BADGE[u.role] ?? 'badge'}>{u.role}</span></td>
                  <td>
                    <span className={u.isDeleted ? 'badge badge-red' : 'badge badge-green'}>
                      {u.isDeleted ? 'Dezactivat' : 'Activ'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole({ id: u.id, role: e.target.value })}
                        style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                      >
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleOpenModal(u)}
                        style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border-color)', background: 'none' }}
                      >
                        Modifică Parola
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleToggleDelete(u)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          border: u.isDeleted ? '1px solid var(--green, #10b981)' : '1px solid var(--red, #ef4444)',
                          color: u.isDeleted ? 'var(--green, #10b981)' : 'var(--red, #ef4444)',
                          background: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {u.isDeleted ? 'Reactivează' : 'Dezactivează'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedUsers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No users.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ maxWidth: 400, width: '90%', padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Schimbă Parola</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Utilizator: {selectedUser.email}</p>
            
            {error && (
              <div className="badge badge-red" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="badge badge-green" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
                {success}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>Noua parolă (minim 8 caractere)</label>
              <input
                type="password"
                placeholder="Introdu noua parolă"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={handleCloseModal} disabled={isUpdating}>
                Anulează
              </button>
              <button className="btn btn-primary" onClick={handleSavePassword} disabled={isUpdating || newPassword.length < 8}>
                {isUpdating ? 'Se salvează…' : 'Salvează Parola'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
