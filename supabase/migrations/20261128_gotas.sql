-- Escondite de rainn: sistema de "gotas" (moneda del juego).
-- No toca public.signups (registro de SALVAME KIM!). Todo lo nuevo es aparte.

-- ---------- tablas ----------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  gotas integer not null default 0 check (gotas >= 0),
  aviso text,                                   -- mensaje pendiente para mostrar una vez (ej. bienvenida Kingpin)
  creado timestamptz not null default now()
);

create table public.misiones (
  id text primary key,
  nombre text not null,
  recompensa integer not null check (recompensa >= 0),
  activa boolean not null default true
);

create table public.misiones_hechas (
  user_id uuid not null references public.perfiles (id) on delete cascade,
  mision_id text not null references public.misiones (id),
  hecho timestamptz not null default now(),
  primary key (user_id, mision_id)
);

create table public.catalogo (
  id text primary key,
  nombre text not null,
  descripcion text,
  precio integer not null check (precio >= 0),
  activo boolean not null default true,
  stock integer check (stock is null or stock >= 0)   -- null = ilimitado
);

create table public.compras (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.perfiles (id) on delete cascade,
  item_id text not null references public.catalogo (id),
  precio integer not null,
  fecha timestamptz not null default now(),
  unique (user_id, item_id)
);
create index compras_user_idx on public.compras (user_id);
create index misiones_hechas_mision_idx on public.misiones_hechas (mision_id);
create index compras_item_idx on public.compras (item_id);

-- ---------- datos iniciales ----------
insert into public.misiones (id, nombre, recompensa) values
  ('bienvenida_kingpin', 'Gracias por estar desde el inicio (KILLPIN)', 20),  -- nombre actualizado el 28 nov
  ('diego_telefono',     'Devolverle el teléfono a Diego', 30),
  ('kim_completado',     'Pasar SALVAME KIM!', 50),
  ('oraciones',          'Escuchar las oraciones de rainn', 10);

insert into public.catalogo (id, nombre, descripcion, precio) values
  ('oracion_secreta', 'Oración secreta', 'Una oración de rainn que nadie más escucha.', 40),
  ('wallpaper_1',     'Wallpaper', 'Fondo de pantalla exclusivo del escondite.', 25),
  ('pase_album',      'Pase del álbum', 'Desbloquea una canción la semana del release.', 100);

-- ---------- seguridad (RLS) ----------
alter table public.perfiles        enable row level security;
alter table public.misiones        enable row level security;
alter table public.misiones_hechas enable row level security;
alter table public.catalogo        enable row level security;
alter table public.compras         enable row level security;

create policy "ver mi perfil"    on public.perfiles        for select to authenticated using ((select auth.uid()) = id);
create policy "ver mis misiones" on public.misiones_hechas for select to authenticated using ((select auth.uid()) = user_id);
create policy "ver mis compras"  on public.compras         for select to authenticated using ((select auth.uid()) = user_id);
create policy "misiones visibles" on public.misiones for select to anon, authenticated using (activa);
create policy "catalogo visible"  on public.catalogo for select to anon, authenticated using (activo);

revoke all on public.perfiles, public.misiones, public.misiones_hechas, public.catalogo, public.compras from anon, authenticated;
grant select on public.misiones, public.catalogo to anon, authenticated;
grant select on public.perfiles, public.misiones_hechas, public.compras to authenticated;

-- ---------- funciones (la única forma de cambiar gotas) ----------
create function public.completar_mision(p_mision text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_rec integer; v_gotas integer;
begin
  if v_uid is null then raise exception 'no_login'; end if;
  if p_mision = 'bienvenida_kingpin' then raise exception 'mision_no_valida'; end if;
  select recompensa into v_rec from public.misiones where id = p_mision and activa;
  if v_rec is null then raise exception 'mision_no_existe'; end if;
  insert into public.misiones_hechas (user_id, mision_id) values (v_uid, p_mision) on conflict do nothing;
  if not found then select gotas into v_gotas from public.perfiles where id = v_uid; return v_gotas; end if;
  update public.perfiles set gotas = gotas + v_rec where id = v_uid returning gotas into v_gotas;
  return v_gotas;
end $$;

create function public.comprar(p_item text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_precio integer; v_gotas integer;
begin
  if v_uid is null then raise exception 'no_login'; end if;
  select precio into v_precio from public.catalogo where id = p_item and activo and (stock is null or stock > 0) for update;
  if v_precio is null then raise exception 'item_no_disponible'; end if;
  if exists (select 1 from public.compras where user_id = v_uid and item_id = p_item) then raise exception 'ya_comprado'; end if;
  update public.perfiles set gotas = gotas - v_precio where id = v_uid and gotas >= v_precio returning gotas into v_gotas;
  if v_gotas is null then raise exception 'gotas_insuficientes'; end if;
  insert into public.compras (user_id, item_id, precio) values (v_uid, p_item, v_precio);
  update public.catalogo set stock = stock - 1 where id = p_item and stock is not null;
  return v_gotas;
end $$;

create function public.ver_aviso()
returns text language plpgsql security definer set search_path = '' as $$
declare v_aviso text;
begin
  select aviso into v_aviso from public.perfiles where id = auth.uid() for update;
  if v_aviso is not null then update public.perfiles set aviso = null where id = auth.uid(); end if;
  return v_aviso;
end $$;

-- perfil automático al crear la cuenta + agradecimiento (+20) para los que estuvieron desde KILLPIN (están en public.signups)
create function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_kim boolean;
begin
  select exists (select 1 from public.signups s where lower(trim(s.email)) = lower(trim(new.email))) into v_kim;
  insert into public.perfiles (id, nombre, gotas, aviso)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          case when v_kim then 20 else 0 end,
          case when v_kim then 'Por haber peleado contra Kingpin te has ganado 20 gotas' end);
  if v_kim then insert into public.misiones_hechas (user_id, mision_id) values (new.id, 'bienvenida_kingpin'); end if;
  return new;
end $$;

create trigger al_crear_usuario after insert on auth.users for each row execute function public.crear_perfil();

revoke all on function public.completar_mision(text), public.comprar(text), public.ver_aviso(), public.crear_perfil() from public, anon;
grant execute on function public.completar_mision(text), public.comprar(text), public.ver_aviso() to authenticated;

-- el trigger no debe poder llamarse desde la API
revoke execute on function public.crear_perfil() from authenticated;
