DROP TABLE IF EXISTS usuario;

CREATE TABLE usuario (
    id bigint GENERATED ALWAYS AS IDENTITY,
    login text NOT NULL,
    email text NOT NULL,
    senha text NOT NULL,
    role text NOT NULL DEFAULT 'cliente',
    
    -- Constraints
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uk_usuario_login UNIQUE (login), -- unicidade
    CONSTRAINT uk_usuario_email UNIQUE (email), -- unicidade
    CONSTRAINT ck_usuario_login_length CHECK (length(login) >= 3 AND length(login) <= 50), -- comprimento
    CONSTRAINT ck_usuario_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- formato de email com expressão regular
    CONSTRAINT ck_usuario_senha_length CHECK (length(senha) >= 6), -- comprimento mínimo
    CONSTRAINT ck_usuario_role_valid CHECK (role IN ('admin','bibliotecario','cliente')) -- tipos de usuário
);

INSERT INTO usuario (login, email, senha, role) VALUES
-- senha 123456
('Gui', 'gui@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK', 'admin'),
('Biel', 'biel@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK', 'cliente');


