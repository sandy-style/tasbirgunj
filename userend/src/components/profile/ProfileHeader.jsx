import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  LoaderCircle,
  MapPin,
  Share2,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../../utils/api";
import { useApp } from "../../context/AppContext";

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
  if (!token || typeof window === "undefined") return "";

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

const getCurrentUserId = (user) =>
  getId(
    user?._id ??
      user?.id ??
      user?.userId ??
      user?.user ??
      user?.accountId ??
      user?.sub,
  );

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

const getAccountIdFromFollower = (item) => {
  const candidates = [
    item?.follower?.user?._id,
    item?.follower?.user,
    item?.follower?._id,
    item?.follower,
    item?.user?.user?._id,
    item?.user?.user,
    item?.user,
    item?.userId,
    item?.profile?.user?._id,
    item?.profile?.user,
    item?.following?.user,
    item,
  ];

  for (const candidate of candidates) {
    const id = getId(candidate);
    if (id) return id;
  }

  return "";
};

const getImage = (value) => {
  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return value.url || value.secure_url || "";
  }

  return "";
};

const formatCount = (value) => {
  const count = Math.max(0, Number(value) || 0);

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(count);
};

const normalizeCount = (value) => {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
};

const unwrapResponse = (response) => {
  const body = response?.data ?? {};

  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return { ...body, ...body.data };
  }

  return body;
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

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getCounts = (payload) =>
  payload?.counts ?? payload?.stats ?? payload ?? {};

/* -------------------------------------------------------
   ProfileHeader
------------------------------------------------------- */

