import { useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetSessionQuery, useGetMeetingTokenQuery } from '../catalogue/catalogueApi'
import MeetingRoom from './MeetingRoom'

export default function MeetingPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { data: session, isLoading, error } = useGetSessionQuery(sessionId, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useGetMeetingTokenQuery(
    sessionId,
    { skip: !session?.meetingUrl }
  )

  const handleLeave = useCallback(() => navigate(-1), [navigate])

  if (isLoading || tokenLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading meeting…</p>
      </div>
    )
  }

  if (error || !session || tokenError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <p>{tokenError ? 'Could not get meeting access.' : 'Session not found.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    )
  }

  if (!session.meetingUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <p>Meeting room is not ready yet.</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000' }}>
      <MeetingRoom meetingUrl={session.meetingUrl} token={tokenData?.token} onLeave={handleLeave} />
    </div>
  )
}
