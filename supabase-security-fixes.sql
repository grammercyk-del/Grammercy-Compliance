-- ================================================
-- GRAMERCY DASHBOARD — SUPABASE SECURITY FIXES
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- NOTE: This app uses the table "compliances", not "compliance_items".
-- The SQL below references "compliance_items" as originally specified.
-- If you are running this against the Grammercy Compliance Dashboard,
-- replace "compliance_items" with "compliances" throughout.

-- 1. Revoke unsafe anon write privileges
REVOKE INSERT, UPDATE, DELETE, TRIGGER
ON public.compliance_items FROM anon;

-- 2. Drop the old broad write policy
DROP POLICY IF EXISTS "Editors can modify"
ON compliance_items;

-- 3. Create split write policies by operation
CREATE POLICY "Editors can insert" ON compliance_items
FOR INSERT WITH CHECK (
  auth.email() LIKE '%@kesariprojects.com'
);

CREATE POLICY "Editors can update" ON compliance_items
FOR UPDATE USING (
  auth.email() LIKE '%@kesariprojects.com'
);

CREATE POLICY "Editors can delete" ON compliance_items
FOR DELETE USING (
  auth.email() LIKE '%@kesariprojects.com'
);

-- 4. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_compliance_next_renewal
ON compliance_items(next_renewal_date);

CREATE INDEX IF NOT EXISTS idx_compliance_alert_level
ON compliance_items(alert_level);

CREATE INDEX IF NOT EXISTS idx_compliance_owner
ON compliance_items(owner);

-- 5. Fix seed data dates so rows are not all overdue
-- 2 critical, 2 high, 3 medium, 3 normal
UPDATE compliance_items
SET next_renewal_date = CURRENT_DATE - INTERVAL '5 days',
    last_renewed_date = CURRENT_DATE - INTERVAL '365 days'
WHERE ctid IN (
  SELECT ctid FROM compliance_items
  ORDER BY created_at LIMIT 2
);

UPDATE compliance_items
SET next_renewal_date = CURRENT_DATE + INTERVAL '20 days',
    last_renewed_date = CURRENT_DATE - INTERVAL '345 days'
WHERE ctid IN (
  SELECT ctid FROM compliance_items
  ORDER BY created_at LIMIT 2 OFFSET 2
);

UPDATE compliance_items
SET next_renewal_date = CURRENT_DATE + INTERVAL '60 days',
    last_renewed_date = CURRENT_DATE - INTERVAL '305 days'
WHERE ctid IN (
  SELECT ctid FROM compliance_items
  ORDER BY created_at LIMIT 3 OFFSET 4
);

UPDATE compliance_items
SET next_renewal_date = CURRENT_DATE + INTERVAL '120 days',
    last_renewed_date = CURRENT_DATE - INTERVAL '245 days'
WHERE ctid IN (
  SELECT ctid FROM compliance_items
  ORDER BY created_at LIMIT 3 OFFSET 7
);

-- Verify trigger recomputed all values
SELECT certification_name, next_renewal_date,
       alert_level, days_remaining
FROM compliance_items
ORDER BY days_remaining ASC;

-- ================================================
-- END OF FILE
-- ================================================
