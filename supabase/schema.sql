-- ============================================================
-- GRAMERCY COMPLIANCE DASHBOARD — FULL DATABASE SCHEMA
-- Supabase Project: vwuufzzpuvgxltrdnpre
--
-- INSTRUCTIONS:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file and click Run
--   3. Then run the "First-time setup" queries at the bottom
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── LOOKUP TABLES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS owners (
  owner_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name  TEXT        NOT NULL,
  email       TEXT,
  department  TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  category_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT        NOT NULL,
  description   TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  department_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name TEXT        NOT NULL,
  description     TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── USER ROLES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── COMPLIANCES (BASE TABLE) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliances (
  compliance_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_no    TEXT        NOT NULL DEFAULT ('CERT-' || UPPER(LEFT(gen_random_uuid()::TEXT, 8))),
  certificate_name  TEXT        NOT NULL,
  owner_id          UUID        NOT NULL REFERENCES owners(owner_id),
  category_id       UUID        NOT NULL REFERENCES categories(category_id),
  department_id     UUID        NOT NULL REFERENCES departments(department_id),
  renewal_frequency TEXT        NOT NULL CHECK (renewal_frequency IN (
                                  'Monthly','Quarterly','Half-Yearly','Yearly','Bi-Yearly','One-Time'
                                )),
  last_renewed_date DATE,
  next_renewal_date DATE,
  notes             TEXT,
  is_deleted        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-bump updated_at on every UPDATE
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compliances_updated_at ON compliances;
CREATE TRIGGER trg_compliances_updated_at
  BEFORE UPDATE ON compliances
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ─── AUDIT TABLE ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliances_audit (
  audit_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_id UUID        NOT NULL,
  operation     TEXT        NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  changed_by    TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_values    JSONB,
  new_values    JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_compliance_id ON compliances_audit(compliance_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at    ON compliances_audit(changed_at DESC);

-- Audit trigger: records every INSERT / UPDATE / DELETE on compliances
CREATE OR REPLACE FUNCTION fn_compliance_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO compliances_audit(compliance_id, operation, changed_by, new_values)
    VALUES (NEW.compliance_id, 'INSERT', v_email, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO compliances_audit(compliance_id, operation, changed_by, old_values, new_values)
    VALUES (NEW.compliance_id, 'UPDATE', v_email, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO compliances_audit(compliance_id, operation, changed_by, old_values)
    VALUES (OLD.compliance_id, 'DELETE', v_email, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_compliance_audit ON compliances;
CREATE TRIGGER trg_compliance_audit
  AFTER INSERT OR UPDATE OR DELETE ON compliances
  FOR EACH ROW EXECUTE FUNCTION fn_compliance_audit();

-- ─── SOFT-DELETE RPC ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION soft_delete_compliance(p_compliance_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE compliances
     SET is_deleted = TRUE,
         updated_at = now()
   WHERE compliance_id = p_compliance_id;
END;
$$;

-- ─── VIEWS ───────────────────────────────────────────────────────────────────

-- Active lookup views (used by all dropdowns)
CREATE OR REPLACE VIEW active_owners AS
  SELECT * FROM owners WHERE is_active = TRUE ORDER BY owner_name;

CREATE OR REPLACE VIEW active_categories AS
  SELECT * FROM categories WHERE is_active = TRUE ORDER BY category_name;

CREATE OR REPLACE VIEW active_departments AS
  SELECT * FROM departments WHERE is_active = TRUE ORDER BY department_name;

-- Main reporting view — all dashboard/table queries read from here
CREATE OR REPLACE VIEW compliances_with_status AS
SELECT
  c.compliance_id,
  c.certificate_no,
  c.certificate_name,
  c.owner_id,
  o.owner_name,
  c.category_id,
  cat.category_name,
  c.department_id,
  d.department_name,
  c.renewal_frequency,
  c.last_renewed_date::TEXT  AS last_renewed_date,
  c.next_renewal_date::TEXT  AS next_renewal_date,
  c.notes,
  -- days_remaining: positive = days left, negative = days overdue, null = no date
  CASE
    WHEN c.next_renewal_date IS NULL THEN NULL::INT
    ELSE (c.next_renewal_date - CURRENT_DATE)::INT
  END AS days_remaining,
  -- status classification
  CASE
    WHEN c.next_renewal_date IS NULL                               THEN 'Pending'
    WHEN c.next_renewal_date < CURRENT_DATE - INTERVAL '90 days'  THEN 'Expired'
    WHEN c.next_renewal_date < CURRENT_DATE                       THEN 'Overdue'
    WHEN c.next_renewal_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due Soon'
    ELSE 'Active'
  END AS status,
  c.created_at,
  c.updated_at
FROM compliances       c
JOIN owners            o   ON o.owner_id      = c.owner_id
JOIN categories        cat ON cat.category_id = c.category_id
JOIN departments       d   ON d.department_id = c.department_id
WHERE c.is_deleted = FALSE;

-- Critical alerts view — used by Alerts page
CREATE OR REPLACE VIEW critical_alerts AS
SELECT
  c.compliance_id,
  c.certificate_no,
  c.certificate_name,
  o.owner_name,
  cat.category_name,
  d.department_name,
  c.next_renewal_date::TEXT AS next_renewal_date,
  CASE
    WHEN c.next_renewal_date IS NULL THEN NULL::INT
    ELSE (c.next_renewal_date - CURRENT_DATE)::INT
  END AS days_remaining,
  CASE
    WHEN c.next_renewal_date IS NULL                               THEN 'Pending'
    WHEN c.next_renewal_date < CURRENT_DATE - INTERVAL '90 days'  THEN 'Expired'
    WHEN c.next_renewal_date < CURRENT_DATE                       THEN 'Overdue'
    WHEN c.next_renewal_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due Soon'
    ELSE 'Active'
  END AS status
FROM compliances c
JOIN owners      o   ON o.owner_id      = c.owner_id
JOIN categories  cat ON cat.category_id = c.category_id
JOIN departments d   ON d.department_id = c.department_id
WHERE c.is_deleted = FALSE
  AND (
    c.next_renewal_date IS NULL
    OR c.next_renewal_date <= CURRENT_DATE + INTERVAL '30 days'
  )
ORDER BY c.next_renewal_date ASC NULLS FIRST;

-- Owner risk scores — used by Risk Analytics page
CREATE OR REPLACE VIEW owner_risk_scores AS
SELECT
  o.owner_id,
  o.owner_name,
  COUNT(c.compliance_id)::INT AS total_compliances,
  COUNT(c.compliance_id) FILTER (WHERE c.next_renewal_date < CURRENT_DATE)::INT AS overdue_count,
  COUNT(c.compliance_id) FILTER (
    WHERE c.next_renewal_date >= CURRENT_DATE
      AND c.next_renewal_date <= CURRENT_DATE + INTERVAL '30 days'
  )::INT AS due_soon_count,
  COUNT(c.compliance_id) FILTER (
    WHERE c.next_renewal_date > CURRENT_DATE + INTERVAL '30 days'
  )::INT AS active_count,
  LEAST(100,
    COUNT(c.compliance_id) FILTER (WHERE c.next_renewal_date < CURRENT_DATE) * 40 +
    COUNT(c.compliance_id) FILTER (
      WHERE c.next_renewal_date >= CURRENT_DATE
        AND c.next_renewal_date <= CURRENT_DATE + INTERVAL '30 days'
    ) * 10
  )::INT AS risk_score
FROM owners o
LEFT JOIN compliances c
  ON c.owner_id = o.owner_id AND c.is_deleted = FALSE
WHERE o.is_active = TRUE
GROUP BY o.owner_id, o.owner_name
ORDER BY risk_score DESC, o.owner_name;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE owners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliances_audit ENABLE ROW LEVEL SECURITY;

-- Helper: returns true if calling user is an editor
-- (either has editor role in user_roles OR uses @kesariprojects.com email)
CREATE OR REPLACE FUNCTION is_editor()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'editor'
  )
  OR (
    SELECT COALESCE(email, '') FROM auth.users WHERE id = auth.uid()
  ) ILIKE '%@kesariprojects.com'
$$;

-- Drop old policies if re-running schema
DO $$ BEGIN
  -- owners
  DROP POLICY IF EXISTS owners_select ON owners;
  DROP POLICY IF EXISTS owners_insert ON owners;
  DROP POLICY IF EXISTS owners_update ON owners;
  DROP POLICY IF EXISTS owners_delete ON owners;
  -- categories
  DROP POLICY IF EXISTS categories_select ON categories;
  DROP POLICY IF EXISTS categories_insert ON categories;
  DROP POLICY IF EXISTS categories_update ON categories;
  DROP POLICY IF EXISTS categories_delete ON categories;
  -- departments
  DROP POLICY IF EXISTS departments_select ON departments;
  DROP POLICY IF EXISTS departments_insert ON departments;
  DROP POLICY IF EXISTS departments_update ON departments;
  DROP POLICY IF EXISTS departments_delete ON departments;
  -- user_roles
  DROP POLICY IF EXISTS user_roles_select ON user_roles;
  DROP POLICY IF EXISTS user_roles_manage ON user_roles;
  -- compliances
  DROP POLICY IF EXISTS compliances_select ON compliances;
  DROP POLICY IF EXISTS compliances_insert ON compliances;
  DROP POLICY IF EXISTS compliances_update ON compliances;
  DROP POLICY IF EXISTS compliances_delete ON compliances;
  -- audit
  DROP POLICY IF EXISTS audit_select ON compliances_audit;
  DROP POLICY IF EXISTS audit_insert ON compliances_audit;
END $$;

-- OWNERS
CREATE POLICY owners_select ON owners FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY owners_insert ON owners FOR INSERT TO authenticated WITH CHECK (is_editor());
CREATE POLICY owners_update ON owners FOR UPDATE TO authenticated USING (is_editor());
CREATE POLICY owners_delete ON owners FOR DELETE TO authenticated USING (is_editor());

-- CATEGORIES
CREATE POLICY categories_select ON categories FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY categories_insert ON categories FOR INSERT TO authenticated WITH CHECK (is_editor());
CREATE POLICY categories_update ON categories FOR UPDATE TO authenticated USING (is_editor());
CREATE POLICY categories_delete ON categories FOR DELETE TO authenticated USING (is_editor());

-- DEPARTMENTS
CREATE POLICY departments_select ON departments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY departments_insert ON departments FOR INSERT TO authenticated WITH CHECK (is_editor());
CREATE POLICY departments_update ON departments FOR UPDATE TO authenticated USING (is_editor());
CREATE POLICY departments_delete ON departments FOR DELETE TO authenticated USING (is_editor());

-- USER ROLES (users can only read their own role; service_role manages it)
CREATE POLICY user_roles_select ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_roles_manage ON user_roles FOR ALL  TO service_role  USING (TRUE);

-- COMPLIANCES
CREATE POLICY compliances_select ON compliances FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY compliances_insert ON compliances FOR INSERT TO authenticated WITH CHECK (is_editor());
CREATE POLICY compliances_update ON compliances FOR UPDATE TO authenticated USING (is_editor());
CREATE POLICY compliances_delete ON compliances FOR DELETE TO authenticated USING (is_editor());

-- AUDIT (all authenticated users can read; SECURITY DEFINER trigger writes it)
CREATE POLICY audit_select ON compliances_audit FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY audit_insert ON compliances_audit FOR INSERT TO authenticated WITH CHECK (TRUE);

-- ─── GRANTS ──────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Base tables
GRANT SELECT, INSERT, UPDATE, DELETE ON owners, categories, departments, compliances TO authenticated;
GRANT SELECT ON user_roles, compliances_audit TO authenticated;
GRANT INSERT ON compliances_audit TO authenticated;

-- Views
GRANT SELECT ON active_owners, active_categories, active_departments TO authenticated;
GRANT SELECT ON compliances_with_status, critical_alerts, owner_risk_scores TO authenticated;

-- Functions
GRANT EXECUTE ON FUNCTION soft_delete_compliance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_editor()                  TO authenticated;

-- ─── SAMPLE SEED DATA ────────────────────────────────────────────────────────
-- Uncomment and run after initial schema setup to populate test data.

/*

INSERT INTO owners (owner_name, email, department) VALUES
  ('Ankit Devadiga', 'ankit@kesariprojects.com', 'Environmental'),
  ('Mayank Jain',    'mayank@kesariprojects.com', 'Compliance'),
  ('Priya Sharma',   'priya@kesariprojects.com',  'Infrastructure');

INSERT INTO categories (category_name, description) VALUES
  ('MoEF & CC / MPCB',         'Ministry of Environment, Forest and Climate Change certifications'),
  ('Fire Safety',               'Fire NOC and emergency safety certificates'),
  ('Labour & Employment',       'PF, ESIC, and other labour law compliances'),
  ('Factory / Boiler',          'Factory Act and Boiler regulations'),
  ('Pollution Control',         'Air and water pollution control certificates');

INSERT INTO departments (department_name, description) VALUES
  ('Infrastructure',  'Main infrastructure department'),
  ('Operations',      'Plant operations and maintenance'),
  ('HR & Admin',      'Human resources and administration'),
  ('Legal & Compliance', 'Legal team and compliance officers');

-- After inserting owners/categories/departments, add some sample compliances:
INSERT INTO compliances (
  certificate_name, owner_id, category_id, department_id,
  renewal_frequency, last_renewed_date, next_renewal_date, notes
) VALUES
  (
    'Fire NOC — Block A',
    (SELECT owner_id FROM owners WHERE owner_name = 'Ankit Devadiga'),
    (SELECT category_id FROM categories WHERE category_name = 'Fire Safety'),
    (SELECT department_id FROM departments WHERE department_name = 'Infrastructure'),
    'Yearly',
    CURRENT_DATE - INTERVAL '300 days',
    CURRENT_DATE + INTERVAL '65 days',
    'Annual renewal — coordinate with local fire department'
  ),
  (
    'MPCB Consent to Operate',
    (SELECT owner_id FROM owners WHERE owner_name = 'Ankit Devadiga'),
    (SELECT category_id FROM categories WHERE category_name = 'MoEF & CC / MPCB'),
    (SELECT department_id FROM departments WHERE department_name = 'Operations'),
    'Yearly',
    CURRENT_DATE - INTERVAL '350 days',
    CURRENT_DATE + INTERVAL '15 days',
    'Critical — coordinate with MPCB officer'
  ),
  (
    'PF Registration',
    (SELECT owner_id FROM owners WHERE owner_name = 'Mayank Jain'),
    (SELECT category_id FROM categories WHERE category_name = 'Labour & Employment'),
    (SELECT department_id FROM departments WHERE department_name = 'HR & Admin'),
    'Yearly',
    CURRENT_DATE - INTERVAL '400 days',
    CURRENT_DATE - INTERVAL '35 days',
    NULL
  );

*/

-- ─── FIRST-TIME USER SETUP ───────────────────────────────────────────────────
-- After creating your account (via login page), run this to make yourself an editor.
-- Replace the email with your actual login email.
--
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'editor'
-- FROM auth.users
-- WHERE email = 'your-email@kesariprojects.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'editor';
