import { useState, useEffect, useRef } from 'react'
import { useGetSystemSettingsQuery, useUpdateSystemSettingMutation } from './toolsApi'

const POLICIES = [
  { key: 'legal_terms', label: 'Termeni și Condiții', displayLabel: 'Termeni și Condiții' },
  { key: 'legal_privacy', label: 'GDPR & Confidențialitate', displayLabel: 'Politica de Confidențialitate' },
  { key: 'legal_cookies', label: 'Politica de Cookies', displayLabel: 'Politica de Cookies' },
]

export default function LegalSettingsTab() {
  const { data: settings, isLoading, refetch } = useGetSystemSettingsQuery()
  const [updateSetting, { isLoading: isSaving }] = useUpdateSystemSettingMutation()

  const [activeKey, setActiveKey] = useState('legal_terms')
  const [mode, setMode] = useState('visual') // 'visual' | 'html'
  const [htmlContent, setHtmlContent] = useState('')
  const [saveStatus, setSaveStatus] = useState(null) // { success: boolean, message: string }

  const editorRef = useRef(null)

  // Sync content when settings or activePolicy shifts
  useEffect(() => {
    if (settings?.legal) {
      const value = settings.legal[activeKey] ?? ''
      setHtmlContent(value)
      if (editorRef.current && mode === 'visual') {
        editorRef.current.innerHTML = value
      }
    }
  }, [settings, activeKey, mode])

  const handleVisualChange = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML)
    }
  }

  // Formatting operations
  const applyFormat = (command, value = null) => {
    if (mode !== 'visual') return
    document.execCommand(command, false, value)
    handleVisualChange()
  }

  const promptLink = () => {
    const url = window.prompt('Introduceți link-ul URL:')
    if (url) {
      applyFormat('createLink', url)
    }
  }

  const handleSave = async () => {
    setSaveStatus(null)
    let currentContent = htmlContent
    if (mode === 'visual' && editorRef.current) {
      currentContent = editorRef.current.innerHTML
    }

    try {
      await updateSetting({ key: activeKey, value: currentContent }).unwrap()
      setSaveStatus({ success: true, message: 'Actualizat cu succes!' })
      refetch()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err) {
      setSaveStatus({ success: false, message: err?.data?.error ?? 'Eroare la salvare.' })
    }
  }

  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>Se încarcă paginile legale…</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 12 }}>Documente Legale (Ts&Cs, GDPR, Cookies)</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Gestionați conținutul paginilor legale ale platformei. Textul poate fi redactat direct sau copiat din Microsoft Word sau alte editoare de documente. Modificările se vor reflecta în timp real pe paginile publice ale platformei.
        </p>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 10, margin: '16px 0', flexWrap: 'wrap' }}>
          {POLICIES.map((p) => {
            const isActive = activeKey === p.key
            return (
              <button
                key={p.key}
                type="button"
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}
                onClick={() => {
                  setActiveKey(p.key)
                  setSaveStatus(null)
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Editor Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {mode === 'visual' ? (
              <>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('bold')} title="Bold"><b>B</b></button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('italic')} title="Italic"><i>I</i></button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('underline')} title="Underline"><u>U</u></button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('strikeThrough')} title="StrikeThrough"><s>S</s></button>
                <span style={{ borderRight: '1px solid var(--border)', margin: '0 4px' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('formatBlock', '<h2>')} title="Heading 2">H2</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('formatBlock', '<h3>')} title="Heading 3">H3</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('formatBlock', '<p>')} title="Paragraph">P</button>
                <span style={{ borderRight: '1px solid var(--border)', margin: '0 4px' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('insertUnorderedList')} title="Bullet List">• listă</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('insertOrderedList')} title="Numbered List">1. listă</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={promptLink} title="Insert Link">🔗 link</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('unlink')} title="Remove Link">unlink</button>
                <span style={{ borderRight: '1px solid var(--border)', margin: '0 4px' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyFormat('removeFormat')} title="Clear format">Șterge format</button>
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Editor Cod Sursă HTML</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => {
                if (mode === 'html' && editorRef.current) {
                  // sync HTML input value to contentEditable reference when swapping visual
                }
                setMode('visual')
              }}
            >
              Vizual (WYSIWYG)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'html' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => {
                if (mode === 'visual' && editorRef.current) {
                  setHtmlContent(editorRef.current.innerHTML)
                }
                setMode('html')
              }}
            >
              Sursă HTML
            </button>
          </div>
        </div>

        {/* Editor Body Area */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: '360px', overflow: 'hidden', background: '#fff' }}>
          {mode === 'visual' ? (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleVisualChange}
              onBlur={handleVisualChange}
              style={{
                outline: 'none',
                minHeight: '360px',
                padding: '16px 20px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#1e293b',
              }}
            />
          ) : (
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '360px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                padding: '16px 20px',
                color: '#0f172a',
                background: '#f8fafc',
                display: 'block',
              }}
              placeholder="Scrie sau inserează cod HTML..."
            />
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-start', marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ fontWeight: 600 }}
          >
            {isSaving ? 'Se salvează…' : 'Salvează Modificările'}
          </button>

          {saveStatus && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: saveStatus.success ? 'var(--green, #22c55e)' : 'var(--red, #ef4444)',
              }}
            >
              {saveStatus.success ? '✓ ' : '✗ '}
              {saveStatus.message}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}