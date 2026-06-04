const DAILY_API = 'https://api.daily.co/v1'

/**
 * Create a Daily.co room.
 * @param {{ name: string, exp: number }} opts
 *   name — room slug (must be unique)
 *   exp  — expiry as a JS timestamp (ms); converted to Unix seconds internally
 * @returns {Promise<{ url: string, name: string }>}
 */
async function createRoom({ name, exp }) {
  const res = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name,
      privacy: 'private',
      properties: {
        exp: Math.floor(exp / 1000),
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        enable_recording: 'cloud',
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Daily.co createRoom failed: ${res.status} ${text}`)
  }

  return res.json()
}

/**
 * Create a signed meeting token for a participant.
 * @param {{ roomName: string, userName: string, exp: number, isOwner?: boolean }} opts
 * @returns {Promise<{ token: string }>}
 */
async function createMeetingToken({ roomName, userName, exp, isOwner = false }) {
  const res = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        exp: Math.floor(exp / 1000),
        is_owner: isOwner,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Daily.co createMeetingToken failed: ${res.status} ${text}`)
  }

  return res.json()
}

module.exports = { createRoom, createMeetingToken }
