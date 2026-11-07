import {createContext,useContext,useEffect,useState,} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check logged-in user
  async function refreshUser() {
    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);

      return response.data.user;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Login
  async function login(credentials) {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    setUser(response.data.user);

    return response.data;
  }

  // Register
  async function register(userData) {
    const response = await api.post(
      "/auth/register",
      userData
    );

    await refreshUser();

    return response.data;
  }

  // Logout
  async function logout() {
    const response = await api.post("/auth/logout");

    // Clear logged-in user from React state
    setUser(null);

    return response.data;
  }

  // Check authentication on application load
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}