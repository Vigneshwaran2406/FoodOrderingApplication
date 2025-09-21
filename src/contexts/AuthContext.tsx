// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  profileImage?: string; // ✅ added profileImage
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
    address?: object
  ) => Promise<void>;
  logout: (reason?: "expired" | "manual") => Promise<void>; // ✅ updated
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ API base (Vite env or fallback localhost)
const API_URL =
  ((import.meta as any)?.env?.VITE_API_URL as string) ||
  "http://localhost:5000";

// ✅ Axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true; // send/receive cookies automatically

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Normalize backend user object
  const normalizeUser = (rawUser: any): User => ({
    id: rawUser._id || rawUser.id,
    name: rawUser.name,
    email: rawUser.email,
    role: rawUser.role,
    profileImage: rawUser.profileImage || undefined, // ✅ normalize profileImage
  });

  // Extract friendly message from axios error
  const getErrorMessage = (err: any) => {
    if (!err) return "Unknown error";
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.error) return err.response.data.error;
    if (err.message) return err.message;
    return JSON.stringify(err);
  };

  // ✅ Logout (handles both manual + expired sessions)
  const logout = async (reason?: "expired" | "manual") => {
    try {
      await axios.post(`${API_URL}/auth/logout`); // ✅ fixed
    } catch (err) {
      console.error("Logout failed:", getErrorMessage(err));
    } finally {
      setUser(null);

      if (reason === "expired") {
        toast.error("Session expired, please login again");
      } else {
        toast.info("You have been logged out");
      }

      navigate("/login", { replace: true });
    }
  };

  // ✅ Load session user on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`); // ✅ fixed
        if (res.data) {
          setUser(normalizeUser(res.data));
        } else {
          setUser(null);
        }
      } catch (err: any) {
        setUser(null);

        // 🚀 If user WAS logged in but session expired
        if (err.response?.status === 401 && user !== null) {
          logout("expired"); // ✅ single source of truth for expired handling
        }
      } finally {
        setLoading(false);
      }
    };
    checkSession();
    // ✅ we don’t add `user` to deps, avoids infinite loop
  }, [navigate]);

  // ✅ Login
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`/auth/login`, { email, password });
      if (!res.data?.user) throw new Error("Invalid login response");
      setUser(normalizeUser(res.data.user));
    } catch (err: any) {
      setUser(null);

      if (err.response?.status === 403) {
        toast.error(
          "Your account has been deactivated. Please contact support."
        );
      } else {
        toast.error(getErrorMessage(err));
      }

      throw new Error(getErrorMessage(err));
    }
  };

  // ✅ Register
  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    address?: object
  ) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { // ✅ fixed
        name,
        email,
        password,
        phone,
        address,
      });
      if (!res.data?.user) throw new Error("Invalid register response");
      setUser(normalizeUser(res.data.user));
    } catch (err) {
      setUser(null);
      throw new Error(getErrorMessage(err));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === "admin" || false,
        login,
        register,
        logout,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
