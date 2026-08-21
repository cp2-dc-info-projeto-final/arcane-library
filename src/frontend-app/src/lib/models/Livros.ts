export interface Livro {
  id: number;
  id_categorias: number;
  categoria: string;
  titulo: string;
  ano_de_publicacao: string;
  autor: string;
  editora: string;
  isbn: number;
  foto?: string; // URL da foto
}

export interface LivroFormData {
  id?: number;
  id_categorias: number;
  categoria: string;
  titulo: string;
  ano_de_publicacao: string;
  autor: string;
  editora: string;
  isbn: number;
  foto?: string;
}