import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Camera,
  ImagePlus,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useApp } from "../../context/AppContext";

/* -------------------------------------------------------
   Constants
------------------------------------------------------- */

const SAVED_POSTS_KEY = "tg_saved_posts";

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

const getImage = (value) => {
  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return value.url || value.secure_url || "";
  }

  return "";
};

const normalizePost = (post) => {
  if (!post || typeof post !== "object") return null;

  const image = getImage(
    post.image ??
      post.imageUrl ??
      post.photoUrl ??
      post.photo ??
      post.url ??
      "",
  );

  const rawLocation = post.location ?? post.place ?? "";

  const location =
    typeof rawLocation === "string"
      ? rawLocation
      : rawLocation?.name || rawLocation?.address || rawLocation?.city || "";

  const author =
    post.author && typeof post.author === "object"
      ? post.author
      : post.user && typeof post.user === "object"
        ? post.user
        : post.createdBy && typeof post.createdBy === "object"
          ? post.createdBy
          : {};

  return {
    ...post,
    _id: String(post._id ?? post.id ?? ""),
    image,
    caption: post.caption ?? post.description ?? "",
    location,
    author,
    authorName:
      post.authorName ||
      author.name ||
      author.fullName ||
      author.username ||
      post.userName ||
      post.username ||
      "Photographer",
    authorUsername:
      author.username || post.authorUsername || post.username || "",
    authorImage: getImage(
      author.profileImage ||
        author.avatar ||
        author.profilePicture ||
        post.authorImage,
    ),
    createdAt: post.createdAt ?? post.created_at ?? post.date ?? null,
  };
};

const getPostKey = (post, index = 0) =>
  String(post?._id || post?.image || `profile-post-${index}`);

const readSavedPosts = () => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(SAVED_POSTS_KEY) || "[]",
    );

    return Array.isArray(saved) ? saved.map(String) : [];
  } catch {
    return [];
  }
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

/* -------------------------------------------------------
   ProfilePosts

   Clicking a photograph navigates to the interactive
   post-details page. No static details modal is rendered.
------------------------------------------------------- */

