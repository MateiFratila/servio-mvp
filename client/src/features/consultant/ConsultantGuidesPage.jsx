import { useNavigate } from 'react-router-dom'

export default function ConsultantGuidesPage() {
  const navigate = useNavigate()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '48px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>📘</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary-dark)', marginBottom: 12 }}>
            Ghidul Succesului tău pe SERVIO
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Bine ai venit în comunitatea de consultanți SERVIO! Acest ghid te va ajuta să îți configurezi profilul pentru a atrage cât mai mulți clienți și a asigura o colaborare excelentă.
          </p>
        </div>

        {/* Dynamic Profile Completion Checklist Guideline Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 44 }}>
          
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✉️</span> 1. Confirmarea adresei de email
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Primul pas critic este verificarea identității tale digitale. Dă click pe link-ul primit pe email pentru a-ți asigura accesul securizat la instrumentele de consultanță.
            </p>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💰</span> 2. Setarea tarifului orar optim
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 10 }}>
              Tariful tău reflectă valoarea experienței tale profesionale. 
            </p>
            <ul style={{ paddingLeft: 20, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong>Sfat util:</strong> Începe cu un tarif competitiv pentru a strânge primele review-uri pozitive.</li>
              <li><strong>Transparență totală:</strong> SERVIO aplică un comision platformă standard (afișat în panou), restul sumei ajungând direct la tine.</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🗓️</span> 3. Configurarea disponibilității (Calendarul)
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 10 }}>
              Fără sloturi disponibile în calendarul tău, clienții nu vor putea rezerva sesiuni video cu tine.
            </p>
            <ul style={{ paddingLeft: 20, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Asigură-te că adaugi intervale orare în care ești garantat disponibil.</li>
              <li>Actualizează-ți calendarul săptămânal pentru a evita anulările nedorite.</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💳</span> 4. Conectarea Stripe Connect pentru Plăți Securizate
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Toate plățile de pe SERVIO sunt procesate securizat prin Stripe. Prin intermediul Stripe Connect, banii din sesiunile programate și finalizate vor fi transferați direct în contul tău bancar. Procesul durează doar 2-3 minute pentru a fi finalizat.
            </p>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✍️</span> 5. Completarea descrierii și specializărilor
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 10 }}>
              Un profil detaliat oferă încredere deplină clienților. Descrie-ți experiența într-un mod prietenos și profesional:
            </p>
            <ul style={{ paddingLeft: 20, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong>Cine ești și ce probleme rezolvi:</strong> Începe cu 2-3 propoziții clare despre expertiza ta principală.</li>
              <li><strong>Specializări precise:</strong> Alege categoriile profesionale care te reprezintă cel mai bine, astfel încât clienții să te găsească ușor în catalog.</li>
            </ul>
          </div>

        </div>

        {/* CTA (Mandatory My Profile Button) */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: 16, padding: '14px 36px', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => navigate('/contul-meu')}
          >
            Mergi la Profilul Meu (Contul Meu)
          </button>
        </div>

      </div>
    </div>
  )
}
