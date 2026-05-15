// TODO: replace PLACEHOLDER_SESSIONS with useGetMySessionsAsClientQuery()
const PLACEHOLDER_SESSIONS = [
  { id: 4821, consultant: 'Lorem Ipsum', dateTime: '20 May 2026, 10:30', status: 'pending' },
  { id: 4820, consultant: 'Dolor Sit', dateTime: '25 May 2026, 14:00', status: 'confirmed' },
  { id: 4819, consultant: 'Amet Consult', dateTime: '02 Jun 2026, 09:00', status: 'completed' },
]

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function MySessionsPanel() {
  const sessions = PLACEHOLDER_SESSIONS
  // TODO: const { data: sessions = [] } = useGetMySessionsAsClientQuery()
  // TODO: const [cancelSession] = useCancelSessionMutation()

  return (
    <div className="card">
      <h3 className="section-title">My Sessions</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Consultant</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.consultant}</td>
                <td style={{ color: 'var(--text-muted)' }}>{s.dateTime}</td>
                <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                <td>
                  {(s.status === 'pending' || s.status === 'confirmed') && (
                    <button className="btn btn-danger btn-sm">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
