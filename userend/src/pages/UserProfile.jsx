import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  LoaderCircle,
  RefreshCw,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../utils/api";
import useAuth from "../hooks/useAuth";
import { useApp } from "../context/AppContext";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfilePosts from "../components/profile/ProfilePosts";

/* -------------------------------------------------------
   Constants
------------------------------------------------------- */

const PROFILE_ENDPOINTS = {
  me: "/api/profile/me",
  create: "/api/profile/create-profile",
  update: "/api/profile/update-profile",
  user: (userId) => `/api/profile/${encodeURIComponent(userId)}`,
};

const MAX_NAME_LENGTH = 60;
const MAX_USERNAME_LENGTH = 20;
const MIN_USERNAME_LENGTH = 3;
const MAX_BIO_LENGTH = 160;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

const getStoredToken = () => {
  try {
    return window.localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const getId = (value) => {
  if (value == null || value === "") return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value !== "object") return "";

  const candidates = [
    value._id,
    value.id,
    value.userId,
    value.user,
    value.ownerUserId,
    value.accountId,
    value.sub,
  ];

  for (const candidate of candidates) {
    const id = getId(candidate);
    if (id) return id;
  }

  return "";
};

const getTokenUserId = (token) => {
  if (!token) return "";

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "";

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");

    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(window.atob(padded));

    return getId(
      payload._id ??
        payload.id ??
        payload.userId ??
        payload.user ??
        payload.accountId ??
        payload.sub,
    );
  } catch {
    return "";
  }
};

const getCurrentUserId = (user, token) => {
  const candidates = [
    user?._id,
    user?.id,
    user?.userId,
    user?.user,
    user?.accountId,
    user?.sub,
  ];

  for (const candidate of candidates) {
    const id = getId(candidate);
    if (id) return id;
  }

  return getTokenUserId(token);
};

const getProfileUserId = (profile) => {
  const candidates = [
    profile?.user?._id,
    profile?.user?.id,
    profile?.user,
    profile?.userId?._id,
    profile?.userId,
    profile?.ownerUserId,
    profile?.owner?._id,
    profile?.owner,
    profile?.author?._id,
    profile?.author,
    profile?.createdBy,
  ];

  for (const candidate of candidates) {
    const id = getId(candidate);
    if (id) return id;
  }

  return "";
};

