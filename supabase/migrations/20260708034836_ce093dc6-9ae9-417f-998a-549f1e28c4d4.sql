
alter table public.stores add column if not exists opening_hours jsonb;
comment on column public.stores.opening_hours is 'Horário de atendimento por dia da semana. Ex.: {"mon":{"closed":false,"ranges":[{"open":"09:00","close":"18:00"}]}, ...}';
