import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectCurrentRole } from '../auth/authSlice'
import { useLabels } from '../../lib/useLabels'
import {
  useUpdateAccountSettingsMutation,
  useDeleteMyAccountMutation,
  useGetConnectStatusQuery,
  useStartConnectOnboardingMutation,
} from './dashboardApi'

export default function AccountSettingsTab() {
  const role = useSelector(selectCurrentRole)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 520 }}>
      {role === 'consultant' && <FinanciarSection />}
      <ChangeEmailSection />
      <ChangePasswordSection />
      <DangerZoneSection />
    </div>
  )
}

// ── Financiar (consultant-only) ─────────────────────────────────────────────

function FinanciarSection() {
  const { data, isLoading, refetch, isFetching } = useGetConnectStatusQuery()
  const [startOnboarding, { isLoading: isStarting }] = useStartConnectOnboardingMutation()
  const t = useLabels()

  async function handleOnboard() {
    try {
      const result = await startOnboarding().unwrap()
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('[connect] onboarding failed', err)
    }
  }

  return (
    <div className="card">
      <h3 className="section-title">Financiar</h3>

      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Se încarcă…</p>
      ) : data?.stripeAccountId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: data.onboardingComplete ? '#22c55e' : '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {data.onboardingComplete
                ? 'Activ — plățile sunt direcționate automat'
                : 'Onboarding incomplet — finalizează configurarea'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Stripe ID</span>
            <code style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text)' }}>{data.stripeAccountId}</code>
          </div>
          {!data.onboardingComplete && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={handleOnboard} disabled={isStarting}>
                {isStarting ? 'Se redirecționează…' : 'Finalizează onboarding-ul'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={refetch} disabled={isFetching}>
                {isFetching ? 'Se verifică…' : 'Verifică statusul'}
              </button>
            </div>
          )}
          {data.onboardingComplete && (
            <div>
              <button className="btn btn-secondary btn-sm" onClick={handleOnboard} disabled={isStarting}>
                {isStarting ? 'Se redirecționează…' : 'Actualizează datele bancare'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Nu ai un cont Stripe conectat. Conectează-te pentru a primi plățile direct în contul tău bancar.
          </p>
          <div>
            <button className="btn btn-primary" onClick={handleOnboard} disabled={isStarting}>
              {isStarting ? 'Se redirecționează…' : 'Conectează cont Stripe'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Change email ────────────────────────────────────────────────────────────

function ChangeEmailSection() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [updateAccount, { isLoading, error }] = useUpdateAccountSettingsMutation()
  const t = useLabels()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    try {
      await updateAccount({ email }).unwrap()
      setSuccess(true)
      setEmail('')
    } catch {
      setSuccess(false)
    }
  }

  return (
    <div className="card">
      <h3 className="section-title">{t.accountSettings.changeEmail.title}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label>{t.accountSettings.changeEmail.newEmail}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSuccess(false) }}
            placeholder={t.accountSettings.changeEmail.placeholder}
            required
          />
        </div>
        {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error?.data?.error ?? t.accountSettings.changeEmail.error}</p>}
        {success && <p style={{ fontSize: 13, color: 'var(--green)' }}>{t.accountSettings.changeEmail.success}</p>}
        <div>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !email}>
            {isLoading ? t.accountSettings.changeEmail.saving : t.accountSettings.changeEmail.save}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Change password ─────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [success, setSuccess] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const [updateAccount, { isLoading, error }] = useUpdateAccountSettingsMutation()
  const t = useLabels()

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
    setMismatch(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { setMismatch(true); return }
    if (form.password.length < 8) return
    try {
      await updateAccount({ password: form.password }).unwrap()
      setSuccess(true)
      setForm({ password: '', confirm: '' })
    } catch {
      setSuccess(false)
    }
  }

  return (
    <div className="card">
      <h3 className="section-title">{t.accountSettings.changePassword.title}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label>{t.accountSettings.changePassword.newPassword}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Minimum 8 caractere"
            minLength={8}
            required
          />
        </div>
        <div className="form-group">
          <label>{t.accountSettings.changePassword.confirmPassword}</label>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => handleChange('confirm', e.target.value)}
            placeholder="Repeţă parola"
            required
          />
        </div>
        {mismatch && <p style={{ fontSize: 13, color: 'var(--red)' }}>{t.accountSettings.changePassword.mismatch}</p>}
        {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error?.data?.error ?? t.accountSettings.changePassword.error}</p>}
        {success && <p style={{ fontSize: 13, color: 'var(--green)' }}>{t.accountSettings.changePassword.success}</p>}
        <div>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !form.password || !form.confirm}>
            {isLoading ? t.accountSettings.changePassword.saving : t.accountSettings.changePassword.save}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Danger zone ─────────────────────────────────────────────────────────────

function DangerZoneSection() {
  const dispatch = useDispatch()
  const [confirming, setConfirming] = useState(false)
  const [deleteAccount, { isLoading, error }] = useDeleteMyAccountMutation()
  const t = useLabels()

  async function handleDelete() {
    try {
      await deleteAccount().unwrap()
      dispatch(logout())
    } catch {
      // error displayed below
    }
  }

  return (
    <div className="card" style={{ borderColor: 'var(--red)', borderWidth: 1 }}>
      <h3 className="section-title" style={{ color: 'var(--red)' }}>{t.accountSettings.dangerZone.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        {t.accountSettings.dangerZone.confirmMessage}
      </p>
      {!confirming ? (
        <button className="btn btn-danger" onClick={() => setConfirming(true)}>
          {t.accountSettings.dangerZone.deleteAccount}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>
            {t.accountSettings.dangerZone.confirmMessage}
          </p>
          {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error?.data?.error ?? t.accountSettings.changeEmail.error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? t.accountSettings.dangerZone.deleting : t.accountSettings.dangerZone.deleteAccount}
            </button>
            <button className="btn btn-secondary" onClick={() => setConfirming(false)}>
              {t.accountSettings.dangerZone.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
