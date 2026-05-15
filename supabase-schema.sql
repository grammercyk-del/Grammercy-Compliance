-- KIPL Compliance Intelligence Platform
-- Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (Extended from Supabase Auth)
-- =====================================================
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('kipl_admin', 'kipl_user', 'gramercy_viewer', 'super_admin')) DEFAULT 'gramercy_viewer',
    organization TEXT CHECK (organization IN ('KIPL', 'Gramercy')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. COMPLIANCES TABLE (Main Data)
-- =====================================================
CREATE TABLE public.compliances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    department TEXT NOT NULL, -- Fire, Environmental, Structural, Electrical, PESO, MPCB
    compliance_category TEXT NOT NULL,
    particulars TEXT NOT NULL,
    frequency TEXT CHECK (frequency IN ('Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time', 'As required')) NOT NULL,
    due_date DATE NOT NULL,
    next_due_date DATE,
    scope_applicable BOOLEAN DEFAULT true,
    remarks TEXT,
    owner_id UUID REFERENCES public.user_profiles(id),
    status TEXT CHECK (status IN ('compliant', 'due_60', 'due_30', 'due_7', 'expired', 'pending')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.user_profiles(id)
);

-- =====================================================
-- 3. ALERTS TABLE
-- =====================================================
CREATE TABLE public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compliance_id UUID REFERENCES public.compliances(id) ON DELETE CASCADE,
    alert_level TEXT CHECK (alert_level IN ('info', 'warning', 'urgent', 'critical')) NOT NULL,
    alert_message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES public.user_profiles(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ACTIVITY LOGS (Audit Trail)
-- =====================================================
CREATE TABLE public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'uploaded'
    entity_type TEXT NOT NULL, -- 'compliance', 'alert', 'user'
    entity_id UUID,
    changes JSONB, -- Store what changed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS: Auto-calculate status and next due date
-- =====================================================

-- Function to calculate compliance status based on due date
CREATE OR REPLACE FUNCTION calculate_compliance_status(due_date DATE)
RETURNS TEXT AS $$
DECLARE
    days_until_due INTEGER;
BEGIN
    days_until_due := due_date - CURRENT_DATE;
    
    IF days_until_due < 0 THEN
        RETURN 'expired';
    ELSIF days_until_due <= 7 THEN
        RETURN 'due_7';
    ELSIF days_until_due <= 30 THEN
        RETURN 'due_30';
    ELSIF days_until_due <= 60 THEN
        RETURN 'due_60';
    ELSE
        RETURN 'compliant';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(current_due DATE, freq TEXT)
RETURNS DATE AS $$
BEGIN
    CASE freq
        WHEN 'Monthly' THEN
            RETURN current_due + INTERVAL '1 month';
        WHEN 'Quarterly' THEN
            RETURN current_due + INTERVAL '3 months';
        WHEN 'Half-yearly' THEN
            RETURN current_due + INTERVAL '6 months';
        WHEN 'Yearly' THEN
            RETURN current_due + INTERVAL '1 year';
        ELSE
            RETURN NULL; -- For 'One-time' or 'As required'
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Auto-update status and timestamps
-- =====================================================

-- Trigger to auto-calculate status before insert/update
CREATE OR REPLACE FUNCTION update_compliance_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status := calculate_compliance_status(NEW.due_date);
    NEW.next_due_date := calculate_next_due_date(NEW.due_date, NEW.frequency);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_compliance_status
    BEFORE INSERT OR UPDATE ON public.compliances
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_status();

-- Trigger to update user_profiles timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
-- Everyone can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Only KIPL admins can view all profiles
CREATE POLICY "KIPL admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('kipl_admin', 'super_admin')
        )
    );

-- COMPLIANCES POLICIES
-- Everyone (KIPL + Gramercy) can view compliances
CREATE POLICY "Everyone can view compliances"
    ON public.compliances FOR SELECT
    USING (true);

-- Only KIPL users can insert compliances
CREATE POLICY "KIPL users can insert compliances"
    ON public.compliances FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('kipl_admin', 'kipl_user', 'super_admin')
            AND organization = 'KIPL'
        )
    );

-- Only KIPL users can update compliances
CREATE POLICY "KIPL users can update compliances"
    ON public.compliances FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('kipl_admin', 'kipl_user', 'super_admin')
            AND organization = 'KIPL'
        )
    );

-- Only KIPL admins can delete compliances
CREATE POLICY "KIPL admins can delete compliances"
    ON public.compliances FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('kipl_admin', 'super_admin')
            AND organization = 'KIPL'
        )
    );

-- ALERTS POLICIES
-- Everyone can view alerts
CREATE POLICY "Everyone can view alerts"
    ON public.alerts FOR SELECT
    USING (true);

-- KIPL users can acknowledge alerts
CREATE POLICY "KIPL users can update alerts"
    ON public.alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND organization = 'KIPL'
        )
    );

-- ACTIVITY LOGS POLICIES
-- Only KIPL admins can view activity logs
CREATE POLICY "KIPL admins can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('kipl_admin', 'super_admin')
        )
    );

-- =====================================================
-- REALTIME: Enable for all tables
-- =====================================================
-- This makes all changes broadcast in real-time to connected clients

ALTER PUBLICATION supabase_realtime ADD TABLE public.compliances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_compliances_status ON public.compliances(status);
CREATE INDEX idx_compliances_due_date ON public.compliances(due_date);
CREATE INDEX idx_compliances_department ON public.compliances(department);
CREATE INDEX idx_alerts_compliance_id ON public.alerts(compliance_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);

-- =====================================================
-- SEED DATA: Sample Compliances
-- =====================================================
-- You'll replace this with your actual data later

INSERT INTO public.compliances (department, compliance_category, particulars, frequency, due_date, scope_applicable, remarks)
VALUES
    ('Fire', 'Fire Safety', 'Fire extinguisher annual maintenance', 'Yearly', '2026-06-30', true, 'Required for all premises'),
    ('Environmental', 'MPCB', 'Consent to Operate renewal', 'Yearly', '2026-07-15', true, 'Critical compliance'),
    ('PESO', 'Licensing', 'PESO license renewal', 'Yearly', '2026-05-20', true, 'Urgent - expiring soon'),
    ('Structural', 'Audit', 'Structural stability audit', 'Yearly', '2026-08-01', true, 'Annual requirement'),
    ('Environmental', 'Waste Management', 'Hazardous waste disposal certificate', 'Quarterly', '2026-06-01', true, 'Q2 2026');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Create user accounts via Supabase Auth
-- 3. Manually add user_profiles entries with correct roles
-- 4. Deploy the Next.js application
