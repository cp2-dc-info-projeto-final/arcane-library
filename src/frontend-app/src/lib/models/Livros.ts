export interface Livro {
  id: number;
  id_autor: number;
  titulo: string;
  ano_de_publicacao: string;
  editora: string;
  isbn: number;
  foto?: string;

  sinopse?: string;
  arquivo?: string;

  autor: string;
  pseunonimo?: string;
  categorias: CategoriaLivro[];
}

export interface LivroFormData {
  id?: number;
  id_autor: number;
  categorias: number[];
  titulo: string;
  ano_de_publicacao: string;
  autor: string;
  editora: string;
  isbn: number;
  foto?: string;
  sinopse?: string;
  arquivo?: string;
}