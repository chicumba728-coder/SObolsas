import React, { useEffect, useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { EmptyState, PageHeading, SearchField } from '../components/ui.jsx';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/icons.jsx';
import { emptyData } from '../data/emptyData.js';

export default function MentorsPage({ detailId }) {
  const { search, navigate } = useRouter();
  const applied = new URLSearchParams(search).get('pesquisa') || '';
  const [query, setQuery] = useState(applied);

  useEffect(() => {
    setQuery(new URLSearchParams(search).get('pesquisa') || '');
  }, [search]);

  if (detailId) {
    return (
      <div className="content-wrap content-wrap--narrow page-content detail-page">
        <Link className="back-link" to="/mentores"><ArrowLeft size={15} /> Voltar aos mentores</Link>
        <PageHeading title="Perfil de mentor" />
        <EmptyState
          title="Este perfil não está disponível"
          description="Não existe um mentor publicado com este identificador."
          action={<Link className="text-link" to="/mentores">Ver todos os mentores <ArrowRight size={15} /></Link>}
        />
      </div>
    );
  }

  const total = emptyData.mentors.length;
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
        description="Consulte perfis, especialidades, serviços e disponibilidade, e agende uma sessão."
      />
      <form className="toolbar toolbar--single" onSubmit={applySearch} role="search" aria-label="Pesquisar mentores pela especialidade">
        <SearchField
          id="mentor-query"
          label="Pesquisar por especialidade"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="toolbar__actions">
          <button className="button button--primary" type="submit">Pesquisar</button>
          {submitted && <button className="button button--text" type="button" onClick={clearSearch}>Limpar</button>}
        </div>
      </form>
      <div className="list-toolbar">
        <span>{submitted ? <>Resultados para <strong>“{applied}”</strong></> : 'Todos os mentores'}</span>
        <span className="list-toolbar__count" role="status" aria-live="polite">{total === 0 ? 'Nenhum publicado' : `${total} mentor${total === 1 ? '' : 'es'}`}</span>
      </div>
      {total === 0 && (
        <EmptyState
          title={submitted ? 'Nenhum mentor corresponde à pesquisa' : 'Ainda não há mentores publicados'}
          description={submitted
            ? 'Experimente especialidades mais amplas ou limpe a pesquisa.'
            : 'Os perfis de mentores aparecem aqui assim que forem publicados.'}
          hints={submitted ? undefined : [
            'Cada perfil reúne especialidades, serviços e preços.',
            'O agendamento fica disponível quando existir disponibilidade real.',
          ]}
          action={submitted
            ? <button className="button button--outline" type="button" onClick={clearSearch}>Limpar pesquisa</button>
            : <Link className="button button--outline" to="/bolsas">Explorar bolsas <ArrowUpRight size={16} /></Link>}
        />
      )}
    </div>
  );
}
