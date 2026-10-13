-- Runs once on an empty data volume. Keycloak gets its own database on the
-- same server so one Postgres instance serves both.
CREATE DATABASE keycloak OWNER daily;
