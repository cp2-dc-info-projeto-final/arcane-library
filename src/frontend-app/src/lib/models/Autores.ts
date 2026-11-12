
export interface Autores {
  id: number;
  nome: string;
  pseunonimo: string;
  foto: string | null;
  sinopse: string | null;
}

export interface AutoresFormData {
  id?: number;
  nome: string;
  pseunonimo: string;
  sinopse: string;
  foto?: File | null;
}
