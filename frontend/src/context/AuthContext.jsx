import { createContext, useContext, useState, useEffect } from 'react'
import { getAccessToken, clearTokens } from '../services/api'


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_BASE = `${API_URL}/api/auth`

const AuthContext = createContext(null)

/**
 * Custom hook to consume the AuthContext.
 * Usage: const { user, isAuthenticated, login, logout } = useAuth()
 */
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

/**
 * AuthProvider wraps the entire app and manages authentication state.
 * On mount it calls /api/auth/me to check if the user has a valid session.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true) // true while checking session

    /**
     * Check the current session by calling /api/auth/me.
     * Uses stored token via Authorization header (cross-domain mobile support).
     */
    const checkAuth = async () => {
        try {
            const accessToken = getAccessToken()
            const headers = accessToken
                ? { 'Authorization': `Bearer ${accessToken}` }
                : {}

            const res = await fetch(`${API_BASE}/me`, {
                method: 'GET',
                credentials: 'include',
                headers,
            })

            if (res.ok) {
                const data = await res.json()
                setUser(data.data.user)
            } else {
                setUser(null)
            }
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    // On first mount, verify existing session
    useEffect(() => {
        checkAuth()
    }, [])

    /**
     * Called after a successful login API response.
     * Accepts user data directly to avoid an extra /me call.
     */
    const login = async (userData) => {
        if (userData) {
            setUser(userData);
            return userData;
        }
        // Fallback: fetch from /me if no user provided
        const accessToken = getAccessToken()
        const headers = accessToken
            ? { 'Authorization': `Bearer ${accessToken}` }
            : {}

        const res = await fetch(`${API_BASE}/me`, {
            credentials: 'include',
            headers,
        });

        if (!res.ok) return null;

        const data = await res.json();
        setUser(data.data.user);
        return data.data.user;
    }

    /**
     * Called on sign-out. Clears application state and stored tokens.
     */
    const logoutUser = () => {
        clearTokens()
        setUser(null)
    }

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout: logoutUser,
        checkAuth,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

