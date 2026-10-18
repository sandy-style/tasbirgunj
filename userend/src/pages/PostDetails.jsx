  import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  Download,
  Heart,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  UserRound,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { useApp } from "../context/AppContext";

const SAVED_POSTS_KEY = "tasbirgunj:savedPosts";

/* =========================================================
   THEME
========================================================= */

const theme = {
  light: {
    page: "bg-[#F7F7F7] text-[#111111]",
    surface: "bg-white",
    panel: "border-[#E5E5E5] bg-white",
    muted: "text-[#767676]",
    subtle: "text-[#555555]",
    border: "border-[#E5E5E5]",
    divider: "bg-[#E5E5E5]",
    soft: "bg-[#F7F7F7]",
    hover: "hover:bg-[#F0F0F0]",
    accent: "text-[#E60023]",
    accentHover: "hover:text-[#AD081B]",
    button: "bg-[#E60023] text-white hover:bg-[#AD081B]",
    ring: "focus-visible:ring-[#E60023]",
    avatar: "bg-[#FCE8EC] text-[#AD081B]",
    input: "border-[#E5E5E5] bg-[#FAFAFA] text-[#111111]",
    comment: "border-[#E5E5E5] bg-[#FAFAFA]",
    secondaryButton: "bg-[#F0F0F0] text-[#333333] hover:bg-[#E7E7E7]",
  },
  dark: {
    page: "bg-[#111111] text-[#F7F7F7]",
    surface: "bg-[#1C1C1C]",
    panel: "border-white/[0.09] bg-[#1C1C1C]",
    muted: "text-[#A6A6A6]",
    subtle: "text-[#D0D0D0]",
    border: "border-white/[0.1]",
    divider: "bg-white/[0.1]",
    soft: "bg-white/[0.06]",
    hover: "hover:bg-white/[0.09]",
    accent: "text-[#FF5A73]",
    accentHover: "hover:text-[#FF8496]",
    button: "bg-[#E60023] text-white hover:bg-[#AD081B]",
    ring: "focus-visible:ring-[#FF5A73]",
    avatar: "bg-[#E60023]/15 text-[#FF8496]",
    input: "border-white/[0.1] bg-[#151515] text-[#F7F7F7]",
    comment: "border-white/[0.1] bg-[#151515]",
    secondaryButton: "bg-white/[0.07] text-[#F0F0F0] hover:bg-white/[0.12]",
  },
};

/* =========================================================
   AUTH HELPERS
========================================================= */

const getStoredToken = () => {
  if (typeof window === "undefined") return "";

  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  } catch {
    return "";
  }
};

const getAuthConfig = (extra = {}) => {
  const token = getStoredToken();

  return {
    ...extra,
    headers: {
      ...(extra.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const unwrapResponse = (response) => {
  const body = response?.data ?? response ?? {};

  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return { ...body, ...body.data };
  }

  return body;
};

/* =========================================================
   ID + IMAGE HELPERS
========================================================= */

const getObjectId = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return "";

  const id = String(value).trim();

  if (/^[a-f\d]{24}$/i.test(id)) return id;
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return id;

  return "";
};

const getUserId = (value, depth = 0) => {
  if (!value || depth > 5) return "";

  if (typeof value !== "object") return getObjectId(value);

  const candidates = [
    value.userId,
    value.user_id,
    value.user,
    value.ownerId,
    value.owner,
    value.authorId,
    value.author,
    value.createdBy,
    value.account,
    value._id,
    value.id,
  ];

  for (const candidate of candidates) {
    const id = getUserId(candidate, depth + 1);
    if (id) return id;
  }

  return "";
};

const getProfilePath = (userId) =>
  userId ? `/profile/${encodeURIComponent(userId)}` : "";

const getImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();

  if (typeof value === "object") {
    return (
      value.url ||
      value.secure_url ||
      value.imageUrl ||
      value.imageURL ||
      value.image ||
      value.src ||
      ""
    );
  }

  return "";
};

/* =========================================================
   POST HELPERS
========================================================= */

const getPostId = (value) => {
  if (!value || typeof value !== "object") return "";

  const id = value._id ?? value.id ?? value.postId ?? value.post_id;

  return id == null ? "" : String(id);
};

const getPostImage = (post) => {
  if (!post) return "";

  return (
    getImageUrl(post.image) ||
    getImageUrl(post.imageUrl) ||
    getImageUrl(post.imageURL) ||
    getImageUrl(post.photo) ||
    getImageUrl(post.photoUrl) ||
    getImageUrl(post.media) ||
    getImageUrl(post.mediaUrl) ||
    getImageUrl(post.thumbnail) ||
    ""
  );
};

const getPostLikeCount = (post) => {
  if (!post) return null;

  const candidates = [
    post.likesCount,
    post.likeCount,
    post.totalLikes,
    post.stats?.likes,
    post.engagement?.likes,
    post.likes,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.length;

    if (candidate !== undefined && candidate !== null) {
      const count = Number(candidate);

      if (Number.isFinite(count) && count >= 0) return count;
    }
  }

  return null;
};

const getPostComments = (post) => {
  if (!post) return [];

  if (Array.isArray(post.comments)) return post.comments;
  if (Array.isArray(post.commentList)) return post.commentList;
  if (Array.isArray(post.comment)) return post.comment;

  return [];
};

const isPostObject = (value) =>
  Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    getPostId(value) &&
    (getPostImage(value) || value.caption || value.description || value.title),
  );

