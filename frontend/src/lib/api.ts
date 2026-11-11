import { ApiResponse, RefreshTokenResponseDTO } from '../types/api.dto';

const API_BASE = import.meta.env.VITE_API_URL;

export function getStoredAccessToken(): string {
    return localStorage.getItem('access_token') || '';
}

export function getStoredRefreshToken(): string {
    return localStorage.getItem('refresh_token') || '';
}

export function storeTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
    }
}

export function clearStoredTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

async function tryRefreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = getStoredRefreshToken();
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        });
        if (!res.ok) return null;
        const payload = (await res.json()) as ApiResponse<RefreshTokenResponseDTO>;
        if (payload.success && payload.data?.accessToken) {
            storeTokens(payload.data.accessToken, payload.data.refreshToken);
            return payload.data.accessToken;
        }
        return null;
    } catch {
        return null;
    }
}

export async function apiRequest<TResponse>(
    endpoint: string,
    options: RequestInit = {},
    retryOn401 = true
): Promise<TResponse> {
    const token = getStoredAccessToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
    });

    if (res.status === 401 && retryOn401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
        const refreshedToken = await tryRefreshAccessToken();
        if (refreshedToken) {
            return apiRequest<TResponse>(endpoint, options, false);
        }
    }

    const json = (await res.json().catch(() => ({}))) as ApiResponse<TResponse>;
    if (!res.ok || json.success === false) {
        throw new Error(json.error || `Request failed with status ${res.status}`);
    }

    return (json.data !== undefined ? json.data : (json as unknown as TResponse));
}

