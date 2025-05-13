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
    console.log("Launching");

    try {
      const response = await api.get("/api/auth/check-auth/");
      console.log(response);
      if (response.data.is_authenticated === false) {
        console.log(response.data);

        if (response.data.error === "No token found") {
          setIsAuthenticated(false);
          api.defaults.headers.common["X-No-Refresh"] = "true";
        } else {
          setIsAuthenticated(false);
          api.defaults.headers.common["X-No-Refresh"] = "true";
        }
      } else {
        setIsAuthenticated(true);
        delete api.defaults.headers.common["X-No-Refresh"];
      }
    } catch (err) {
      setIsAuthenticated(false);
      console.log("Error in checkAuth:", err);

      if (err.response?.data?.error === "No token found") {
        console.log("No token found, not refreshing");
        api.defaults.headers.common["X-No-Refresh"] = "true";
      }
      else if (
        err.response?.data?.error ===
          "refresh_token doesn't exist in cookies" ||
        err.response?.status === 401
      ) {
        console.log("Token expired or invalid, attempting to refresh...");
        await handleTokenExpiration();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTokenExpiration = async () => {
    try {
      const refreshResponse = await api.post("/api/auth/token/refresh/");
      setIsAuthenticated(true);
      delete api.defaults.headers.common["X-No-Refresh"];
    } catch (err) {
      setIsAuthenticated(false);
      api.defaults.headers.common["X-No-Refresh"] = "true";
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