const findPostInPayload = (payload, wantedId, depth = 0) => {
  if (!payload || depth > 5) return null;

  if (Array.isArray(payload)) {
    const match = payload.find(
      (item) => getPostId(item) === String(wantedId) && isPostObject(item),
    );

    if (match) return match;

    for (const item of payload) {
      const found = findPostInPayload(item, wantedId, depth + 1);
      if (found) return found;
    }

    return null;
  }

  if (typeof payload !== "object") return null;

  if (isPostObject(payload) && getPostId(payload) === String(wantedId)) {
    return payload;
  }

  for (const key of [
    "post",
    "photograph",
    "postData",
    "postDetails",
    "item",
    "data",
    "result",
    "payload",
    "posts",
    "feed",
    "items",
  ]) {
    if (payload[key] !== undefined) {
      const found = findPostInPayload(payload[key], wantedId, depth + 1);
      if (found) return found;
    }
  }

  return null;
};

const fetchPostById = async (postId, signal) => {
  const encodedId = encodeURIComponent(postId);

  const requests = [
    () =>
      api.get(`/api/post/get-post/${encodedId}`, {
        ...getAuthConfig(),
        signal,
      }),
    () =>
      api.get(`/api/post/${encodedId}`, {
        ...getAuthConfig(),
        signal,
      }),
    () =>
      api.get("/api/post", {
        ...getAuthConfig(),
        signal,
        params: { postId },
      }),
  ];

  let lastError = null;

  for (const request of requests) {
    try {
      const response = await request();
      const found = findPostInPayload(response?.data, postId);

      if (found) return found;
    } catch (error) {
      if (
        signal?.aborted ||
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED"
      ) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError || new Error("Could not find this photograph.");
};

/* =========================================================
   AUTHOR HELPERS
========================================================= */

const isUsefulText = (value) => {
  if (typeof value !== "string") return false;

  const text = value.trim();

  return Boolean(
    text &&
    !/^[a-f\d]{24}$/i.test(text) &&
    text.toLowerCase() !== "photographer",
  );
};

const getAuthorInfo = (post) => {
  if (!post) {
    return {
      id: "",
      path: "",
      username: "",
      name: "Photographer",
      avatar: "",
      hasName: false,
    };
  }

  const candidates = [
    post.author,
    post.user,
    post.createdBy,
    post.photographer,
    post.authorProfile,
    post.profile,
    post.authorData,
    post.userProfile,
  ];

  const people = [];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    people.push(candidate);

    for (const key of ["profile", "user", "account"]) {
      if (candidate[key] && typeof candidate[key] === "object") {
        people.push(candidate[key]);
      }
    }
  }

  const usernameCandidates = [
    post.authorUsername,
    post.username,
    post.profile?.username,
    ...people.map((person) => person.username),
    ...people.map((person) => person.handle),
  ];

  const usernameValue = usernameCandidates.find(isUsefulText) || "";
  const username = String(usernameValue).replace(/^@/, "").trim();

  const nameCandidates = [
    post.authorName,
    post.photographerName,
    post.displayName,
    post.profile?.name,
    ...people.flatMap((person) => [
      person.name,
      person.fullName,
      person.displayName,
      person.full_name,
    ]),
  ];

  const actualName = nameCandidates.find(isUsefulText);
  const name = actualName?.trim() || username || "Photographer";

  const avatarCandidates = [
    post.authorImage,
    post.authorAvatar,
    post.profileImage,
    post.authorProfileImage,
    post.photographerImage,
    ...people.flatMap((person) => [
      person.profileImage,
      person.profile_image,
      person.avatar,
      person.avatarUrl,
      person.avatarURL,
      person.image,
      person.imageUrl,
      person.imageURL,
      person.profilePhoto,
      person.profilePicture,
      person.photo,
      person.picture,
    ]),
  ];

  const avatar = avatarCandidates.map(getImageUrl).find(Boolean) || "";

  const id =
    getUserId(post.authorUserId) ||
    getUserId(post.authorId) ||
    getUserId(post.userId) ||
    getUserId(post.createdBy) ||
    getUserId(post.author) ||
    getUserId(post.user) ||
    getUserId(post.photographer) ||
    getUserId(post.authorProfile) ||
    getUserId(post.profile) ||
    people.map(getUserId).find(Boolean) ||
    "";

  return {
    id,
    path: getProfilePath(id),
    username,
    name,
    avatar,
    hasName: Boolean(actualName || username),
  };
};

const getLocationLabel = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    return (
      value.name ||
      value.label ||
      value.city ||
      value.address ||
      value.title ||
      ""
    );
  }

  return "";
};

/* =========================================================
   COMMENT HELPERS
========================================================= */

const getCommentUserObjects = (comment) => {
  if (!comment || typeof comment !== "object") return [];

  const result = [];

  const candidates = [
    comment.commenterProfile,
    comment.userProfile,
    comment.profile,
    comment.commenter,
    comment.user,
    comment.author,
    comment.createdBy,
    comment.owner,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    result.push(candidate);

    for (const key of ["profile", "user"]) {
      if (candidate[key] && typeof candidate[key] === "object") {
        result.push(candidate[key]);
      }
    }
  }

  return result;
};

