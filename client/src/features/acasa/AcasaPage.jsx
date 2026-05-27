import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CataloguePage from '../catalogue/CataloguePage'
import Footer from './Footer'

const SLIDES = [
  {
    id: 'consultant',
    heading: 'Devino consultant',
    sub: 'Oferă-ți expertiza fiscală și construiește-ți clientela pe Servio.',
    cta: 'Află mai mult',
    href: '/consultant',
    bg: '#1e3a5f',
  },
  {
    id: 'client',
    heading: 'Găsește un consultant',
    sub: 'Conectează-te cu cei mai buni consultanți fiscali în câțiva pași.',
    cta: 'Caută acum',
    href: '/client',
    bg: '#1a4731',
  },
]

export default function AcasaPage() {
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const slide = SLIDES[active]

  function prev() { setActive((active - 1 + SLIDES.length) % SLIDES.length) }
  function next() { setActive((active + 1) % SLIDES.length) }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Unit */}
      <div style={{ background: slide.bg, color: '#fff', padding: '72px 0', transition: 'background 0.4s', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>{slide.heading}</h1>
          <p style={{ fontSize: 18, opacity: 0.75, maxWidth: 520 }}>{slide.sub}</p>
          <button
            className="btn"
            style={{ fontSize: 15, padding: '12px 28px', marginTop: 4, background: '#fff', color: slide.bg, fontWeight: 600 }}
            onClick={() => navigate(slide.href)}
          >
            {slide.cta}
          </button>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
                style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', transition: 'background 0.2s', background: i === active ? '#fff' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        </div>
        {/* Arrows */}
        <button onClick={prev} aria-label="Previous" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <button onClick={next} aria-label="Next" style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      </div>

      {/* Catalogue */}
      <CataloguePage />

      {/* Footer */}
      <Footer />
    </div>
  )
}
