import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  Camera,
  RotateCcw,
  Clock3,
  Heart,
  Shuffle,
  MessageCircle,
  Tag,
  ChevronDown,
  Bookmark,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

import { readFeedCache, writeFeedCache } from "../utils/feedCache";
import PostGrid from "../components/post/PostGrid";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";

const PAGE_SIZE = 30;
const MAX_PAGES = 10;

const CATEGORIES = [
  { value: "All", label: "All photographs" },
  { value: "nature", label: "Nature" },
  { value: "mountains", label: "Mountains" },
  { value: "travel", label: "Travel" },
  { value: "wildlife", label: "Wildlife" },
  { value: "culture", label: "Culture" },
  { value: "architecture", label: "Architecture" },
  { value: "people", label: "People" },
  { value: "street-photography", label: "Street Photography" },
  { value: "saved", label: "Saved Photographs" },
];

const SORT_OPTIONS = [
  {
    value: "random",
    label: "Random",
    description: "Discover something unexpected",
    icon: Shuffle,
  },
  {
    value: "latest",
    label: "Latest",
    description: "Recently published photographs",
    icon: Clock3,
  },
  {
    value: "most-liked",
    label: "Most liked",
    description: "Photographs with the most likes",
    icon: Heart,
  },
  {
    value: "most-commented",
    label: "Most discussed",
    description: "Photographs with the most comments",
    icon: MessageCircle,
  },
  {
    value: "oldest",
    label: "Oldest",
    description: "Explore earlier photographs",
    icon: Clock3,
  },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function extractPosts(data) {
  if (Array.isArray(data)) return data;

  const candidates = [
    data?.posts,
    data?.data?.posts,
    data?.data,
    data?.feed,
    data?.results,
    data?.data?.results,
    data?.items,
    data?.data?.items,
  ];

  return candidates.find(Array.isArray) ?? null;
}

function extractPagination(data) {
  const candidates = [
    data?.pagination,
    data?.data?.pagination,
    data?.meta,
    data?.data?.meta,
    data,
  ];

  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;

    const hasMore =
      typeof item.hasMore === "boolean"
        ? item.hasMore
        : typeof item.hasNextPage === "boolean"
          ? item.hasNextPage
          : typeof item.hasNext === "boolean"
            ? item.hasNext
            : null;

    const rawPages = item.totalPages ?? item.total_pages ?? item.pages;
    const totalPages =
      rawPages !== undefined && rawPages !== null ? Number(rawPages) : null;

    if (
      hasMore !== null ||
      (totalPages !== null && Number.isFinite(totalPages) && totalPages > 0)
    ) {
      return {
        hasMore,
        totalPages:
          totalPages !== null && Number.isFinite(totalPages) && totalPages > 0
            ? totalPages
            : null,
      };
    }
  }

  return null;
}

function getPostImage(post) {
  const image = post?.image || post?.imageUrl || post?.photo || post?.url;

  if (typeof image === "string") return image;
  if (typeof image?.url === "string") return image.url;

  return "";
}

function getPostIdentity(post) {
  const id = post?._id ?? post?.id;

  if (id !== undefined && id !== null && String(id)) {
    return `id:${String(id)}`;
  }

  const image = getPostImage(post);
  return image ? `image:${image}` : null;
}

function getSavedIdentity(post) {
  const id = post?._id ?? post?.id;

  if (id !== undefined && id !== null && String(id)) {
    return String(id);
  }

  const image = getPostImage(post);
  return image ? `image:${image}` : null;
}

function shuffleArray(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function normalizeCategory(value) {
  if (typeof value !== "string") return "";

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[_\s]+/g, "-");

  const aliases = {
    portrait: "people",
    portraits: "people",
    street: "street-photography",
    "street-photo": "street-photography",
    "street-photography": "street-photography",
  };

  return aliases[normalized] || normalized;
}