const getCommentAuthor = (comment) => {
  if (!comment || typeof comment !== "object") {
    return {
      id: "",
      path: "",
      name: "Photographer",
      username: "",
      avatar: "",
      hasName: false,
    };
  }

  const people = getCommentUserObjects(comment);

  const usernameCandidates = [
    comment.commenterUsername,
    comment.authorUsername,
    comment.username,
    ...people.map((person) => person.username),
  ];

  const usernameValue = usernameCandidates.find(isUsefulText) || "";
  const username = String(usernameValue).replace(/^@/, "").trim();

  const nameCandidates = [
    comment.commenterName,
    comment.authorName,
    comment.displayName,
    comment.fullName,
    comment.name,
    ...people.flatMap((person) => [
      person.name,
      person.fullName,
      person.displayName,
      person.username,
    ]),
  ];

  const actualName = nameCandidates.find(isUsefulText);
  const name = actualName?.trim() || username || "Photographer";

  const avatarCandidates = [
    comment.commenterImage,
    comment.authorImage,
    comment.profileImage,
    ...people.flatMap((person) => [
      person.profileImage,
      person.avatar,
      person.avatarUrl,
      person.image,
      person.imageUrl,
      person.profilePhoto,
      person.profilePicture,
    ]),
  ];

  const avatar = avatarCandidates.map(getImageUrl).find(Boolean) || "";

  const id =
    getUserId(comment.commenterUserId) ||
    getUserId(comment.authorUserId) ||
    getUserId(comment.userId) ||
    getUserId(comment.createdBy) ||
    getUserId(comment.commenter) ||
    getUserId(comment.user) ||
    getUserId(comment.author) ||
    people.map(getUserId).find(Boolean) ||
    "";

  return {
    id,
    path: getProfilePath(id),
    name,
    username,
    avatar,
    hasName: Boolean(actualName || username),
  };
};

const getCommentText = (comment) => {
  if (typeof comment === "string") return comment;

  return (
    comment?.text ||
    comment?.content ||
    comment?.comment ||
    comment?.message ||
    ""
  );
};

const getCommentId = (comment) =>
  String(
    comment?._id ||
      comment?.id ||
      comment?.commentId ||
      `${comment?.createdAt || ""}-${getCommentText(comment)}`,
  );

const extractComments = (payload, depth = 0) => {
  if (payload == null || depth > 5) return null;
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return null;

  for (const key of ["comments", "commentList", "data", "result", "items"]) {
    if (payload[key] !== undefined) {
      const found = extractComments(payload[key], depth + 1);
      if (found !== null) return found;
    }
  }

  return null;
};

/* =========================================================
   PROFILE RESPONSE HELPERS
========================================================= */

const looksLikeProfile = (value) =>
  Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    [
      "name",
      "fullName",
      "displayName",
      "username",
      "profileImage",
      "profilePicture",
      "avatar",
      "avatarUrl",
      "bio",
      "userId",
      "user",
    ].some((key) => value[key] !== undefined && value[key] !== null),
  );

const extractProfile = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const candidates = [
    payload.profile,
    payload.userProfile,
    payload.profileData,
    payload.data?.profile,
    payload.data?.userProfile,
    payload.data?.profileData,
    payload.user,
    payload.data?.user,
    payload.result?.profile,
    payload.result?.user,
    payload.result,
    payload.data,
    payload,
  ];

  return candidates.find(looksLikeProfile) || null;
};

const extractCreatedComment = (body) => {
  const candidate =
    body?.comment || body?.createdComment || body?.result?.comment;

  if (candidate && typeof candidate === "object") return candidate;
  if (body?._id || body?.id) return body;

  return null;
};

const getInitials = (name = "Photographer") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  return parts.length
    ? parts
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "TG";
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* =========================================================
   SAVED PHOTOGRAPHS
========================================================= */

const readSavedPostIds = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY) || "[]");

    return Array.isArray(stored) ? stored.map(String) : [];
  } catch {
    return [];
  }
};

const writeSavedPostIds = (ids) => {
  try {
    localStorage.setItem(
      SAVED_POSTS_KEY,
      JSON.stringify([...new Set(ids.map(String))]),
    );

    return true;
  } catch {
    return false;
  }
};

/* =========================================================
   REUSABLE UI
========================================================= */

function Avatar({ src, name, size = "h-11 w-11", t }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || "Photographer"}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${size} shrink-0 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10`}
      />
    );
  }

  return (
    <div
      aria-label={name || "Photographer"}
      className={`${size} flex shrink-0 items-center justify-center rounded-full font-semibold ${t.avatar}`}
    >
      {getInitials(name)}
    </div>
  );
}

function EmptyComments({ t }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${t.soft} ${t.accent}`}
      >
        <MessageCircle size={21} strokeWidth={1.6} />
      </div>

      <p className="font-medium">Start the conversation</p>

      <p className={`mt-1 max-w-xs text-sm leading-6 ${t.muted}`}>
        Share what this photograph makes you notice.
      </p>
    </div>
  );
}

