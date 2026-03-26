// src/environments/environment.ts  (desarrollo)
export const environment = {
  production: false,
  supabaseUrl: 'https://pvlldrsovcsproestspz.supabase.co',
  supabaseKey: 'sb_publishable_EDxxQjoUWO4CJLmbk6b3pg_-r3ojEzv',
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
