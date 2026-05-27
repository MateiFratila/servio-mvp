import { useState, useEffect, useRef } from 'react'
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadAvatarMutation,
  useUploadBannerMutation,
  useGetExpertiseCategoriesQuery,
} from './dashboardApi'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ro', label: 'Romanian' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'pl', label: 'Polish' },
]

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

// ── Small helpers ──────────────────────────────────────────────────────────

function ImageUploadArea({ label, proxyUrl, onUpload, uploading, aspect }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [hasExisting, setHasExisting] = useState(true)

  function handleFile(file) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    const fd = new FormData()
    fd.append('file', file)
    onUpload(fd)
  }

  const imgSrc = preview || (hasExisting ? proxyUrl : null)

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 'var(--radius)',
          border: '2px dashed var(--border)',
          background: 'var(--grey-bg)',
          overflow: 'hidden',
          cursor: uploading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setHasExisting(false)}
          />
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to upload</span>
        )}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Uploading…
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  function addTag() {
    const val = input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').trim()
    if (!val || tags.includes(val)) { setInput(''); return }
    onChange([...tags, val])
    setInput('')
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map((tag) => (
          <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'var(--blue-bg)', color: 'var(--blue)', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, padding: 0, fontSize: 14 }}
              aria-label={`Remove ${tag}`}
            >×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          placeholder="add-a-tag (Enter)"
          style={{ flex: 1 }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
      </div>
    </div>
  )
}

function MultiSelect({ options, selected, onChange, labelKey = 'label', valueKey = 'id' }) {
  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => {
        const val = opt[valueKey]
        const active = selected.includes(val)
        return (
          <button
            key={val}
            type="button"
            onClick={() => toggle(val)}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
              background: active ? 'var(--primary)' : 'var(--surface)',
              color: active ? '#fff' : 'var(--text)',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: active ? 600 : 400,
            }}
          >
            {opt[labelKey]}
          </button>
        )
      })}
    </div>
  )
}

function HourlyRateTooltip() {
  const [visible, setVisible] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{ cursor: 'help', fontSize: 13, color: 'var(--text-muted)' }}>ⓘ</span>
      {visible && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          background: '#1e293b',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          Please note that the platform will keep 30% of the total value
        </span>
      )}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ProfileTab() {
  const { data: me, isLoading } = useGetMyProfileQuery()
  const { data: allCategories = [] } = useGetExpertiseCategoriesQuery()
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation()
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation()
  const [uploadBanner, { isLoading: uploadingBanner }] = useUploadBannerMutation()

  const profileData = me
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profileData && !form) {
      setForm({
        displayName: profileData.displayName ?? '',
        specialisation: profileData.specialisation ?? SPECIALISATIONS[0],
        description: profileData.description ?? '',
        hourlyRate: Number(profileData.hourlyRate) ?? 0,
        languages: Array.isArray(profileData.languages) ? profileData.languages : [],
        categoryIds: (profileData.expertiseCategories ?? []).map((ec) => ec.category.id),
        tags: (profileData.tags ?? []).map((t) => t.tag),
      })
    }
  }, [profileData, form])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await updateProfile({
      displayName: form.displayName,
      specialisation: form.specialisation,
      description: form.description,
      hourlyRate: form.hourlyRate,
      languages: form.languages,
      categoryIds: form.categoryIds,
      tags: form.tags,
    })
    setSaved(true)
  }

  if (isLoading || !form) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  const profileId = profileData?.id
  const avatarSrc = profileId ? `/api/consultants/${profileId}/avatar` : null
  const bannerSrc = profileId ? `/api/consultants/${profileId}/banner` : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>

      {/* ── Media ── */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 16 }}>Profile Media</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ImageUploadArea
            label="Banner"
            proxyUrl={bannerSrc}
            onUpload={(fd) => uploadBanner(fd)}
            uploading={uploadingBanner}
            aspect="4/1"
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ width: 80, flexShrink: 0 }}>
              <ImageUploadArea
                label="Avatar"
                proxyUrl={avatarSrc}
                onUpload={(fd) => uploadAvatar(fd)}
                uploading={uploadingAvatar}
                aspect="1/1"
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              JPEG, PNG or WebP. Avatar max 5 MB. Banner is displayed at the top of your public profile page.
            </p>
          </div>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 16 }}>Profile Details</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="form-group">
            <label>Display Name</label>
            <input value={form.displayName} onChange={(e) => handleChange('displayName', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Primary Specialisation</label>
            <select value={form.specialisation} onChange={(e) => handleChange('specialisation', e.target.value)}>
              {SPECIALISATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea rows={4} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Hourly Rate (€)
              <HourlyRateTooltip />
            </label>
            <input
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Expertise Areas</label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Select all that apply</p>
            <MultiSelect
              options={allCategories}
              selected={form.categoryIds}
              onChange={(v) => handleChange('categoryIds', v)}
              labelKey="name"
              valueKey="id"
            />
          </div>

          <div className="form-group">
            <label>Hashtags</label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Add specific keywords clients can search for (e.g. intrastat, transfer-pricing)
            </p>
            <TagInput tags={form.tags} onChange={(v) => handleChange('tags', v)} />
          </div>

          <div className="form-group">
            <label>Languages</label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Languages you can offer consultations in</p>
            <MultiSelect
              options={LANGUAGES}
              selected={form.languages}
              onChange={(v) => handleChange('languages', v)}
              labelKey="label"
              valueKey="code"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Saved</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

