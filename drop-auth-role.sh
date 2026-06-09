#!/bin/bash
# Revoke all privileges from authenticated role and drop it
cat <<'SQL' | PGPASSWORD=*** ./neon.sh psql --role-name neondb_owner 2>&1
-- Revoke all privileges from authenticated role
REVOKE ALL PRIVILEGES ON SCHEMA public FROM authenticated;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;

-- Now drop it
DROP ROLE IF EXISTS authenticated;
SQL
