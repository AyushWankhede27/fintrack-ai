import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './authSlice';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Insights from './pages/Insights';
import AskAI from './pages/AskAI';
import Alerts from './pages/Alerts';
import Goals from './pages/Goals';
import Import from './pages/Import';
import Reports from './pages/Reports';

const NAV = [['/', 'Dashboard'], ['/transactions', 'Transactions'], ['/budget', 'Budget'], ['/insights', 'Insights'], ['/ask', 'Ask AI'], ['/alerts', 'Alerts'], ['/goals', 'Goals'], ['/import', 'Import'], ['/reports', 'Reports']];

function Layout() {
  const { token, user } = useSelector((s) => s.auth), dispatch = useDispatch();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen md:flex">
      <nav className="bg-ink text-emerald-50 md:w-56 md:min-h-screen p-4 flex md:flex-col gap-1 overflow-x-auto">
        <p className="font-bold text-white text-lg md:mb-4 mr-4 whitespace-nowrap">FinTrack AI</p>
        {NAV.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `px-3 py-2 rounded-lg text-sm whitespace-nowrap ${isActive ? 'bg-primary text-white' : 'hover:bg-white/10'}`}>{label}</NavLink>
        ))}
        <button onClick={() => dispatch(logout())} className="md:mt-auto text-left px-3 py-2 text-sm text-emerald-200 whitespace-nowrap">Log out ({user?.name})</button>
      </nav>
      <main className="flex-1 p-4 md:p-8 space-y-5 min-w-0"><Outlet /></main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth signup />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budget" element={<Budget />} />
        <Route path="insights" element={<Insights />} />
        <Route path="ask" element={<AskAI />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="goals" element={<Goals />} />
        <Route path="import" element={<Import />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
