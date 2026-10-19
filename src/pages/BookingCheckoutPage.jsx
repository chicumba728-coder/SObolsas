import React from 'react';
import { Link } from '../router.jsx';
import { DemoNote, EmptyState, PageHeading, SectionCard } from '../components/ui.jsx';
import { ArrowLeft, Lock } from '../components/icons.jsx';
import { emptyData } from '../data/emptyData.js';

export function BookingPage() {
  const hasServices = emptyData.services.length > 0;
  return (
    <div className="content-wrap content-wrap--narrow page-content">
      <PageHeading title="Agendamento" description="Escolha um serviço e um horário para marcar uma sessão de mentoria." />
      <SectionCard title="Selecionar sessão" description="Os serviços e horários ficam disponíveis quando a ligação estiver ativa.">
        <DemoNote>O agendamento ainda não está ligado a serviços nem a calendários. Nenhuma reserva é criada.</DemoNote>
        <fieldset className="form-group">
          <legend>Detalhes da sessão</legend>
          <div className="form-grid form-grid--three">
            <div className="form-field">
              <label htmlFor="booking-service">Serviço</label>
              <select id="booking-service" name="servico" disabled>
                <option>Sem serviços disponíveis</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="booking-date">Data</label>
              <input id="booking-date" name="data" type="date" disabled />
            </div>
            <div className="form-field">
              <label htmlFor="booking-time">Horário</label>
              <select id="booking-time" name="horario" disabled>
                <option>Sem horários disponíveis</option>
              </select>
            </div>
          </div>
        </fieldset>
        {!hasServices && (
          <EmptyState
            compact
            title="Sem serviços disponíveis"
            description="Assim que existirem serviços publicados, poderá escolher um serviço, uma data e um horário."
          />
        )}
        <div className="form-actions">
          <button className="button button--primary" type="button" disabled>Continuar para checkout</button>
        </div>
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
