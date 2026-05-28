import {
  useGetSuggestionsQuery,
  useApproveSpecialisationSuggestionMutation,
  useRejectSpecialisationSuggestionMutation,
  useApproveExpertiseAreaSuggestionMutation,
  useRejectExpertiseAreaSuggestionMutation,
} from './toolsApi'

export default function SuggestionsVettingTab() {
  const { data, isLoading } = useGetSuggestionsQuery()
  const [approveSpecialisation, { isLoading: approvingSpec }] = useApproveSpecialisationSuggestionMutation()
  const [rejectSpecialisation, { isLoading: rejectingSpec }] = useRejectSpecialisationSuggestionMutation()
  const [approveExpertiseArea, { isLoading: approvingArea }] = useApproveExpertiseAreaSuggestionMutation()
  const [rejectExpertiseArea, { isLoading: rejectingArea }] = useRejectExpertiseAreaSuggestionMutation()

  const specialisations = data?.specialisations ?? []
  const expertiseAreas = data?.expertiseAreas ?? []

  const handleApproveSpec = async (id, name) => {
    if (window.confirm(`Doriți să aprobați specializarea "${name}"? Ea va fi adăugată în catalog.`)) {
      try {
        const res = await approveSpecialisation(id).unwrap()
        alert(res?.message || 'Aprobat cu succes!')
      } catch (err) {
        alert(err?.data?.error || 'A apărut o eroare la aprobarea specializării.')
      }
    }
  }

  const handleRejectSpec = async (id, name) => {
    if (window.confirm(`Doriți să respingeți/ștergeți sugestia "${name}"?`)) {
      try {
        const res = await rejectSpecialisation(id).unwrap()
        alert(res?.message || 'Respins cu succes!')
      } catch (err) {
        alert(err?.data?.error || 'A apărut o eroare la respingerea specializării.')
      }
    }
  }

  const handleApproveArea = async (id, name) => {
    if (window.confirm(`Doriți să aprobați aria de expertiză "${name}"?`)) {
      try {
        const res = await approveExpertiseArea(id).unwrap()
        alert(res?.message || 'Aprobat cu succes!')
      } catch (err) {
        alert(err?.data?.error || 'A apărut o eroare la aprobarea ariei.')
      }
    }
  }

  const handleRejectArea = async (id, name) => {
    if (window.confirm(`Doriți să respingeți/ștergeți sugestia de arie "${name}"?`)) {
      try {
        const res = await rejectExpertiseArea(id).unwrap()
        alert(res?.message || 'Respins cu succes!')
      } catch (err) {
        alert(err?.data?.error || 'A apărut o eroare la respingerea ariei.')
      }
    }
  }

  const formatTime = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading suggestions…</p></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Suggested Specialisations ── */}
      <div className="card">
        <h3 className="section-title">Specializări Sugerate ({specialisations.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Sugestii de specializări noi trimise de consultanți, aflate în statusul <strong style={{ color: 'var(--blue)' }}>Pending</strong>.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 150 }}>Data Trimiterii</th>
                <th>Nume Specializare Sugerată</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 180, textAlign: 'center' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {specialisations.map((spec) => (
                <tr key={spec.id}>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {formatTime(spec.createdAt)}
                  </td>
                  <td style={{ fontSize: 14, fontWeight: 600 }}>
                    {spec.name}
                  </td>
                  <td>
                    <span className="badge badge-blue">{spec.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApproveSpec(spec.id, spec.name)}
                        disabled={approvingSpec}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Aprobă
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRejectSpec(spec.id, spec.name)}
                        disabled={rejectingSpec}
                        style={{ padding: '4px 10px', fontSize: 12, color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        Respinge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {specialisations.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    Nu există specializări sugerate în acest moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Suggested Expertise Areas ── */}
      <div className="card">
        <h3 className="section-title">Arii de Expertiză Sugerate ({expertiseAreas.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Sugestii de arii de expertiză pentru specializări existente, aflate în statusul <strong style={{ color: 'var(--blue)' }}>Pending</strong>.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 150 }}>Data Trimiterii</th>
                <th>Arie Expertiză Sugerată</th>
                <th>Specializare Părinte</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 180, textAlign: 'center' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {expertiseAreas.map((area) => (
                <tr key={area.id}>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {formatTime(area.createdAt)}
                  </td>
                  <td style={{ fontSize: 14, fontWeight: 600 }}>
                    {area.name}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                    {area.specialisation?.name || 'N/A'}
                  </td>
                  <td>
                    <span className="badge badge-blue">{area.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApproveArea(area.id, area.name)}
                        disabled={approvingArea}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Aprobă
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRejectArea(area.id, area.name)}
                        disabled={rejectingArea}
                        style={{ padding: '4px 10px', fontSize: 12, color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        Respinge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expertiseAreas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    Nu există arii de expertiză sugerate în acest moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
