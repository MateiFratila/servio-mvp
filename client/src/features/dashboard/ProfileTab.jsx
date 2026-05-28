import { useState, useEffect, useRef } from 'react'
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadAvatarMutation,
  useUploadBannerMutation,
  useGetSpecialisationsQuery,
  useSuggestSpecialisationMutation,
  useSuggestExpertiseAreaMutation,
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

// ── Specialisation picker ─────────────────────────────────────────────────

function SpecialisationPicker({
  specialisationIds,
  onChangeIds,
  categoryIds,
  onChangeCategoryIds,
  allSpecialisations,
  onSuggestSpecialisation,
  onSuggestExpertiseArea,
}) {
  function addSpecialisation() {
    const available = allSpecialisations.filter((s) => !specialisationIds.includes(s.id))
    if (available.length === 0) return
    onChangeIds([...specialisationIds, available[0].id])
  }

  function removeSpecialisation(specId) {
    const spec = allSpecialisations.find((s) => s.id === specId)
    const areaIds = spec ? spec.expertiseAreas.map((a) => a.id) : []
    onChangeIds(specialisationIds.filter((id) => id !== specId))
    onChangeCategoryIds(categoryIds.filter((id) => !areaIds.includes(id)))
  }

  function changeSpecialisation(oldId, newId) {
    const oldSpec = allSpecialisations.find((s) => s.id === oldId)
    const oldAreaIds = oldSpec ? oldSpec.expertiseAreas.map((a) => a.id) : []
    onChangeIds(specialisationIds.map((id) => (id === oldId ? newId : id)))
    onChangeCategoryIds(categoryIds.filter((id) => !oldAreaIds.includes(id)))
  }

  function toggleArea(areaId) {
    onChangeCategoryIds(
      categoryIds.includes(areaId) ? categoryIds.filter((id) => id !== areaId) : [...categoryIds, areaId],
    )
  }

  const canAdd = specialisationIds.length < allSpecialisations.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {specialisationIds.map((specId) => {
        const spec = allSpecialisations.find((s) => s.id === specId)
        const availableOptions = allSpecialisations.filter((s) => !specialisationIds.includes(s.id) || s.id === specId)
        return (
          <div key={specId} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Specialisation select row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={specId}
                onChange={(e) => {
                  if (e.target.value === 'suggest') {
                    onSuggestSpecialisation()
                  } else {
                    changeSpecialisation(specId, Number(e.target.value))
                  }
                }}
                style={{ flex: 1 }}
              >
                {availableOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="suggest">— Sugerează o specializare…</option>
              </select>
              {specialisationIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSpecialisation(specId)}
                  style={{ padding: '0 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}
                  aria-label="Elimină specializarea"
                >
                  ×
                </button>
              )}
            </div>

            {/* Expertise areas for this specialisation */}
            {spec && spec.expertiseAreas.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Arii de expertiză</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {spec.expertiseAreas.map((area) => {
                    const active = categoryIds.includes(area.id)
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => toggleArea(area.id)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'var(--primary)' : 'var(--surface)',
                          color: active ? '#fff' : 'var(--text)',
                          fontSize: 12,
                          cursor: 'pointer',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {area.name}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => onSuggestExpertiseArea(spec.id)}
                    style={{
                      padding: '3px 12px',
                      borderRadius: 999,
                      border: '1.5px dashed var(--primary)',
                      background: 'transparent',
                      color: 'var(--primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    + Sugerează o arie…
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div>
        <button
          type="button"
          onClick={addSpecialisation}
          disabled={!canAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)', background: 'transparent', cursor: canAdd ? 'pointer' : 'not-allowed', color: canAdd ? 'var(--primary)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, opacity: canAdd ? 1 : 0.5 }}
        >
          + Adaugă specializare
        </button>
      </div>
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

// ── Suggestion Modals ──────────────────────────────────────────────────────

function SuggestSpecialisationModal({ onClose }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [suggestSpec, { isLoading: submitting }] = useSuggestSpecialisationMutation()

  async function handleSuggest(e) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setSuccess(false)
    try {
      await suggestSpec({ name: name.trim() }).unwrap()
      setSuccess(true)
      setName('')
    } catch (err) {
      setError(err?.data?.error || 'A apărut o eroare la salvarea sugestiei.')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', width: '100%', maxWidth: 450, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Sugerează o specializare</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--green)', fontSize: 14 }}>
              Sugestia ta a fost trimisă cu succes în statusul "Pending"! Un administrator o va verifica în cel mai scurt timp.
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>Închide</button>
          </div>
        ) : (
          <form onSubmit={handleSuggest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Nume specializare sugerată</label>
              <input
                required
                placeholder="ex. Taxe Locale"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Renunță</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
                {submitting ? 'Se trimite…' : 'Trimite sugestia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function SuggestExpertiseAreaModal({ specialisationId, allSpecialisations, onClose }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [suggestArea, { isLoading: submitting }] = useSuggestExpertiseAreaMutation()

  const parentSpec = allSpecialisations.find(s => s.id === specialisationId)

  async function handleSuggest(e) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setSuccess(false)
    try {
      await suggestArea({ name: name.trim(), specialisationId }).unwrap()
      setSuccess(true)
      setName('')
    } catch (err) {
      setError(err?.data?.error || 'A apărut o eroare la salvarea sugestiei.')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', width: '100%', maxWidth: 450, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Sugerează o arie de expertiză</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Sugerează o arie de expertiză pentru specializarea: <strong>{parentSpec?.name}</strong>
        </p>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--green)', fontSize: 14 }}>
              Sugestia ta a fost trimisă cu succes în statusul "Pending"! Un administrator o va verifica în cel mai scurt timp.
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>Închide</button>
          </div>
        ) : (
          <form onSubmit={handleSuggest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Nume arie de expertiză sugerată</label>
              <input
                required
                placeholder="ex. Taxarea criptomonedelor"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Renunță</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
                {submitting ? 'Se trimite…' : 'Trimite sugestia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ProfileTab() {
  const { data: me, isLoading } = useGetMyProfileQuery()
  const { data: allSpecialisations = [] } = useGetSpecialisationsQuery()
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation()
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation()
  const [uploadBanner, { isLoading: uploadingBanner }] = useUploadBannerMutation()

  const [showSuggestSpec, setShowSuggestSpec] = useState(false)
  const [showSuggestArea, setShowSuggestArea] = useState(false)
  const [suggestAreaSpecId, setSuggestAreaSpecId] = useState(null)

  const profileData = me
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profileData && !form) {
      setForm({
        displayName: profileData.displayName ?? '',
        specialisationIds: (profileData.specialisations ?? []).map((cs) => cs.specialisation.id),
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
      specialisationIds: form.specialisationIds,
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
            <label>Specializări</label>
            {form.specialisationIds.length === 0 && allSpecialisations.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Nicio specializare selectată. Apasă butonul de mai jos pentru a adăuga una.
              </p>
            )}
            <SpecialisationPicker
              specialisationIds={form.specialisationIds}
              onChangeIds={(v) => {
                handleChange('specialisationIds', v)
                setSaved(false)
              }}
              categoryIds={form.categoryIds}
              onChangeCategoryIds={(v) => handleChange('categoryIds', v)}
              allSpecialisations={allSpecialisations}
              onSuggestSpecialisation={() => setShowSuggestSpec(true)}
              onSuggestExpertiseArea={(specId) => {
                setSuggestAreaSpecId(specId)
                setShowSuggestArea(true)
              }}
            />
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

      {showSuggestSpec && (
        <SuggestSpecialisationModal onClose={() => setShowSuggestSpec(false)} />
      )}

      {showSuggestArea && (
        <SuggestExpertiseAreaModal
          specialisationId={suggestAreaSpecId}
          allSpecialisations={allSpecialisations}
          onClose={() => {
            setShowSuggestArea(false)
            setSuggestAreaSpecId(null)
          }}
        />
      )}
    </div>
  )
}