function getPostDate(post) {
  const value =
    post?.createdAt || post?.created_at || post?.publishedAt || post?.date;

  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLikeCount(post) {
  const candidates = [
    post?.likesCount,
    post?.likeCount,
    post?.likes_count,
    post?.totalLikes,
    post?.likes,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (Array.isArray(value)) return value.length;

    if (value && typeof value === "object") {
      if (typeof value.count === "number") return value.count;
      if (Array.isArray(value.users)) return value.users.length;
    }
  }

  return 0;
}

function getCommentCount(post) {
  const candidates = [
    post?.commentsCount,
    post?.commentCount,
    post?.comments_count,
    post?.totalComments,
    post?.comments,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (Array.isArray(value)) return value.length;

    if (value && typeof value === "object") {
      if (typeof value.count === "number") return value.count;
    }
  }

  return 0;
}

function getAuthor(post) {
  const author = post?.author || post?.authorData || post?.user || {};

  if (typeof author === "string") {
    return { name: author, username: author };
  }

  return author;
}

function getSearchableText(post) {
  const author = getAuthor(post);

  const values = [
    post?.caption,
    post?.title,
    post?.description,
    post?.alt,
    post?.altText,
    post?.location,
    post?.category,
    post?.hashtags,
    post?.tags,
    post?.keywords,
    post?.imageTitle,
    post?.imageDescription,
    author?.name,
    author?.fullName,
    author?.username,
    author?.handle,
    author?.bio,
    author?.location,
  ];

  return values
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value.map((item) =>
          typeof item === "string"
            ? item
            : item?.name || item?.label || item?.tag || "",
        );
      }

      return [value];
    })
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function mergePosts(posts = []) {
  const seen = new Set();

  return posts.filter((post) => {
    if (!post || typeof post !== "object") return false;

    const identity = getPostIdentity(post);

    if (!identity || seen.has(identity)) return false;

    seen.add(identity);
    return true;
  });
}

async function fetchFirstBackendPage() {
  const endpoints = [
    API_ENDPOINTS?.POST?.FEED,
    "/api/post/feed",
    "/api/post",
  ].filter(
    (endpoint, index, all) =>
      typeof endpoint === "string" &&
      endpoint.length > 0 &&
      all.indexOf(endpoint) === index,
  );

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint, {
        params: { page: 1, limit: PAGE_SIZE },
      });

      const batch = extractPosts(response?.data);

      if (!batch) {
        lastError = new Error(`Unexpected post response from ${endpoint}`);
        continue;
      }

      return {
        endpoint,
        firstPage: batch,
        firstResponse: response.data,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Could not load the Explore feed.");
}

async function fetchRemainingBackendPages(
  endpoint,
  firstResponse,
  firstPage,
  onUpdate,
) {
  const collected = [...firstPage];
  const seen = new Set(collected.map(getPostIdentity).filter(Boolean));

  const publish = () => onUpdate(mergePosts(collected));
  const initialPagination = extractPagination(firstResponse);

  if (
    initialPagination?.hasMore === false ||
    (initialPagination?.totalPages && initialPagination.totalPages <= 1) ||
    firstPage.length === 0
  ) {
    publish();
    return collected;
  }

  for (let page = 2; page <= MAX_PAGES; page += 1) {
    try {
      const response = await api.get(endpoint, {
        params: { page, limit: PAGE_SIZE },
      });

      const batch = extractPosts(response?.data);

      if (!batch || batch.length === 0) break;

      let added = 0;

      for (const post of batch) {
        const identity = getPostIdentity(post);

        if (!post || !identity || seen.has(identity)) continue;

        seen.add(identity);
        collected.push(post);
        added += 1;
      }

      const pagination = extractPagination(response.data);

      if (pagination?.hasMore === false) break;

      if (pagination?.totalPages && page >= pagination.totalPages) {
        break;
      }

      if (added === 0) break;

      if (
        (!pagination || pagination.hasMore === null) &&
        !pagination?.totalPages &&
        batch.length < PAGE_SIZE
      ) {
        break;
      }

      if (page % 3 === 0) publish();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Background feed pagination stopped.", error);
      }

      break;
    }
  }

  publish();
  return collected;
}

function normalizeSavedIds(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((id) => typeof id === "string" || typeof id === "number")
    .map(String);
}

