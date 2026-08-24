export interface CategoriaLivro {
  id_categorias: number;
  nome: string;
}

export interface Livro {
  id: number;
  id_autor: number;
  titulo: string;
  ano_de_publicacao: string;
  editora: string;
  isbn: number;
  foto?: string;

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
  editora: string;
  isbn: number;
  foto?: string;
}