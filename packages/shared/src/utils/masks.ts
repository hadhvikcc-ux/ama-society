export function maskPhone(phone: string): string { if (!phone || phone.length < 10) return '***'; return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3); }
export function maskEmail(email: string): string { const [user, domain] = email.split('@'); if (!user || !domain) return '***'; return user.substring(0, 2) + '***@' + domain; }