const ProfileHeader = ({
  profile,
  currentUser,
  postsCount = 0,
  isOwnProfile = false,
  onEditProfile,
}) => {
  const appContext = useApp() || {};
  const isDark =
    appContext.theme != null
      ? appContext.theme === "dark"
      : Boolean(appContext.isDark);

  const targetUserId = getProfileUserId(profile);
  const currentUserId =
    getCurrentUserId(currentUser) || getTokenUserId(getStoredToken());

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [followSaving, setFollowSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const requestInProgress = useRef(false);
  const requestId = useRef(0);
  const copyTimeoutRef = useRef(null);

  /* -----------------------------------------------------
     Pinterest-inspired theme tokens
  ----------------------------------------------------- */

  const colors = {
    name: isDark ? "text-[#F5F5F5]" : "text-[#111111]",
    username: isDark ? "text-[#A1A1A1]" : "text-[#767676]",
    bio: isDark ? "text-[#D4D4D4]" : "text-[#333333]",
    muted: isDark ? "text-[#A1A1A1]" : "text-[#767676]",
    placeholder: isDark ? "text-[#858585]" : "text-[#999999]",

    divider: isDark ? "border-white/10" : "border-[#E5E5E5]",

    avatar: isDark
      ? "border-white/10 bg-[#202020] text-[#F5F5F5] ring-white/[0.04]"
      : "border-[#E5E5E5] bg-[#F1F1F1] text-[#E60023] ring-[#F7F7F7]",

    secondaryButton: isDark
      ? "border-white/10 bg-white/[0.07] text-[#F5F5F5] hover:bg-white/[0.13]"
      : "border-[#E5E5E5] bg-[#EFEFEF] text-[#111111] hover:bg-[#E2E2E2]",

    followingButton: isDark
      ? "border-white/10 bg-white/[0.1] text-[#F5F5F5] hover:bg-white/[0.16]"
      : "border-[#D9D9D9] bg-[#EFEFEF] text-[#111111] hover:bg-[#E2E2E2]",

    followButton:
      "bg-[#E60023] text-white hover:bg-[#AD081B] focus-visible:ring-2 focus-visible:ring-[#E60023]/30",

    accent: isDark ? "text-[#FF7187]" : "text-[#E60023]",
  };

  const name =
    profile?.name ||
    profile?.fullName ||
    profile?.user?.name ||
    profile?.user?.fullName ||
    "Photographer";

  const username = profile?.username || profile?.user?.username || "";
  const bio = profile?.bio || "";
  const location = profile?.location || profile?.address || "";
  const profileImage = getImage(
    profile?.profileImage ?? profile?.profileImageUrl,
  );

  /* -----------------------------------------------------
     Fetch follower/following counts and follow status
  ----------------------------------------------------- */

  const loadFollowData = useCallback(
    async (signal) => {
      const thisRequest = ++requestId.current;

      if (!targetUserId) {
        setFollowersCount(0);
        setFollowingCount(0);
        setIsFollowing(false);
        setStatusLoading(false);
        return;
      }

      setStatusLoading(true);

      try {
        const response = await api.get(
          `/api/follow/${encodeURIComponent(targetUserId)}/counts`,
          getAuthConfig({ signal }),
        );

        if (signal?.aborted || thisRequest !== requestId.current) return;

        const counts = getCounts(unwrapResponse(response));

        const followers =
          counts.followers ??
          counts.followersCount ??
          counts.totalFollowers ??
          0;

        const following =
          counts.following ??
          counts.followingCount ??
          counts.totalFollowing ??
          0;

        setFollowersCount(normalizeCount(followers));
        setFollowingCount(normalizeCount(following));

        if (typeof counts.isFollowing === "boolean") {
          setIsFollowing(counts.isFollowing);
          return;
        }

        if (!currentUserId || currentUserId === targetUserId) {
          setIsFollowing(false);
          return;
        }

        let page = 1;
        let found = false;
        let hasMore = true;

        while (hasMore && page <= 100) {
          const followerResponse = await api.get(
            `/api/follow/${encodeURIComponent(targetUserId)}/followers`,
            getAuthConfig({
              params: { page, limit: 30 },
              signal,
            }),
          );

          if (signal?.aborted || thisRequest !== requestId.current) {
            return;
          }

          const data = unwrapResponse(followerResponse);
          const pagination = data.pagination ?? {};

          const users = Array.isArray(data.users)
            ? data.users
            : Array.isArray(data.followers)
              ? data.followers
              : Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.data)
                  ? data.data
                  : [];

          found = users.some(
            (item) => getAccountIdFromFollower(item) === currentUserId,
          );

          if (found) break;

          if (pagination.totalPages != null && pagination.page != null) {
            hasMore = Number(pagination.page) < Number(pagination.totalPages);
          } else if (pagination.hasMore != null || data.hasMore != null) {
            hasMore = Boolean(pagination.hasMore ?? data.hasMore);
          } else {
            hasMore = users.length === 30;
          }

          page += 1;
        }

        if (!signal?.aborted && thisRequest === requestId.current) {
          setIsFollowing(found);
        }
      } catch (error) {
        if (
          error?.name !== "CanceledError" &&
          error?.code !== "ERR_CANCELED" &&
          !signal?.aborted
        ) {
          console.error("Follow status loading failed:", error);
        }
      } finally {
        if (!signal?.aborted && thisRequest === requestId.current) {
          setStatusLoading(false);
        }
      }
    },
    [targetUserId, currentUserId],
  );

  useEffect(() => {
    const controller = new AbortController();

    loadFollowData(controller.signal);

    return () => {
      controller.abort();
      requestId.current += 1;
    };
  }, [loadFollowData]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  /* -----------------------------------------------------
     Follow / Unfollow
  ----------------------------------------------------- */

  const handleFollowToggle = async () => {
    if (requestInProgress.current || followSaving || statusLoading) return;

    const token = getStoredToken();

    if (!token && !currentUserId) {
      toast.error("Please log in to follow photographers.");
      return;
    }

    if (!targetUserId) {
      console.error("Could not determine the target account ID:", profile);
      toast.error("Could not identify this photographer's account.");
      return;
    }

    if (currentUserId && currentUserId === targetUserId) {
      toast.info("This is your own profile.");
      return;
    }

    requestInProgress.current = true;
    setFollowSaving(true);

    const previousFollowing = isFollowing;
    const previousCount = followersCount;
    const nextFollowing = !previousFollowing;

    setIsFollowing(nextFollowing);
    setFollowersCount(Math.max(0, previousCount + (nextFollowing ? 1 : -1)));

    try {
      const endpoint = `/api/follow/${encodeURIComponent(targetUserId)}`;

      if (previousFollowing) {
        await api.delete(endpoint, getAuthConfig());
      } else {
        await api.post(endpoint, {}, getAuthConfig());
      }

      toast.success(
        nextFollowing ? "Following successfully." : "Unfollowed successfully.",
      );

      try {
        const response = await api.get(`${endpoint}/counts`, getAuthConfig());
        const counts = getCounts(unwrapResponse(response));

        setFollowersCount(
          normalizeCount(
            counts.followers ??
              counts.followersCount ??
              counts.totalFollowers ??
              previousCount + (nextFollowing ? 1 : -1),
          ),
        );

        setFollowingCount(
          normalizeCount(
            counts.following ??
              counts.followingCount ??
              counts.totalFollowing ??
              followingCount,
          ),
        );

        if (typeof counts.isFollowing === "boolean") {
          setIsFollowing(counts.isFollowing);
        }
      } catch (error) {
        console.warn("Could not refresh follow counts:", error);
      }
    } catch (error) {
      setIsFollowing(previousFollowing);
      setFollowersCount(previousCount);
      toast.error(getErrorMessage(error));
    } finally {
      requestInProgress.current = false;
      setFollowSaving(false);
    }
  };

  /* -----------------------------------------------------
     Share profile
  ----------------------------------------------------- */

  const handleShare = async () => {
    const profileUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${name} on तस्बिरगंज`,
          text: username ? `Follow @${username} on तस्बिरगंज` : name,
          url: profileUrl,
        });

        return;
      }

      if (!navigator.clipboard?.writeText) {
        toast.error("Sharing is not supported by this browser.");
        return;
      }

      await navigator.clipboard.writeText(profileUrl);

      setCopied(true);
      toast.success("Profile link copied.");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1800);
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error("Could not share this profile.");
      }
    }
  };

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */

  return (
    <section
      data-theme={isDark ? "dark" : "light"}
      className={`w-full transition-colors duration-300 ${colors.name}`}
    >
      <div
        className={`flex flex-col gap-6 border-b pb-7 transition-colors duration-300 sm:flex-row sm:items-start sm:gap-8 md:gap-10 ${colors.divider}`}
      >
        {/* Profile avatar */}
        <div className="flex shrink-0 justify-center sm:justify-start">
          <div
            className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border ring-4 transition-colors duration-300 sm:h-28 sm:w-28 md:h-32 md:w-32 ${colors.avatar}`}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${name}'s profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound
                size={42}
                strokeWidth={1.5}
                className={colors.accent}
              />
            )}
          </div>
        </div>

        {/* Profile information */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 text-center sm:text-left">
              <h1
                className={`break-words text-2xl font-semibold tracking-tight transition-colors duration-300 sm:text-3xl ${colors.name}`}
              >
                {name}
              </h1>

              {username && (
                <p
                  className={`mt-1 text-sm transition-colors duration-300 ${colors.username}`}
                >
                  @{username}
                </p>
              )}
            </div>

            {/* Profile actions */}
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:justify-end">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition active:scale-[0.97] ${colors.followButton}`}
                >
                  Edit profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followSaving || statusLoading}
                  aria-pressed={isFollowing}
                  className={`inline-flex h-10 min-w-[112px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:scale-[0.97] disabled:cursor-wait disabled:opacity-70 ${
                    isFollowing ? colors.followingButton : colors.followButton
                  }`}
                >
                  {followSaving || statusLoading ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : isFollowing ? (
                    <Check size={15} />
                  ) : (
                    <UserRoundPlus size={15} />
                  )}

                  <span>
                    {followSaving
                      ? "Please wait…"
                      : statusLoading
                        ? "Checking…"
                        : isFollowing
                          ? "Following"
                          : "Follow"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition active:scale-[0.97] ${colors.secondaryButton}`}
              >
                {copied ? <Copy size={15} /> : <Share2 size={15} />}
                <span>{copied ? "Copied" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Profile statistics */}
          <div className="mt-6 flex items-center justify-center gap-5 sm:justify-start sm:gap-7">
            <div>
              <span className={`font-semibold tabular-nums ${colors.name}`}>
                {formatCount(postsCount)}
              </span>
              <span className={`ml-1.5 text-sm ${colors.muted}`}>posts</span>
            </div>

            <div>
              <span className={`font-semibold tabular-nums ${colors.name}`}>
                {formatCount(followersCount)}
              </span>
              <span className={`ml-1.5 text-sm ${colors.muted}`}>
                followers
              </span>
            </div>

            <div>
              <span className={`font-semibold tabular-nums ${colors.name}`}>
                {formatCount(followingCount)}
              </span>
              <span className={`ml-1.5 text-sm ${colors.muted}`}>
                following
              </span>
            </div>
          </div>

          {/* Bio and location */}
          <div className="mt-5 space-y-2 text-center sm:text-left">
            {bio && (
              <p
                className={`whitespace-pre-wrap break-words text-sm leading-relaxed transition-colors duration-300 ${colors.bio}`}
              >
                {bio}
              </p>
            )}

            {location && (
              <p
                className={`flex items-center justify-center gap-1.5 text-xs transition-colors duration-300 sm:justify-start ${colors.muted}`}
              >
                <MapPin size={14} className="shrink-0" />
                <span className="break-words">{location}</span>
              </p>
            )}

            {!bio && !location && isOwnProfile && (
              <p className={`text-sm ${colors.placeholder}`}>
                Add a bio to tell your story.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;
