-- SyncSpace Supabase schema
-- RESET VERSION: running this script deletes existing public SyncSpace tables
-- and booking data. Supabase Auth users in auth.users are NOT deleted.

begin;

create extension if not exists pgcrypto;

-- =========================================================
-- 1. REMOVE THE OLD PROTOTYPE SCHEMA
-- =========================================================

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.refunds cascade;
drop table if exists public.payments cascade;
drop table if exists public.bookings cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.workspace_types cascade;
drop table if exists public.profiles cascade;

drop function if exists public.get_my_reservations() cascade;
drop function if exists public.admin_process_refund(uuid, text, text) cascade;
drop function if exists public.request_booking_cancellation(uuid, text) cascade;
drop function if exists public.complete_simulated_payment(uuid) cascade;
drop function if exists public.create_pending_booking(text, date, date, text, integer) cascade;
drop function if exists public.get_workspace_availability(date, date, text, text, integer) cascade;
drop function if exists public.resolve_slot_timestamp(date, text, boolean) cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

-- =========================================================
-- 2. APPLICATION TABLES
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'customer'
    check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_types (
  id text primary key,
  name text not null unique,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id text primary key,
  workspace_type_id text not null
    references public.workspace_types(id) on delete restrict,
  unit_code text not null unique,
  name text not null,
  description text not null,
  layout text not null,
  capacity integer not null check (capacity > 0),
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id text not null
    references public.workspaces(id) on delete restrict,

  start_date date not null,
  end_date date not null,
  time_slot text not null
    check (
      time_slot in (
        '09:00 - 12:00',
        '13:00 - 17:00',
        '18:00 - 21:00',
        'Full day'
      )
    ),

  starts_at timestamptz not null,
  ends_at timestamptz not null,
  party_size integer not null check (party_size > 0),

  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total numeric(10, 2) not null check (total >= 0),

  status text not null default 'pending_payment'
    check (
      status in (
        'pending_payment',
        'confirmed',
        'completed',
        'cancel_requested',
        'cancelled',
        'expired'
      )
    ),

  expires_at timestamptz,
  cancellation_requested_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bookings_valid_date_range
    check (end_date >= start_date),

  constraint bookings_valid_timestamp_range
    check (ends_at > starts_at)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique
    references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'paid',
        'failed',
        'refund_pending',
        'refunded'
      )
    ),
  payment_method text,
  payment_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique
    references public.bookings(id) on delete cascade,
  payment_id uuid not null
    references public.payments(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'requested'
    check (
      status in (
        'requested',
        'approved',
        'rejected',
        'processing',
        'refunded'
      )
    ),
  admin_note text,
  processed_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 3. INDEXES
-- =========================================================

create index bookings_user_start_idx
  on public.bookings (user_id, starts_at);

create index bookings_workspace_availability_idx
  on public.bookings (
    workspace_id,
    start_date,
    end_date,
    time_slot,
    status
  );

create index bookings_expiry_idx
  on public.bookings (expires_at)
  where status = 'pending_payment';

create index payments_user_idx
  on public.payments (user_id, created_at desc);

create index refunds_status_idx
  on public.refunds (status, requested_at);

create index workspaces_type_capacity_idx
  on public.workspaces (workspace_type_id, capacity, active);

-- =========================================================
-- 4. COMMON TRIGGERS
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger workspace_types_set_updated_at
before update on public.workspace_types
for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();

-- =========================================================
-- 5. AUTOMATIC PROFILE CREATION
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'User'
    ),
    new.phone,
    'customer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profiles for users who registered before this schema was added.
insert into public.profiles (
  id,
  full_name,
  phone,
  role,
  created_at,
  updated_at
)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'User'
  ),
  u.phone,
  'customer',
  coalesce(u.created_at, now()),
  now()
from auth.users u
on conflict (id) do nothing;

-- =========================================================
-- 6. ADMIN HELPER
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

-- =========================================================
-- 7. SEED WORKSPACE INVENTORY
-- =========================================================

