import React, { useEffect, useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { EmptyState, PageHeading, SearchField } from '../components/ui.jsx';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/icons.jsx';
import { useCollection } from '../data/store.js';

const excerpt = (text = '', max = 160) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

function MentorDetail({ id }) {
  const mentors = useCollection('mentors');
  // Só mentores aprovados são públicos. O email nunca é apresentado.
  const mentor = mentors.find((m) => m.id === id && m.status === 'approved');

  return (
    <div className="content-wrap content-wrap--narrow page-content detail-page">
      <Link className="back-link" to="/mentores"><ArrowLeft size={15} /> Voltar aos mentores</Link>
      {!mentor ? (
        <>
          <PageHeading title="Perfil de mentor" />
          <EmptyState
            title="Este perfil não está disponível"
            description="Não existe um mentor publicado com este identificador."
            action={<Link className="text-link" to="/mentores">Ver todos os mentores <ArrowRight size={15} /></Link>}
          />
        </>
      ) : (
        <>
          <PageHeading title={mentor.name} description={mentor.specialty || undefined} />
          {mentor.bio && (
            <div className="detail-text">
              {mentor.bio.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          )}
          <div className="detail-actions">
            <Link className="button button--primary" to={`/agendar?mentor=${encodeURIComponent(mentor.id)}`}>Agendar sessão <ArrowRight size={16} /></Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function MentorsPage({ detailId }) {
  const { search, navigate } = useRouter();
  const applied = new URLSearchParams(search).get('pesquisa') || '';
  const [query, setQuery] = useState(applied);
  const mentors = useCollection('mentors');

  useEffect(() => {
    setQuery(new URLSearchParams(search).get('pesquisa') || '');
  }, [search]);

  if (detailId) return <MentorDetail id={detailId} />;

  const approved = mentors.filter((m) => m.status === 'approved');
  const term = applied.toLowerCase();
  const results = term
    ? approved.filter((m) => [m.name, m.specialty, m.bio].some((value) => (value || '').toLowerCase().includes(term)))
    : approved;
  const submitted = applied.length > 0;

  const applySearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('pesquisa', query.trim());
    navigate(`/mentores${params.size ? `?${params.toString()}` : ''}`, { replace: true });
  };

  const clearSearch = () => {
    setQuery('');
    navigate('/mentores', { replace: true });
  };

  return (
    <div className="content-wrap page-content">
      <PageHeading
        title="Mentores"
        description="Consulte perfis e especialidades, e peça uma sessão de mentoria."
      />
      <form className="toolbar toolbar--single" onSubmit={applySearch} role="search" aria-label="Pesquisar mentores pela especialidade">
        <SearchField id="mentor-query" label="Pesquisar por especialidade" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="toolbar__actions">
          <button className="button button--primary" type="submit">Pesquisar</button>
          {submitted && <button className="button button--text" type="button" onClick={clearSearch}>Limpar</button>}
        </div>
      </form>
      <div className="list-toolbar">
        <span>{submitted ? <>Resultados para <strong>“{applied}”</strong></> : 'Todos os mentores'}</span>
        <span className="list-toolbar__count" role="status" aria-live="polite">
          {results.length === 0 ? 'Nenhum encontrado' : `${results.length} mentor${results.length === 1 ? '' : 'es'}`}
        </span>
      </div>
      {results.length === 0 ? (
        <EmptyState
          title={submitted ? 'Nenhum mentor corresponde à pesquisa' : 'Ainda não há mentores publicados'}
          description={submitted
            ? 'Experimente especialidades mais amplas ou limpe a pesquisa.'
            : 'Os perfis de mentores aparecem aqui assim que forem aprovados.'}
          hints={submitted ? undefined : [
            'Cada perfil reúne a especialidade e a apresentação do mentor.',
            'O pedido de sessão fica disponível quando existirem mentores aprovados.',
          ]}
          action={submitted
            ? <button className="button button--outline" type="button" onClick={clearSearch}>Limpar pesquisa</button>
            : <Link className="button button--outline" to="/bolsas">Explorar bolsas <ArrowUpRight size={16} /></Link>}
        />
      ) : (
        <ul className="result-list">
          {results.map((mentor) => (
            <li key={mentor.id}>
              <div className="result-card result-card--static">
                <Link className="result-card__title" to={`/mentores/${mentor.id}`}>{mentor.name}</Link>
                {mentor.specialty && <span className="result-card__meta">{mentor.specialty}</span>}
                {mentor.bio && <span className="result-card__text">{excerpt(mentor.bio)}</span>}
                <span className="result-card__foot">
                  <Link className="text-link" to={`/mentores/${mentor.id}`}>Ver perfil</Link>
                  <Link className="button button--small button--primary" to={`/agendar?mentor=${encodeURIComponent(mentor.id)}`}>Agendar</Link>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
