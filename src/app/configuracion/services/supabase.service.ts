import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

// ── Credenciales Supabase ────────────────────────────────
// Reemplaza estos valores con los de tu proyecto en:
// Supabase → Settings → API
const SUPABASE_URL     = 'https://pvlldrsovcsproestspz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EDxxQjoUWO4CJLmbk6b3pg_-r3ojEzv';
// ────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Supabase Auth Event:', event);
      this.currentUserSubject.next(session?.user ?? null);
    });

    this.loadUser();
  }

  private async loadUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUserSubject.next(user);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ── Autenticación ─────────────────────────────────────
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email, password, options: { data: metadata }
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
    return { error };
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }
}
