/**
 * api.js — Centralized fetch client for FoodBridge Frontend.
 * Uses localStorage tokens + Authorization header (works cross-domain on mobile).
 */

// ✅ Environment-based API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ✅ Build base once
const API_BASE = `${API_URL}/api`;

// ── Token helpers ──
export function getAccessToken() {
    return localStorage.getItem('accessToken');
}

export function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

export async function fetchWithAuth(endpoint, options = {}) {
    const accessToken = getAccessToken();

    const fetchOptions = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
            ...(options.headers || {}),
        },
    };

    let response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

    if (response.status === 401) {
        // Try refreshing the token
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${refreshToken}`,
                    },
                });

                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    // Store the new access token
                    if (refreshData.data?.accessToken) {
                        setTokens(refreshData.data.accessToken, null);
                    }
                    // Retry the original request with new token
                    fetchOptions.headers['Authorization'] = `Bearer ${getAccessToken()}`;
                    response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
                } else {
                    clearTokens();
                    window.location.href = '/login';
                    return response;
                }
            } catch (error) {
                clearTokens();
                window.location.href = '/login';
                return response;
            }
        } else {
            clearTokens();
            window.location.href = '/login';
            return response;
        }
    }

    return response;
}