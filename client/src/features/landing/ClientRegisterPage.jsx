import ClientRegisterForm from '../auth/ClientRegisterForm'

export default function ClientRegisterPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 36 }}>
        <ClientRegisterForm />
      </div>
    </div>
  )
}
