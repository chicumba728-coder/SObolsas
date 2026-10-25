import React, { useEffect } from 'react';
import { Link, isAdminPath, useRouter } from './router.jsx';
import { useSession } from './session.jsx';
import AppShell from './components/AppShell.jsx';
import AdminShell from './components/AdminShell.jsx';
import HomePage from './pages/HomePage.jsx';
import ScholarshipsPage from './pages/ScholarshipsPage.jsx';
import MentorsPage from './pages/MentorsPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import RoleChoicePage from './pages/RoleChoicePage.jsx';
import StudentPage from './pages/StudentPage.jsx';
import MentorPage from './pages/MentorPage.jsx';
import { BookingPage, CheckoutPage } from './pages/BookingCheckoutPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import { EmptyState } from './components/ui.jsx';

const authKeys = ['login-student', 'login-mentor', 'register-student', 'register-mentor', 'recovery'];

function NotFound({ description, home = { to: '/', label: 'Voltar à página inicial' } }) {
  return (
    <div className="content-wrap content-wrap--narrow page-content">
      <EmptyState
        title="Esta página não está disponível"
        description={description}
        action={<Link className="button button--outline" to={home.to}>{home.label}</Link>}
      />
    </div>
  );
}

// Rotas da administração: isoladas e protegidas. Sem sessão de admin, só /admin/entrar é acessível.
function AdminRoutes({ route, params }) {
  const { role } = useSession();
  const { navigate, pathname } = useRouter();
  const isLogin = route?.key === 'admin-login';
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!isLogin && !isAdmin) navigate('/admin/entrar', { replace: true });
    else if (isLogin && isAdmin) navigate('/admin', { replace: true });
  }, [isLogin, isAdmin, navigate]);

  if (isLogin) return isAdmin ? null : <AdminLoginPage />;
  if (!isAdmin) return null;
  if (!route) return <NotFound description={`Não há conteúdo para ${pathname}.`} home={{ to: '/admin', label: 'Voltar ao painel' }} />;
  return <AdminPage key={`${route.key}:${params.id ?? ''}`} routeKey={route.key} />;
}

function PublicRoutes({ route, params, pathname }) {
  const key = route ? `${route.key}:${params.id ?? ''}` : `404:${pathname}`;

  if (!route) return <NotFound description="Verifique o endereço ou volte à página inicial." />;
  if (route.key === 'home') return <HomePage key={key} />;
  if (route.key === 'scholarships') return <ScholarshipsPage key={key} />;
  if (route.key === 'scholarship-detail') return <ScholarshipsPage key={key} detailId={params.id} />;
  if (route.key === 'mentors') return <MentorsPage key={key} />;
  if (route.key === 'mentor-detail') return <MentorsPage key={key} detailId={params.id} />;
  if (route.key === 'login') return <RoleChoicePage key={key} />;
  if (authKeys.includes(route.key)) return <AuthPage key={key} mode={route.key} />;
  if (route.key.startsWith('student-')) return <StudentPage key={key} routeKey={route.key} />;
  if (route.key.startsWith('mentor-')) return <MentorPage key={key} routeKey={route.key} />;
  if (route.key === 'booking') return <BookingPage key={key} />;
  if (route.key === 'checkout') return <CheckoutPage key={key} />;
  return <NotFound description={`Não há conteúdo para ${pathname}.`} />;
}

function RouteView() {
  const { route, params, pathname } = useRouter();
  const inAdmin = isAdminPath(pathname);

  useEffect(() => {
    const base = route ? route.title : 'Página não encontrada';
    document.title = `${base} — Bolsaria`;
  }, [route]);

  return inAdmin
    ? <AdminRoutes route={route} params={params} />
    : <PublicRoutes route={route} params={params} pathname={pathname} />;
}

export default function App() {
  const { pathname } = useRouter();
  const Shell = isAdminPath(pathname) ? AdminShell : AppShell;
  return <Shell><RouteView /></Shell>;
}