const getAuthConfig = (token, extra = {}) => ({
  ...extra,
  headers: {
    ...(extra.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

const unwrapResponse = (response) => {
  const body = response?.data ?? {};

  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return { ...body, ...body.data };
  }

  return body;
};

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message ||
  error?.response?.data?.data?.message ||
  error?.message ||
  fallback;

const isMissingProfileMessage = (message = "") =>
  /profile.*(not found|does not exist|not created|missing)|no profile/i.test(
    message,
  );

const isMissingProfileError = (error) => {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    "";

  return (
    status === 404 &&
    (!message || /profile|not found|does not exist|no profile/i.test(message))
  );
};

const getProfileImage = (profile) => {
  const image = profile?.profileImage ?? profile?.profileImageUrl;

  if (typeof image === "string") return image;

  if (image && typeof image === "object") {
    return image.url || image.secure_url || "";
  }

  return "";
};

const normalizePost = (post) => {
  if (!post || typeof post !== "object") return null;

  const rawImage = post.image ?? post.imageUrl ?? post.photo ?? post.url ?? "";

  const image =
    typeof rawImage === "string"
      ? rawImage
      : rawImage?.url || rawImage?.secure_url || "";

  return {
    ...post,
    image,
    _id: getId(post._id ?? post.id) || undefined,
  };
};

/* -------------------------------------------------------
   UserProfile
------------------------------------------------------- */

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();

  const auth = useAuth() || {};
  const appContext = useApp() || {};

  const user = auth.user ?? auth.currentUser ?? null;
  const authToken = auth.token || auth.accessToken || getStoredToken();

  const theme = appContext.theme ?? (appContext.isDark ? "dark" : "light");
  const isDark = theme === "dark";

  const isAuthenticated = Boolean(auth.isAuthenticated || user || authToken);
  const currentUserId = getCurrentUserId(user, authToken);

  /* -----------------------------------------------------
     State
  ----------------------------------------------------- */

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);

  const [refreshKey, setRefreshKey] = useState(0);

  const displayedProfileUserId = getProfileUserId(profile);

  const isOwnProfile = !routeUserId
    ? true
    : Boolean(
        (currentUserId && routeUserId === currentUserId) ||
        (currentUserId && displayedProfileUserId === currentUserId),
      );

  const postsCount = Math.max(
    0,
    Number.isFinite(Number(totalPosts)) ? Number(totalPosts) : posts.length,
  );

  /* -----------------------------------------------------
     Pinterest-inspired theme tokens
  ----------------------------------------------------- */

  const colors = {
    bg: isDark ? "bg-[#111111]" : "bg-[#F7F7F7]",
    text: isDark ? "text-[#F5F5F5]" : "text-[#111111]",
    muted: isDark ? "text-[#A1A1A1]" : "text-[#767676]",
    subtle: isDark ? "text-[#858585]" : "text-[#999999]",
    border: isDark ? "border-white/10" : "border-[#E5E5E5]",
    card: isDark ? "bg-[#1C1C1C]" : "bg-white",
    inputBg: isDark ? "bg-[#151515]" : "bg-[#F7F7F7]",
    inputBorder: isDark ? "border-white/15" : "border-[#D6D6D6]",

    primaryBtn:
      "bg-[#E60023] text-white hover:bg-[#AD081B] focus-visible:ring-2 focus-visible:ring-[#E60023]/40",

    secondaryBtn: isDark
      ? "bg-white/10 text-white hover:bg-white/15"
      : "bg-[#EFEFEF] text-[#111111] hover:bg-[#E2E2E2]",

    accentText: isDark ? "text-[#FF6B81]" : "text-[#E60023]",
    accentSoft: isDark
      ? "bg-[#E60023]/15 text-[#FF8294]"
      : "bg-[#E60023]/[0.08] text-[#E60023]",
    focus: "focus:border-[#E60023] focus:ring-2 focus:ring-[#E60023]/15",
  };

  /* -----------------------------------------------------
     Edit / Create profile form
  ----------------------------------------------------- */

  const resetEditForm = useCallback(() => {
    setName(profile?.name || profile?.user?.name || "");
    setUsername(profile?.username || profile?.user?.username || "");
    setBio(profile?.bio || "");

    setImageFile(null);
    setImagePreview(getProfileImage(profile));
    setImageInputKey((value) => value + 1);
  }, [profile]);

  const openEditProfile = useCallback(() => {
    if (!isOwnProfile || !profile) return;

    resetEditForm();
    setEditOpen(true);
  }, [isOwnProfile, profile, resetEditForm]);

  const openCreateProfile = useCallback(() => {
    if (!isOwnProfile || profile) return;

    setName(user?.name || user?.fullName || "");
    setUsername("");
    setBio("");

    setImageFile(null);
    setImagePreview("");
    setImageInputKey((value) => value + 1);

    setEditOpen(true);
  }, [user, isOwnProfile, profile]);

  const closeEditProfile = useCallback(() => {
    if (editSaving) return;

    setEditOpen(false);
    setImageFile(null);
    setImagePreview("");
  }, [editSaving]);

  /* -----------------------------------------------------
     Fetch Profile and Posts
  ----------------------------------------------------- */

  const fetchProfile = useCallback(
    async (signal) => {
      if (!isAuthenticated) {
        setProfile(null);
        setPosts([]);
        setTotalPosts(0);
        setProfileMissing(false);
        setProfileError("");
        setProfileLoading(false);
        return;
      }

      const viewingOwnRoute =
        !routeUserId || Boolean(currentUserId && routeUserId === currentUserId);

      const endpoint = viewingOwnRoute
        ? PROFILE_ENDPOINTS.me
        : PROFILE_ENDPOINTS.user(routeUserId);

      setProfileLoading(true);
      setProfile(null);
      setPosts([]);
      setTotalPosts(0);
      setProfileError("");
      setProfileMissing(false);
      setEditOpen(false);

      try {
        const response = await api.get(
          endpoint,
          getAuthConfig(authToken, { signal }),
        );

        if (signal?.aborted) return;

        const data = unwrapResponse(response);
        const returnedProfile = data.profile ?? data.userProfile ?? null;

        if (data.success === false) {
          const message = data.message || "Unable to load this profile.";

          if (isMissingProfileMessage(message)) {
            setProfile(null);
            setPosts([]);
            setTotalPosts(0);

            if (viewingOwnRoute) {
              setProfileMissing(true);
            } else {
              setProfileError("This user profile could not be found.");
            }

            return;
          }

          throw new Error(message);
        }

        if (!returnedProfile || typeof returnedProfile !== "object") {
          setProfile(null);
          setPosts([]);
          setTotalPosts(0);

          if (viewingOwnRoute) {
            setProfileMissing(true);
          } else {
            setProfileError("This user profile could not be found.");
          }

          return;
        }

        setProfile(returnedProfile);

        const rawPosts = Array.isArray(data.posts)
          ? data.posts
          : Array.isArray(returnedProfile.posts)
            ? returnedProfile.posts
            : [];

        const fetchedPosts = rawPosts.map(normalizePost).filter(Boolean);

        setPosts(fetchedPosts);

        const rawCount =
          data.totalPosts ?? data.postsCount ?? data.pagination?.totalPosts;

        const count = Number(rawCount);

        setTotalPosts(
          rawCount != null && Number.isFinite(count) && count >= 0
            ? count
            : fetchedPosts.length,
        );
      } catch (error) {
        if (signal?.aborted) return;

        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
          return;
        }

        if (error?.response?.status === 401) {
          setProfile(null);
          setPosts([]);
          setTotalPosts(0);
          setProfileError("Your session has expired. Please log in again.");
          return;
        }

        if (isMissingProfileError(error)) {
          setProfile(null);
          setPosts([]);
          setTotalPosts(0);

          if (viewingOwnRoute) {
            setProfileMissing(true);
          } else {
            setProfileError("This user profile could not be found.");
          }

          return;
        }

        setProfileError(
          getErrorMessage(
            error,
            "Something went wrong while loading this profile.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setProfileLoading(false);
        }
      }
    },
    [isAuthenticated, routeUserId, currentUserId, authToken],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchProfile(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchProfile, refreshKey]);

  /* -----------------------------------------------------
     Image selection & cleanup
  ----------------------------------------------------- */

  const handleImageChange = (event) => {
    const file = event.currentTarget.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Profile images must be 5 MB or smaller.");
      event.currentTarget.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleClearSelectedImage = () => {
    if (!imageFile) return;

    setImageFile(null);
    setImagePreview(getProfileImage(profile));
    setImageInputKey((value) => value + 1);
  };

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /* -----------------------------------------------------
     Save / Update profile
  ----------------------------------------------------- */

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (editSaving) return;

    const cleanName = name.trim();
    const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
    const cleanBio = bio.trim();

    if (!cleanName) {
      toast.error("Please enter your name.");
      return;
    }

    if (cleanName.length > MAX_NAME_LENGTH) {
      toast.error("Your name cannot exceed 60 characters.");
      return;
    }

    if (!profile) {
      if (
        cleanUsername.length < MIN_USERNAME_LENGTH ||
        cleanUsername.length > MAX_USERNAME_LENGTH ||
        !USERNAME_REGEX.test(cleanUsername)
      ) {
        toast.error(
          "Username must be 3–20 characters using lowercase letters, numbers, or underscores.",
        );
        return;
      }
    }

    if (cleanBio.length > MAX_BIO_LENGTH) {
      toast.error("Your bio cannot exceed 160 characters.");
      return;
    }

    if (!authToken && !auth.isAuthenticated && !user) {
      toast.error("Please log in again before saving your profile.");
      return;
    }

    setEditSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", cleanName);
      formData.append("bio", cleanBio);

      if (!profile) {
        formData.append("username", cleanUsername);
      }

      if (imageFile) {
        formData.append("profileImage", imageFile);
      }

      const isCreating = !profile;

      const response = isCreating
        ? await api.post(
            PROFILE_ENDPOINTS.create,
            formData,
            getAuthConfig(authToken),
          )
        : await api.patch(
            PROFILE_ENDPOINTS.update,
            formData,
            getAuthConfig(authToken),
          );

      const data = unwrapResponse(response);

      if (data.success === false) {
        throw new Error(data.message || "Unable to save your profile.");
      }

      setEditOpen(false);
      setImageFile(null);
      setImagePreview("");

      toast.success(
        isCreating
          ? "Your profile has been created."
          : "Your profile has been updated.",
      );

      setRefreshKey((value) => value + 1);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save your profile."));
    } finally {
      setEditSaving(false);
    }
  };

  /* -----------------------------------------------------
     1. Loading state
  ----------------------------------------------------- */

  if (profileLoading) {
    return (
      <main
        data-theme={theme}
        className={`min-h-screen px-4 pb-16 pt-5 transition-colors duration-200 sm:px-6 md:pt-7 ${colors.bg} ${colors.text}`}
      >
        <div className="mx-auto max-w-4xl animate-pulse">
          <div className="mb-6 flex items-center justify-between">
            <div
              className={`h-4 w-28 rounded-md ${
                isDark ? "bg-white/10" : "bg-neutral-200"
              }`}
            />
            <div
              className={`h-4 w-20 rounded-md ${
                isDark ? "bg-white/10" : "bg-neutral-200"
              }`}
            />
          </div>

          <div className="flex flex-col gap-6 pb-8 md:flex-row md:items-start md:gap-14">
            <div
              className={`mx-auto h-24 w-24 shrink-0 rounded-full md:mx-0 md:h-36 md:w-36 ${
                isDark ? "bg-white/10" : "bg-neutral-200"
              }`}
            />

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`h-6 w-44 rounded-md ${
                    isDark ? "bg-white/10" : "bg-neutral-200"
                  }`}
                />
                <div
                  className={`h-8 w-24 rounded-lg ${
                    isDark ? "bg-white/10" : "bg-neutral-200"
                  }`}
                />
              </div>

              <div className="flex gap-6 pt-1">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`h-4 w-20 rounded ${
                      isDark ? "bg-white/10" : "bg-neutral-200"
                    }`}
                  />
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <div
                  className={`h-4 w-32 rounded ${
                    isDark ? "bg-white/10" : "bg-neutral-200"
                  }`}
                />
                <div
                  className={`h-4 w-full max-w-md rounded ${
                    isDark ? "bg-white/10" : "bg-neutral-200"
                  }`}
                />
              </div>
            </div>
          </div>

          <div
            className={`mt-4 border-t pt-4 ${
              isDark ? "border-white/10" : "border-neutral-200"
            }`}
          >
            <div
              className={`mx-auto h-4 w-20 rounded ${
                isDark ? "bg-white/10" : "bg-neutral-200"
              }`}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-1 sm:gap-4 md:gap-7">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className={`aspect-square w-full rounded-md ${
                  isDark ? "bg-white/5" : "bg-neutral-200"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* -----------------------------------------------------
     2. Authentication guard
  ----------------------------------------------------- */

  if (!isAuthenticated) {
    return (
      <main
        data-theme={theme}
        className={`flex min-h-[75vh] items-center justify-center px-4 py-16 transition-colors duration-200 ${colors.bg} ${colors.text}`}
      >
        <section
          className={`w-full max-w-md rounded-2xl border p-8 text-center shadow-sm sm:p-10 ${colors.card} ${colors.border}`}
        >
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${colors.accentSoft}`}
          >
            <UserRound size={28} strokeWidth={1.7} />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Log in to view your profile
          </h1>

          <p className={`mt-2.5 text-sm leading-relaxed ${colors.muted}`}>
            Connect with the community, curate your photographs, and customize
            your presence on तस्बिरगंज.
          </p>

          <Link
            to="/login"
            className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition active:scale-[0.98] ${colors.primaryBtn}`}
          >
            Log in to continue
          </Link>
        </section>
      </main>
    );
  }

  /* -----------------------------------------------------
     3. Profile loading error
  ----------------------------------------------------- */

  if (profileError) {
    const sessionExpired = /session|log in again|login again/i.test(
      profileError,
    );

    return (
      <main
        data-theme={theme}
        className={`flex min-h-[75vh] items-center justify-center px-4 py-16 transition-colors duration-200 ${colors.bg} ${colors.text}`}
      >
        <section
          className={`w-full max-w-md rounded-2xl border p-8 text-center shadow-sm ${colors.card} ${colors.border}`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-[#E60023]">
            <AlertCircle size={26} />
          </div>

          <h1 className="mt-4 text-xl font-bold tracking-tight">
            Couldn't load profile
          </h1>

          <p
            className={`mt-2 break-words text-sm leading-relaxed ${colors.muted}`}
          >
            {profileError}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            {sessionExpired ? (
              <Link
                to="/login"
                className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${colors.primaryBtn}`}
              >
                Log in again
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${colors.primaryBtn}`}
              >
                <RefreshCw size={15} />
                Try again
              </button>
            )}

            <Link
              to="/explore"
              className={`inline-flex h-10 items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${colors.secondaryBtn} ${colors.border}`}
            >
              Explore
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* -----------------------------------------------------
     4. Main profile view
  ----------------------------------------------------- */

  return (
    <main
      data-theme={theme}
      className={`min-h-screen px-4 pb-20 pt-4 transition-colors duration-200 sm:px-6 md:pt-6 ${colors.bg} ${colors.text}`}
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-4 flex items-center justify-between sm:mb-6">
          <Link
            to="/explore"
            aria-label="Back to explore"
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-neutral-500/10 active:scale-95 sm:text-sm ${colors.muted}`}
          >
            <ArrowLeft size={16} />
            <span>Explore</span>
          </Link>

          <Link
            to="/"
            aria-label="तस्बिरगंज home"
            className="font-['Rozha_One',serif] text-lg tracking-wide transition hover:opacity-75 sm:text-xl"
            style={{ color: "#E60023" }}
          >
            तस्बिरगंज
          </Link>
        </header>

        {profile ? (
          <>
            <ProfileHeader
              profile={profile}
              currentUser={user}
              postsCount={postsCount}
              isOwnProfile={isOwnProfile}
              onEditProfile={openEditProfile}
            />

            <section className="mt-5 sm:mt-7">
              <ProfilePosts
                posts={posts}
                loading={false}
                error=""
                isOwnProfile={isOwnProfile}
                totalCount={postsCount}
                onRetry={() => setRefreshKey((value) => value + 1)}
                onCreatePost={() => navigate("/create-post")}
              />
            </section>
          </>
        ) : profileMissing ? (
          <section
            className={`mx-auto mt-8 max-w-xl rounded-2xl border p-8 text-center shadow-sm sm:p-12 ${colors.card} ${colors.border}`}
          >
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${colors.accentSoft}`}
            >
              <UserRound size={29} strokeWidth={1.6} />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
              Create your profile
            </h1>

            <p
              className={`mx-auto mt-3 max-w-sm text-sm leading-relaxed ${colors.muted}`}
            >
              Set up your profile to start sharing photographs, following
              creators, and becoming part of the तस्बिरगंज community.
            </p>

            <button
              type="button"
              onClick={openCreateProfile}
              className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition active:scale-[0.98] ${colors.primaryBtn}`}
            >
              <UserRound size={16} />
              <span>Create profile</span>
            </button>
          </section>
        ) : (
          <section
            className={`mt-8 rounded-2xl border p-8 text-center ${colors.card} ${colors.border}`}
          >
            <p className={`text-sm ${colors.muted}`}>
              No profile information is available yet.
            </p>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${colors.primaryBtn}`}
            >
              <RefreshCw size={14} />
              Refresh profile
            </button>
          </section>
        )}
      </div>

      {/* ---------------------------------------------------
          Create / Edit Profile Modal
      --------------------------------------------------- */}

      {editOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-editor-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProfile();
            }
          }}
        >
          <div
            className={`my-auto w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl ${colors.card} ${colors.border} ${colors.text}`}
          >
            <div
              className={`flex items-center justify-between border-b px-5 py-4 sm:px-6 ${colors.border}`}
            >
              <div>
                <h2
                  id="profile-editor-title"
                  className="text-base font-semibold tracking-tight"
                >
                  {profile ? "Edit profile" : "Create profile"}
                </h2>
                <p className={`mt-1 text-xs ${colors.muted}`}>
                  {profile
                    ? "Keep your profile up to date."
                    : "Introduce yourself to the community."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                disabled={editSaving}
                aria-label="Close"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-neutral-500/10 active:scale-95 disabled:opacity-50 ${colors.muted}`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 p-5 sm:p-6">
              {/* Avatar and image upload */}
              <div
                className={`flex items-center gap-4 rounded-xl p-3.5 ${
                  isDark ? "bg-white/[0.04]" : "bg-[#F7F7F7]"
                }`}
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xl font-bold ${
                    isDark
                      ? "border-white/10 bg-white/[0.06] text-white"
                      : "border-[#E5E5E5] bg-white text-[#E60023]"
                  }`}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={26} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {username
                      ? `@${username.replace(/^@/, "")}`
                      : name || "New Photographer"}
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <label
                      className={`cursor-pointer text-xs font-semibold transition hover:underline ${colors.accentText}`}
                    >
                      <span>{imagePreview ? "Change photo" : "Add photo"}</span>

                      <input
                        key={imageInputKey}
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={editSaving}
                        className="sr-only"
                      />
                    </label>

                    {imageFile && (
                      <button
                        type="button"
                        onClick={handleClearSelectedImage}
                        disabled={editSaving}
                        className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                      >
                        Revert
                      </button>
                    )}
                  </div>

                  <p className={`mt-1.5 text-[11px] ${colors.subtle}`}>
                    Maximum file size: 5 MB
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="profile-name"
                    className="text-xs font-semibold tracking-wide"
                  >
                    Name
                  </label>

                  <span className={`text-[11px] ${colors.subtle}`}>
                    {name.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>

                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                  disabled={editSaving}
                  className={`h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition ${colors.inputBg} ${colors.inputBorder} ${colors.focus} disabled:opacity-60`}
                />
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="profile-username"
                  className="mb-1.5 block text-xs font-semibold tracking-wide"
                >
                  Username
                </label>

                <div
                  className={`flex h-11 items-center rounded-xl border px-3.5 ${colors.inputBg} ${colors.inputBorder} ${
                    profile ? "opacity-70" : ""
                  }`}
                >
                  <span className={`mr-1 text-sm ${colors.subtle}`}>@</span>

                  <input
                    id="profile-username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value.replace(/^@/, "").toLowerCase(),
                      )
                    }
                    maxLength={MAX_USERNAME_LENGTH}
                    minLength={MIN_USERNAME_LENGTH}
                    required={!profile}
                    disabled={Boolean(profile) || editSaving}
                    autoComplete="username"
                    spellCheck={false}
                    placeholder="username"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
                  />
                </div>

                <p
                  className={`mt-1.5 text-[11px] leading-relaxed ${colors.subtle}`}
                >
                  {profile
                    ? "Usernames cannot be changed once created."
                    : "3–20 lowercase characters, numbers, or underscores."}
                </p>
              </div>

              {/* Bio */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="profile-bio"
                    className="text-xs font-semibold tracking-wide"
                  >
                    Bio
                  </label>

                  <span className={`text-[11px] ${colors.subtle}`}>
                    {bio.length}/{MAX_BIO_LENGTH}
                  </span>
                </div>

                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={MAX_BIO_LENGTH}
                  rows={3}
                  disabled={editSaving}
                  placeholder="Write a short bio about your photography journey…"
                  className={`w-full resize-none rounded-xl border p-3 text-sm leading-relaxed outline-none transition ${colors.inputBg} ${colors.inputBorder} ${colors.focus} disabled:opacity-60`}
                />
              </div>

              {/* Actions */}
              <div
                className={`flex items-center justify-end gap-2.5 border-t pt-4 ${colors.border}`}
              >
                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={editSaving}
                  className={`h-10 rounded-full px-5 text-xs font-semibold transition active:scale-95 disabled:opacity-50 ${colors.secondaryBtn}`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSaving}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${colors.primaryBtn}`}
                >
                  {editSaving ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : profile ? (
                    <Save size={14} />
                  ) : (
                    <Check size={14} />
                  )}

                  <span>
                    {editSaving
                      ? "Saving…"
                      : profile
                        ? "Save changes"
                        : "Create profile"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserProfile;
