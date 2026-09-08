DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'dashboard_app'
  ) THEN
    CREATE ROLE dashboard_app LOGIN;
  END IF;
END
$$;

REVOKE ALL
ON DATABASE "misheel1"
FROM PUBLIC;

GRANT CONNECT
ON DATABASE "misheel1"
TO dashboard_app;

GRANT USAGE
ON SCHEMA public
TO dashboard_app;

GRANT SELECT
ON ALL TABLES
IN SCHEMA public
TO dashboard_app;

REVOKE INSERT, UPDATE, DELETE
ON ALL TABLES
IN SCHEMA public
FROM dashboard_app;

GRANT
  SELECT,
  INSERT,
  UPDATE,
  DELETE
ON TABLE
  public.dashboard_users,
  public.support_requests
TO dashboard_app;

GRANT USAGE, SELECT
ON ALL SEQUENCES
IN SCHEMA public
TO dashboard_app;

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
GRANT SELECT
ON TABLES
TO dashboard_app;