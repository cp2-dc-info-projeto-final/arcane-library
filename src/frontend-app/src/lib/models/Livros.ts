export interface Livro {
  id: number;
  id_categorias: number;
  titulo: string;
  ano_de_publicacao: string;
  editora: string;
  isbn: number;
  foto?: string; // URL da foto
}

export interface LivroFormData {
  id?: number;
  id_categorias: number;
  titulo: string;
  ano_de_publicacao: string;
  editora: string;
  isbn: number;
  foto?: string;
}