import React, { useEffect } from 'react';
import { useRouter } from './router.jsx';
import AppShell from './components/AppShell.jsx';
import HomePage from './pages/HomePage.jsx';
import ScholarshipsPage from './pages/ScholarshipsPage.jsx';
import MentorsPage from './pages/MentorsPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import RoleChoicePage from './pages/RoleChoicePage.jsx';
import StudentPage from './pages/StudentPage.jsx';
import MentorPage from './pages/MentorPage.jsx';
import { BookingPage, CheckoutPage } from './pages/BookingCheckoutPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { EmptyState } from './components/ui.jsx';

const authKeys = ['login-student', 'login-mentor', 'register-student', 'register-mentor', 'recovery'];

function RouteView() {
  const { route, params, pathname } = useRouter();
  useEffect(() => {
    document.title = route ? `${route.title} — Bolsaria` : 'Página não encontrada — Bolsaria';
  }, [route]);

  const key = route ? `${route.key}:${params.id ?? ''}` : `404:${pathname}`;

  if (!route) return <div className="content-wrap content-wrap--narrow"><EmptyState title="Esta página não está disponível" description="Verifique o endereço ou volte à página inicial." /></div>;
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
  if (route.key.startsWith('admin-')) return <AdminPage key={key} routeKey={route.key} />;
  return <div className="content-wrap content-wrap--narrow"><EmptyState title="Esta página não está disponível" description={`Não há conteúdo para ${pathname}.`} /></div>;
}

export default function App() {
  return <AppShell><RouteView /></AppShell>;
}
