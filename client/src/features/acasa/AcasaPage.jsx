import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../auth/authSlice'
import { useGetMyProfileQuery, useRequestPublicationMutation } from '../dashboard/dashboardApi'
import CataloguePage from '../catalogue/CataloguePage'
import Footer from './Footer'
import { useLabels } from '../../lib/useLabels'

/**
 * @typedef {Object} SpecialisationDetails
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 */

/**
 * @typedef {Object} ProfileSpecialisation
 * @property {SpecialisationDetails} specialisation
 */

/**
 * @typedef {Object} CategoryDetails
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {number|null} specialisationId
 */

/**
 * @typedef {Object} ProfileCategory
 * @property {CategoryDetails} category
 */

/**
 * @typedef {Object} ProfileTag
 * @property {number} id
 * @property {string} tag
 */

/**
 * @typedef {Object} ProfileUser
 * @property {number} id
 * @property {string} email
 * @property {boolean} isEmailConfirmed
 */

/**
 * @typedef {Object} ConsultantProfileData
 * @property {number} id
 * @property {string} displayName
 * @property {string|null} description
 * @property {number|string} hourlyRate
 * @property {string|null} avatarUrl
 * @property {string|null} avatarBlobName
 * @property {string|null} bannerUrl
 * @property {string|null} bannerBlobName
 * @property {any} languages
 * @property {boolean} isActive
 * @property {number} userId
 * @property {number|string} platformFeePct
 * @property {string|null} stripeAccountId
 * @property {boolean} stripeOnboardingComplete
 * @property {boolean} publicationRequested
 * @property {number} averageRating
 * @property {Object} _count
 * @property {number} _count.reviews
 * @property {ProfileUser} user
 * @property {Array<ProfileSpecialisation>} specialisations
 * @property {Array<ProfileCategory>} [expertiseCategories]
 * @property {Array<ProfileTag>} [tags]
 * @property {boolean} isEmailConfirmed
 * @property {boolean} isHourlyRateSet
 * @property {boolean} isAvailabilitySet
 * @property {boolean} isStripeOnboarded
 * @property {boolean} isProfileSetupComplete
 * @property {boolean} accountComplete
 */

class ConsultantProfileModel {
  /**
   * @param {ConsultantProfileData} data
   */
  constructor(data) {
    Object.assign(this, data)
  }

  /**
   * Validates if the email address is confirmed.
   * @returns {boolean}
   */
  validateEmailConfirmed() {
    return !!(this.user?.isEmailConfirmed || this.isEmailConfirmed)
  }

  /**
   * Validates if a valid hourly rate greater than 0 has been set.
   * @returns {boolean}
   */
  validateHourlyRateSet() {
    return parseFloat(this.hourlyRate) > 0
  }

  /**
   * Validates if the Stripe Express account onboarding is fully complete.
   * @returns {boolean}
   */
  validateStripeOnboarded() {
    return !!(this.stripeOnboardingComplete || this.isStripeOnboarded)
  }

  /**
   * Validates if the profile satisfies core presentation credentials: name, photo, bio, specialisations.
   * @returns {boolean}
   */
  validateProfileSetupComplete() {
    return !!(
      this.description &&
      this.description.trim() &&
      this.specialisations &&
      this.specialisations.length > 0 &&
      this.displayName &&
      this.displayName.trim() &&
      (this.avatarUrl || this.avatarBlobName)
    )
  }

  /**
   * Validates whether all 5 onboarding checkpoints are met.
   * @returns {boolean}
   */
  validateAccountComplete() {
    return (
      this.validateEmailConfirmed() &&
      this.validateHourlyRateSet() &&
      !!this.isAvailabilitySet &&
      this.validateStripeOnboarded() &&
      this.validateProfileSetupComplete()
    )
  }
}

