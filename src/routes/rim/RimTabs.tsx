import { Link } from 'react-router-dom';

const DEFAULT_JOB = 'MKY-RJ-26-0132';

export function RimTabs({ active, jobNo }: { active: 'intake' | 'ndt' | 'certs'; jobNo?: string }) {
  const job = jobNo ?? DEFAULT_JOB;
  const tab = (id: 'intake' | 'ndt' | 'certs', label: string, to: string) => (
    <Link
      to={to}
      style={{
        border: 'none', background: active === id ? 'var(--td-blue)' : 'transparent', color: active === id ? '#fff' : '#8fc0e8',
        fontSize: 15, fontWeight: 600, padding: '9px 17px', textDecoration: 'none', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Link>
  );
  return (
    <div style={{ display: 'flex', border: '1px solid rgba(234,243,248,.3)', borderRadius: 999, overflow: 'hidden' }}>
      {tab('intake', 'Rim intake', '/rim/intake')}
      {tab('ndt', 'NDT bay', `/rim/${job}/ndt`)}
      {tab('certs', 'Certificates', `/rim/${job}/certs`)}
    </div>
  );
}
