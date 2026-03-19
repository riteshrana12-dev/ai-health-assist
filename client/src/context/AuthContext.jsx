import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Initial State ─────────────────────────────────────────────
const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: false,
  isLoading: true, // true on first mount while we verify token
  error: null,
};

// ── Reducer ───────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true, error: null };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "AUTH_LOGOUT":
      return {
        ...initialState,
        token: null,
        isLoading: false,
      };

    case "USER_UPDATED":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
};

// ── Provider ──────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── On mount: verify stored token ─────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }
      try {
        const { data } = await authService.getProfile();
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.data.user, token },
        });
      } catch {
        localStorage.removeItem("token");
        dispatch({ type: "AUTH_FAILURE", payload: null });
      }
    };
    verifyToken();
  }, []);

  // ── Register ───────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const { data } = await authService.register(formData);
      localStorage.setItem("token", data.token);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: data.data.user, token: data.token },
      });
      toast.success("Welcome to AI Health Assist! 🎉");
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      dispatch({ type: "AUTH_FAILURE", payload: msg });
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const { data } = await authService.login({ email, password });
      localStorage.setItem("token", data.token);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: data.data.user, token: data.token },
      });
      toast.success(`Welcome back, ${data.data.user.name.split(" ")[0]}! 👋`);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: msg });
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    dispatch({ type: "AUTH_LOGOUT" });
    toast.success("Logged out successfully");
  }, []);

  // ── Update user in context ─────────────────────────────────
  const updateUser = useCallback((userData) => {
    dispatch({ type: "USER_UPDATED", payload: userData });
  }, []);

  // ── Clear error ────────────────────────────────────────────
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = {
    ...state,
    register,
    login,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ──────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;