const ProfilePosts = ({
  posts = [],
  loading = false,
  error = null,
  isOwnProfile = false,
  totalCount,
  onRetry,
  onSelectPost,
  onSavePost,
  onCreatePost,
  postDetailsPath = "/post",
  className = "",
}) => {
  const navigate = useNavigate();

  const appContext = useApp() || {};

  const isDark =
    appContext.theme === "dark" ||
    (appContext.theme == null && Boolean(appContext.isDark));

  const [savedPostIds, setSavedPostIds] = useState(readSavedPosts);
  const [savingPostId, setSavingPostId] = useState("");

  const photos = Array.isArray(posts)
    ? posts.map(normalizePost).filter(Boolean)
    : [];

  const errorMessage =
    typeof error === "string"
      ? error
      : error?.response?.data?.message ||
        error?.message ||
        "We couldn't load these photographs. Please try again.";

  const displayedCount =
    totalCount !== null &&
    totalCount !== undefined &&
    Number.isFinite(Number(totalCount))
      ? Math.max(0, Number(totalCount))
      : photos.length;

  const hasError = Boolean(error);
  const hasPosts = photos.length > 0;

  /* -----------------------------------------------------
     Theme tokens
  ----------------------------------------------------- */

  const colors = {
    text: isDark ? "text-[#F5F5F5]" : "text-[#111111]",
    muted: isDark ? "text-[#A1A1A1]" : "text-[#767676]",
    border: isDark ? "border-white/10" : "border-[#E5E5E5]",
    surface: isDark ? "bg-[#1C1C1C]" : "bg-white",
    accentBg: "bg-[#E60023]",
    button:
      "bg-[#E60023] text-white hover:bg-[#AD081B] focus-visible:ring-[#E60023]",
    secondaryButton: isDark
      ? "border-white/10 bg-white/[0.06] text-[#F5F5F5] hover:bg-white/[0.12]"
      : "border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7]",
  };

  const createButtonClass = [
    "inline-flex min-h-10 items-center justify-center gap-2",
    "rounded-full px-5 py-2.5",
    "text-sm font-semibold",
    "transition duration-200 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    colors.button,
    isDark
      ? "focus-visible:ring-offset-[#111111]"
      : "focus-visible:ring-offset-white",
  ].join(" ");

  /* -----------------------------------------------------
     Post navigation
  ----------------------------------------------------- */

  const handleOpenPost = (post) => {
    const postId = String(post?._id || post?.id || "").trim();

    if (!postId) {
      toast.error("This post doesn't have a valid ID.");
      return;
    }

    // Preserve a parent callback if the application already
    // uses it for navigation or other post selection behavior.
    if (typeof onSelectPost === "function") {
      onSelectPost(post);
      return;
    }

    // Default route: /post/:postId
    // Example: /post/671abc123
    const basePath = `/${String(postDetailsPath || "/post")
      .split("/")
      .filter(Boolean)
      .join("/")}`;

    navigate(`${basePath}/${encodeURIComponent(postId)}`);
  };

  /* -----------------------------------------------------
     Save / unsave post
  ----------------------------------------------------- */

  const handleSavePost = async (event, post, index) => {
    event.preventDefault();
    event.stopPropagation();

    const postId = getPostKey(post, index);

    if (savingPostId) return;

    const shouldSave = !savedPostIds.includes(postId);

    setSavingPostId(postId);

    try {
      if (typeof onSavePost === "function") {
        await onSavePost(post, shouldSave);
      }

      const nextSavedIds = shouldSave
        ? [...new Set([...savedPostIds, postId])]
        : savedPostIds.filter((id) => id !== postId);

      try {
        window.localStorage.setItem(
          SAVED_POSTS_KEY,
          JSON.stringify(nextSavedIds),
        );
      } catch {
        if (typeof onSavePost !== "function") {
          throw new Error("Could not update saved posts in this browser.");
        }
      }

      setSavedPostIds(nextSavedIds);

      toast.success(shouldSave ? "Post saved." : "Post removed from saved.");
    } catch (saveError) {
      console.error("Could not save post:", saveError);

      toast.error(
        saveError?.response?.data?.message ||
          saveError?.message ||
          "Could not save this post. Please try again.",
      );
    } finally {
      setSavingPostId("");
    }
  };

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */

  return (
    <section
      aria-label="Profile photographs"
      data-theme={isDark ? "dark" : "light"}
      className={`w-full min-w-0 py-7 transition-colors duration-300 sm:py-9 ${colors.text} ${className}`}
    >
      {/* Gallery heading */}
      <header className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className={`mb-2 flex items-center gap-2 text-xs font-medium tracking-wide ${colors.muted}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${colors.accentBg}`}
              aria-hidden="true"
            />

            <span>Photography</span>
            <span aria-hidden="true">·</span>

            <span>
              {formatCount(displayedCount)}{" "}
              {displayedCount === 1 ? "post" : "posts"}
            </span>
          </div>

          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Gallery
          </h2>

          <p className={`mt-2 text-sm ${colors.muted}`}>
            Moments, places, and perspectives worth keeping.
          </p>
        </div>

        {isOwnProfile &&
          (onCreatePost ? (
            <button
              type="button"
              onClick={onCreatePost}
              className={createButtonClass}
            >
              <ImagePlus size={17} />
              Create post
            </button>
          ) : (
            <Link to="/create-post" className={createButtonClass}>
              <ImagePlus size={17} />
              Create post
            </Link>
          ))}
      </header>

      {/* Loading skeleton */}
      {loading && (
        <div
          role="status"
          aria-label="Loading photographs"
          className="columns-2 gap-3 sm:gap-5 lg:columns-3 lg:gap-6"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="mb-4 break-inside-avoid overflow-hidden rounded-xl sm:mb-6 sm:rounded-2xl"
            >
              <div
                className={[
                  "animate-pulse rounded-xl sm:rounded-2xl",
                  isDark ? "bg-white/[0.07]" : "bg-[#EAEAEA]",
                  index % 3 === 0
                    ? "aspect-[3/4]"
                    : index % 3 === 1
                      ? "aspect-[4/5]"
                      : "aspect-[4/3]",
                ].join(" ")}
              />
            </div>
          ))}

          <span className="sr-only">Loading photographs.</span>
        </div>
      )}

      {/* Error state */}
      {!loading && hasError && (
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border px-6 py-14 text-center ${colors.border} ${colors.surface}`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E60023]/10 text-[#E60023]">
            <AlertCircle size={22} />
          </div>

          <h3 className="mt-4 text-base font-semibold">
            Could not load photographs
          </h3>

          <p className={`mt-2 max-w-md text-sm leading-6 ${colors.muted}`}>
            {errorMessage}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] ${colors.border} ${colors.secondaryButton}`}
            >
              <RefreshCw size={15} />
              Try again
            </button>
          )}
        </div>
      )}

      {/* Pinterest-style masonry gallery */}
      {!loading && !hasError && hasPosts && (
        <div className="columns-2 gap-3 sm:gap-5 lg:columns-3 lg:gap-6">
          {photos.map((post, index) => {
            const postId = getPostKey(post, index);
            const isSaved = savedPostIds.includes(postId);
            const isSaving = savingPostId === postId;

            return (
              <article
                key={post._id || `${post.image}-${index}`}
                className="mb-4 break-inside-avoid sm:mb-6"
              >
                <div
                  className={`group relative overflow-hidden rounded-xl transition duration-300 hover:shadow-lg sm:rounded-2xl ${
                    isDark
                      ? "bg-[#1C1C1C] shadow-black/10"
                      : "bg-white shadow-black/[0.04]"
                  }`}
                >
                  {/* Click a photograph to open its interactive details page */}
                  <button
                    type="button"
                    onClick={() => handleOpenPost(post)}
                    aria-label={`View post: ${post.caption || post.authorName}`}
                    className="block w-full cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-inset"
                  >
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.caption || "Photograph"}
                        loading="lazy"
                        decoding="async"
                        className="block h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div
                        className={`flex aspect-[4/5] items-center justify-center ${
                          isDark ? "bg-[#252525]" : "bg-[#F0F0F0]"
                        }`}
                      >
                        <Camera
                          size={30}
                          strokeWidth={1.5}
                          className={colors.muted}
                        />
                      </div>
                    )}
                  </button>

                  {/* Save action */}
                  <button
                    type="button"
                    onClick={(event) => handleSavePost(event, post, index)}
                    disabled={Boolean(savingPostId)}
                    aria-label={isSaved ? "Remove saved post" : "Save post"}
                    aria-pressed={isSaved}
                    title={isSaved ? "Saved" : "Save"}
                    className={[
                      "absolute right-2.5 top-2.5 z-10",
                      "inline-flex items-center justify-center gap-1.5",
                      "rounded-full px-3.5 py-2.5",
                      "bg-[#E60023] text-white",
                      "text-xs font-semibold shadow-md",
                      "transition-all duration-200",
                      "hover:bg-[#AD081B] active:scale-95",
                      "disabled:cursor-wait disabled:opacity-70",
                      "opacity-100 translate-y-0",
                      "sm:-translate-y-1 sm:opacity-0",
                      "sm:group-hover:translate-y-0 sm:group-hover:opacity-100",
                      "sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100",
                    ].join(" ")}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} />
                    ) : (
                      <Bookmark size={15} />
                    )}

                    <span>
                      {isSaving ? "Saving…" : isSaved ? "Saved" : "Save"}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasError && !hasPosts && (
        <div
          className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-12 text-center sm:min-h-[340px] ${colors.border} ${colors.surface}`}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isDark
                ? "bg-white/[0.07] text-[#F5F5F5]"
                : "bg-[#F2F2F2] text-[#111111]"
            }`}
          >
            <ImagePlus size={27} strokeWidth={1.6} />
          </div>

          <h3 className="mt-5 text-2xl font-bold tracking-tight">
            {isOwnProfile ? "Your story starts here" : "Nothing captured yet"}
          </h3>

          <p className={`mt-2 max-w-sm text-sm leading-6 ${colors.muted}`}>
            {isOwnProfile
              ? "Share your first photograph and give the world a glimpse through your lens."
              : "This photographer hasn't shared any photographs yet. Check back later."}
          </p>

          {isOwnProfile &&
            (onCreatePost ? (
              <button
                type="button"
                onClick={onCreatePost}
                className={`${createButtonClass} mt-5`}
              >
                <ImagePlus size={16} />
                Share your first photograph
              </button>
            ) : (
              <Link to="/create-post" className={`${createButtonClass} mt-5`}>
                <ImagePlus size={16} />
                Share your first photograph
              </Link>
            ))}
        </div>
      )}
    </section>
  );
};

export default ProfilePosts;
