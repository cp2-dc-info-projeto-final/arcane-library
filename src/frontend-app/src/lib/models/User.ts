export interface User {
  id: number;
  login: string;
  cpf: number;
  dataNasc: number;
  telefone: number;
  email: string;
  role: string;
}

export interface UserFormData {
  id: number;
  login: string;
  cpf: number;
  dataNasc: number;
  telefone: number;
  email: string;
  senha?: string;
  role: string;
}
