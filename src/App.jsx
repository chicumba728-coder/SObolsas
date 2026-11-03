import React, { useEffect } from 'react';
import { Link, isAdminPath, useRouter } from './router.jsx';
import { useSession, homeFor } from './session.jsx';
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
import { EmptyState, LoadingState } from './components/ui.jsx';

const authKeys = ['login-student', 'login-mentor', 'register-student', 'register-mentor', 'recovery', 'reset'];

function NotFound({ title = 'Esta página não está disponível', description, home = { to: '/', label: 'Voltar à página inicial' } }) {
  return (
    <div className="content-wrap content-wrap--narrow page-content">
      <EmptyState
        title={title}
        description={description}
        action={<Link className="button button--outline" to={home.to}>{home.label}</Link>}
      />
    </div>
  );
}

function PageLoading() {
  return <div className="content-wrap content-wrap--narrow page-content"><LoadingState label="A verificar a sessão…" /></div>;
}

// Rotas da administração: isoladas e protegidas. Sem sessão de admin, só /admin/entrar é acessível.
function AdminRoutes({ route, params }) {
  const { loading, canAccess } = useSession();
  const { navigate, pathname } = useRouter();
  const isLogin = route?.key === 'admin-login';
  const isAdmin = canAccess('admin');

  useEffect(() => {
    if (loading) return;
    if (!isLogin && !isAdmin) navigate('/admin/entrar', { replace: true });
    else if (isLogin && isAdmin) navigate('/admin', { replace: true });
  }, [loading, isLogin, isAdmin, navigate]);

  if (loading) return <PageLoading />;
  if (isLogin) return isAdmin ? null : <AdminLoginPage />;
  if (!isAdmin) return null;
  if (!route) return <NotFound description={`Não há conteúdo para ${pathname}.`} home={{ to: '/admin', label: 'Voltar ao painel' }} />;
  return <AdminPage key={`${route.key}:${params.id ?? ''}`} routeKey={route.key} />;
}

// Guarda das áreas de estudante e mentor: sem sessão → página de entrada (com regresso); papel errado → aviso.
function ProtectedArea({ area, children }) {
  const { loading, user, canAccess } = useSession();
  const { navigate, pathname, search } = useRouter();
  const allowed = canAccess(area);
  const loginPath = area === 'mentor' ? '/entrar/mentor' : '/entrar/estudante';

  useEffect(() => {
    if (!loading && !user) navigate(`${loginPath}?voltar=${encodeURIComponent(pathname + search)}`, { replace: true });
  }, [loading, user, loginPath, navigate, pathname, search]);

  if (loading || !user) return <PageLoading />;
  if (!allowed) {
    return (
      <NotFound
        title={area === 'mentor' ? 'Esta área é para mentores' : 'Esta área é para estudantes'}
        description="A sua conta não tem acesso a esta área."
        home={{ to: homeFor(user), label: 'Ir para a minha área' }}
      />
    );
  }
  return children;
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
  if (route.key.startsWith('student-')) return <ProtectedArea area="student"><StudentPage key={key} routeKey={route.key} /></ProtectedArea>;
  if (route.key.startsWith('mentor-')) return <ProtectedArea area="mentor"><MentorPage key={key} routeKey={route.key} /></ProtectedArea>;
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
