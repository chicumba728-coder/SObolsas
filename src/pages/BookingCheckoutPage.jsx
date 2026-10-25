import React, { useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { DemoNote, EmptyState, Field, Notice, PageHeading, SectionCard, SelectField, TextAreaField } from '../components/ui.jsx';
import { ArrowLeft, Lock } from '../components/icons.jsx';
import { addRecord, useCollection } from '../data/store.js';
import { formatDate, todayISO } from '../data/status.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BookingPage() {
  const { search } = useRouter();
  const mentors = useCollection('mentors').filter((m) => m.status === 'approved');
  const bookings = useCollection('bookings');
  const presetMentor = new URLSearchParams(search).get('mentor') || '';
  const [values, setValues] = useState({
    mentorId: '', date: '', time: '', studentName: '', studentEmail: '', topic: '',
  });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);

  // Pré-seleciona o mentor vindo do perfil (?mentor=ID), se continuar aprovado.
  const mentorId = values.mentorId || (mentors.some((m) => m.id === presetMentor) ? presetMentor : '');

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const clean = {
      mentorId,
      date: values.date,
      time: values.time,
      studentName: values.studentName.trim(),
      studentEmail: values.studentEmail.trim(),
      topic: values.topic.trim(),
    };
    const next = {};
    if (!clean.mentorId) next.mentorId = 'Escolha um mentor.';
    if (!clean.date) next.date = 'Escolha a data.';
    else if (clean.date < todayISO()) next.date = 'A data não pode estar no passado.';
    if (!clean.time) next.time = 'Escolha o horário.';
    if (!clean.studentName) next.studentName = 'Indique o seu nome.';
    if (!clean.studentEmail) next.studentEmail = 'Indique o endereço de email.';
    else if (!EMAIL_RE.test(clean.studentEmail)) next.studentEmail = 'Introduza um endereço de email válido.';
    if (!next.time && !next.date && clean.mentorId) {
      const clash = bookings.some((b) => b.mentorId === clean.mentorId && b.date === clean.date && b.time === clean.time && b.status !== 'cancelled');
      if (clash) next.time = 'Este horário já tem um pedido. Escolha outro.';
    }
    setErrors(next);
    const order = ['mentorId', 'date', 'time', 'studentName', 'studentEmail'];
    const first = order.find((field) => next[field]);
    if (first) { document.getElementById(`booking-${first}`)?.focus(); return; }

    const mentor = mentors.find((m) => m.id === clean.mentorId);
    addRecord('bookings', { ...clean, mentorName: mentor?.name || '', status: 'pending', source: 'public' });
    setDone({ mentorName: mentor?.name || '', date: clean.date, time: clean.time });
  };

  if (done) {
    return (
      <div className="content-wrap content-wrap--narrow page-content">
        <PageHeading title="Pedido registado" />
        <Notice tone="success" title="Pedido de sessão registado">
          Sessão com {done.mentorName} em {formatDate(done.date)} às {done.time}. Fica pendente até a administração a confirmar.
          Nesta versão não é enviado email nem cobrado qualquer valor.
        </Notice>
        <div className="detail-actions">
          <button className="button button--outline" type="button" onClick={() => { setDone(null); setValues({ mentorId: '', date: '', time: '', studentName: '', studentEmail: '', topic: '' }); }}>Fazer outro pedido</button>
          <Link className="button button--primary" to="/mentores">Voltar aos mentores</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrap content-wrap--narrow page-content">
      <PageHeading title="Agendamento" description="Escolha um mentor, uma data e um horário para pedir uma sessão de mentoria." />
      <SectionCard title="Pedir sessão" description="O pedido fica pendente até ser confirmado pela administração.">
        {mentors.length === 0 ? (
          <EmptyState
            compact
            title="Ainda não há mentores disponíveis"
            description="Assim que existirem mentores aprovados, poderá escolher um mentor, uma data e um horário."
          />
        ) : (
          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            <fieldset className="form-group">
              <legend>Detalhes da sessão</legend>
              <div className="form-grid form-grid--three">
                <SelectField
                  id="booking-mentorId"
                  label="Mentor"
                  required
                  placeholder="Escolha um mentor"
                  options={mentors.map((m) => ({ value: m.id, label: m.specialty ? `${m.name} — ${m.specialty}` : m.name }))}
                  value={mentorId}
                  onChange={setValue('mentorId')}
                  error={errors.mentorId}
                />
                <Field id="booking-date" label="Data" type="date" required min={todayISO()} value={values.date} onChange={setValue('date')} error={errors.date} />
                <Field id="booking-time" label="Horário" type="time" required value={values.time} onChange={setValue('time')} error={errors.time} />
              </div>
            </fieldset>
            <fieldset className="form-group">
              <legend>Os seus dados</legend>
              <div className="form-grid">
                <Field id="booking-studentName" label="Nome" required autoComplete="name" value={values.studentName} onChange={setValue('studentName')} error={errors.studentName} />
                <Field id="booking-studentEmail" label="Endereço de email" type="email" required autoComplete="email" value={values.studentEmail} onChange={setValue('studentEmail')} error={errors.studentEmail} />
                <TextAreaField className="form-field--full" id="booking-topic" label="Assunto (opcional)" rows="3" value={values.topic} onChange={setValue('topic')} />
              </div>
            </fieldset>
            <div className="form-actions">
              <button className="button button--primary" type="submit">Enviar pedido</button>
            </div>
          </form>
        )}
      </SectionCard>
      <div className="page-footer">
        <Link className="text-link" to="/mentores"><ArrowLeft size={15} /> Voltar aos mentores</Link>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  return (
    <div className="content-wrap content-wrap--narrow page-content">
      <PageHeading title="Checkout" description="Confirme a sessão e conclua o pagamento com segurança." />
      <DemoNote>Não são recolhidos dados de pagamento nem processada qualquer transação nesta versão.</DemoNote>
      <div className="checkout-grid">
        <SectionCard title="Resumo da reserva" description="A sessão escolhida no agendamento aparece aqui.">
          <div className="order-summary">
            <div className="order-line">
              <span className="order-line__label">Serviço</span>
              <span className="order-line__value order-line__value--empty">Nenhum selecionado</span>
            </div>
            <div className="order-line">
              <span className="order-line__label">Data e horário</span>
              <span className="order-line__value order-line__value--empty">Por definir</span>
            </div>
            <div className="order-line">
              <span className="order-line__label">Mentor</span>
              <span className="order-line__value order-line__value--empty">Por definir</span>
            </div>
            <div className="order-total">
              <span className="order-total__label">Total</span>
              <span className="order-total__value">—</span>
            </div>
          </div>
          <p className="order-reassure"><Lock size={15} /> Só avança para pagamento depois de escolher um serviço. Nenhum valor é cobrado nesta versão.</p>
        </SectionCard>
        <SectionCard title="Pagamento" description="Métodos de pagamento e faturação.">
          <div className="payment-placeholder">
            <span className="payment-placeholder__icon" aria-hidden="true"><Lock size={20} /></span>
            <strong>Pagamento ainda não disponível</strong>
            <p>O checkout fica ativo quando a integração de pagamentos for concluída. Nenhum valor ou método foi adicionado.</p>
            <button type="button" className="button button--primary button--wide" disabled>Concluir pagamento</button>
          </div>
        </SectionCard>
      </div>
      <div className="page-footer">
        <Link className="text-link" to="/agendar"><ArrowLeft size={15} /> Voltar ao agendamento</Link>
      </div>
    </div>
  );
}
