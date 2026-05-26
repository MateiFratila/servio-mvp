import { useNavigate } from 'react-router-dom'

const benefits = [
  {
    icon: '📅',
    title: 'Programări fără bătăi de cap',
    desc: 'Clienții rezervă direct în calendarul tău. Tu confirmi, ele se sincronizează automat.',
  },
  {
    icon: '💳',
    title: 'Plăți sigure și rapide',
    desc: 'Fiecare sesiune este plătită în avans prin card. Banii ajung în contul tău după finalizare.',
  },
  {
    icon: '🎥',
    title: 'Video integrat',
    desc: 'Nu ai nevoie de instrumente externe. Sesiunile video se desfășoară direct în platformă.',
  },
  {
    icon: '📄',
    title: 'Documente și note centralizate',
    desc: 'Schimbă documente și note cu clienții înainte și după sesiune, totul într-un singur loc.',
  },
  {
    icon: '⭐',
    title: 'Reputație construită pe recenzii reale',
    desc: 'Clienții lasă recenzii după fiecare sesiune. Profilul tău crește organic.',
  },
  {
    icon: '🔧',
    title: 'Cont dedicat de consultant',
    desc: 'Dashboard propriu cu toate sesiunile, disponibilitatea și veniturile tale.',
  },
]

const steps = [
  { num: '01', title: 'Creezi un cont', desc: 'Completezi formularul de înregistrare și trimiți profilul spre aprobare.' },
  { num: '02', title: 'Îți configurezi profilul', desc: 'Adaugi specialitatea, tariful orar, disponibilitatea și o scurtă descriere.' },
  { num: '03', title: 'Primești clienți', desc: 'Clienții te găsesc în catalog, rezervă și plătesc. Tu confirmi și te prezinți.' },
]

export default function ConsultantLandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        color: '#fff',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.75, marginBottom: 16 }}>
            Devino consultant pe Servio
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            Transformă-ți expertiza în venituri, online.
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.6, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Servio este platforma care conectează consultanți verificați cu clienți care au nevoie de ajutor concret.
            Fără intermediari, fără complicații.
          </p>
          <button
            className="btn"
            onClick={() => navigate('/consultant/inregistrare')}
            style={{
              background: '#fff',
              color: '#2563eb',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 32px',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            Înregistrează-te ca consultant →
          </button>
          <p style={{ marginTop: 14, fontSize: 13, opacity: 0.65 }}>Înregistrarea este gratuită. Platforma reținee un comision doar la sesiunile finalizate.</p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '72px 24px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>De ce Servio?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48 }}>
            Tot ce ai nevoie ca să îți desfășori activitatea de consultanță profesional.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {benefits.map(b => (
              <div key={b.title} className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{b.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '72px 24px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Cum funcționează?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48 }}>Trei pași simpli și ești activ pe platformă.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: 48, height: 48,
                  borderRadius: '50%',
                  background: 'var(--blue-bg)',
                  color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                }}>
                  {s.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section style={{ padding: '72px 24px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Ești gata să începi?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Înregistrarea durează câteva minute. Echipa noastră îți va verifica profilul și te vom activa în platformă în cel mai scurt timp.
          </p>
          <button
            className="btn"
            onClick={() => navigate('/consultant/inregistrare')}
            style={{
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              padding: '13px 28px',
            }}
          >
            Completează formularul de înregistrare →
          </button>
        </div>
      </section>

      {/* Footer note */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Ai deja cont?{' '}
          <a href="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Autentifică-te</a>
        </p>
      </div>
    </div>
  )
}
