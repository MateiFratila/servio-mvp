import { useNavigate } from 'react-router-dom'

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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        color: '#fff',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.75, marginBottom: 16 }}>
            Consultanță online, când ai nevoie
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            Expertul potrivit,<br />la un click distanță.
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.6, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Servio îți conectează cu consultanți verificați în domenii precum juridic, financiar, medical, tehnic și multe altele.
            Rapid, simplu și sigur.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => navigate('/catalog')}
              style={{
                background: '#fff',
                color: '#059669',
                fontWeight: 700,
                fontSize: 16,
                padding: '14px 32px',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
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
                border: '2px solid rgba(255,255,255,0.5)',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 8,
              }}
            >
              Creează cont gratuit
            </button>
          </div>
          <p style={{ marginTop: 14, fontSize: 13, opacity: 0.65 }}>Înregistrarea este gratuită. Plătești doar sesiunile rezervate.</p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '72px 24px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Tot ce ai nevoie, într-un singur loc</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48 }}>
            De la căutare până la sesiunea video — fără aplicații externe, fără complicații.
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

      {/* Video */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '72px 24px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Vezi cum funcționează Servio</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 40 }}>
            Un tur rapid al platformei — de la înregistrare până la prima sesiune.
          </p>
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%', /* 16:9 */
            height: 0,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Prezentare Servio"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 24px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Cum funcționează?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48 }}>Trei pași și ești în sesiune.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {steps.map(s => (
              <div key={s.num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: 48, height: 48,
                  borderRadius: '50%',
                  background: '#d1fae5',
                  color: '#059669',
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
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Gata să îți rezolvi problema?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Creează un cont gratuit și rezervă prima ta sesiune de consultanță în câteva minute.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => navigate('/catalog')}
              style={{
                background: '#059669',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                padding: '13px 28px',
              }}
            >
              Vezi consultanții disponibili →
            </button>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Ești consultant?{' '}
          <a href="/consultant" style={{ color: 'var(--primary)', fontWeight: 500 }}>Află cum poți oferi sesiuni pe Servio</a>
          {' · '}
          Ai deja cont?{' '}
          <a href="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Autentifică-te</a>
        </p>
      </div>
    </div>
  )
}
