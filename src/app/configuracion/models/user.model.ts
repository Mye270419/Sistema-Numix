export interface User {
  id: string; // UUID de Supabase
  email: string;
  perfil?: Perfil;
}

export interface Perfil {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  rol: 'super_admin' | 'admin' | 'contador' | 'auxiliar_contable' | 'consultor';
  ci_nit?: string;
  telefono?: string;
  foto_url?: string;
  activo: boolean;
  empresa?: Empresa;
}

export interface Empresa {
  id: string;
  razon_social: string;
  nit: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  logo_url?: string;
}