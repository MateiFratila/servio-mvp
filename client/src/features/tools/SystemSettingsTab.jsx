import { useState } from 'react'
import { useGetSystemSettingsQuery, useUpdateSystemSettingMutation } from './toolsApi'

function ConfiguredBadge({ configured }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: configured ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
        color: configured ? 'var(--green, #22c55e)' : 'var(--red, #ef4444)',
      }}
    >
      {configured ? 'Configured' : 'Not set'}
    </span>
  )
}

function EditableField({ label, value, settingKey, hint }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [updateSetting, { isLoading }] = useUpdateSystemSettingMutation()
  const [saveError, setSaveError] = useState('')

  async function handleSave() {
    setSaveError('')
    try {
      await updateSetting({ key: settingKey, value: draft }).unwrap()
      setEditing(false)
    } catch (err) {
      setSaveError(err?.data?.error ?? 'Save failed')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {editing ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1, minWidth: 280, fontFamily: 'monospace', fontSize: 13 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setDraft(value) }}>
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{value || <span style={{ color: 'var(--text-muted)' }}>Not set</span>}</span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: '2px 8px' }}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>
      )}
      {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</div>}
      {saveError && <div style={{ fontSize: 12, color: 'var(--red, #ef4444)' }}>{saveError}</div>}
    </div>
  )
}

function EnvOnlyField({ label, configured, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ConfiguredBadge configured={configured} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>env var only — never sent to browser</span>
      </div>
      {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</div>}
    </div>
  )
}

export default function SystemSettingsTab() {
  const { data, isLoading, isError } = useGetSystemSettingsQuery()

  if (isLoading) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading settings…</p>
  if (isError) return <p style={{ color: 'var(--red, #ef4444)', fontSize: 13 }}>Failed to load settings.</p>

  const { stripe } = data
  const modeColor = stripe.mode === 'live' ? 'var(--green, #22c55e)' : 'var(--yellow, #f59e0b)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Stripe</h3>
          <span
            className="badge"
            style={{
              background: stripe.mode === 'live' ? 'rgba(34,197,94,.15)' : 'rgba(245,158,11,.15)',
              color: modeColor,
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: 11,
              letterSpacing: '0.05em',
            }}
          >
            {stripe.mode} mode
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <EditableField
            label="Publishable Key"
            value={stripe.publishableKey}
            settingKey="stripe_publishable_key"
            hint="Public key — safe to expose to the browser. Changes take effect immediately without redeployment."
          />
          <EnvOnlyField
            label="Secret Key"
            configured={stripe.secretKeyConfigured}
            hint="Set via STRIPE_SECRET_KEY environment variable on the server."
          />
          <EnvOnlyField
            label="Webhook Secret"
            configured={stripe.webhookSecretConfigured}
            hint="Set via STRIPE_WEBHOOK_SECRET environment variable on the server."
          />
        </div>

        {stripe.mode !== 'live' && (
          <div
            style={{
              background: 'rgba(245,158,11,.08)',
              border: '1px solid rgba(245,158,11,.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            You are in <strong>test mode</strong>. Switch to live keys in Azure environment variables when ready to accept real payments.
          </div>
        )}
      </div>

    </div>
  )
}
