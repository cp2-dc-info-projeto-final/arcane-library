-- Script de inicialização automática do PostgreSQL
-- Este arquivo é executado automaticamente pelo Docker

-- Criar usuário da aplicação se não existir
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'arcane_library') THEN
      CREATE USER arcane_library WITH ENCRYPTED PASSWORD 'arcane_library';
   END IF;
END
$$;

-- Conceder permissões ao usuário no banco arcane_library
\c arcane_library;
GRANT ALL ON SCHEMA public TO arcane_library;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO arcane_library;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO arcane_library;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO arcane_library;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO arcane_library;