export default function AcasaPage() {
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const t = useLabels()

  const currentUser = useSelector(selectCurrentUser)
  const isConsultant = currentUser?.role === 'consultant'

  // Only query profile if the user is a logged-in consultant
  const { data: rawProfile, refetch: refetchProfile } = useGetMyProfileQuery(undefined, {
    skip: !isConsultant,
  })

  const profile = rawProfile ? new ConsultantProfileModel(rawProfile) : null

  const [requestPublication, { isLoading: isRequesting }] = useRequestPublicationMutation()
  const [toast, setToast] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Check router state for a redirect toast message
  useEffect(() => {
    if (location.state?.showEmailToast) {
      setToast('Un email de confirmare a fost trimis! Verifică-ți căsuța prin link-ul de activare și revino pe platformă.')
      // Clear navigation state so it doesn't reappear
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  const handleRequestPublication = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await requestPublication().unwrap()
      setSuccessMsg('Cererea ta de publicare a fost trimisă cu succes administratorilor! Aceștia o vor analiza în cel mai scurt timp.')
      refetchProfile()
    } catch (err) {
      setErrorMsg(err?.data?.error || 'Trimiterea cererii a eșuat. Încearcă din nou.')
    }
  }

  const slides = t.acasa.slides.map((s, i) => ({
    ...s,
    id: i === 0 ? 'consultant' : 'client',
    href: i === 0 ? '/consultant' : '/client',
    bg: i === 0 ? '#1e3a5f' : '#1a4731',
  }))
  const slide = slides[active]

  function prev() { setActive((active - 1 + slides.length) % slides.length) }
  function next() { setActive((active + 1) % slides.length) }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          background: 'var(--green-bg)',
          color: 'var(--green)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '14px 24px',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span>{toast}</span>
          <button 
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Hero Unit */}
      {!(isConsultant && profile?.isActive) && (
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
              {slides.map((_, i) => (
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
      )}

      {/* Onboarding Status / Warnings Widget (Consultants only) */}
      {isConsultant && profile && !profile.isActive && (
        <div style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', padding: '36px 0' }}>
          <div className="container" style={{ maxWidth: 840 }}>
            
            {/* Case 1: All requirements met, waiting for admin approval */}
            {profile.accountComplete && profile.publicationRequested ? (
              <div className="card" style={{ borderLeft: '4px solid var(--yellow)', padding: '28px 32px' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28 }}>⏰</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--primary-dark)' }}>
                      Profil în curs de verificare
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                      Ai îndeplinit cu succes toate cerințele! Cererea ta de publicare a fost trimisă. Administratorii noștri revizuiesc detaliile profilului tău, iar de îndată ce contul este aprobat și publicat, vei fi notificat pe email și vei apărea în catalogul public.
                    </p>
                    <div style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: 20, background: 'var(--yellow-bg)', color: 'var(--yellow)', fontSize: 13, fontWeight: 600 }}>
                      Status: Așteaptă aprobarea administratorului
                    </div>
                  </div>
                </div>
              </div>
            ) : profile.accountComplete ? (
              /* Case 2: All requirements met, can request publication */
              <div className="card" style={{ borderLeft: '4px solid var(--green)', padding: '28px 32px' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28 }}>🎉</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--primary-dark)' }}>
                      Contul tău este pregătit pentru publicare!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                      Felicitări! Ai configurat cu succes toate elementele obligatorii ale profilului de consultant. Solicită publicarea lui acum pentru ca echipa noastră să îl poată activa în catalogul public.
                    </p>

                    {errorMsg && (
                      <div style={{ color: 'var(--red)', background: 'var(--red-bg)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 14, border: '1px solid #fca5a5' }}>
                        {errorMsg}
                      </div>
                    )}
                    {successMsg && (
                      <div style={{ color: 'var(--green)', background: 'var(--green-bg)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 14, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        {successMsg}
                      </div>
                    )}

                    <button
                      className="btn btn-primary"
                      onClick={handleRequestPublication}
                      disabled={isRequesting}
                      style={{ padding: '11px 24px', fontWeight: 600 }}
                    >
                      {isRequesting ? 'Se trimite cererea…' : 'Solicită publicarea profilului'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Case 3: Requirements not yet met (Checklist warning banner) */
              <div className="card" style={{ borderLeft: '4px solid var(--accent-orange)', padding: '28px 32px' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ fontSize: 28 }}>⚠️</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--primary-dark)' }}>
                      Finalizează configurarea profilului pentru a putea fi publicat
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                      Profilul tău de consultant este momentan privat deoarece nu îndeplinește toate condițiile obligatorii. Verifică lista de mai jos și configurează elementele lipsă în panoul tău de administrare pentru a putea începe să primești programări de la clienți.
                    </p>
                  </div>
                </div>

                {/* Progress Checklist Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--grey-bg)', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 18 }}>{profile.isEmailConfirmed ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Confirmare Email</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {profile.isEmailConfirmed ? 'Verificat' : 'Necesită confirmare'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--grey-bg)', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 18 }}>{profile.isHourlyRateSet ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Setare Tarif Orar</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {profile.isHourlyRateSet ? `${profile.hourlyRate} EUR` : 'Neconfigurat'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--grey-bg)', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 18 }}>{profile.isAvailabilitySet ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Grup Disponibilitate</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {profile.isAvailabilitySet ? 'Calendar configurat' : 'Lipsă sloturi'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--grey-bg)', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 18 }}>{profile.isStripeOnboarded ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Conexiune Stripe</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {profile.isStripeOnboarded ? 'Sincronizat corect' : 'Necesită acțiune'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--grey-bg)', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 18 }}>{profile.isProfileSetupComplete ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Date de Profil Complete</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {profile.isProfileSetupComplete ? 'Nume, Poză, Bio & Specializări setate' : 'Lipsă elemente profil'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/contul-meu')}
                    style={{ fontSize: 13, border: '1px solid var(--border)', background: '#fff' }}
                  >
                    Configurează profilul acum →
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Catalogue */}
      <CataloguePage />

      {/* Footer */}
      <Footer />
    </div>
  )
}
