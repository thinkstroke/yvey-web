-- YVEY Products Table
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Products table
create table public.products (
  id            uuid        default gen_random_uuid() primary key,
  name          text        not null,
  description   text,
  price         numeric     not null,
  compare_price numeric,
  category      text        not null default 'haircare',
  image_url     text,
  images        jsonb       default '[]'::jsonb,
  variants      jsonb       default '[]'::jsonb,
  stock         int         not null default 0,
  is_featured   boolean     not null default false,
  is_active     boolean     not null default true,
  tags          text[]      default '{}',
  created_by    uuid        references public.profiles(id),
  created_at    timestamptz default timezone('utc', now()),
  updated_at    timestamptz default timezone('utc', now())
);

-- Auto-update updated_at on every edit
create or replace function public.handle_product_updated()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger on_product_updated
  before update on public.products
  for each row execute procedure public.handle_product_updated();

-- Enable RLS
alter table public.products enable row level security;

-- Public: authenticated users can view active products
create policy "View active products"
  on products for select
  using (auth.role() = 'authenticated' and is_active = true);

-- Admin: can view ALL products including inactive
create policy "Admin view all products"
  on products for select
  using (
    exists (
      select 1 from public.user_roles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admin only: insert, update, delete
create policy "Admin insert products"
  on products for insert
  with check (
    exists (select 1 from public.user_roles where id = auth.uid() and role = 'admin')
  );

create policy "Admin update products"
  on products for update
  using (
    exists (select 1 from public.user_roles where id = auth.uid() and role = 'admin')
  );

create policy "Admin delete products"
  on products for delete
  using (
    exists (select 1 from public.user_roles where id = auth.uid() and role = 'admin')
  );

-- Seed 6 sample products
insert into public.products
  (name, description, price, compare_price, category, image_url, stock, is_featured, is_active, tags)
values
  ('Hydration Ritual Kit',
   'A deep moisture system for Type 3-4 textured hair. Curl Revive Complex with shea, mongongo oil, and baobab extract for lasting hydration.',
   128, 160, 'ritual_kits',
   'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
   24, true, true, array['bestseller','type4','hydration']),

  ('Scalp Revive Serum',
   'Concentrated scalp treatment that balances oil production, reduces inflammation, and stimulates circulation for optimal hair growth.',
   58, null, 'haircare',
   'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80',
   48, false, true, array['scalp','treatment','growth']),

  ('Curl Definition Cream',
   'Lightweight defining cream that enhances natural curl pattern without crunch. Aloe vera, flaxseed, and argan oil for frizz-free definition.',
   44, null, 'styling',
   'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80',
   62, true, true, array['curls','definition','type3','type4']),

  ('Silk Press Prep Spray',
   'Heat-protecting mist for silk press styling. Thermal barrier up to 450 degrees F with shine and smoothness.',
   36, null, 'styling',
   'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80',
   35, false, true, array['heat-protection','silk-press','shine']),

  ('Glass Skin Essence',
   'Lightweight essence delivering intense hydration and radiance to melanin-rich skin. Niacinamide, hyaluronic acid, and vitamin C.',
   72, 90, 'skincare',
   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
   19, true, true, array['glow','hydration','melanin-rich','bestseller']),

  ('Mongongo Oil',
   'Pure cold-pressed mongongo oil for high-porosity hair. Omega-6 fatty acids and vitamin E to lock in moisture and add lustrous shine.',
   48, null, 'haircare',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
   40, false, true, array['oil','sealing','shine','porosity']);
