-- Verify the security hardening installed. Expect 3 rows.
select tgname
from pg_trigger
where tgname in (
  'trg_properties_guard',
  'trg_deals_guard',
  'trg_enquiries_guard'
);