insert into public.workspace_types (
  id,
  name,
  description,
  active
)
values
  (
    'hot-desk',
    'Hot Desk',
    'Individual flexible desks for focused work and daily workspace use.',
    true
  ),
  (
    'meeting-room',
    'Meeting Room',
    'Bookable rooms for meetings, presentations, and team discussions.',
    true
  ),
  (
    'private-suite',
    'Private Suite',
    'Private enclosed workspaces for teams requiring dedicated space.',
    true
  ),
  (
    'event-space',
    'Event Space',
    'Adaptable spaces for workshops, training, networking, and events.',
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active;

-- Ten individual Focus Desk units.
insert into public.workspaces (
  id,
  workspace_type_id,
  unit_code,
  name,
  description,
  layout,
  capacity,
  price,
  image_url,
  active,
  display_order
)
select
  'focus-desk-' || lpad(n::text, 2, '0'),
  'hot-desk',
  'FD-' || lpad(n::text, 2, '0'),
  'Focus Desk',
  'An individual hot desk with power access and shared workspace amenities.',
  'Open desk near natural light',
  1,
  35.00,
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
  true,
  n
from generate_series(1, 10) as n
on conflict (id) do nothing;

-- Two Studio Four meeting rooms.
insert into public.workspaces (
  id,
  workspace_type_id,
  unit_code,
  name,
  description,
  layout,
  capacity,
  price,
  image_url,
  active,
  display_order
)
values
  (
    'studio-four-01',
    'meeting-room',
    'SF-01',
    'Studio Four',
    'A compact meeting room for client meetings and small team discussions.',
    'Round table, display screen, and whiteboard',
    4,
    90.00,
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
    true,
    20
  ),
  (
    'studio-four-02',
    'meeting-room',
    'SF-02',
    'Studio Four',
    'A compact meeting room for client meetings and small team discussions.',
    'Round table, display screen, and whiteboard',
    4,
    90.00,
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
    true,
    21
  ),
  (
    'launch-room-01',
    'meeting-room',
    'LR-01',
    'Launch Room',
    'A larger meeting room for presentations and structured team sessions.',
    'Boardroom layout with presentation wall',
    8,
    160.00,
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80',
    true,
    30
  ),
  (
    'team-suite-01',
    'private-suite',
    'TS-01',
    'Team Suite',
    'A private suite for teams needing dedicated desks and secure storage.',
    'Private room, team desks, and lockable storage',
    12,
    240.00,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
    true,
    40
  ),
  (
    'creator-corner-01',
    'event-space',
    'CC-01',
    'Creator Corner',
    'A flexible space for workshops, networking sessions, and community events.',
    'Flexible seating for workshops and talks',
    30,
    420.00,
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
    true,
    50
  )
on conflict (id) do nothing;

-- =========================================================
-- 8. TIME-SLOT HELPER
--    Times are interpreted in Malaysia time.
-- =========================================================

create or replace function public.resolve_slot_timestamp(
  p_date date,
  p_time_slot text,
  p_is_start boolean
)
returns timestamptz
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_time time;
begin
  case p_time_slot
    when '09:00 - 12:00' then
      v_time := case when p_is_start then time '09:00' else time '12:00' end;

    when '13:00 - 17:00' then
      v_time := case when p_is_start then time '13:00' else time '17:00' end;

    when '18:00 - 21:00' then
      v_time := case when p_is_start then time '18:00' else time '21:00' end;

    when 'Full day' then
      v_time := case when p_is_start then time '09:00' else time '21:00' end;

    else
      raise exception 'Unsupported time slot: %', p_time_slot;
  end case;

  return (p_date + v_time) at time zone 'Asia/Kuala_Lumpur';
end;
$$;

-- =========================================================
-- 9. AVAILABILITY RPC USED BY booking.js
-- =========================================================

create or replace function public.get_workspace_availability(
  p_start_date date,
  p_end_date date,
  p_time_slot text,
  p_room_type text,
  p_party_size integer
)
returns table (
  workspace_id text,
  unit_code text,
  workspace_name text,
  workspace_type text,
  layout text,
  capacity integer,
  price numeric,
  image_url text,
  is_available boolean,
  unavailable_reason text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_start_date is null or p_end_date is null then
    raise exception 'Start date and end date are required.';
  end if;

  if p_end_date < p_start_date then
    raise exception 'End date cannot be before start date.';
  end if;

  if p_party_size is null or p_party_size < 1 then
    raise exception 'Party size must be at least 1.';
  end if;

  perform public.resolve_slot_timestamp(p_start_date, p_time_slot, true);

  return query
  select
    w.id,
    w.unit_code,
    w.name,
    wt.name,
    w.layout,
    w.capacity,
    w.price,
    w.image_url,
    not exists (
      select 1
      from public.bookings b
      where b.workspace_id = w.id
        and b.start_date <= p_end_date
        and b.end_date >= p_start_date
        and (
          b.time_slot = p_time_slot
          or b.time_slot = 'Full day'
          or p_time_slot = 'Full day'
        )
        and (
          b.status in ('confirmed', 'cancel_requested')
          or (
            b.status = 'pending_payment'
            and b.expires_at > now()
          )
        )
    ) as is_available,
    case
      when exists (
        select 1
        from public.bookings b
        where b.workspace_id = w.id
          and b.start_date <= p_end_date
          and b.end_date >= p_start_date
          and (
            b.time_slot = p_time_slot
            or b.time_slot = 'Full day'
            or p_time_slot = 'Full day'
          )
          and (
            b.status in ('confirmed', 'cancel_requested')
            or (
              b.status = 'pending_payment'
              and b.expires_at > now()
            )
          )
      ) then 'Reserved for the selected date and time'
      else null
    end as unavailable_reason
  from public.workspaces w
  join public.workspace_types wt
    on wt.id = w.workspace_type_id
  where w.active = true
    and wt.active = true
    and w.capacity >= p_party_size
    and (
      p_room_type is null
      or wt.name = p_room_type
    )
  order by w.display_order, w.unit_code;
end;
$$;

-- =========================================================
-- 10. PENDING-BOOKING RPC USED BY booking.js
-- =========================================================

create or replace function public.create_pending_booking(
  p_workspace_id text,
  p_start_date date,
  p_end_date date,
  p_time_slot text,
  p_party_size integer
)
returns table (
  id uuid,
  status text,
  total numeric,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_workspace public.workspaces%rowtype;
  v_booking public.bookings%rowtype;
  v_days integer;
  v_total numeric(10, 2);
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'You must be logged in to create a booking.';
  end if;

  if p_start_date is null or p_end_date is null then
    raise exception 'Start date and end date are required.';
  end if;

  if p_end_date < p_start_date then
    raise exception 'End date cannot be before start date.';
  end if;

  if p_start_date < (now() at time zone 'Asia/Kuala_Lumpur')::date then
    raise exception 'The booking date cannot be in the past.';
  end if;

  if p_party_size is null or p_party_size < 1 then
    raise exception 'Party size must be at least 1.';
  end if;

  -- Serializes booking attempts for the same physical workspace unit.
  perform pg_advisory_xact_lock(
    hashtextextended(p_workspace_id, 0)
  );

  select w.*
  into v_workspace
  from public.workspaces w
  where w.id = p_workspace_id
    and w.active = true;

  if not found then
    raise exception 'The selected workspace does not exist or is inactive.';
  end if;

  if v_workspace.capacity < p_party_size then
    raise exception 'The selected workspace cannot accommodate this number of people.';
  end if;

  v_starts_at := public.resolve_slot_timestamp(
    p_start_date,
    p_time_slot,
    true
  );

  v_ends_at := public.resolve_slot_timestamp(
    p_end_date,
    p_time_slot,
    false
  );

  -- Expire old unpaid holds for this workspace before checking availability.
  update public.bookings b
  set status = 'expired'
  where b.workspace_id = p_workspace_id
    and b.status = 'pending_payment'
    and b.expires_at <= now();

  update public.payments p
  set status = 'failed'
  where p.status = 'pending'
    and exists (
      select 1
      from public.bookings b
      where b.id = p.booking_id
        and b.status = 'expired'
    );

  if exists (
    select 1
    from public.bookings b
    where b.workspace_id = p_workspace_id
      and b.start_date <= p_end_date
      and b.end_date >= p_start_date
      and (
        b.time_slot = p_time_slot
        or b.time_slot = 'Full day'
        or p_time_slot = 'Full day'
      )
      and (
        b.status in ('confirmed', 'cancel_requested')
        or (
          b.status = 'pending_payment'
          and b.expires_at > now()
        )
      )
  ) then
    raise exception using
      errcode = '23P01',
      message = 'The selected workspace is no longer available for this date and time.';
  end if;

  v_days := (p_end_date - p_start_date) + 1;
  v_total := v_workspace.price * v_days;

  insert into public.bookings (
    user_id,
    workspace_id,
    start_date,
    end_date,
    time_slot,
    starts_at,
    ends_at,
    party_size,
    unit_price,
    total,
    status,
    expires_at
  )
  values (
    v_user_id,
    p_workspace_id,
    p_start_date,
    p_end_date,
    p_time_slot,
    v_starts_at,
    v_ends_at,
    p_party_size,
    v_workspace.price,
    v_total,
    'pending_payment',
    now() + interval '15 minutes'
  )
  returning * into v_booking;

  insert into public.payments (
    booking_id,
    user_id,
    amount,
    status
  )
  values (
    v_booking.id,
    v_user_id,
    v_total,
    'pending'
  );

  return query
  select
    v_booking.id,
    v_booking.status,
    v_booking.total,
    v_booking.expires_at;
end;
$$;

-- =========================================================
-- 11. SIMULATED PAYMENT RPC FOR THE FUTURE payment.js
--     This is for a classroom prototype, not real payment processing.
-- =========================================================

create or replace function public.complete_simulated_payment(
  p_booking_id uuid
)
returns table (
  booking_id uuid,
  booking_status text,
  payment_status text,
  payment_reference text,
  total numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_reference text;
begin
  if v_user_id is null then
    raise exception 'You must be logged in to complete payment.';
  end if;

  select b.*
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status = 'confirmed' then
    select p.*
    into v_payment
    from public.payments p
    where p.booking_id = v_booking.id;

    return query
    select
      v_booking.id,
      v_booking.status,
      v_payment.status,
      v_payment.payment_reference,
      v_booking.total;

    return;
  end if;

  if v_booking.status <> 'pending_payment' then
    raise exception 'This booking is not awaiting payment.';
  end if;

  if v_booking.expires_at <= now() then
    update public.bookings
    set status = 'expired'
    where id = v_booking.id;

    update public.payments
    set status = 'failed'
    where booking_id = v_booking.id;

    raise exception 'The payment period has expired. Create a new booking.';
  end if;

  v_reference :=
    'SIM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  update public.payments p
  set
    status = 'paid',
    payment_method = 'simulated_card',
    payment_reference = v_reference,
    paid_at = now()
  where p.booking_id = v_booking.id
  returning * into v_payment;

  update public.bookings
  set status = 'confirmed'
  where id = v_booking.id
  returning * into v_booking;

  return query
  select
    v_booking.id,
    v_booking.status,
    v_payment.status,
    v_payment.payment_reference,
    v_booking.total;
end;
$$;

-- =========================================================
-- 12. CUSTOMER CANCELLATION / REFUND REQUEST RPC
-- =========================================================

create or replace function public.request_booking_cancellation(
  p_booking_id uuid,
  p_reason text
)
returns table (
  booking_id uuid,
  booking_status text,
  refund_id uuid,
  refund_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_refund public.refunds%rowtype;
begin
  if v_user_id is null then
    raise exception 'You must be logged in to request cancellation.';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'A cancellation reason is required.';
  end if;

  select b.*
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status <> 'confirmed' then
    raise exception 'Only confirmed bookings can be cancelled.';
  end if;

  if v_booking.starts_at <= now() then
    raise exception 'A booking cannot be cancelled after it has started.';
  end if;

  select p.*
  into v_payment
  from public.payments p
  where p.booking_id = v_booking.id
    and p.status = 'paid'
  for update;

  if not found then
    raise exception 'A completed payment was not found for this booking.';
  end if;

  update public.bookings
  set
    status = 'cancel_requested',
    cancellation_requested_at = now()
  where id = v_booking.id
  returning * into v_booking;

  update public.payments
  set status = 'refund_pending'
  where id = v_payment.id
  returning * into v_payment;

  insert into public.refunds (
    booking_id,
    payment_id,
    requested_by,
    reason,
    amount,
    status
  )
  values (
    v_booking.id,
    v_payment.id,
    v_user_id,
    trim(p_reason),
    v_payment.amount,
    'requested'
  )
  on conflict (booking_id) do update
  set
    reason = excluded.reason,
    amount = excluded.amount,
    status = 'requested',
    requested_at = now(),
    processed_at = null,
    processed_by = null,
    admin_note = null
  returning * into v_refund;

  return query
  select
    v_booking.id,
    v_booking.status,
    v_refund.id,
    v_refund.status;
end;
$$;

-- =========================================================
-- 13. ADMIN REFUND PROCESSING RPC
-- =========================================================

create or replace function public.admin_process_refund(
  p_refund_id uuid,
  p_action text,
  p_admin_note text default null
)
returns table (
  refund_id uuid,
  refund_status text,
  booking_status text,
  payment_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_refund public.refunds%rowtype;
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  select r.*
  into v_refund
  from public.refunds r
  where r.id = p_refund_id
  for update;

  if not found then
    raise exception 'Refund request not found.';
  end if;

  if p_action = 'approve' then
    update public.refunds
    set
      status = 'approved',
      processed_by = v_admin_id,
      admin_note = p_admin_note
    where id = v_refund.id
    returning * into v_refund;

  elsif p_action = 'processing' then
    update public.refunds
    set
      status = 'processing',
      processed_by = v_admin_id,
      admin_note = p_admin_note
    where id = v_refund.id
    returning * into v_refund;

  elsif p_action = 'refunded' then
    update public.refunds
    set
      status = 'refunded',
      processed_by = v_admin_id,
      processed_at = now(),
      admin_note = p_admin_note
    where id = v_refund.id
    returning * into v_refund;

    update public.payments
    set status = 'refunded'
    where id = v_refund.payment_id
    returning * into v_payment;

    update public.bookings
    set
      status = 'cancelled',
      cancelled_at = now()
    where id = v_refund.booking_id
    returning * into v_booking;

  elsif p_action = 'reject' then
    update public.refunds
    set
      status = 'rejected',
      processed_by = v_admin_id,
      processed_at = now(),
      admin_note = p_admin_note
    where id = v_refund.id
    returning * into v_refund;

    update public.payments
    set status = 'paid'
    where id = v_refund.payment_id
    returning * into v_payment;

    update public.bookings
    set status = 'confirmed'
    where id = v_refund.booking_id
    returning * into v_booking;

  else
    raise exception 'Unsupported refund action: %', p_action;
  end if;

  if v_payment.id is null then
    select p.* into v_payment
    from public.payments p
    where p.id = v_refund.payment_id;
  end if;

  if v_booking.id is null then
    select b.* into v_booking
    from public.bookings b
    where b.id = v_refund.booking_id;
  end if;

  return query
  select
    v_refund.id,
    v_refund.status,
    v_booking.status,
    v_payment.status;
end;
$$;

-- =========================================================
-- 14. USER RESERVATION-HISTORY RPC FOR THE FUTURE profile.js
-- =========================================================

create or replace function public.get_my_reservations()
returns table (
  id uuid,
  workspace_id text,
  unit_code text,
  workspace_name text,
  workspace_type text,
  start_date date,
  end_date date,
  time_slot text,
  party_size integer,
  total numeric,
  booking_status text,
  payment_status text,
  refund_status text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'You must be logged in to view reservations.';
  end if;

  -- Expire unpaid holds owned by this user.
  update public.bookings b
  set status = 'expired'
  where b.user_id = v_user_id
    and b.status = 'pending_payment'
    and b.expires_at <= now();

  update public.payments p
  set status = 'failed'
  where p.user_id = v_user_id
    and p.status = 'pending'
    and exists (
      select 1
      from public.bookings b
      where b.id = p.booking_id
        and b.status = 'expired'
    );

  -- Move used confirmed reservations into completed history.
  update public.bookings b
  set status = 'completed'
  where b.user_id = v_user_id
    and b.status = 'confirmed'
    and b.ends_at < now();

  return query
  select
    b.id,
    b.workspace_id,
    w.unit_code,
    w.name,
    wt.name,
    b.start_date,
    b.end_date,
    b.time_slot,
    b.party_size,
    b.total,
    b.status,
    p.status,
    r.status,
    b.starts_at,
    b.ends_at,
    b.created_at
  from public.bookings b
  join public.workspaces w
    on w.id = b.workspace_id
  join public.workspace_types wt
    on wt.id = w.workspace_type_id
  left join public.payments p
    on p.booking_id = b.id
  left join public.refunds r
    on r.booking_id = b.id
  where b.user_id = v_user_id
  order by b.starts_at asc;
end;
$$;

-- =========================================================
-- 15. ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.workspace_types enable row level security;
alter table public.workspaces enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;

-- Profiles
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.is_admin()
);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Workspace catalogue: public can view active records; admins can manage all.
create policy "Anyone can view active workspace types"
on public.workspace_types
for select
to anon, authenticated
using (active = true or public.is_admin());

create policy "Admins can insert workspace types"
on public.workspace_types
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update workspace types"
on public.workspace_types
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete workspace types"
on public.workspace_types
for delete
to authenticated
using (public.is_admin());

create policy "Anyone can view active workspaces"
on public.workspaces
for select
to anon, authenticated
using (active = true or public.is_admin());

create policy "Admins can insert workspaces"
on public.workspaces
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update workspaces"
on public.workspaces
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete workspaces"
on public.workspaces
for delete
to authenticated
using (public.is_admin());

-- Customers can view only their own operational records.
create policy "Users can view own bookings"
on public.bookings
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin()
);

create policy "Admins can update bookings"
on public.bookings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users can view own payments"
on public.payments
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin()
);

create policy "Admins can update payments"
on public.payments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users can view own refunds"
on public.refunds
for select
to authenticated
using (
  requested_by = (select auth.uid())
  or public.is_admin()
);

create policy "Admins can update refunds"
on public.refunds
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- 16. DATA API GRANTS
-- =========================================================

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.workspace_types from anon, authenticated;
revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.refunds from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

grant select on table public.workspace_types to anon, authenticated;
grant insert, update, delete on table public.workspace_types to authenticated;

grant select on table public.workspaces to anon, authenticated;
grant insert, update, delete on table public.workspaces to authenticated;

grant select, update on table public.bookings to authenticated;
grant select, update on table public.payments to authenticated;
grant select, update on table public.refunds to authenticated;

-- Functions are denied by default, then explicitly granted.
revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.resolve_slot_timestamp(date, text, boolean) from public;
revoke all on function public.is_admin() from public;
revoke all on function public.get_workspace_availability(date, date, text, text, integer) from public;
revoke all on function public.create_pending_booking(text, date, date, text, integer) from public;
revoke all on function public.complete_simulated_payment(uuid) from public;
revoke all on function public.request_booking_cancellation(uuid, text) from public;
revoke all on function public.admin_process_refund(uuid, text, text) from public;
revoke all on function public.get_my_reservations() from public;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.get_workspace_availability(date, date, text, text, integer)
  to anon, authenticated;
grant execute on function public.create_pending_booking(text, date, date, text, integer)
  to authenticated;
grant execute on function public.complete_simulated_payment(uuid)
  to authenticated;
grant execute on function public.request_booking_cancellation(uuid, text)
  to authenticated;
grant execute on function public.admin_process_refund(uuid, text, text)
  to authenticated;
grant execute on function public.get_my_reservations()
  to authenticated;

commit;

-- =========================================================
-- AFTER RUNNING THIS FILE
-- =========================================================
-- Promote one existing registered user to administrator by replacing
-- the email below, then running the statement separately:
--
-- update public.profiles
-- set role = 'admin'
-- where id = (
--   select id
--   from auth.users
--   where email = 'YOUR-ADMIN-EMAIL@example.com'
-- );
