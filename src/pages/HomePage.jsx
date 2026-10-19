import React, { useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { SearchField } from '../components/ui.jsx';
import { ArrowUpRight, ArrowRight } from '../components/icons.jsx';

const journey = [
  ['Explorar', 'Pesquise bolsas por curso, área ou instituição.'],
  ['Preparar', 'Organize requisitos, prazos e documentos.'],
  ['Avançar', 'Candidate-se e acompanhe cada passo.'],
];

const destinations = [
  ['/bolsas', 'Bolsas de estudo', 'Pesquise oportunidades e guarde as que quer seguir.'],
  ['/mentores', 'Mentores', 'Consulte perfis e serviços, e agende uma sessão.'],
  ['/estudante', 'A sua área', 'Reúna perfil, candidaturas, documentos e mentorias.'],
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const { navigate } = useRouter();

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('pesquisa', query.trim());
    navigate(`/bolsas${params.size ? `?${params.toString()}` : ''}`);
  };

  return (
    <>
      <section className="hero">
        <div className="hero__inner content-wrap">
          <div className="hero__copy">
            <h1>Encontre bolsas de estudo e o apoio para se candidatar.</h1>
            <p className="hero__lead">
              Pesquise oportunidades, guarde as que lhe interessam e acompanhe candidaturas.
              Para as decisões mais difíceis, conte com mentoria individual.
            </p>
            <form className="hero-search" onSubmit={submitSearch} role="search" aria-label="Pesquisar bolsas de estudo">
              <SearchField
                id="hero-scholarship-search"
                label="Pesquisar por curso, área ou instituição"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="button button--primary" type="submit">
                Pesquisar <ArrowRight size={16} />
              </button>
            </form>
          </div>
          <ol className="journey" aria-label="Um percurso em três passos">
            {journey.map(([label, description], index) => (
              <li className="journey__step" key={label}>
                <span className="journey__marker" aria-hidden="true">{index + 1}</span>
                <div>
                  <h2 className="journey__label">{label}</h2>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-explore content-wrap" aria-labelledby="explore-title">
        <div className="section-heading">
          <div>
            <h2 id="explore-title">O que pode fazer aqui</h2>
            <p>Três áreas, uma só plataforma.</p>
          </div>
        </div>
        <ul className="link-list">
          {destinations.map(([to, title, description]) => (
            <li key={to}>
              <Link className="link-list__item" to={to}>
                <span className="link-list__title">{title}</span>
                <span className="link-list__description">{description}</span>
                <span className="link-list__icon" aria-hidden="true"><ArrowUpRight size={18} /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
