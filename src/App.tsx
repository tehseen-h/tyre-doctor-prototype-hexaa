import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider } from './app/AppState';
import { WorkshopLayout } from './layout/WorkshopLayout';
import { RouteFallback } from './components/LoadingIndicator';
import { store } from './data/store';

/** Runs regardless of route so oven countdowns keep ticking across navigation. */
function OvenTicker() {
  useEffect(() => {
    const id = setInterval(() => store.tickOvens(), 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}

const Landing = lazy(() => import('./routes/Landing').then((m) => ({ default: m.Landing })));
const WhoAreYou = lazy(() => import('./routes/WhoAreYou').then((m) => ({ default: m.WhoAreYou })));
const BranchConsole = lazy(() => import('./routes/BranchConsole').then((m) => ({ default: m.BranchConsole })));
const BranchPerformance = lazy(() => import('./routes/BranchPerformance').then((m) => ({ default: m.BranchPerformance })));
const CustomerTracker = lazy(() => import('./routes/CustomerTracker').then((m) => ({ default: m.CustomerTracker })));
const Field = lazy(() => import('./routes/field/Field').then((m) => ({ default: m.Field })));
const JobFile = lazy(() => import('./routes/jobfile/JobFile').then((m) => ({ default: m.JobFile })));
const JobReport = lazy(() => import('./routes/jobfile/JobReport').then((m) => ({ default: m.JobReport })));
const Escalation = lazy(() => import('./routes/jobfile/Escalation').then((m) => ({ default: m.Escalation })));
const RimIntake = lazy(() => import('./routes/rim/RimIntake').then((m) => ({ default: m.RimIntake })));
const NdtBay = lazy(() => import('./routes/rim/NdtBay').then((m) => ({ default: m.NdtBay })));
const Certificates = lazy(() => import('./routes/rim/Certificates').then((m) => ({ default: m.Certificates })));
const ProcessFlow = lazy(() => import('./routes/processFlow/ProcessFlow').then((m) => ({ default: m.ProcessFlow })));

export function App() {
  return (
    <AppStateProvider>
      <OvenTicker />
      <HashRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/who" element={<WhoAreYou />} />
            <Route path="/t/:token" element={<CustomerTracker />} />
            <Route path="/field/*" element={<Field />} />
            <Route path="/process-flow" element={<ProcessFlow />} />

            <Route element={<WorkshopLayout />}>
              <Route path="/console" element={<BranchConsole />} />
              <Route path="/performance" element={<BranchPerformance />} />
              <Route path="/jobs/:jobNo" element={<JobFile />} />
              <Route path="/jobs/:jobNo/report" element={<JobReport />} />
              <Route path="/jobs/:jobNo/escalation" element={<Escalation />} />
              <Route path="/rim" element={<Navigate to="/rim/intake" replace />} />
              <Route path="/rim/intake" element={<RimIntake />} />
              <Route path="/rim/:jobNo/ndt" element={<NdtBay />} />
              <Route path="/rim/:jobNo/certs" element={<Certificates />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AppStateProvider>
  );
}
