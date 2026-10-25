import React, { useEffect, useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { EmptyState, PageHeading, SearchField, SelectField } from '../components/ui.jsx';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/icons.jsx';
import { useCollection } from '../data/store.js';
import { formatDate, isDeadlineOpen } from '../data/status.js';

const deadlineFilters = [
  { value: 'abertas', label: 'Prazo aberto' },
  { value: 'encerradas', label: 'Prazo encerrado' },
];

const excerpt = (text = '', max = 160) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

function DeadlineBadge({ deadline }) {
  if (!deadline) return <span className="status-badge status-badge--muted">Sem prazo definido</span>;
  return isDeadlineOpen(deadline)
    ? <span className="status-badge status-badge--success">Prazo aberto</span>
    : <span className="status-badge status-badge--muted">Prazo encerrado</span>;
}

function ScholarshipDetail({ id }) {
  const scholarships = useCollection('scholarships');
  const item = scholarships.find((r) => r.id === id && r.status === 'published');

  return (
    <div className="content-wrap content-wrap--narrow page-content detail-page">
      <Link className="back-link" to="/bolsas"><ArrowLeft size={15} /> Voltar às bolsas</Link>
      {!item ? (
        <>
          <PageHeading title="Detalhe da bolsa" />
          <EmptyState
            title="Esta bolsa não está disponível"
            description="Não existe uma oportunidade publicada com este identificador."
            action={<Link className="text-link" to="/bolsas">Ver todas as bolsas <ArrowRight size={15} /></Link>}
          />
        </>
      ) : (
        <>
          <PageHeading title={item.title} description={item.provider} />
          <dl className="detail-facts">
            <div><dt>Entidade</dt><dd>{item.provider}</dd></div>
            <div><dt>Prazo</dt><dd>{formatDate(item.deadline)} <DeadlineBadge deadline={item.deadline} /></dd></div>
          </dl>
          {item.description && (
            <div className="detail-text">
              {item.description.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          )}
          <div className="detail-actions">
            {item.link && /^https?:\/\//i.test(item.link) && (
              <a className="button button--primary" href={item.link} target="_blank" rel="noopener noreferrer">
                Abrir página oficial <ArrowUpRight size={16} />
              </a>
            )}
            <Link className="button button--outline" to="/mentores">Pedir ajuda a um mentor</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ScholarshipsPage({ detailId }) {
  const { search, navigate } = useRouter();
  const params = new URLSearchParams(search);
  const applied = params.get('pesquisa') || '';
  const prazo = deadlineFilters.some((f) => f.value === params.get('prazo')) ? params.get('prazo') : '';
  const [query, setQuery] = useState(applied);
  const scholarships = useCollection('scholarships');

  useEffect(() => {
    setQuery(new URLSearchParams(search).get('pesquisa') || '');
  }, [search]);

  if (detailId) return <ScholarshipDetail id={detailId} />;

  const published = scholarships.filter((r) => r.status === 'published');
  const term = applied.toLowerCase();
  const results = published.filter((r) => {
    if (term && ![r.title, r.provider, r.description].some((value) => (value || '').toLowerCase().includes(term))) return false;
    if (prazo === 'abertas') return isDeadlineOpen(r.deadline);
    if (prazo === 'encerradas') return !isDeadlineOpen(r.deadline);
    return true;
  });
  const filtered = applied.length > 0 || prazo !== '';

  const go = (nextQuery, nextPrazo) => {
    const next = new URLSearchParams();
    if (nextQuery.trim()) next.set('pesquisa', nextQuery.trim());
    if (nextPrazo) next.set('prazo', nextPrazo);
    navigate(`/bolsas${next.size ? `?${next.toString()}` : ''}`, { replace: true });
  };

  const applySearch = (event) => { event.preventDefault(); go(query, prazo); };
  const clearAll = () => { setQuery(''); navigate('/bolsas', { replace: true }); };

  return (
    <div className="content-wrap page-content">
      <PageHeading
        title="Bolsas de estudo"
        description="Pesquise oportunidades por curso, área, instituição ou palavra-chave."
      />
      <form className="toolbar" onSubmit={applySearch} role="search" aria-label="Pesquisar bolsas de estudo">
        <SearchField id="scholarship-query" label="Pesquisar bolsas" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="toolbar__actions">
          <button className="button button--primary" type="submit">Pesquisar</button>
          {filtered && <button className="button button--text" type="button" onClick={clearAll}>Limpar</button>}
        </div>
      </form>
      <div className="filter-row">
        <SelectField
          id="scholarship-deadline"
          label="Prazo"
          placeholder="Todos os prazos"
          options={deadlineFilters}
          value={prazo}
          onChange={(event) => go(applied, event.target.value)}
        />
      </div>
      <div className="list-toolbar">
        <span>{applied ? <>Resultados para <strong>“{applied}”</strong></> : 'Todas as oportunidades'}</span>
        <span className="list-toolbar__count" role="status" aria-live="polite">
          {results.length === 0 ? 'Nenhuma encontrada' : `${results.length} oportunidade${results.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {results.length === 0 ? (
        <EmptyState
          title={filtered ? 'Nenhuma oportunidade corresponde à pesquisa' : 'Ainda não há bolsas publicadas'}
          description={filtered
            ? 'Experimente termos mais amplos ou limpe os filtros para ver todas as oportunidades.'
            : 'As oportunidades de estudo aparecem aqui assim que forem publicadas.'}
          hints={filtered ? undefined : [
            'Pesquise por área, curso ou instituição.',
            'Explore mentores enquanto novas bolsas não são publicadas.',
          ]}
          action={filtered
            ? <button className="button button--outline" type="button" onClick={clearAll}>Limpar pesquisa</button>
            : <Link className="button button--outline" to="/mentores">Conhecer mentores <ArrowUpRight size={16} /></Link>}
        />
      ) : (
        <ul className="result-list">
          {results.map((item) => (
            <li key={item.id}>
              <Link className="result-card" to={`/bolsas/${item.id}`}>
                <span className="result-card__title">{item.title}</span>
                <span className="result-card__meta">{item.provider} · Prazo: {formatDate(item.deadline)}</span>
                {item.description && <span className="result-card__text">{excerpt(item.description)}</span>}
                <span className="result-card__foot"><DeadlineBadge deadline={item.deadline} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
