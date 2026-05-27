import { useLabels } from '../../lib/useLabels'

export default function Footer() {
  const t = useLabels()
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '40px 0 24px', marginTop: 'auto' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Servio</span>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 13, maxWidth: 260 }}>
            {t.footer.tagline}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <SocialLink href="https://facebook.com" label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </SocialLink>
            <SocialLink href="https://linkedin.com" label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            </SocialLink>
            <SocialLink href="https://instagram.com" label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </SocialLink>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <FooterCol title={t.footer.legalTitle}>
            <FooterLink href="/legal/termeni">{t.footer.terms}</FooterLink>
            <FooterLink href="/legal/confidentialitate">{t.footer.privacy}</FooterLink>
          </FooterCol>
          <FooterCol title={t.footer.supportTitle}>
            <FooterLink href="/contact">{t.footer.contact}</FooterLink>
            <FooterLink href="/feedback">{t.footer.feedback}</FooterLink>
          </FooterCol>
        </div>
      </div>

      <div className="container" style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
        {t.footer.copyright(new Date().getFullYear())}
      </div>
    </footer>
  )
}

function FooterCol({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </span>
      {children}
    </div>
  )
}

function FooterLink({ href, children }) {
  return (
    <a
      href={href}
      style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
    >
      {children}
    </a>
  )
}

function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
    >
      {children}
    </a>
  )
}
