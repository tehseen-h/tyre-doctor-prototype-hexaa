import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { ResetDemo } from '../components/ResetDemo';
import { BRANCHES, ROLES } from '../data/fixtures';
import { useAppState } from '../app/AppState';
import tyreDoctorLogo from '../assets/tyre-doctor-logo.svg';

const ENTRY_ROUTE: Record<string, string> = {
  field: '/field', console: '/console', ndt: '/rim/MKY-RJ-26-0132/ndt', performance: '/performance',
};

export function WhoAreYou() {
  const { branch, setBranch, roleId, setRoleId } = useAppState();
  const navigate = useNavigate();
  const branchRow = BRANCHES.find((b) => b.code === branch);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(900px 460px at 92% -14%, rgba(13,100,173,.14), transparent 60%), var(--td-ground)' }}>
      <header style={{ background: 'var(--td-steel)', color: 'var(--td-steel-ink)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 40px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', color: 'inherit' }}>
            <img src={tyreDoctorLogo} alt="Tyre Doctor" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontFamily: 'var(--td-mono)', fontSize: 11, letterSpacing: '.14em', color: '#8fc0e8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TD One</span>
          </Link>
          <Link to="/process-flow" style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 600, color: 'var(--td-steel-ink)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Process flow</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '52px 40px 90px', animation: 'tdRise 420ms ease-out both' }}>
        <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 52, lineHeight: 1.02, margin: '0 0 12px' }}>Who are you today?</h1>
        <p style={{ fontSize: 18, color: 'var(--td-ink-2)', margin: '0 0 32px', maxWidth: '44em' }}>
          TD One opens on the screen you use most. You can change it from the header at any time.
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26, flexWrap: 'wrap', marginBottom: 32 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)' }}>Your branch</span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as typeof branch)}
              style={{
                border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-md)', background: 'var(--td-paper)', color: 'var(--td-ink)',
                minWidth: 290, fontSize: 17, padding: '14px 14px', boxShadow: 'var(--td-card)',
              }}
            >
              {BRANCHES.map((b) => <option key={b.code} value={b.code}>{b.name} — {b.code}{b.isHq ? ' (head office)' : ''}</option>)}
            </select>
          </label>
          <div style={{ fontSize: 16, color: 'var(--td-ink-2)', paddingBottom: 14 }}>
            {branchRow?.code === 'MKY' ? 'Mackay has the busiest floor — start there.' : `${branchRow?.name} selected.`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => { setRoleId(role.id); navigate(ENTRY_ROUTE[role.entry]); }}
              style={{ textAlign: 'left', border: 'none', padding: 0, background: 'none', cursor: 'pointer', whiteSpace: 'normal', width: '100%' }}
            >
              <Card variant="reduced" style={{ padding: '30px 22px 22px', display: 'flex', flexDirection: 'column', gap: 11, minHeight: 206 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: role.dot }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-3)', textTransform: 'capitalize' }}>{role.world === 'field' ? 'Mine site' : role.world === 'workshop' ? 'Workshop floor' : 'Office'}</span>
                  {roleId === role.id && <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: 'var(--td-blue-deep)' }}>current</span>}
                </div>
                <h3 style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 29, lineHeight: 1.06, margin: 0 }}>{role.label}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--td-ink-2)', whiteSpace: 'normal' }}>{role.does}</p>
                <span style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: 'var(--td-blue)' }}>
                  {ENTRY_LABEL[role.entry]} <span style={{ fontSize: 19, lineHeight: 1 }}>→</span>
                </span>
              </Card>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link
            to="/t/ridgeview"
            style={{
              display: 'inline-flex', alignItems: 'center', background: 'var(--td-paper)', border: '1px solid var(--td-line-strong)',
              color: 'var(--td-ink)', fontSize: 16, fontWeight: 600, padding: '14px 22px', borderRadius: 'var(--td-r-md)', textDecoration: 'none',
            }}
          >
            Open the customer view
          </Link>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--td-ink-2)', fontSize: 16, fontWeight: 600, padding: '14px 8px', textDecoration: 'none' }}>
            Back to the front page
          </Link>
          <div style={{ marginLeft: 'auto', alignSelf: 'center' }}><ResetDemo /></div>
        </div>
      </main>
    </div>
  );
}

const ENTRY_LABEL: Record<string, string> = {
  field: 'New site visit', console: 'Branch console', ndt: 'NDT bay', performance: 'Branch performance',
};
