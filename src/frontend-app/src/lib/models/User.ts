export interface User {
  id: number;
  foto: string;
  login: string;
  cpf: number;
  datanasc: number;
  telefone: number;
  email: string;
  role: string;
}

export interface UserFormData {
  id: number;
  foto: string;
  login: string;
  cpf: number;
  datanasc: number;
  telefone: number;
  email: string;
  senha?: string;
  role: string;
}
