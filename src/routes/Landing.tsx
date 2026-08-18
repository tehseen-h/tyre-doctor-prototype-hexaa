import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { ResetDemo } from '../components/ResetDemo';
import { BRANCHES } from '../data/fixtures';
import { TYRE_STAGES } from '../config/stages';
import tyreDoctorLogoNavy from '../assets/tyre-doctor-logo-navy.svg';

const SCATTER = ['A row in a spreadsheet', 'Photos in a chat thread', 'A photograph of a paper sheet', 'The quote, somewhere else again'];

export function Landing() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(1100px 520px at 88% -12%, rgba(13,100,173,.16), transparent 62%),'
        + 'radial-gradient(700px 420px at 4% 8%, rgba(245,163,0,.13), transparent 60%), var(--td-ground)',
    }}
    >
      <header style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 40px', display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={tyreDoctorLogoNavy} alt="Tyre Doctor" style={{ height: 34, width: 'auto' }} />
          <div style={{ fontFamily: 'var(--td-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--td-blue-deep)', textTransform: 'uppercase' }}>TD One</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 15, color: 'var(--td-ink-2)' }}>Mining and earthmoving tyre repair and rim testing — eight workshops</span>
        <Link to="/process-flow" style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-blue)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Process flow</Link>
      </header>

      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '0 40px 90px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 56, alignItems: 'center', padding: '44px 0 56px', animation: 'tdRise 520ms ease-out both' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--td-hazard-tint)', border: '1px solid rgba(245,163,0,.5)',
              color: 'var(--td-hazard-deep)', padding: '7px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, marginBottom: 22,
            }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--td-hazard)' }} />
              Tyre repair and rim NDT, in one place
            </div>
            <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 70, lineHeight: 0.98, letterSpacing: '-.015em', margin: '0 0 22px', maxWidth: '16em' }}>
              Every tyre and rim has one file, from the pit to dispatch.
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, maxWidth: '34em', color: 'var(--td-ink-2)', margin: '0 0 32px' }}>
              Photos stay with the stage they were taken at. Every step carries a time and a name. The workshop, sales and the mine all read the same page.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to="/who"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12, background: 'var(--td-blue)', color: '#fff', fontSize: 19,
                  fontWeight: 600, padding: '17px 30px', borderRadius: 'var(--td-r-md)', textDecoration: 'none', boxShadow: '0 10px 24px rgba(13,100,173,.3)',
                }}
              >
                Open the workshop <span style={{ fontSize: 22, lineHeight: 1 }}>→</span>
              </Link>
              <Link
                to="/t/ridgeview"
                style={{
                  display: 'inline-flex', alignItems: 'center', background: 'var(--td-paper)', border: '1px solid var(--td-line-strong)', color: 'var(--td-ink)',
                  fontSize: 17, fontWeight: 600, padding: '16px 24px', borderRadius: 'var(--td-r-md)', textDecoration: 'none',
                }}
              >
                See the customer view
              </Link>
            </div>
          </div>

          <Card variant="hero" style={{ padding: '34px 28px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 16 }}>Where one job lives today</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 20 }}>
              {SCATTER.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 13, fontSize: 16 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', background: 'var(--td-fail-tint)', color: 'var(--td-fail-deep)',
                    display: 'grid', placeItems: 'center', fontFamily: 'var(--td-mono)', fontSize: 12, flex: 'none',
                  }}
                  >
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 13, background: 'var(--td-pass-tint)', border: '1px solid rgba(31,138,77,.4)',
              borderRadius: 'var(--td-r-sm)', padding: '14px 16px',
            }}
            >
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--td-pass)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15, flex: 'none' }}>✓</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--td-pass-deep)' }}>One file, built as the work happens</span>
            </div>
          </Card>
        </section>

        <section style={{ animation: 'tdRise 620ms ease-out 90ms both', marginBottom: 44 }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 30, margin: '0 0 4px' }}>The stages a tyre passes through</h2>
          <p style={{ fontSize: 16, color: 'var(--td-ink-2)', margin: '0 0 26px' }}>Twelve steps, each one a tap on the floor. The oven is where the repair cures.</p>
          <div style={{ position: 'relative', paddingTop: 30 }}>
            <div style={{
              position: 'absolute', left: '3%', right: '3%', top: 37, height: 3, borderRadius: 2,
              background: 'linear-gradient(90deg,var(--td-blue) 0%,var(--td-blue) 66%,var(--td-heat) 76%,var(--td-blue) 86%)',
            }}
            />
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(12,1fr)' }}>
              {[...TYRE_STAGES.slice(0, -1).map((s) => s.label), 'Closed'].map((label) => {
                const hot = label === 'Cooked';
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
                    <span style={{
                      width: hot ? 22 : 16, height: hot ? 22 : 16, borderRadius: '50%', background: hot ? 'var(--td-heat)' : 'var(--td-paper)',
                      border: `3px solid ${hot ? 'var(--td-heat-deep)' : 'var(--td-blue)'}`, boxShadow: '0 2px 8px rgba(17,28,36,.14)',
                    }}
                    />
                    <span style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 17, textAlign: 'center', lineHeight: 1.1, color: hot ? 'var(--td-heat-deep)' : 'var(--td-ink)' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, animation: 'tdRise 700ms ease-out 160ms both' }}>
          {[
            { title: 'One job file', body: 'Serial, quote number, customer, site, branch and stage — with the photos attached to the step they came from.' },
            { title: 'Live status', body: 'The workshop taps once per stage. Sales and the mine can see where a tyre is without ringing anybody.' },
            { title: 'Certificates', body: 'Rim NDT and rim repair certificates, numbered, with the next test due in machine hours.' },
          ].map((c) => (
            <Card key={c.title} variant="reduced" style={{ padding: '30px 24px 26px' }}>
              <h3 style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 27, margin: '0 0 10px' }}>{c.title}</h3>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--td-ink-2)' }}>{c.body}</p>
            </Card>
          ))}
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--td-line)', background: 'var(--td-ground-soft)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 40px', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)' }}>Workshops</span>
          <span style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>{BRANCHES.map((b) => b.name).join(' · ')}</span>
          <div style={{ marginLeft: 'auto' }}><ResetDemo /></div>
        </div>
      </footer>
    </div>
  );
}
