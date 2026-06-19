import { useState, useEffect } from 'react';
import { login as apiLogin, getProfile } from '../api/client';
import { useNavigate } from 'react-router-dom';


interface User {
  id: number;
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getProfile()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
      console.log('A. login called');
      const res = await apiLogin(email, password);
      console.log('B. api response:', res);
      const { token, user } = res.data;
      console.log('C. token:', token);
      console.log('D. user:', user);
      localStorage.setItem('token', token);
      setUser(user);
      console.log('E. user set');
      return user;
  };

  const navigate = useNavigate();
  // ...
  const logout = () => {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
  };

  return { user, loading, login, logout };
}