import React from 'react';
import { Alert, Compass, Search } from './icons.jsx';

export function PageHeading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div className="page-heading__copy">
        <h1>{title}</h1>
        {description && <p className="page-heading__description">{description}</p>}
      </div>
      {action && <div className="page-heading__action">{action}</div>}
    </div>
  );
}

export function SectionHeading({ title, description, action, id }) {
  return (
    <div className="section-heading">
      <div>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-heading__action">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title = 'Ainda não há dados para apresentar',
  description,
  hints,
  action,
  icon,
  titleAs: TitleTag = 'h2',
  compact = false,
}) {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}`} role="status">
      <span className="empty-state__icon" aria-hidden="true">{icon || <Compass size={22} />}</span>
      <div className="empty-state__body">
        <TitleTag className="empty-state__title">{title}</TitleTag>
        {description && <p className="empty-state__description">{description}</p>}
        {hints && (
          <ul className="empty-state__hints">
            {hints.map((hint) => <li key={hint}>{hint}</li>)}
          </ul>
        )}
        {action && <div className="empty-state__action">{action}</div>}
      </div>
    </div>
  );
}

export function Notice({ children, tone = 'info', title, icon = true }) {
  const role = tone === 'error' ? 'alert' : 'status';
  return (
    <div className={`notice notice--${tone}`} role={role}>
      {icon && <span className="notice__icon" aria-hidden="true">{tone === 'error' ? <Alert size={16} /> : <InfoDot />}</span>}
      <div className="notice__body">
        {title && <strong>{title}</strong>}
        <span>{children}</span>
      </div>
    </div>
  );
}

export function DemoNote({ children }) {
  return (
    <Notice tone="info" title="Demonstração">{children}</Notice>
  );
}

function InfoDot() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.12" /><path d="M12 11v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /><circle cx="12" cy="8" r="1.15" fill="currentColor" /></svg>;
}

export function LoadingState({ label = 'A carregar informação…' }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="loading-indicator" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = 'Não foi possível carregar esta informação',
  description = 'Tente novamente. Se o problema persistir, contacte o suporte.',
  action,
}) {
  return (
    <div className="state-panel state-panel--error" role="alert">
      <span className="state-panel__icon" aria-hidden="true"><Alert size={17} /></span>
      <div className="state-panel__body">
        <strong>{title}</strong>
        <p>{description}</p>
        {action && <div className="state-panel__action">{action}</div>}
      </div>
    </div>
  );
}

function FieldLabel({ id, label, required }) {
  return (
    <label htmlFor={id}>
      {label}
      {required && <span className="form-field__required" aria-hidden="true">*</span>}
    </label>
  );
}

function describedBy(id, hint, error) {
  const ids = [];
  if (hint) ids.push(`${id}-hint`);
  if (error) ids.push(`${id}-error`);
  return ids.length ? ids.join(' ') : undefined;
}

export function Field({ label, id, hint, error, required = false, className = '', ...props }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <FieldLabel id={id} label={label} required={required} />
      <input
        id={id}
        name={id}
        required={required}
        aria-required={required ? 'true' : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
      {hint && !error && <p className="form-field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-field__error" id={`${id}-error`}><Alert size={14} />{error}</p>}
    </div>
  );
}

export function TextAreaField({ label, id, hint, error, required = false, className = '', ...props }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <FieldLabel id={id} label={label} required={required} />
      <textarea
        id={id}
        name={id}
        required={required}
        aria-required={required ? 'true' : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
      {hint && !error && <p className="form-field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-field__error" id={`${id}-error`}><Alert size={14} />{error}</p>}
    </div>
  );
}

export function SelectField({ label, id, hint, error, required = false, options, placeholder, className = '', ...props }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <FieldLabel id={id} label={label} required={required} />
      <select
        id={id}
        name={id}
        required={required}
        aria-required={required ? 'true' : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {hint && !error && <p className="form-field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-field__error" id={`${id}-error`}><Alert size={14} />{error}</p>}
    </div>
  );
}

export function SearchField({ label = 'Pesquisar', id = 'pesquisa', hideLabel = false, className = '', ...props }) {
  return (
    <div className={`search-field ${className}`.trim()}>
      <label className={hideLabel ? 'sr-only' : 'search-field__label'} htmlFor={id}>{label}</label>
      <span className="search-field__icon" aria-hidden="true"><Search size={17} /></span>
      <input id={id} name={id} type="search" placeholder={label} {...props} />
    </div>
  );
}

export function DataTable({
  caption,
  columns,
  rows = [],
  renderRow,
  emptyTitle = 'Sem registos',
  emptyDescription = 'Quando existirem dados, serão apresentados aqui.',
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="data-table__empty" colSpan={columns.length}>
                <EmptyState title={emptyTitle} description={emptyDescription} compact titleAs="p" />
              </td>
            </tr>
          ) : rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

export function SectionCard({ title, description, action, children, className = '', as: Tag = 'section' }) {
  return (
    <Tag className={`section-card ${className}`.trim()}>
      {(title || description || action) && (
        <div className="section-card__heading">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action && <div className="section-card__action">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}
