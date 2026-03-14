// src/environments/environment.ts  (desarrollo)
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL_AQUI',
  supabaseKey: 'TU_SUPABASE_ANON_KEY_AQUI',
};

// ─────────────────────────────────────────────────────────────
// src/environments/environment.prod.ts  (producción - Netlify)
// Las variables vienen de process.env en el build de Netlify
// ─────────────────────────────────────────────────────────────
// export const environment = {
//   production: true,
//   supabaseUrl: (window as any).__env?.SUPABASE_URL || '',
//   supabaseKey: (window as any).__env?.SUPABASE_KEY || '',
// };
