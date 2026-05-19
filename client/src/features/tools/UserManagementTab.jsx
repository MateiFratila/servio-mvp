import { useGetAllUsersQuery, useUpdateUserRoleMutation } from './toolsApi'

const ROLES = ['client', 'consultant', 'admin']

const ROLE_BADGE = {
  client: 'badge badge-grey',
  consultant: 'badge badge-blue',
  admin: 'badge badge-green',
}

export default function UserManagementTab() {
  const { data: users = [], isLoading } = useGetAllUsersQuery()
  const [updateUserRole] = useUpdateUserRoleMutation()

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
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{u.id}</td>
                  <td>{u.email}</td>
                  <td><span className={ROLE_BADGE[u.role] ?? 'badge'}>{u.role}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole({ id: u.id, role: e.target.value })}
                      style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                    >
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No users.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
