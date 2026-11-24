// Delade hjälpfunktioner. Filer som börjar med _ blir inga egna adresser hos Vercel.
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tålig mot vanliga misstag i Vercel: mellanslag och citattecken runt värdet.
export const env = (k) => String(process.env[k] ?? '').trim().replace(/^["']|["']$/g, '').trim();
