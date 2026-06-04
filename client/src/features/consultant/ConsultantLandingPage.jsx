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
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--dark-blue) 100%)',
        color: '#fff',
        padding: '96px 24px',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-orange)', marginBottom: 16 }}>
            Devino consultant pe SERVO
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Transformă-ți expertiza în venituri, online.
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, lineHeight: 1.6, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            SERVO este platforma care conectează consultanți verificați cu clienți care au nevoie de ajutor concret.
            Fără intermediari, fără bătăi de cap.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/consultant/inregistrare')}
            style={{
              background: 'var(--accent-orange)',
              color: 'var(--primary-dark)',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 32px',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 16px rgba(252, 170, 89, 0.3)',
            }}
          >
            Înregistrează-te! →
          </button>
          <p style={{ marginTop: 16, fontSize: 13, opacity: 0.7 }}>Înregistrarea este gratuită. Platforma reține un comision doar la sesiunile finalizate.</p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>De ce SERVO?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 16, marginBottom: 48 }}>
            Tot ce ai nevoie ca să îți desfășori activitatea de consultanță profesional.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {benefits.map(b => (
              <div key={b.title} className="card" style={{ padding: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{b.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Vezi cum funcționează SERVO</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 16, marginBottom: 40 }}>
            Un tur rapid al platformei — de la înregistrare până la prima sesiune.
          </p>
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%', /* 16:9 */
            height: 0,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}>
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Prezentare SERVO"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Cum funcționează?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 16, marginBottom: 48 }}>Trei pași simpli și ești activ pe platformă.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: 48, height: 48,
                  borderRadius: '50%',
                  background: 'var(--blue-bg)',
                  color: 'var(--primary-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14,
                }}>
                  {s.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>Ești gata să începi?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            Înregistrarea durează câteva minute. Echipa noastră îți va verifica profilul și te vom activa în platformă în cel mai scurt timp.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/consultant/inregistrare')}
            style={{
              background: 'var(--accent-orange)',
              color: 'var(--primary-dark)',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 32px',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 16px rgba(252, 170, 89, 0.3)',
            }}
          >
            Completează formularul de înregistrare →
          </button>
        </div>
      </section>

      {/* Footer note */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 24px', textAlign: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Ai deja cont?{' '}
          <a href="/login" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Autentifică-te</a>
        </p>
      </div>
    </div>
  )
}
