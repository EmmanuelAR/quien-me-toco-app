-- quitar participantes sin cuenta / ghost tokens

drop table if exists ghost_tokens;

alter table members drop column if exists is_ghost;
