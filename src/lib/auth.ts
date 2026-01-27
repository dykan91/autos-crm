const KEY = 'autoscrm_session';

export type Session = { email: string; createdAt: string };

export function getSession(): Session | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Session;
    } catch {
        return null;
    }
}

export function signIn(email: string, password: string): { ok: boolean; error?: string } {
    // временно: любой email + пароль "123456"
    if (!email.includes('@')) return { ok: false, error: 'Неверный email' };
    if (password !== '123456') return { ok: false, error: 'Пароль пока фиксированный: 123456' };

    const s: Session = { email, createdAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(s));
    return { ok: true };
}

export function signOut() {
    localStorage.removeItem(KEY);
}