function LoadingScreen({ t }) {
  return (
    <main
      className={`flex min-h-[70vh] items-center justify-center px-5 ${t.page}`}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <LoaderCircle size={32} className={`animate-spin ${t.accent}`} />
        <p className={`text-sm tracking-wide ${t.muted}`}>
          Opening photograph…
        </p>
      </div>
    </main>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PostDetails() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useApp();

  const t = isDark ? theme.dark : theme.light;

  const routePostId = params.postId || params.id || params.post_id || "";

  const locationPost =
    location.state?.post ||
    location.state?.photograph ||
    location.state?.selectedPost ||
    null;

  const [post, setPost] = useState(locationPost);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const [liked, setLiked] = useState(
    Boolean(locationPost?.isLiked ?? locationPost?.liked ?? false),
  );

  const [likesCount, setLikesCount] = useState(
    getPostLikeCount(locationPost) ?? 0,
  );

  const [likeSaving, setLikeSaving] = useState(false);
  const [comments, setComments] = useState(getPostComments(locationPost));
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // NEW: full-screen image viewer and download state
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const attemptedAuthorProfileIds = useRef(new Set());
  const attemptedCommentProfileIds = useRef(new Set());

  const postId = String(
    routePostId || getPostId(locationPost) || getPostId(post) || "",
  );

  const imageUrl = getPostImage(post);

  const caption = String(
    post?.caption || post?.description || post?.title || "",
  );

  const author = useMemo(() => getAuthorInfo(post), [post]);

  const locationLabel = getLocationLabel(
    post?.location || post?.place || post?.locationName,
  );

  const createdAt =
    post?.createdAt || post?.created_at || post?.date || post?.publishedAt;

  const isAuthenticated = Boolean(getStoredToken());
  const commentCount = comments.length;

  /* =======================================================
     FULL-SCREEN VIEWER
  ======================================================= */

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
  }, []);

  useEffect(() => {
    if (!isImageViewerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeImageViewer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageViewerOpen, closeImageViewer]);

  // Close the viewer if the displayed photograph changes.
  useEffect(() => {
    setIsImageViewerOpen(false);
  }, [postId]);

  /* =======================================================
     LOAD POST
  ======================================================= */

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const incomingPost =
      locationPost && getPostId(locationPost) === String(postId)
        ? locationPost
        : null;

    const loadPost = async () => {
      if (!postId) {
        setPageError("This photograph is missing its post ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError("");
      setImageFailed(false);

      if (incomingPost) {
        setPost(incomingPost);
        setComments(getPostComments(incomingPost));
      } else {
        setPost(null);
      }

      try {
        const fetchedPost = await fetchPostById(postId, controller.signal);

        if (cancelled) return;

        const mergedPost = {
          ...(incomingPost || {}),
          ...fetchedPost,
        };

        setPost(mergedPost);
        setComments(getPostComments(mergedPost));

        const count = getPostLikeCount(mergedPost);
        if (count !== null) setLikesCount(count);
      } catch (error) {
        if (
          cancelled ||
          controller.signal.aborted ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (incomingPost) {
          setPost(incomingPost);
        } else {
          setPageError(
            getErrorMessage(error, "We couldn't load this photograph."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPost();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [postId, locationPost]);

  /* =======================================================
     RESOLVE AUTHOR PROFILE
  ======================================================= */

  useEffect(() => {
    const userId = author.id;

    if (!userId) return undefined;

    const missingDetails =
      !author.hasName || !author.avatar || !author.username;

    if (!missingDetails) return undefined;
    if (attemptedAuthorProfileIds.current.has(userId)) return undefined;

    attemptedAuthorProfileIds.current.add(userId);

    const controller = new AbortController();
    let cancelled = false;

    const resolveAuthorProfile = async () => {
      try {
        const response = await api.get(
          `/api/profile/${encodeURIComponent(userId)}`,
          getAuthConfig({ signal: controller.signal }),
        );

        if (cancelled) return;

        const profile = extractProfile(response?.data);
        if (!profile) return;

        setPost((currentPost) => {
          if (!currentPost) return currentPost;

          const existingProfile =
            currentPost.authorProfile &&
            typeof currentPost.authorProfile === "object"
              ? currentPost.authorProfile
              : {};

          return {
            ...currentPost,
            authorProfile: {
              ...existingProfile,
              ...profile,
              userId,
            },
          };
        });
      } catch (error) {
        if (
          !cancelled &&
          error?.name !== "CanceledError" &&
          error?.code !== "ERR_CANCELED"
        ) {
          console.warn(
            "Could not resolve the author's profile:",
            error?.response?.data?.message || error?.message,
          );
        }
      }
    };

    resolveAuthorProfile();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [author.id, author.hasName, author.avatar, author.username]);

  /* =======================================================
     LOAD LIKE COUNT + STATUS
  ======================================================= */

  useEffect(() => {
    if (!postId) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    const loadLikes = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.LIKE.COUNT(postId), {
          signal: controller.signal,
        });

        if (cancelled) return;

        const body = unwrapResponse(response);
        const count = Number(body.likeCount);

        if (body.success !== false && Number.isFinite(count) && count >= 0) {
          setLikesCount(count);
        }
      } catch (error) {
        if (
          !cancelled &&
          error?.name !== "CanceledError" &&
          error?.code !== "ERR_CANCELED"
        ) {
          console.error("Could not load like count:", error);
        }
      }

      if (cancelled) return;

      if (!getStoredToken()) {
        setLiked(false);
        return;
      }

      const statusEndpoint = API_ENDPOINTS.LIKE.STATUS
        ? API_ENDPOINTS.LIKE.STATUS(postId)
        : `/api/like/${encodeURIComponent(postId)}/status`;

      try {
        const response = await api.get(
          statusEndpoint,
          getAuthConfig({ signal: controller.signal }),
        );

        if (cancelled) return;

        const body = unwrapResponse(response);

        if (typeof body.liked === "boolean") {
          setLiked(body.liked);
        }

        const count = Number(body.likeCount);

        if (Number.isFinite(count) && count >= 0) {
          setLikesCount(count);
        }
      } catch (error) {
        if (
          !cancelled &&
          error?.name !== "CanceledError" &&
          error?.code !== "ERR_CANCELED"
        ) {
          console.error("Could not load like status:", error);
        }
      }
    };

    loadLikes();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [postId]);

  /* =======================================================
     LIKE / UNLIKE
  ======================================================= */

  const handleToggleLike = useCallback(async () => {
    if (likeSaving) return;

    if (!getStoredToken()) {
      toast.error("Please log in to like photographs.");
      return;
    }

    if (!postId) {
      toast.error("This photograph has no valid post ID.");
      return;
    }

    const previousLiked = liked;
    const previousCount = likesCount;
    const nextLiked = !previousLiked;

    const optimisticCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setLikesCount(optimisticCount);
    setLikeSaving(true);

    try {
      const response = await api.post(
        API_ENDPOINTS.LIKE.TOGGLE(postId),
        {},
        getAuthConfig(),
      );

      const body = unwrapResponse(response);

      if (body.success === false) {
        throw new Error(body.message || "Could not update your like.");
      }

      const confirmedLiked =
        typeof body.liked === "boolean" ? body.liked : nextLiked;

      const rawCount =
        body.likeCount ??
        body.likesCount ??
        body.totalLikes ??
        body.post?.likeCount ??
        body.post?.likesCount;

      const parsedCount = Number(rawCount);

      const confirmedCount =
        rawCount !== undefined &&
        rawCount !== null &&
        Number.isFinite(parsedCount) &&
        parsedCount >= 0
          ? parsedCount
          : optimisticCount;

      setLiked(confirmedLiked);
      setLikesCount(confirmedCount);

      setPost((current) =>
        current
          ? {
              ...current,
              liked: confirmedLiked,
              isLiked: confirmedLiked,
              likeCount: confirmedCount,
              likesCount: confirmedCount,
            }
          : current,
      );
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousCount);

      toast.error(getErrorMessage(error, "Could not update your like."));
    } finally {
      setLikeSaving(false);
    }
  }, [likeSaving, liked, likesCount, postId]);

  /* =======================================================
     SAVE / UNSAVE
  ======================================================= */

  useEffect(() => {
    setIsSaved(postId ? readSavedPostIds().includes(String(postId)) : false);
  }, [postId]);

  const handleToggleSave = useCallback(() => {
    if (!postId) {
      toast.error("This photograph has no valid post ID.");
      return;
    }

    const savedIds = readSavedPostIds();
    const alreadySaved = savedIds.includes(String(postId));

    const updatedIds = alreadySaved
      ? savedIds.filter((id) => id !== String(postId))
      : [...savedIds, String(postId)];

    if (!writeSavedPostIds(updatedIds)) {
      toast.error("Your saved photographs could not be stored.");
      return;
    }

    setIsSaved(!alreadySaved);

    toast.success(
      alreadySaved
        ? "Removed from your saved photographs."
        : "Photograph saved.",
    );
  }, [postId]);

  /* =======================================================
     DOWNLOAD PHOTOGRAPH
  ======================================================= */

  const handleDownload = useCallback(async () => {
    if (!imageUrl || downloadLoading) {
      if (!imageUrl) toast.error("No photograph is available to download.");
      return;
    }

    setDownloadLoading(true);

    try {
      // Fetch the image as a file so the browser can download it
      // instead of simply navigating to the image URL.
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("The image could not be downloaded.");
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The downloaded image is empty.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const extensionFromUrl = imageUrl
        .split("?")[0]
        .match(/\.(jpe?g|png|webp|gif|avif|bmp)$/i)?.[1];

      const mimeExtension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
        "image/bmp": "bmp",
      };

      const extension =
        extensionFromUrl?.toLowerCase() || mimeExtension[blob.type] || "jpg";

      link.href = objectUrl;
      link.download = `tasbirgunj-${postId || "photograph"}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Revoke the temporary URL after the browser has started the download.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

      toast.success("Your photograph download has started.");
    } catch (error) {
      console.warn("Direct image download failed:", error);

      // Cross-origin image hosts may block fetch requests. In that case,
      // open the original image so the user can save it from the browser.
      try {
        const opened = window.open(imageUrl, "_blank", "noopener,noreferrer");

        if (opened) {
          toast.info(
            "The image opened in a new tab. Use your browser's Save image option.",
          );
        } else {
          toast.error(
            "The browser blocked the image tab. Allow pop-ups and try again.",
          );
        }
      } catch {
        toast.error("Could not download this photograph.");
      }
    } finally {
      setDownloadLoading(false);
    }
  }, [imageUrl, downloadLoading, postId]);

  /* =======================================================
     LOAD COMMENTS
  ======================================================= */

  useEffect(() => {
    if (!postId) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    const loadComments = async () => {
      setCommentsLoading(true);

      try {
        const response = await api.get(
          `/api/comment/${encodeURIComponent(postId)}`,
          { signal: controller.signal },
        );

        if (cancelled) return;

        const result = extractComments(response?.data);
        if (result !== null) setComments(result);
      } catch (error) {
        if (
          !cancelled &&
          error?.name !== "CanceledError" &&
          error?.code !== "ERR_CANCELED"
        ) {
          console.info("Could not load the comments endpoint.");
        }
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    };

    loadComments();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [postId]);

  /* =======================================================
     RESOLVE COMMENTER PROFILES
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const idsToResolve = [
      ...new Set(
        comments
          .map((comment) => {
            const commenter = getCommentAuthor(comment);

            return commenter.id &&
              (!commenter.hasName || !commenter.avatar || !commenter.username)
              ? commenter.id
              : "";
          })
          .filter(Boolean)
          .filter((id) => !attemptedCommentProfileIds.current.has(id)),
      ),
    ];

    if (!idsToResolve.length) {
      return () => {
        cancelled = true;
      };
    }

    idsToResolve.forEach((id) => attemptedCommentProfileIds.current.add(id));

    const resolveProfiles = async () => {
      const results = await Promise.all(
        idsToResolve.map(async (userId) => {
          try {
            const response = await api.get(
              `/api/profile/${encodeURIComponent(userId)}`,
              getAuthConfig(),
            );

            const profile = extractProfile(response?.data);

            return profile ? { userId, profile } : null;
          } catch (error) {
            console.warn(
              `Could not resolve commenter ${userId}:`,
              error?.response?.data?.message || error?.message,
            );

            return null;
          }
        }),
      );

      if (cancelled) return;

      const profileMap = new Map(
        results
          .filter(Boolean)
          .map(({ userId, profile }) => [userId, { ...profile, userId }]),
      );

      if (!profileMap.size) return;

      setComments((currentComments) =>
        currentComments.map((comment) => {
          const commenter = getCommentAuthor(comment);
          const profile = profileMap.get(commenter.id);

          if (!profile) return comment;

          return {
            ...comment,
            commenterProfile: {
              ...(comment.commenterProfile || {}),
              ...profile,
              userId: commenter.id,
            },
          };
        }),
      );
    };

    resolveProfiles();

    return () => {
      cancelled = true;
    };
  }, [comments]);

  /* =======================================================
     ADD COMMENT
  ======================================================= */

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    const text = commentText.trim();

    if (!text) {
      toast.error("Write a comment first.");
      return;
    }

    if (!getStoredToken()) {
      toast.error("Please log in to comment.");
      return;
    }

    if (!postId || commentLoading) return;

    setCommentLoading(true);

    try {
      const response = await api.post(
        `/api/comment/${encodeURIComponent(postId)}`,
        {
          text,
          content: text,
          comment: text,
        },
        getAuthConfig(),
      );

      const body = unwrapResponse(response);

      if (body.success === false) {
        throw new Error(body.message || "Could not publish your comment.");
      }

      const createdComment = extractCreatedComment(body);

      if (createdComment) {
        setComments((current) => [
          ...current,
          {
            ...createdComment,
            text: getCommentText(createdComment) || text,
          },
        ]);
      } else {
        setComments((current) => [
          ...current,
          {
            _id: `temporary-${Date.now()}`,
            text,
            createdAt: new Date().toISOString(),
            user: { name: "You" },
          },
        ]);
      }

      setCommentText("");
      toast.success("Comment added.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not publish your comment."));
    } finally {
      setCommentLoading(false);
    }
  };

  /* =======================================================
     SHARE
  ======================================================= */

  const handleShare = async () => {
    if (shareLoading) return;

    setShareLoading(true);

    try {
      const shareUrl = window.location.href;

      if (typeof navigator.share === "function") {
        await navigator.share({
          title: caption || "Photograph on तस्बिरगंज",
          text: caption || "Discover this photograph on तस्बिरगंज.",
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Photograph link copied.");
      } else {
        toast.error("Sharing is unavailable in this browser.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error("Could not share this photograph.");
      }
    } finally {
      setShareLoading(false);
    }
  };

  /* =======================================================
     LOADING + ERROR STATES
  ======================================================= */

  if (loading) {
    return <LoadingScreen t={t} />;
  }

  if (!post || pageError) {
    return (
      <main
        className={`flex min-h-[70vh] items-center justify-center px-5 ${t.page}`}
      >
        <div className="max-w-md text-center">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${t.soft} ${t.accent}`}
          >
            <Bookmark size={27} strokeWidth={1.6} />
          </div>

          <h1 className="font-['Cormorant_Garamond',serif] text-3xl font-semibold">
            Photograph unavailable
          </h1>

          <p className={`mt-3 text-sm leading-6 ${t.muted}`}>
            {pageError || "We couldn't find this photograph."}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${t.button} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t.ring}`}
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <main className={`min-h-screen transition-colors duration-300 ${t.page}`}>
        <div className="mx-auto max-w-[1800px] px-3 py-3 sm:px-5 sm:py-5 lg:px-7">
          {/* TOP BAR */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${t.muted} ${t.hover} focus-visible:outline-none focus-visible:ring-2 ${t.ring}`}
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <Link
              to="/explore"
              className={`inline-flex items-center gap-1.5 text-sm font-semibold transition ${t.accent} ${t.accentHover}`}
            >
              Explore photographs
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.8fr)] lg:gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(390px,0.78fr)]">
            {/* LARGE PHOTOGRAPH */}
            <section className="min-w-0">
              <div
                className={`relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[22px] border ${t.border} ${isDark ? "bg-[#191919]" : "bg-[#EEEEEE]"} sm:min-h-[430px] lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:min-h-[500px]`}
              >
                {imageUrl && !imageFailed ? (
                  <button
                    type="button"
                    onClick={() => setIsImageViewerOpen(true)}
                    aria-label="Open photograph in full screen"
                    title="View full-screen photograph"
                    className="group absolute inset-0 flex h-full w-full cursor-zoom-in items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E60023]"
                  >
                    <img
                      src={imageUrl}
                      alt={caption || "Photograph shared on तस्बिरगंज"}
                      className="h-full max-h-[calc(100vh-2.5rem)] w-full object-contain"
                      onError={() => setImageFailed(true)}
                    />

                    {/* Subtle hover hint */}
                    <span className="pointer-events-none absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/65 px-4 py-2.5 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <ZoomIn size={15} />
                      View full screen
                    </span>
                  </button>
                ) : (
                  <div
                    className={`flex min-h-[300px] w-full flex-col items-center justify-center gap-3 ${t.muted} sm:min-h-[430px]`}
                  >
                    <Bookmark size={38} strokeWidth={1.3} />
                    <p className="text-sm">Photograph preview unavailable</p>
                  </div>
                )}

                {/* Save button on photograph */}
                <button
                  type="button"
                  onClick={handleToggleSave}
                  title={isSaved ? "Remove from saved" : "Save photograph"}
                  aria-label={isSaved ? "Unsave photograph" : "Save photograph"}
                  aria-pressed={isSaved}
                  className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-offset-2 ${
                    isSaved
                      ? "bg-[#E60023] text-white"
                      : "bg-white text-[#111111] hover:bg-[#E60023] hover:text-white"
                  }`}
                >
                  {isSaved ? <Check size={19} /> : <Bookmark size={19} />}
                </button>

                {/* NEW: Download button on photograph */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloadLoading || !imageUrl || imageFailed}
                  title="Download photograph"
                  aria-label="Download photograph"
                  className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#111111] shadow-lg transition hover:bg-[#E60023] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadLoading ? (
                    <LoaderCircle size={19} className="animate-spin" />
                  ) : (
                    <Download size={19} />
                  )}
                </button>
              </div>
            </section>

            {/* DETAILS PANEL */}
            <aside
              className={`min-w-0 rounded-[22px] border p-5 shadow-[0_8px_35px_rgba(0,0,0,0.035)] transition-colors duration-300 sm:p-7 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto ${t.panel}`}
            >
              {/* POST AUTHOR */}
              <div className="flex items-center gap-3">
                {author.path ? (
                  <Link
                    to={author.path}
                    aria-label={`View ${author.name}'s profile`}
                    className="shrink-0 rounded-full"
                  >
                    <Avatar
                      src={author.avatar}
                      name={author.name}
                      size="h-12 w-12"
                      t={t}
                    />
                  </Link>
                ) : (
                  <Avatar
                    src={author.avatar}
                    name={author.name}
                    size="h-12 w-12"
                    t={t}
                  />
                )}

                <div className="min-w-0 flex-1">
                  {author.path ? (
                    <Link
                      to={author.path}
                      className={`block truncate text-sm font-semibold transition ${t.accent} ${t.accentHover}`}
                    >
                      {author.name}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-semibold">
                      {author.name}
                    </p>
                  )}

                  {author.username && (
                    <p className={`mt-0.5 truncate text-xs ${t.muted}`}>
                      @{author.username}
                    </p>
                  )}
                </div>

                {author.path && (
                  <Link
                    to={author.path}
                    aria-label={`Open ${author.name}'s profile`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${t.border} ${t.muted} ${t.hover}`}
                  >
                    <UserRound size={17} />
                  </Link>
                )}
              </div>

              {/* CAPTION */}
              {caption && (
                <div className="mt-7">
                  <h1 className="whitespace-pre-wrap break-words font-['Cormorant_Garamond',serif] text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] sm:text-[34px]">
                    {caption}
                  </h1>
                </div>
              )}

              {/* LOCATION + DATE */}
              {(locationLabel || createdAt) && (
                <div
                  className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${t.muted}`}
                >
                  {locationLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} />
                      <span className="break-words">{locationLabel}</span>
                    </span>
                  )}

                  {createdAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {formatDate(createdAt)}
                    </span>
                  )}
                </div>
              )}

              <div className={`my-6 h-px ${t.divider}`} />

              {/* LIKE / COMMENT / SAVE / DOWNLOAD / SHARE */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={likeSaving}
                  aria-pressed={liked}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-60 ${
                    liked ? "bg-[#E60023]/10 text-[#E60023]" : t.secondaryButton
                  }`}
                >
                  {likeSaving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Heart size={17} fill={liked ? "currentColor" : "none"} />
                  )}

                  <span className="tabular-nums">
                    {likesCount.toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("post-comments")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${t.secondaryButton}`}
                >
                  <MessageCircle size={17} />
                  <span>{commentCount}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleSave}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? "Unsave photograph" : "Save photograph"}
                  title={isSaved ? "Remove from saved" : "Save photograph"}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                    isSaved ? "bg-[#E60023] text-white" : t.secondaryButton
                  }`}
                >
                  {isSaved ? <Check size={17} /> : <Bookmark size={17} />}
                </button>

                {/* NEW: Download action */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloadLoading || !imageUrl || imageFailed}
                  aria-label="Download photograph"
                  title="Download photograph"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${t.secondaryButton}`}
                >
                  {downloadLoading ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Download size={17} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  disabled={shareLoading}
                  aria-label="Share photograph"
                  title="Share photograph"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-60 ${t.secondaryButton}`}
                >
                  {shareLoading ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Share2 size={17} />
                  )}
                </button>
              </div>

              <p className={`mt-4 text-xs leading-5 ${t.muted}`}>
                {isSaved
                  ? "Saved to your photographs."
                  : "A moment captured and shared."}
              </p>

              {/* COMMENTS */}
              <section id="post-comments" className="mt-8 scroll-mt-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold">
                    Conversation
                  </h2>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.soft} ${t.muted}`}
                  >
                    {commentCount}
                  </span>
                </div>

                {/* COMMENT INPUT */}
                <form
                  onSubmit={handleSubmitComment}
                  className={`rounded-2xl border p-3 transition-colors duration-300 ${t.comment}`}
                >
                  <label htmlFor="post-detail-comment" className="sr-only">
                    Write a comment
                  </label>

                  <textarea
                    id="post-detail-comment"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Share a thought about this photograph…"
                    rows={3}
                    maxLength={1500}
                    className={`w-full resize-y border-0 bg-transparent px-1 py-1 text-sm leading-6 outline-none placeholder:opacity-60 focus:ring-0 ${
                      isDark
                        ? "text-[#F7F7F7] placeholder:text-[#999999]"
                        : "text-[#111111] placeholder:text-[#888888]"
                    }`}
                  />

                  <div
                    className={`mt-2 flex items-center justify-between gap-3 border-t pt-3 ${t.border}`}
                  >
                    <span className={`text-[11px] ${t.muted}`}>
                      {commentText.length}/1500
                    </span>

                    <button
                      type="submit"
                      disabled={commentLoading || !commentText.trim()}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${t.button}`}
                    >
                      {commentLoading ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}

                      {commentLoading ? "Posting…" : "Comment"}
                    </button>
                  </div>

                  {!isAuthenticated && (
                    <p className={`mt-2 px-1 text-[11px] ${t.muted}`}>
                      Log in to publish a comment.
                    </p>
                  )}
                </form>

                {/* COMMENT LIST */}
                <div className="mt-5">
                  {commentsLoading && comments.length === 0 ? (
                    <div
                      className={`flex items-center justify-center gap-2 py-8 text-sm ${t.muted}`}
                    >
                      <LoaderCircle size={17} className="animate-spin" />
                      Loading comments…
                    </div>
                  ) : comments.length === 0 ? (
                    <EmptyComments t={t} />
                  ) : (
                    <div className="space-y-5">
                      {comments.map((comment, index) => {
                        const key = getCommentId(comment) || `comment-${index}`;

                        const commenter = getCommentAuthor(comment);
                        const text = getCommentText(comment);

                        const commentDate =
                          comment?.createdAt ||
                          comment?.created_at ||
                          comment?.date;

                        return (
                          <article key={key} className="flex items-start gap-3">
                            {commenter.path ? (
                              <Link
                                to={commenter.path}
                                aria-label={`View ${commenter.name}'s profile`}
                                className="shrink-0 rounded-full"
                              >
                                <Avatar
                                  src={commenter.avatar}
                                  name={commenter.name}
                                  size="h-9 w-9"
                                  t={t}
                                />
                              </Link>
                            ) : (
                              <Avatar
                                src={commenter.avatar}
                                name={commenter.name}
                                size="h-9 w-9"
                                t={t}
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                {commenter.path ? (
                                  <Link
                                    to={commenter.path}
                                    className={`text-xs font-semibold transition hover:underline ${t.accent} ${t.accentHover}`}
                                  >
                                    {commenter.name}
                                  </Link>
                                ) : (
                                  <span className="text-xs font-semibold">
                                    {commenter.name}
                                  </span>
                                )}

                                {commentDate && (
                                  <span className={`text-[10px] ${t.muted}`}>
                                    {formatDate(commentDate)}
                                  </span>
                                )}
                              </div>

                              {commenter.username && (
                                <p className={`mt-0.5 text-[11px] ${t.muted}`}>
                                  @{commenter.username}
                                </p>
                              )}

                              <p
                                className={`mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 ${t.subtle}`}
                              >
                                {text}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <div className={`mt-8 border-t pt-4 ${t.border}`}>
                <p
                  className={`text-center text-[11px] tracking-wide ${t.muted}`}
                >
                  Every photograph holds a story.
                </p>

                <Link
                  to="/explore"
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${t.border} ${t.hover}`}
                >
                  Discover more photographs
                  <ArrowRight size={15} className={t.accent} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* =====================================================
          FULL-SCREEN IMAGE VIEWER
      ===================================================== */}

      {isImageViewerOpen && imageUrl && !imageFailed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen photograph viewer"
          onClick={closeImageViewer}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 backdrop-blur-md sm:p-6 lg:p-10"
        >
          {/* Top controls */}
          <div
            className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/90">
                {caption || "Photograph"}
              </p>

              <p className="mt-1 text-xs text-white/50">
                तस्बिरगंज · Photograph viewer
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloadLoading}
                aria-label="Download photograph"
                title="Download photograph"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-60"
              >
                {downloadLoading ? (
                  <LoaderCircle size={19} className="animate-spin" />
                ) : (
                  <Download size={19} />
                )}
              </button>

              <button
                type="button"
                onClick={closeImageViewer}
                aria-label="Close full-screen viewer"
                title="Close (Esc)"
                autoFocus
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* The image itself does not close the viewer when clicked */}
          <img
            src={imageUrl}
            alt={caption || "Full-screen photograph"}
            onClick={(event) => event.stopPropagation()}
            draggable="false"
            className="max-h-[calc(100dvh-7rem)] max-w-full select-none object-contain shadow-2xl sm:max-h-[calc(100dvh-9rem)]"
          />

          {/* Bottom hint */}
          <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs text-white/50 sm:bottom-6">
            Click outside the photograph or press Esc to close
          </p>
        </div>
      )}
    </>
  );
}
