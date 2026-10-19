import React, { useEffect, useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { EmptyState, PageHeading, SearchField } from '../components/ui.jsx';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/icons.jsx';
import { emptyData } from '../data/emptyData.js';

export default function ScholarshipsPage({ detailId }) {
  const { search, navigate } = useRouter();
  const applied = new URLSearchParams(search).get('pesquisa') || '';
  const [query, setQuery] = useState(applied);

  useEffect(() => {
    setQuery(new URLSearchParams(search).get('pesquisa') || '');
  }, [search]);

  if (detailId) {
    return (
      <div className="content-wrap content-wrap--narrow page-content detail-page">
        <Link className="back-link" to="/bolsas"><ArrowLeft size={15} /> Voltar às bolsas</Link>
        <PageHeading title="Detalhe da bolsa" />
        <EmptyState
          title="Esta bolsa não está disponível"
          description="Não existe uma oportunidade publicada com este identificador."
          action={<Link className="text-link" to="/bolsas">Ver todas as bolsas <ArrowRight size={15} /></Link>}
        />
      </div>
    );
  }

  const total = emptyData.scholarships.length;
  const submitted = applied.length > 0;

  const applySearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('pesquisa', query.trim());
    navigate(`/bolsas${params.size ? `?${params.toString()}` : ''}`, { replace: true });
  };

  const clearSearch = () => {
    setQuery('');
    navigate('/bolsas', { replace: true });
  };

  return (
    <div className="content-wrap page-content">
      <PageHeading
        title="Bolsas de estudo"
        description="Pesquise oportunidades por curso, área, instituição ou palavra-chave."
      />
      <form className="toolbar" onSubmit={applySearch} role="search" aria-label="Pesquisar bolsas de estudo">
        <SearchField
          id="scholarship-query"
          label="Pesquisar bolsas"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="toolbar__actions">
          <button className="button button--primary" type="submit">Pesquisar</button>
          {submitted && <button className="button button--text" type="button" onClick={clearSearch}>Limpar</button>}
        </div>
      </form>
      <div className="list-toolbar">
        <span>{submitted ? <>Resultados para <strong>“{applied}”</strong></> : 'Todas as oportunidades'}</span>
        <span className="list-toolbar__count" role="status" aria-live="polite">{total === 0 ? 'Nenhuma publicada' : `${total} oportunidade${total === 1 ? '' : 's'}`}</span>
      </div>
      {total === 0 && (
        <EmptyState
          title={submitted ? 'Nenhuma oportunidade corresponde à pesquisa' : 'Ainda não há bolsas publicadas'}
          description={submitted
            ? 'Experimente termos mais amplos ou limpe a pesquisa para ver todas as oportunidades.'
            : 'As oportunidades de estudo aparecem aqui assim que forem publicadas.'}
          hints={submitted ? undefined : [
            'Pesquise por área, curso ou instituição.',
            'Explore mentores enquanto novas bolsas não são publicadas.',
          ]}
          action={submitted
            ? <button className="button button--outline" type="button" onClick={clearSearch}>Limpar pesquisa</button>
            : <Link className="button button--outline" to="/mentores">Conhecer mentores <ArrowUpRight size={16} /></Link>}
        />
      )}
    </div>
  );
}
