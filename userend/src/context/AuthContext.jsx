import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

export const AuthContext = createContext(null);

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/user/auth/register",
    LOGIN: "/api/user/auth/login",
    VERIFY: "/api/user/auth/verify",
    RESEND_VERIFICATION: "/api/user/auth/resend-email",
    FORGOT_PASSWORD: "/api/user/auth/forgot-password",
    RESET_PASSWORD: "/api/user/auth/reset-password",
  },

  PROFILE: {
    CREATE: "/api/profile/create-profile",
    UPDATE: "/api/profile/update-profile",
    ME: "/api/profile/me",
    USER: (userId) => `/api/profile/${userId}`,
  },

  POST: {
    CREATE: "/api/post/create-post",
    DELETE: (postId) => `/api/post/delete-post/${postId}`,
    GET: (postId) => `/api/post/get-post/${postId}`,
    FEED: "/api/post",
  },

  FOLLOW: {
    COUNTS: (userId) => `/api/follow/${userId}/counts`,
    FOLLOWERS: (userId) => `/api/follow/${userId}/followers`,
    FOLLOWING: (userId) => `/api/follow/${userId}/following`,
    FOLLOW: (userId) => `/api/follow/${userId}`,
    UNFOLLOW: (userId) => `/api/follow/${userId}`,
  },

  LIKE: {
    COUNT: (postId) => `/api/like/${postId}/count`,
    TOGGLE: (postId) => `/api/like/${postId}`,
  },

  COMMENT: {
    COUNT: (postId) => `/api/comment/${postId}/count`,
    LIST: (postId) => `/api/comment/${postId}`,
    CREATE: (postId) => `/api/comment/${postId}`,
    DELETE: (commentId) => `/api/comment/${commentId}`,
  },
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );

  const [user, setUserState] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState(null);

  // loading | exists | missing | error | idle
  const [profileStatus, setProfileStatus] = useState("idle");

  const [profileError, setProfileError] = useState("");

  const login = useCallback((newToken, userData = null) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUserState(userData);
    }

    setProfile(null);
    setProfileStatus("loading");
    setProfileError("");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUserState(null);
    setProfile(null);
    setProfileStatus("idle");
    setProfileError("");
  }, []);

  const updateUser = useCallback((userData) => {
    setUserState(userData);

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setProfile(null);
      setProfileStatus("idle");
      setProfileError("");
      return { exists: false };
    }

    setProfileStatus("loading");
    setProfileError("");

    try {
      // Assumes the frontend proxies /api to your backend,
      // or that the frontend and backend share the same origin.
      const response = await fetch(API_ENDPOINTS.PROFILE.ME, {
        method: "GET",
        headers: {
          token: currentToken,
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      console.log("Profile API status:", response.status);
      console.log("Profile API response:", data);
      console.log("Profile exists:", data.profileExists);
      console.log("Success:", data.success);

      if (response.ok && data.success && data.profile) {
        setProfile(data.profile);
        setProfileStatus("exists");

        return {
          exists: true,
          profile: data.profile,
        };
      }

      if (response.status === 404 && data.profileExists === false) {
        setProfile(null);
        setProfileStatus("missing");

        return { exists: false };
      }

      if (response.status === 401 || response.status === 403) {
        setProfile(null);
        setProfileStatus("error");
        setProfileError("Your session may have expired.");

        return { exists: false, error: true };
      }

      throw new Error(data.message || "Unable to check your profile.");
    } catch (error) {
      console.error("Profile check error:", error);

      setProfile(null);
      setProfileStatus("error");
      setProfileError(error.message);

      return {
        exists: false,
        error: true,
      };
    }
  }, []);

  // Check profile when authentication becomes available.
  useEffect(() => {
    if (!token) {
      setProfile(null);
      setProfileStatus("idle");
      setProfileError("");
      return;
    }

    refreshProfile();
  }, [token, refreshProfile]);

  const value = {
    token,
    user,
    setUser: updateUser,
    login,
    logout,
    isAuthenticated: Boolean(token),

    profile,
    setProfile,
    profileStatus,
    profileError,
    hasProfile: profileStatus === "exists",
    isProfileLoading: profileStatus === "loading",
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};
