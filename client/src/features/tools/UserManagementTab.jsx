import { useState } from 'react'

const ROLES = ['client', 'consultant', 'admin']

const PLACEHOLDER_USERS = [
  { id: 1, email: 'lorem@example.com', role: 'client', createdAt: '10 Jan 2026', isActive: true },
  { id: 2, email: 'ipsum@example.com', role: 'consultant', createdAt: '15 Feb 2026', isActive: true },
  { id: 3, email: 'dolor@example.com', role: 'admin', createdAt: '01 Jan 2026', isActive: true },
  { id: 4, email: 'sit@example.com', role: 'client', createdAt: '20 Mar 2026', isActive: true },
]

const ROLE_BADGE = {
  client: 'badge badge-grey',
  consultant: 'badge badge-blue',
  admin: 'badge badge-green',
}

export default function UserManagementTab() {
  const [users, setUsers] = useState(PLACEHOLDER_USERS)
  // TODO: const { data: users = [] } = useGetAllUsersQuery()
  // TODO: const [updateUserRole] = useUpdateUserRoleMutation()

  function changeRole(id, newRole) {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u))
  }

  function toggleActive(id) {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u))
  }

  return (
    <div className="card">
      <h3 className="section-title">User Management</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.id}</td>
                <td>{u.email}</td>
                <td><span className={ROLE_BADGE[u.role]}>{u.role}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{u.createdAt}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                    >
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => toggleActive(u.id)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
