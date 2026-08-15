DROP TABLE IF EXISTS usuario CASCADE;

CREATE TABLE usuario (
    id bigint GENERATED ALWAYS AS IDENTITY,
    login text NOT NULL,
    email text NOT NULL,
    senha text NOT NULL,
    telefone text NOT NULL,
    cpf text NOT NULL,
    datanasc date NOT NULL,
    foto TEXT,
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

DROP TABLE IF EXISTS categorias CASCADE;
 
CREATE TABLE categorias (
    id_categorias BIGINT GENERATED ALWAYS AS IDENTITY,
    nome text NOT NULL,
    
    CONSTRAINT pk_categorias PRIMARY KEY (id)
);


DROP TABLE IF EXISTS livro CASCADE;

CREATE TABLE livro (
     id BIGINT GENERATED ALWAYS AS IDENTITY,
     id_categorias BIGINT NOT NULL,
     titulo text NOT NULL,
     ano_de_publicacao text NOT NULL,
     editora text NOT NULL,
     isbn int NOT NULL,

    CONSTRAINT pk_livro PRIMARY KEY(id),
    CONSTRAINT uk_livro_isbn UNIQUE (isbn),
    CONSTRAINT fk_categorias FOREIGN KEY (id_categorias) REFERENCES categorias(id) ON DELETE CASCADE
);


DROP TABLE IF EXISTS autor CASCADE;  
CREATE TABLE autor (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    nome text NOT NULL,
    pseunonimo text,

    CONSTRAINT pk_autor PRIMARY KEY (id)
);

DROP TABLE IF EXISTS livro_autor CASCADE;
CREATE TABLE livro_autor (
    id_autor BIGINT,
    id_livro BIGINT,

    PRIMARY KEY (id_autor, id_livro),
    CONSTRAINT fk_autor FOREIGN KEY (id_autor) REFERENCES autor(id),
    CONSTRAINT fk_livro FOREIGN KEY (id_livro) REFERENCES livro(id)
);


DROP TABLE IF EXISTS emprestimo CASCADE;
CREATE TABLE emprestimo (
    id BIGINT GENERATED ALWAYS AS IDENTITY, 
    id_usuario BIGINT NOT NULL,
    data_de_emprestimo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim_emprestimo TIMESTAMP,
    status_emprestimo text NOT NULL DEFAULT 'ativo',
    CONSTRAINT pk_emprestimo PRIMARY KEY (id),
    CONSTRAINT fk_emprestimo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT ck_emprestimo_status CHECK (status_emprestimo IN ('ativo', 'devolvido', 'atrasado'))
);

DROP TABLE IF EXISTS emprestimo_livro CASCADE;
CREATE TABLE emprestimo_livro (
    id_emprestimo BIGINT,
    id_livro BIGINT, 
    PRIMARY KEY (id_emprestimo, id_livro),
    CONSTRAINT fk_emprestimo FOREIGN KEY (id_emprestimo) REFERENCES emprestimo(id),
    CONSTRAINT fk_livro FOREIGN KEY (id_livro) REFERENCES livro(id)
);

DROP TABLE IF EXISTS exemplar CASCADE;
CREATE TABLE exemplar (
    id_exemplar BIGINT, 
    id_livro BIGINT,
    PRIMARY KEY (id_exemplar),
    CONSTRAINT fk_livro FOREIGN KEY (id_livro) REFERENCES livro(id)
);
INSERT INTO usuario (foto, login, email, senha, cpf, datanasc, telefone, role) VALUES
-- senha 123456
('','Gui', 'gui@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK','','01/01/2009','', 'admin'),
('','Biel', 'biel@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK','','01/01/2009','', 'cliente');