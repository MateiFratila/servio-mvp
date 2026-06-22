import { useNavigate, useLocation, Link } from 'react-router-dom'

const benefits = [
  {
    icon: '🔍',
    title: 'Găsești expertul potrivit',
    desc: 'Caută consultanți după specialitate, citește profiluri detaliate și recenzii verificate înainte să rezervi.',
  },
  {
    icon: '📅',
    title: 'Rezervi în câteva secunde',
    desc: 'Alegi un slot disponibil direct din calendarul consultantului. Fără emailuri, fără așteptare.',
  },
  {
    icon: '💳',
    title: 'Plătești simplu și în siguranță',
    desc: 'Plata se face prin card, securizat prin Stripe. Banii sunt reținuți până la finalizarea sesiunii.',
  },
  {
    icon: '🎥',
    title: 'Sesiune video integrată',
    desc: 'Nimic de instalat. Sesiunea are loc direct în browser, fără aplicații externe.',
  },
  {
    icon: '📄',
    title: 'Documente și note în același loc',
    desc: 'Trimite documente relevante înainte de sesiune. Notele și materialele rămân accesibile după.',
  },
  {
    icon: '⭐',
    title: 'Recenzii după fiecare sesiune',
    desc: 'Lasă o recenzie și ajută comunitatea să găsească cei mai buni consultanți.',
  },
]

const steps = [
  { num: '01', title: 'Creezi un cont gratuit', desc: 'Înregistrarea durează sub un minut. Accesul în platformă este complet gratuit.' },
  { num: '02', title: 'Găsești consultantul potrivit', desc: 'Răsfoiești catalogul, citești profilurile și alegi specialistul care ți se potrivește.' },
  { num: '03', title: 'Rezervi și te prezinți', desc: 'Alegi un slot, plătești și te conectezi la ora stabilită. Atât.' },
]

export default function ClientLandingPage() {
  const navigate = useNavigate()
  const location = useLocation()

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
            Consultanță online, când ai nevoie
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Expertul potrivit,<br />la un click distanță.
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, lineHeight: 1.6, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            SERVIO te conectează cu consultanți verificați în domenii precum juridic, financiar, medical, tehnic și multe altele.
            Rapid, simplu și sigur.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/catalog')}
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
              Explorează consultanții →
            </button>
            <button
              className="btn"
              onClick={() => navigate('/client/inregistrare')}
              style={{
                background: 'transparent',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 12,
                transition: 'all 0.15s ease-in-out',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Creează cont gratuit
            </button>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, opacity: 0.7 }}>Înregistrarea este gratuită. Plătești doar sesiunile rezervate.</p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Tot ce ai nevoie, într-un singur loc</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 16, marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
            De la căutare până la sesiunea video — fără aplicații externe, fără complicații.
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
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Vezi cum funcționează SERVIO</h2>
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
              title="Prezentare SERVIO"
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
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 16, marginBottom: 48 }}>Trei pași și ești în sesiune.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {steps.map(s => (
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
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>Gata să îți rezolvi problema?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            Creează un cont gratuit și rezervă prima ta sesiune de consultanță în câteva minute.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/catalog')}
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
              Vezi consultanții disponibili →
            </button>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 24px', textAlign: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Ești consultant?{' '}
          <Link to="/consultant" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Află cum poți oferi sesiuni pe SERVIO</Link>
          {' · '}
          Ai deja cont?{' '}
          <Link to="/login" state={{ from: location }} style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Autentifică-te</Link>
        </p>
      </div>
    </div>
  )
}
