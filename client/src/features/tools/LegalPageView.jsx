import { useGetPublicLegalDocumentQuery } from './toolsApi'

export default function LegalPageView({ sectionKey, title }) {
  const { data, isLoading, isError } = useGetPublicLegalDocumentQuery(sectionKey)

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '64px 20px', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Se încarcă documentul…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container" style={{ padding: '64px 20px', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--red, #ef4444)' }}>Eroare la încărcarea documentului solicitat.</p>
      </div>
    )
  }

  const content = data?.value || ''

  return (
    <div className="container" style={{ padding: '48px 24px', maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ pointerEvents: 'none', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text, #1e293b)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
          Compania Excelform SRL • Actualizat la zi
        </p>
      </div>

      {!content || content === '<br>' || content.trim() === '' ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontStyle: 'italic' }}>Acest document legal este în curs de actualizare de către administratorii platformei.</p>
        </div>
      ) : (
        <div
          className="legal-document-rendered"
          style={{
            fontSize: '15px',
            lineHeight: '1.7',
            color: 'var(--text, #334155)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  )
}