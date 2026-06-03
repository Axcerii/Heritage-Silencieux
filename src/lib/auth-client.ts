const API_BASE = 'http://localhost:3000/api/auth';

export interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role?: 'ADMIN' | 'USER';
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Session {
    id: string;
    userId: string;
    expiresAt: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuthSession {
    session: Session;
    user: User;
}

export async function getSession(): Promise<AuthSession | null> {
    try {
        const response = await fetch(`${API_BASE}/get-session`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data || !data.session) return null;
        return data as AuthSession;
    } catch (e) {
        console.error('Error fetching session:', e);
        return null;
    }
}

export async function signInEmail(email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${API_BASE}/sign-in/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Erreur de connexion' }));
        throw new Error(err.message || 'Identifiants invalides');
    }
    return await response.json();
}

export async function signUpEmail(name: string, email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${API_BASE}/sign-up/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include'
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Erreur d'inscription" }));
        throw new Error(err.message || 'Erreur lors de la création du compte');
    }
    return await response.json();
}

export async function signInGoogle(): Promise<void> {
    const response = await fetch(`${API_BASE}/sign-in/social`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            provider: 'google', 
            callbackURL: 'http://localhost:5173/' 
        }),
        credentials: 'include'
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Erreur Google Auth' }));
        throw new Error(err.message || 'Erreur de connexion Google');
    }
    const data = await response.json();
    if (data.url) {
        window.location.href = data.url;
    } else {
        throw new Error('Pas d\'URL de redirection Google fournie');
    }
}

export async function signOut(): Promise<void> {
    const response = await fetch(`${API_BASE}/sign-out`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    });
    if (!response.ok) {
        throw new Error('Erreur de déconnexion');
    }
}
