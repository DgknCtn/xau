-- Migration 005: Add INSERT policy for price_snapshots

-- Normalde sadece okuma yetkisi vardı.
-- Kullanıcıların manuel fiyat girebilmesi için INSERT yetkisi ekliyoruz.

create policy "Authenticated users can insert price_snapshots"
  on price_snapshots for insert
  to authenticated
  with check (true);
