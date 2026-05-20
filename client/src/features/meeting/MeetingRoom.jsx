import { useEffect, useRef } from 'react'
import DailyIframe from '@daily-co/daily-js'

export default function MeetingRoom({ meetingUrl, token, onLeave }) {
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!wrapperRef.current) return

    // Reuse an existing call instance if one was left behind by Strict Mode's
    // double-invoke, otherwise create a fresh frame.
    const existing = DailyIframe.getCallInstance()
    const frame = existing ?? DailyIframe.createFrame(wrapperRef.current, {
      showLeaveButton: true,
      showFullscreenButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: 0,
      },
    })

    frame.join({ url: meetingUrl, ...(token ? { token } : {}) })
    frame.on('left-meeting', onLeave)

    return () => {
      frame.off('left-meeting', onLeave)
      frame.destroy()
    }
  }, [meetingUrl, onLeave])

  return <div ref={wrapperRef} style={{ width: '100vw', height: '100vh' }} />
}
