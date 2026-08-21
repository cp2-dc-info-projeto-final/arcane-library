export interface Autores {
  id: number;
  nome: string;
  pseunonimo?: string;
}

export interface AutoresFormData {
  id?: number;
  nome: string;
  pseunonimo?: string;
}
