import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';

export function useAuth() {
  const { user, accessToken, isAuthenticated, setUser, setTokens, logout } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    setTokens(res.data.accessToken, res.data.refreshToken);
  };

  const loginWithOtp = async (phone: string, code: string) => {
    // implementation
  };

  const register = async (data: any) => {
    // implementation
  };

  return { user, isAuthenticated, accessToken, login, loginWithOtp, register, logout };
}