function FeedSkeleton() {
  const cardHeights = [
    "h-56",
    "h-72",
    "h-64",
    "h-80",
    "h-60",
    "h-72",
    "h-52",
    "h-80",
  ];

  return (
    <section
      aria-label="Loading photographs"
      aria-busy="true"
      className="animate-in fade-in duration-500"
    >
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0DDE0] bg-white">
          <Camera size={17} className="animate-pulse text-[#E60023]" />
        </div>

        <div>
          <p
            className="text-lg italic text-[#202927]"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            Developing your collection
          </p>
          <p className="mt-0.5 text-[11px] tracking-wide text-[#7A827C]">
            Gathering moments worth discovering
          </p>
        </div>
      </div>

      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
        {cardHeights.map((height, index) => (
          <div key={index} className="mb-4 break-inside-avoid">
            <div
              className={`relative ${height} overflow-hidden rounded-2xl border border-[#F0DDE0] bg-[#FFF0F2]`}
            >
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#FFF8F8] via-[#FCEBED] to-[#FFF0F2]"
                style={{ animationDelay: `${index * 100}ms` }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="mb-2 h-2 w-2/3 animate-pulse rounded-full bg-[#F0DDE0]" />
                <div className="h-2 w-1/3 animate-pulse rounded-full bg-[#F5E3E6]" />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 pt-3">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-[#FCEBED]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-2 w-2/5 animate-pulse rounded-full bg-[#F0DDE0]" />
                <div className="h-2 w-3/5 animate-pulse rounded-full bg-[#F7ECEE]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ savedCategory, onReset }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#F0DDE0] bg-[#FDFEFC] px-6 py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0F2] text-[#E60023]">
        {savedCategory ? (
          <Bookmark size={25} strokeWidth={1.6} />
        ) : (
          <ImageIcon size={26} strokeWidth={1.6} />
        )}
      </div>

      <h2
        lang="ne"
        className="text-2xl font-normal text-[#202927]"
        style={{ fontFamily: '"Noto Serif Devanagari", "Rozha One", serif' }}
      >
        {savedCategory
          ? "अहिलेसम्म कुनै तस्बिर सुरक्षित छैन"
          : "कुनै तस्बिर भेटिएन"}
      </h2>

      <p className="mt-3 max-w-sm text-sm leading-6 text-[#7A827C]">
        {savedCategory
          ? "Save photographs using the bookmark control on a post. They will appear here for you to revisit."
          : "There are no photographs matching your current selection. Try another category or search."}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#F0DDE0] bg-white px-5 py-3 text-xs font-semibold text-[#E60023] transition hover:border-[#E60023] hover:bg-[#FFF0F2]"
      >
        <RotateCcw size={14} />
        Explore photographs
      </button>
    </div>
  );
}

function FeedError({ onRetry }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#F0DDE0] bg-[#FDFEFC] px-6 py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0F2] text-[#E60023]">
        <Camera size={27} strokeWidth={1.6} />
      </div>

      <h2
        className="text-3xl font-normal text-[#202927]"
        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      >
        The collection is out of reach.
      </h2>

      <p className="mt-3 max-w-sm text-sm leading-6 text-[#7A827C]">
        We couldn't connect to the photograph collection. Check your connection
        and try again.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#E60023] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#C9001F]"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState(() => {
    const cached = readFeedCache();
    return cached?.posts?.length ? cached.posts : [];
  });

  const [isLoading, setIsLoading] = useState(
    () => !readFeedCache()?.posts?.length,
  );

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("random");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [savedPostIds, setSavedPostIds] = useState(() =>
    normalizeSavedIds(readStorage("tasbirgunj-saved-posts", [])),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      const cached = readFeedCache();

      if (cached?.posts?.length) {
        setPosts(cached.posts);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      setLoadError(false);

      try {
        const result = await fetchFirstBackendPage();

        if (cancelled) return;

        const liveFirstPage = mergePosts(result.firstPage);
        const combined = mergePosts([
          ...liveFirstPage,
          ...(cached?.posts || []),
        ]);

        writeFeedCache(combined);
        setPosts(combined);
        setIsLoading(false);

        await fetchRemainingBackendPages(
          result.endpoint,
          result.firstResponse,
          result.firstPage,
          (updatedPosts) => {
            if (cancelled) return;

            const freshPosts = mergePosts(updatedPosts);

            writeFeedCache(freshPosts);
            setPosts(freshPosts);
          },
        );
      } catch (error) {
        if (cancelled) return;

        if (!cached?.posts?.length) {
          setPosts([]);
        }

        setLoadError(true);

        if (import.meta.env.DEV) {
          console.warn("Unable to refresh the Explore feed.", error);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "tasbirgunj-saved-posts",
        JSON.stringify(savedPostIds),
      );
    } catch {
      // Browser storage may be unavailable.
    }
  }, [savedPostIds]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isSavedCategory = activeCategory === "saved";

    return posts.filter((post) => {
      const postCategory = normalizeCategory(post?.category);
      const savedIdentity = getSavedIdentity(post);

      const matchesCategory =
        activeCategory === "All" ||
        isSavedCategory ||
        postCategory === normalizeCategory(activeCategory);

      const matchesSaved =
        !isSavedCategory ||
        (savedIdentity !== null && savedPostIds.includes(savedIdentity));

      const matchesSearch = !query || getSearchableText(post).includes(query);

      return matchesCategory && matchesSaved && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery, savedPostIds]);

  const sortedPosts = useMemo(() => {
    const result = [...filteredPosts];

    switch (sortBy) {
      case "latest":
        return result.sort((a, b) => getPostDate(b) - getPostDate(a));

      case "oldest":
        return result.sort((a, b) => getPostDate(a) - getPostDate(b));

      case "most-liked":
        return result.sort((a, b) => getLikeCount(b) - getLikeCount(a));

      case "most-commented":
        return result.sort((a, b) => getCommentCount(b) - getCommentCount(a));

      case "random":
      default:
        return shuffleArray(result);
    }
  }, [filteredPosts, sortBy, refreshKey]);

  const handleSelectPost = useCallback(
    (post) => {
      const postId = post?._id || post?.id;

      if (!postId) return;

      navigate(`/post/${encodeURIComponent(postId)}`, {
        state: {
          post,
          backgroundLocation: location,
        },
      });
    },
    [navigate, location],
  );

  const handleSave = useCallback((post) => {
    const savedIdentity = getSavedIdentity(post);

    if (!savedIdentity) return;

    setSavedPostIds((current) =>
      current.includes(savedIdentity)
        ? current.filter((id) => id !== savedIdentity)
        : [...current, savedIdentity],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("All");
    setSortBy("random");
  }, []);

  const refreshGallery = useCallback(() => {
    setRefreshKey((current) => current + 1);
    setSortBy("random");
  }, []);

  const hasFilters = searchQuery.trim() !== "" || activeCategory !== "All";

  const selectedSort =
    SORT_OPTIONS.find((option) => option.value === sortBy) || SORT_OPTIONS[0];

  const SelectedSortIcon = selectedSort.icon;

  const countLabel =
    sortedPosts.length === 1
      ? "1 photograph"
      : `${sortedPosts.length} photographs`;

  const showInitialLoading = isLoading && posts.length === 0;
  const showInitialError = loadError && posts.length === 0 && !isLoading;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#FDFEFC] text-[#202927]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -right-48 -top-48 h-[420px] w-[420px] rounded-full bg-[#FCEBED] opacity-60 blur-[120px]" />
        <div className="absolute -left-48 top-1/3 h-[380px] w-[380px] rounded-full bg-[#FFF0F2] opacity-70 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1720px] px-4 pb-16 pt-7 sm:px-8 sm:pt-10 lg:px-12">
        <header className="relative mb-6 border-b border-[#F0DDE0] pb-5 sm:mb-7 sm:pb-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E60023] sm:text-xs sm:tracking-[0.24em]">
                The photography collection
              </p>

              <h1
                className="mt-2 text-3xl font-normal tracking-tight text-[#202927] sm:text-4xl md:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                Explore{" "}
                <span className="italic text-[#E60023]">perspectives.</span>
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-6 text-[#7A827C] sm:text-sm">
                Find places, moments, and stories through the eyes of
                photographers.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setShowCategories(false);
                  setShowSortOptions(false);
                }}
                aria-label={searchOpen ? "Close search" : "Search photographs"}
                aria-expanded={searchOpen}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  searchOpen
                    ? "border-[#E60023] bg-[#FFF0F2] text-[#E60023]"
                    : "border-[#F0DDE0] bg-white hover:border-[#E60023] hover:text-[#E60023]"
                }`}
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCategories((open) => !open);
                  setSearchOpen(false);
                  setShowSortOptions(false);
                }}
                aria-label="Browse categories"
                aria-expanded={showCategories}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  showCategories
                    ? "border-[#E60023] bg-[#FFF0F2] text-[#E60023]"
                    : "border-[#F0DDE0] bg-white hover:border-[#E60023] hover:text-[#E60023]"
                }`}
              >
                <Tag size={17} />
              </button>
            </div>
          </div>

          <div
            className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ${
              searchOpen
                ? "mt-4 grid-rows-[1fr] opacity-100"
                : "mt-0 grid-rows-[0fr] opacity-0"
            }`}
            aria-hidden={!searchOpen}
          >
            <div className="overflow-hidden">
              <div className="flex h-12 w-full min-w-0 items-center rounded-full border border-[#F0DDE0] bg-[#FFF0F2] px-4 transition-colors focus-within:border-[#E60023] focus-within:bg-white">
                <Search size={17} className="mr-3 shrink-0 text-[#E60023]" />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search captions, places, creators..."
                  aria-label="Search all photographs"
                  tabIndex={searchOpen ? 0 : -1}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#202927] outline-none placeholder:text-[#929992]"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="ml-2 shrink-0 rounded-full p-1 text-[#7A827C] hover:bg-[#FCEBED] hover:text-[#202927]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <p className="mt-2 px-4 text-[11px] leading-5 text-[#7A827C]">
                Search by caption, location, category, photographer, username,
                or available tags.
              </p>
            </div>
          </div>
        </header>

        <section className="mb-5" aria-label="Photograph categories">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-[#7A827C]" />
              <p className="text-xs font-semibold text-[#202927]">
                Browse by category
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCategories((open) => !open)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E60023] hover:text-[#C9001F]"
            >
              {showCategories ? "Show less" : "All categories"}
              <ChevronDown
                size={14}
                className={showCategories ? "rotate-180" : ""}
              />
            </button>
          </div>

          <div
            className={`flex flex-wrap gap-2 ${
              showCategories ? "" : "max-h-[43px] overflow-hidden"
            }`}
          >
            {CATEGORIES.map((category) => {
              const active = activeCategory === category.value;
              const isSaved = category.value === "saved";

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setActiveCategory(category.value)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[#E60023] bg-[#E60023] text-white"
                      : "border-[#F0DDE0] bg-white text-[#465149] hover:border-[#E60023] hover:bg-[#FFF0F2]"
                  }`}
                >
                  {isSaved && <Bookmark size={14} />}
                  {category.label}

                  {isSaved && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[#FFF0F2] text-[#E60023]"
                      }`}
                    >
                      {savedPostIds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#F0DDE0] pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <p className="text-xs font-semibold text-[#202927]">{countLabel}</p>

            {hasFilters && (
              <span className="rounded-full bg-[#FFF0F2] px-2.5 py-1 text-[10px] font-medium text-[#E60023]">
                Filtered
              </span>
            )}

            {isLoading && posts.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#7A827C]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E60023]" />
                Updating
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSortOptions((open) => !open);
                  setShowCategories(false);
                  setSearchOpen(false);
                }}
                aria-expanded={showSortOptions}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#F0DDE0] bg-white px-3.5 text-xs font-semibold transition-colors hover:border-[#E60023] sm:px-4"
              >
                <SelectedSortIcon size={15} className="text-[#E60023]" />
                <span>{selectedSort.label}</span>
                <ChevronDown size={14} className="text-[#7A827C]" />
              </button>

              {showSortOptions && (
                <div className="absolute right-0 top-full z-30 mt-2 w-[270px] rounded-2xl border border-[#F0DDE0] bg-white p-2 shadow-xl shadow-black/[0.08]">
                  <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A827C]">
                    Sort photographs
                  </p>

                  {SORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = sortBy === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortOptions(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                          active ? "bg-[#FFF0F2]" : "hover:bg-[#FDF7F8]"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            active
                              ? "bg-[#E60023] text-white"
                              : "bg-[#FCEBED] text-[#7A303A]"
                          }`}
                        >
                          <Icon size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold ${
                              active ? "text-[#C9001F]" : "text-[#202927]"
                            }`}
                          >
                            {option.label}
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-[#7A827C]">
                            {option.description}
                          </p>
                        </div>

                        {active && (
                          <span className="text-xs font-bold text-[#E60023]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={refreshGallery}
              disabled={isLoading}
              aria-label="Refresh gallery and shuffle photographs"
              title="Refresh gallery"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F0DDE0] bg-white text-[#7A303A] transition-colors hover:border-[#E60023] hover:text-[#E60023] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw
                size={15}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </section>

        {hasFilters && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-[#7A827C]">Active filters</span>

            {activeCategory !== "All" && (
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className="inline-flex items-center gap-2 rounded-full bg-[#FFF0F2] px-3 py-2 text-xs font-medium text-[#E60023]"
              >
                {CATEGORIES.find((item) => item.value === activeCategory)
                  ?.label || activeCategory}
                <X size={12} />
              </button>
            )}

            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#FCEBED] px-3 py-2 text-xs text-[#465149]"
              >
                <span className="max-w-[180px] truncate">
                  “{searchQuery.trim()}”
                </span>
                <X size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#E60023] hover:bg-[#FFF0F2]"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        )}

        {showInitialLoading ? (
          <FeedSkeleton />
        ) : showInitialError ? (
          <FeedError onRetry={refreshGallery} />
        ) : sortedPosts.length > 0 ? (
          <>
            <PostGrid
              posts={sortedPosts}
              onSelectPost={handleSelectPost}
              onSave={handleSave}
              savedPostIds={savedPostIds}
              theme="light"
            />

            {!isLoading && loadError && (
              <p className="mt-6 text-center text-xs leading-5 text-[#7A827C]">
                <Sparkles
                  size={13}
                  className="mr-1 inline-block text-[#E60023]"
                />
                Showing previously loaded photographs. The latest collection
                could not be reached.
              </p>
            )}
          </>
        ) : (
          <EmptyState
            savedCategory={activeCategory === "saved"}
            onReset={resetFilters}
          />
        )}
      </div>
    </main>
  );
}
