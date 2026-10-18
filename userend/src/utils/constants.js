export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/user/auth/register",
    LOGIN: "/api/user/auth/login",
    GOOGLE_LOGIN: "/api/user/auth/google-login",
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
    COUNT: (postId) => `/api/like/${encodeURIComponent(postId)}/count`,

    STATUS: (postId) => `/api/like/${encodeURIComponent(postId)}/status`,

    TOGGLE: (postId) => `/api/like/${encodeURIComponent(postId)}`,
  },

  COMMENT: {
    COUNT: (postId) => `/api/comment/${postId}/count`,
    LIST: (postId) => `/api/comment/${postId}`,
    CREATE: (postId) => `/api/comment/${postId}`,
    DELETE: (commentId) => `/api/comment/${commentId}`,
  },
};
