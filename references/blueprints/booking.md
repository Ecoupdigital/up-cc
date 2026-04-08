# Blueprint: Booking & Scheduling

Aplicar quando: "agendar", "reservar", "barbearia", "clinica", "salao", "consultorio", "horario", "calendario".

---

## Calendario (CAL)

- CAL-01: Visualizacao de calendario (dia, semana, mes)
- CAL-02: Slots de horario visiveis com disponibilidade
- CAL-03: Cores por status (disponivel, ocupado, bloqueado)
- CAL-04: Navegacao entre datas (setas, date picker)
- CAL-05: Visualizacao por profissional/recurso
- CAL-06: Drag & drop para remarcar (desktop)
- CAL-07: Responsivo (lista no mobile, grid no desktop)

## Agendamento (BOOKING)

- BOOKING-01: Fluxo de criacao: servico → profissional → data/hora → confirmar
- BOOKING-02: Mostrar apenas horarios disponiveis
- BOOKING-03: Duracao automatica baseada no servico
- BOOKING-04: Conflito detectado antes de confirmar
- BOOKING-05: Confirmacao com resumo (servico, data, hora, profissional, preco)
- BOOKING-06: Cancelamento com motivo (pelo cliente ou pelo negocio)
- BOOKING-07: Remarcacao (mover para outro horario)
- BOOKING-08: Status do agendamento: confirmado, em andamento, concluido, cancelado, no-show

## Disponibilidade (AVAIL)

- AVAIL-01: Horario de funcionamento configuravel por dia da semana
- AVAIL-02: Bloqueio de horarios especificos (ferias, folga, almoco)
- AVAIL-03: Disponibilidade por profissional individual
- AVAIL-04: Tempo de intervalo entre agendamentos (buffer)
- AVAIL-05: Feriados (bloquear dias)

## Lembretes (REMIND)

- REMIND-01: Lembrete 24h antes (email ou WhatsApp)
- REMIND-02: Confirmacao automatica apos agendamento (email)
- REMIND-03: Notificacao de cancelamento
- REMIND-04: Preferencias de notificacao por cliente

## Servicos (SERVICE)

- SERVICE-01: CRUD de servicos (nome, descricao, duracao, preco)
- SERVICE-02: Categorias de servicos
- SERVICE-03: Ativar/desativar servico (sem deletar)
- SERVICE-04: Imagem do servico (opcional)
- SERVICE-05: Preco variavel por profissional (opcional)
