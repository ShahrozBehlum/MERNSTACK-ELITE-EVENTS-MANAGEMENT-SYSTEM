import { createContext, useEffect, useState } from "react";
import api from "../utils/axios";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, []);

  const register = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });

    return response; // ✅ return full response
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            setUser(data);
            return data;
        } catch (err) {
            throw err;
        }
    };

    const verifyOtp = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-otp', {
      email,
      otp,
    });

    setUser(response.data);
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('token', response.data.token);

    return response;
  } catch (error) {
    console.error("OTP verification failed:", error);
    throw error;
  }
};

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    };

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout, verifyOtp }}>
            {children}
        </AuthContext.Provider>
    )
}