import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get("/api/auth/check-auth/");
      setIsAuthenticated(response.data.is_authenticated);
      
      if (!response.data.is_authenticated) {
        api.defaults.headers.common["X-No-Refresh"] = "true";
      } else {
        delete api.defaults.headers.common["X-No-Refresh"];
      }
    } catch (err) {
      setIsAuthenticated(false);
      api.defaults.headers.common["X-No-Refresh"] = "true";
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post("/api/auth/login/", credentials);
      setIsAuthenticated(true);
      delete api.defaults.headers.common["X-No-Refresh"];
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsAuthenticated(false);
      api.defaults.headers.common["X-No-Refresh"] = "true";
    }
  };

  const value = {
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}