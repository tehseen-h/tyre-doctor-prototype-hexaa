import { Link, Outlet } from 'react-router-dom';
import { HeaderSlotProvider } from './HeaderSlot';
import { useAppState } from '../app/AppState';
import { ResetDemo } from '../components/ResetDemo';
import { Button } from '../components/Button';
import tyreDoctorLogo from '../assets/tyre-doctor-logo.svg';

function ProcessFlowLink() {
  return (
    <Link to="/process-flow" style={{ textDecoration: 'none' }}>
      <Button variant="steel-ghost" size="md" style={{ padding: '7px 13px', fontSize: 14 }}>Process flow</Button>
    </Link>
  );
}

function Logo() {
  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
      <img src={tyreDoctorLogo} alt="Tyre Doctor" style={{ height: 26, width: 'auto', flex: 'none' }} />
    </Link>
  );
}

export function RoleAvatar() {
  const { role } = useAppState();
  return (
    <Link
      to="/who"
      style={{
        display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'var(--td-steel-ink)',
        background: 'rgba(234,243,248,.1)', borderRadius: 999, padding: '5px 13px 5px 5px',
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: '50%', background: role.dot === 'var(--td-pass)' ? 'var(--td-pass)' : 'var(--td-blue)',
        display: 'grid', placeItems: 'center', fontFamily: 'var(--td-display)', fontSize: 14, fontWeight: 600,
      }}
      >
        {role.initials}
      </span>
      <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>{role.label}</span>
    </Link>
  );
}

export function WorkshopLayout() {
  return (
    <HeaderSlotProvider>
      {(setMiddleEl, setRightEl) => (
        <div style={{ minHeight: '100vh', background: 'var(--td-ground)' }}>
          <header
            className="no-print"
            style={{
              position: 'sticky', top: 0, zIndex: 40, background: 'var(--td-steel)', color: 'var(--td-steel-ink)',
              boxShadow: '0 2px 14px rgba(17,28,36,.2)',
            }}
          >
            <div style={{ maxWidth: 1560, margin: '0 auto', padding: '11px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Logo />
              <div ref={setMiddleEl} style={{ display: 'contents' }} />
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div ref={setRightEl} style={{ display: 'contents' }} />
                <ProcessFlowLink />
                <ResetDemo dark />
                <RoleAvatar />
              </div>
            </div>
          </header>
          <Outlet />
        </div>
      )}
    </HeaderSlotProvider>
  );
}
