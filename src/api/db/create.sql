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
    CONSTRAINT uk_usuario_telefone UNIQUE (telefone),
    CONSTRAINT uk_usuario_cpf UNIQUE (cpf),
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
    
    CONSTRAINT pk_categorias PRIMARY KEY (id_categorias)
);


DROP TABLE IF EXISTS livro CASCADE;

CREATE TABLE livro (
     id BIGINT GENERATED ALWAYS AS IDENTITY,
     id_categorias BIGINT,
     titulo text NOT NULL,
     sinopse text NOT NULL,
     ano_de_publicacao text NOT NULL,
     editora text NOT NULL,
     isbn text NOT NULL,
     id_autor BIGINT,
     foto TEXT,

    CONSTRAINT pk_livro PRIMARY KEY(id),
    CONSTRAINT uk_livro_isbn UNIQUE (isbn),
    CONSTRAINT fk_categorias FOREIGN KEY (id_categorias) REFERENCES categorias(id_categorias),
    CONSTRAINT fk_autor FOREIGN KEY (id_autor) REFERENCES autor(id) ON DELETE CASCADE

);

DROP TABLE IF EXISTS livro_categoria CASCADE;
CREATE TABLE livro_categoria (
    id_livro BIGINT,
    id_categorias BIGINT,

    PRIMARY KEY (id_categorias, id_livro),
    CONSTRAINT fk_categorias FOREIGN KEY (id_categorias) REFERENCES categorias(id_categorias),
    CONSTRAINT fk_livro FOREIGN KEY (id_livro) REFERENCES livro(id) ON DELETE CASCADE
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
    id_livro BIGINT NOT NULL,
    data_de_emprestimo DATE ,
    data_fim_emprestimo DATE,
    status_emprestimo text NOT NULL DEFAULT 'ativo',
    CONSTRAINT pk_emprestimo PRIMARY KEY (id),
    CONSTRAINT fk_emprestimo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id),
    CONSTRAINT fk_emprestimo_livro FOREIGN KEY (id_livro) REFERENCES livro(id) ON DELETE CASCADE,

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
('', 'Gui', 'gui@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK','142.387.648-42','2026-11-12','(85)93154-3429', 'admin'),
('', 'Biel', 'biel@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK','135.615.732-54','2026-11-12','(21)91452-3161', 'cliente'),
('', 'Manu', 'manu@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK', '123.456.789-67', '2026-11-12', '(21)96451-3287', 'cliente'),
('', 'Capitão', 'joaopedrosantos@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK', '361.842.159-30', '2026-11-12', '(92)99773-9747', 'cliente'),
('', 'Judce', 'judcejudce@gmail.com', '$2a$12$PA7QHgIxNC8YO6.Og2IVTuVu55N4DHP3C95XtDyQ7BgsDc98nemtK', '105.437.460-03', '2026-11-12', '(28)96932-7323', 'cliente');


INSERT INTO categorias (nome) VALUES 
('Romance'),
('Fiquissão'),
('Comédia'),
('Tehor'),
('Piada'),
('Meigo'),
('Classíco'),
('Suxpenci');


INSERT INTO autor (nome, pseunonimo) VALUES 
 ('Cleberson', 'Cleitinho do grau'),
 ('Só queria ser amado', ''),
 ('A felicidade corre de mim', ''),
 ('Machado de Assis', 'Manassés'),
 ('Arthur Conan Doyle', ''),
 ('Jane Austen', ''),
 ('Franz Kafka', '');

INSERT INTO livro (foto, titulo, id_categorias, sinopse, ano_de_publicacao, editora, isbn, id_autor) VALUES
('', 'Fala Manu', 1, 'A manu falou', '20-08-2022', 'Cleberson and cia', '403943942',1),
('', 'Fala Manuu', 2, 'A manu falou', '20-08-2022', 'Cleberson and cia', '403943941',2),
('', 'Fala Manuuu', 3, 'A manu falou', '20-08-2022', 'Cleberson and cia', '403943949',3),
('', 'Fala Manuuuu', 4, 'A manu falou', '20-08-2022', 'Cleberson and cia', '403943948',4),
('', 'Fala Manuuuuu', 5, 'A manu falou', '20-08-2022', 'Cleberson and cia', '403943947',2);

