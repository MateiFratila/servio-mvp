import { useState, useEffect, useRef } from 'react'

export default function HtmlEditor({ value, onChange, minHeight = '240px' }) {
  const [mode, setMode] = useState('visual') // 'visual' | 'html'
  const editorRef = useRef(null)

  // Sync internal content with external value
  useEffect(() => {
    if (editorRef.current && mode === 'visual') {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value, mode])

  const handleVisualChange = () => {
    if (editorRef.current) {
      const currentHTML = editorRef.current.innerHTML
      if (currentHTML !== value) {
        onChange(currentHTML)
      }
    }
  }

  // Formatting operations
  const applyFormat = (command, val = null) => {
    if (mode !== 'visual') return
    document.execCommand(command, false, val)
    handleVisualChange()
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  const promptLink = () => {
    const url = window.prompt('Introduceți link-ul URL (ex. https://exemplu.ro):')
    if (url) {
      applyFormat('createLink', url)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {/* Editor Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border, #e4e4e7)',
        paddingBottom: 8,
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {mode === 'visual' ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => applyFormat('bold')}
                title="Bold"
              >
                <b>B</b>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => applyFormat('italic')}
                title="Italic"
              >
                <i>I</i>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => applyFormat('underline')}
                title="Underline"
              >
                <u>U</u>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => applyFormat('strikeThrough')}
                title="StrikeThrough"
              >
                <s>S</s>
              </button>
              <span style={{ borderRight: '1px solid var(--border, #e4e4e7)', margin: '0 4px', height: '20px', alignSelf: 'center' }} />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', height: '28px', fontSize: '11px', fontWeight: 600 }}
                onClick={() => applyFormat('formatBlock', '<h2>')}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', height: '28px', fontSize: '11px', fontWeight: 600 }}
                onClick={() => applyFormat('formatBlock', '<h3>')}
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', height: '28px', fontSize: '11px', fontWeight: 600 }}
                onClick={() => applyFormat('formatBlock', '<p>')}
                title="Paragraph"
              >
                P
              </button>
              <span style={{ borderRight: '1px solid var(--border, #e4e4e7)', margin: '0 4px', height: '20px', alignSelf: 'center' }} />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', height: '28px', fontSize: '12px' }}
                onClick={() => applyFormat('insertUnorderedList')}
                title="Bullet List"
              >
                • Listă
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', height: '28px', fontSize: '12px' }}
                onClick={() => applyFormat('insertOrderedList')}
                title="Numbered List"
              >
                1. Listă
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', height: '28px', fontSize: '12px' }}
                onClick={promptLink}
                title="Insert Link"
              >
                🔗 Link
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', height: '28px', fontSize: '11px' }}
                onClick={() => applyFormat('unlink')}
                title="Remove Link"
              >
                unlink
              </button>
              <span style={{ borderRight: '1px solid var(--border, #e4e4e7)', margin: '0 4px', height: '20px', alignSelf: 'center' }} />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', height: '28px', fontSize: '11px' }}
                onClick={() => applyFormat('removeFormat')}
                title="Clear format"
              >
                Șterge format
              </button>
            </>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', alignSelf: 'center' }}>
              HTML Editor
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 8px', height: '28px' }}
            onClick={() => setMode('visual')}
          >
            Vizual
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'html' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 8px', height: '28px' }}
            onClick={() => setMode('html')}
          >
            Cod Sursă
          </button>
        </div>
      </div>

      {/* Editor Body Area */}
      <div style={{
        border: '1px solid var(--border, #e4e4e7)',
        borderRadius: 'var(--radius, 6px)',
        minHeight: minHeight,
        overflow: 'hidden',
        background: '#fff'
      }}>
        {mode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleVisualChange}
            onBlur={handleVisualChange}
            style={{
              outline: 'none',
              minHeight: minHeight,
              padding: '12px 16px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text, #1e293b)',
            }}
          />
        ) : (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              minHeight: minHeight,
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              padding: '12px 16px',
              color: '#0f172a',
              background: '#f8fafc',
              display: 'block',
              margin: 0,
              boxSizing: 'border-box'
            }}
          />
        )}
      </div>
    </div>
  )
}
