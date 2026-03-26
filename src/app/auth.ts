import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './configuracion/services/supabase.service';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'administrador' | 'contador' | 'asistente' | 'auditor' | 'solo_lectura';
  fullName: string;
  empresa: string;
  empresaId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private supabaseService: SupabaseService) {
    // Cargar usuario desde localStorage si existe sesión previa
    const stored = localStorage.getItem('numix_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      stored ? JSON.parse(stored) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();

    // Escuchar cambios de sesión en Supabase
    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        this.clearSession();
      } else if (event === 'SIGNED_IN' && session) {
        await this.loadUserProfile(session.user.id);
      }
    });
  }

  // ── LOGIN con email o username ─────────────────────────
  async login(usernameOrEmail: string, password: string): Promise<boolean> {
    try {
      // Determinar si es email o username
      const email = usernameOrEmail.includes('@')
        ? usernameOrEmail
        : await this.getEmailByUsername(usernameOrEmail);

      if (!email) return false;

      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) return false;

      await this.loadUserProfile(data.user.id);
      return !!this.currentUserSubject.value;

    } catch (err) {
      console.error('Error en login:', err);
      return false;
    }
  }

  // Buscar email por username en tabla usuarios
  private async getEmailByUsername(username: string): Promise<string | null> {
    const { data, error } = await this.supabaseService.client
      .from('usuarios')
      .select('email')
      .ilike('email', `${username}%`)
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.email;
  }

  // Cargar perfil del usuario desde tabla usuarios
  private async loadUserProfile(supabaseUserId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('usuarios')
        .select(`
          id,
          empresa_id,
          nombre_completo,
          email,
          rol,
          activo,
          ultimo_acceso,
          preferencias,
          created_at,
          updated_at,
          empresas!inner (
            id,
            nombre
          )
        `)
        .eq('id', supabaseUserId)
        .single();

      if (error || !data) {
        // Si no existe en tabla usuarios, crear perfil básico desde auth
        const { data: authUser } = await this.supabaseService.client.auth.getUser();
        if (authUser.user) {
          const user: User = {
            id: authUser.user.id,
            username: authUser.user.email?.split('@')[0] || 'usuario',
            email: authUser.user.email || '',
            role: 'administrador',
            fullName: authUser.user.user_metadata?.['full_name'] || 'Usuario NUMIX',
            empresa: 'NUMIX',
            empresaId: '',
          };
          this.saveSession(user);
        }
        return;
      }

      // ✅ Mapear datos reales de la BD al interfaz User de la app
      const user: User = {
        id: data.id,
        username: data.email.split('@')[0],
        email: data.email,
        role: data.rol as User['role'],
        fullName: data.nombre_completo,
        // ✅ Solución: usar 'as any' para evitar error de TypeScript en relación anidada
        empresa: (data as any).empresas?.nombre || 'NUMIX',
        empresaId: data.empresa_id,
      };

      this.saveSession(user);
    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
  }

  private saveSession(user: User): void {
    localStorage.setItem('numix_user', JSON.stringify(user));
    localStorage.setItem('empresa_id', user.empresaId);
    localStorage.setItem('usuario_id', user.id);
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem('numix_user');
    localStorage.removeItem('empresa_id');
    localStorage.removeItem('usuario_id');
    this.currentUserSubject.next(null);
  }

  // ── LOGOUT ─────────────────────────────────────────────
  async logout(): Promise<void> {
    await this.supabaseService.client.auth.signOut();
    this.clearSession();
  }

  // ── REGISTRO de empresa + usuario admin ────────────────
  async registrarEmpresa(datos: {
    nombreEmpresa: string;
    nit: string;
    email: string;
    password: string;
    nombreCompleto: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.supabaseService.client.auth.signUp({
        email: datos.email,
        password: datos.password,
        options: { data: { full_name: datos.nombreCompleto } }
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Error al crear usuario' };
      }

      // 2. Crear empresa
      const { data: empresa, error: empError } = await this.supabaseService.client
        .from('empresas')
        .insert({
          nombre: datos.nombreEmpresa,
          razon_social: datos.nombreEmpresa,
          nit: datos.nit,
        })
        .select()
        .single();

      if (empError || !empresa) {
        return { success: false, error: 'Error al crear empresa' };
      }

      // 3. Crear perfil en tabla usuarios
      const { error: userError } = await this.supabaseService.client
        .from('usuarios')
        .insert({
          id: authData.user.id,
          empresa_id: empresa.id,
          nombre_completo: datos.nombreCompleto,
          email: datos.email,
          password_hash: 'managed_by_supabase_auth',
          rol: 'administrador',
        });

      if (userError) {
        return { success: false, error: 'Error al crear perfil de usuario' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ── GETTERS ────────────────────────────────────────────
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  get isAdmin(): boolean {
    return this.currentUserValue?.role === 'administrador';
  }

  get empresaId(): string {
    return this.currentUserValue?.empresaId || localStorage.getItem('empresa_id') || '';
  }
}