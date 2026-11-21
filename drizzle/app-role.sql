DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nextpress_app') THEN
    CREATE ROLE nextpress_app LOGIN NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO nextpress_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nextpress_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nextpress_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nextpress_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nextpress_app;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS app_full_access ON public.%I', t);
    EXECUTE format('CREATE POLICY app_full_access ON public.%I FOR ALL TO nextpress_app USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
