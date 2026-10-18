import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  ImagePlus,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import useAuth from "../hooks/useAuth";
import TermsAndConditionsModal from "../components/common/TermsAndConditionsModal";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_CAPTION_LENGTH = 500;
const MAX_LOCATION_LENGTH = 120;

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

// These values must match POST_CATEGORIES in models/post.js.
const POST_CATEGORIES = [
  {
    value: "nature",
    label: "Nature",
    description: "Landscapes and the natural world",
  },
  {
    value: "mountains",
    label: "Mountains",
    description: "Peaks, hills and the Himalayas",
  },
  {
    value: "travel",
    label: "Travel",
    description: "Journeys and new destinations",
  },
  {
    value: "wildlife",
    label: "Wildlife",
    description: "Animals and living creatures",
  },
  {
    value: "culture",
    label: "Culture",
    description: "Traditions, festivals and heritage",
  },
  {
    value: "architecture",
    label: "Architecture",
    description: "Buildings, temples and structures",
  },
  {
    value: "people",
    label: "People",
    description: "Portraits and everyday lives",
  },
  {
    value: "street-photography",
    label: "Street Photography",
    description: "Candid moments and city life",
  },
];

const getCreatePostEndpoint = () =>
  API_ENDPOINTS?.POST?.CREATE ||
  API_ENDPOINTS?.POST?.CREATE_POST ||
  API_ENDPOINTS?.POSTS?.CREATE ||
  API_ENDPOINTS?.post?.create ||
  "/api/post";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Unable to publish your photograph. Please try again.";

const inputBaseClass =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition placeholder:text-[#A09490] focus:border-[#E60023] focus:ring-4 focus:ring-[#E60023]/[0.07]";

export default function UploadPost({ onPostCreated, onClose, className = "" }) {
  const navigate = useNavigate();
  const auth = useAuth();

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const currentUser = auth?.user ?? null;

  const isAuthenticated = Boolean(
    auth?.isAuthenticated ||
    currentUser ||
    (typeof window !== "undefined" && window.localStorage.getItem("token")),
  );

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Light-only TasbirGunj palette.
  const colors = {
    page: "#FFF9F7",
    surface: "#FFFFFF",
    elevated: "#FFF5F2",
    canvas: "#F8F3F0",
    input: "#FAF7F5",
    text: "#292322",
    muted: "#766A67",
    subtle: "#A09490",
    border: "#EAE0DC",
    accent: "#E60023",
    accentHover: "#AD081B",
    accentSoft: "#FFF0F1",
  };

  const authorName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    currentUser?.email?.split("@")[0] ||
    "Photographer";

  const authorHandle = currentUser?.username
    ? `@${currentUser.username.replace(/^@/, "")}`
    : "";

  const authorImage =
    typeof currentUser?.profileImage === "string"
      ? currentUser.profileImage
      : currentUser?.profileImage?.url ||
        currentUser?.avatar ||
        currentUser?.profilePicture ||
        "";

  const selectedCategory = POST_CATEGORIES.find(
    (item) => item.value === category,
  );

  const isReadyToSubmit = Boolean(
    image && caption.trim() && category && agreedToTerms && !isSubmitting,
  );

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const updateImage = useCallback((file) => {
    if (!file) return;

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP, or AVIF photograph.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Your photograph must be smaller than 10 MB.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;

    setImage(file);
    setPreview(nextPreview);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) updateImage(file);

    // Allows selecting the same file again after removing it.
    event.target.value = "";
  };

  const removeImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setImage(null);
    setPreview("");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) updateImage(file);
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (isSubmitting) return;

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;

    if (!token) {
      toast.info("Log in to share your photograph.");
      navigate("/login", {
        state: { from: "/create-post" },
      });
      return;
    }

    if (!image) {
      toast.error("Please choose a photograph before publishing.");
      return;
    }

    if (!caption.trim()) {
      toast.error("Add a caption to tell your photograph's story.");
      return;
    }

    if (!POST_CATEGORIES.some((item) => item.value === category)) {
      toast.error("Please choose a category for your photograph.");
      return;
    }

    if (location.trim().length > MAX_LOCATION_LENGTH) {
      toast.error("Location cannot exceed 120 characters.");
      return;
    }

    if (!agreedToTerms) {
      toast.info("Please review and agree to the Terms & Conditions.");
      setIsTermsOpen(true);
      return;
    }

    const formData = new FormData();

    formData.append("image", image);
    formData.append("caption", caption.trim());
    formData.append("category", category);

    // Location is optional in the backend.
    if (location.trim()) {
      formData.append("location", location.trim());
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(getCreatePostEndpoint(), formData);

      const result = response?.data;

      if (result?.success === false) {
        throw new Error(
          result?.message || "Your photograph could not be published.",
        );
      }

      const createdPost =
        result?.post || result?.data?.post || result?.data || result;

      toast.success("Your photograph is now part of तस्बिरगंज.");

      if (onPostCreated) {
        await onPostCreated(createdPost);
      }

      setCaption("");
      setLocation("");
      setCategory("");
      setAgreedToTerms(true);
      removeImage();

      if (onClose) {
        onClose();
      } else {
        navigate("/profile");
      }
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401) {
        toast.error("Your session has expired. Please log in again.");
        navigate("/login", {
          state: { from: "/create-post" },
        });
      } else if (status === 403) {
        toast.error(
          error?.response?.data?.message ||
            "Complete your profile before publishing photographs.",
        );
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition duration-200 hover:bg-[#AD081B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

  const primaryButtonStyle = {
    backgroundColor: colors.accent,
    color: "#FFFFFF",
  };

  const fieldStyle = {
    backgroundColor: colors.input,
    borderColor: colors.border,
    color: colors.text,
  };

  /* -------------------------------------------------------
     UNAUTHENTICATED STATE
  ------------------------------------------------------- */

  if (!isAuthenticated) {
    return (
      <main
        className={`flex min-h-[85vh] items-center justify-center px-4 py-14 ${className}`}
        style={{
          backgroundColor: colors.page,
          color: colors.text,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <section
          className="w-full max-w-md rounded-[28px] border p-8 text-center shadow-sm sm:p-10"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: colors.accentSoft,
              color: colors.accent,
            }}
          >
            <ImagePlus size={29} strokeWidth={1.7} />
          </div>

          <p
            className="mt-6 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.accent }}
          >
            तस्बिरगंज
          </p>

          <h1
            className="mt-3 text-3xl leading-tight tracking-tight sm:text-4xl"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
            }}
          >
            Every photograph
            <br />
            has a story.
          </h1>

          <p
            className="mx-auto mt-4 max-w-sm text-sm leading-7"
            style={{ color: colors.muted }}
          >
            Sign in to share your perspective and add your photographs to our
            growing collection.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: "/create-post" }}
              className={`${primaryButtonClass} h-12`}
              style={primaryButtonStyle}
            >
              Log in to continue
            </Link>

            <Link
              to="/explore"
              className="inline-flex h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold transition hover:bg-[#FFF5F2]"
              style={{
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              Explore photographs
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* -------------------------------------------------------
     UPLOAD PAGE
  ------------------------------------------------------- */

  return (
    <main
      className={`min-h-screen px-4 pb-14 pt-5 sm:px-6 sm:pt-8 ${className}`}
      style={{
        backgroundColor: colors.page,
        color: colors.text,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap');

        .tg-upload-dropzone {
          transition: background-color 180ms ease, border-color 180ms ease;
        }

        .tg-upload-dropzone:hover {
          border-color: ${colors.accent};
        }

        .tg-upload-category {
          transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
        }

        .tg-upload-category:hover {
          transform: translateY(-1px);
        }

        .tg-upload-category:focus-visible {
          outline: 3px solid rgba(230, 0, 35, 0.2);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .tg-upload-dropzone,
          .tg-upload-category {
            transition: none !important;
          }

          .tg-upload-category:hover {
            transform: none;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-6xl">
        {/* Top navigation */}
        <div className="mb-7 flex items-center justify-between sm:mb-9">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition hover:opacity-70"
            style={{ color: colors.text }}
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>

          <Link
            to="/explore"
            className="text-xl tracking-tight sm:text-2xl"
            style={{
              color: colors.accent,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 700,
            }}
          >
            तस्बिरगंज
          </Link>
        </div>

        {/* Page heading */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 sm:flex-row sm:items-end">
          <div>
            <p
              className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ color: colors.accent }}
            >
              YOUR CREATIVE SPACE
            </p>

            <h1
              className="text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 600,
              }}
            >
              Create something
              <br className="sm:hidden" />{" "}
              <span style={{ color: colors.accent }}>beautiful.</span>
            </h1>

            <p
              className="mt-3 max-w-xl text-sm leading-6 sm:text-base"
              style={{ color: colors.muted }}
            >
              Save a moment. Tell its story. Share your perspective with the
              world.
            </p>
          </div>

          <div
            className="hidden items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-medium sm:inline-flex"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.muted,
            }}
          >
            <Sparkles size={14} style={{ color: colors.accent }} />
            Made for your point of view
          </div>
        </div>

        {/* Publishing workspace */}
        <section
          className="overflow-hidden rounded-[24px] border shadow-sm sm:rounded-[30px]"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {/* Toolbar */}
          <header
            className="flex min-h-[66px] items-center justify-between gap-3 border-b px-4 py-3 sm:px-7"
            style={{ borderColor: colors.border }}
          >
            <div>
              <h2 className="text-sm font-bold sm:text-base">Create a Pin</h2>
              <p className="mt-0.5 text-xs" style={{ color: colors.subtle }}>
                A new photograph for your collection
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isReadyToSubmit}
              className={`${primaryButtonClass} h-10 min-w-[104px]`}
              style={primaryButtonStyle}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Publish</span>
                </>
              )}
            </button>
          </header>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_IMAGE_TYPES.join(",")}
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload photograph"
            />

            {/* Left: image upload */}
            <div
              className="p-4 sm:p-6 lg:border-r"
              style={{ borderColor: colors.border }}
            >
              <div
                className="relative flex min-h-[350px] items-center justify-center overflow-hidden rounded-[22px] border-2 border-dashed sm:min-h-[480px] lg:min-h-[570px]"
                style={{
                  backgroundColor: colors.canvas,
                  borderColor: isDragging ? colors.accent : colors.border,
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsDragging(false);
                  }
                }}
                onDrop={handleDrop}
              >
                {preview ? (
                  <>
                    <div className="flex h-full w-full items-center justify-center p-3 sm:p-5">
                      <img
                        src={preview}
                        alt="Selected photograph preview"
                        className="max-h-[530px] w-full rounded-xl object-contain"
                      />
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-neutral-800 shadow-md transition hover:bg-neutral-100 active:scale-95"
                      >
                        <RefreshCw size={13} />
                        Replace
                      </button>

                      <button
                        type="button"
                        onClick={removeImage}
                        aria-label="Remove photograph"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition hover:bg-red-50 hover:text-red-600 active:scale-95"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                      <span className="rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                        {(image.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                        {image.type.replace("image/", "").toUpperCase()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div
                    className="tg-upload-dropzone flex min-h-[350px] w-full flex-col items-center justify-center p-6 text-center sm:min-h-[480px] sm:p-10 lg:min-h-[570px]"
                    style={{
                      backgroundColor: isDragging
                        ? colors.accentSoft
                        : "transparent",
                    }}
                  >
                    <div
                      className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[24px]"
                      style={{
                        backgroundColor: colors.accentSoft,
                        color: colors.accent,
                      }}
                    >
                      <ImagePlus size={34} strokeWidth={1.6} />
                    </div>

                    <h3
                      className="text-xl tracking-tight sm:text-2xl"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 600,
                      }}
                    >
                      {isDragging ? "Drop it here" : "Start with a photo"}
                    </h3>

                    <p
                      className="mt-2 max-w-[250px] text-sm leading-6"
                      style={{ color: colors.muted }}
                    >
                      {isDragging
                        ? "Release your photograph to add it to your post."
                        : "Choose a photograph that captures a moment worth sharing."}
                    </p>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`${primaryButtonClass} mt-6 h-11 px-6`}
                      style={primaryButtonStyle}
                    >
                      <ImagePlus size={16} />
                      Choose a photo
                    </button>

                    <p
                      className="mt-4 text-[11px]"
                      style={{ color: colors.subtle }}
                    >
                      JPG, PNG, WebP or AVIF · Up to 10 MB
                    </p>

                    <div
                      className="mt-8 flex items-center gap-2 text-xs"
                      style={{ color: colors.subtle }}
                    >
                      <Sparkles size={14} style={{ color: colors.accent }} />
                      <span>Good stories begin with a single frame.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: post details */}
            <div className="flex flex-col p-5 sm:p-7 lg:p-8">
              <div className="space-y-7">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.accentSoft,
                      color: colors.accent,
                    }}
                  >
                    {authorImage ? (
                      <img
                        src={authorImage}
                        alt={authorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={19} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{authorName}</p>
                    <p
                      className="mt-0.5 truncate text-xs"
                      style={{ color: colors.muted }}
                    >
                      {authorHandle || "Photographer"} · Public post
                    </p>
                  </div>

                  <span
                    className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: colors.accentSoft,
                      color: colors.accent,
                    }}
                  >
                    Creator
                  </span>
                </div>

                {/* Caption */}
                <div>
                  <label
                    htmlFor="post-caption"
                    className="mb-2.5 block text-sm font-bold"
                  >
                    Give your photograph a story
                  </label>

                  <textarea
                    id="post-caption"
                    value={caption}
                    onChange={(event) =>
                      setCaption(
                        event.target.value.slice(0, MAX_CAPTION_LENGTH),
                      )
                    }
                    placeholder="What caught your eye? Tell us about this moment..."
                    rows={5}
                    maxLength={MAX_CAPTION_LENGTH}
                    className={`${inputBaseClass} resize-y leading-7`}
                    style={{
                      ...fieldStyle,
                      minHeight: "135px",
                    }}
                  />

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: colors.subtle }}>
                      Let your perspective shine.
                    </p>

                    <span
                      className="shrink-0 text-xs tabular-nums"
                      style={{
                        color:
                          caption.length > MAX_CAPTION_LENGTH * 0.9
                            ? colors.accent
                            : colors.subtle,
                      }}
                    >
                      {caption.length}/{MAX_CAPTION_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Category selector */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="post-category"
                      className="flex items-center gap-2 text-sm font-bold"
                    >
                      <Tag size={16} style={{ color: colors.accent }} />
                      Choose a category
                    </label>

                    <span
                      className="text-[11px] font-medium"
                      style={{ color: colors.accent }}
                    >
                      Required
                    </span>
                  </div>

                  <p
                    className="mb-3 text-xs leading-5"
                    style={{ color: colors.muted }}
                  >
                    Help people discover your photograph in Explore.
                  </p>

                  <div className="relative" style={{ color: colors.text }}>
                    <select
                      id="post-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      required
                      className={`${inputBaseClass} appearance-none pr-11`}
                      style={{
                        ...fieldStyle,
                        cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>
                        Select the best category
                      </option>

                      {POST_CATEGORIES.map((item) => (
                        <option
                          key={item.value}
                          value={item.value}
                          style={{
                            backgroundColor: "#FFFFFF",
                            color: "#292322",
                          }}
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: colors.muted }}
                    />
                  </div>

                  {selectedCategory && (
                    <div
                      className="mt-3 flex items-start gap-2.5 rounded-xl border p-3"
                      style={{
                        backgroundColor: colors.accentSoft,
                        borderColor: "#F8D7DC",
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: "#FFFFFF",
                          color: colors.accent,
                        }}
                      >
                        <Check size={14} />
                      </div>

                      <div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: colors.text }}
                        >
                          {selectedCategory.label}
                        </p>
                        <p
                          className="mt-0.5 text-xs leading-5"
                          style={{ color: colors.muted }}
                        >
                          {selectedCategory.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="post-location"
                    className="mb-2.5 flex items-center gap-2 text-sm font-bold"
                  >
                    <MapPin size={16} style={{ color: colors.accent }} />
                    Where was it captured?
                    <span
                      className="text-xs font-normal"
                      style={{ color: colors.subtle }}
                    >
                      Optional
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      id="post-location"
                      type="text"
                      value={location}
                      onChange={(event) =>
                        setLocation(
                          event.target.value.slice(0, MAX_LOCATION_LENGTH),
                        )
                      }
                      placeholder="Pokhara, Nepal"
                      maxLength={MAX_LOCATION_LENGTH}
                      className={`${inputBaseClass} pr-11`}
                      style={fieldStyle}
                    />

                    {location && (
                      <button
                        type="button"
                        onClick={() => setLocation("")}
                        aria-label="Clear location"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition hover:opacity-60"
                      >
                        <X size={15} style={{ color: colors.subtle }} />
                      </button>
                    )}
                  </div>

                  <p
                    className="mt-2 text-[11px]"
                    style={{ color: colors.subtle }}
                  >
                    Add a city, landmark, or place name.
                  </p>
                </div>

                {/* Terms */}
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      id="terms-checkbox"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(event) =>
                        setAgreedToTerms(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#E60023]"
                    />

                    <div className="min-w-0">
                      <label
                        htmlFor="terms-checkbox"
                        className="cursor-pointer text-xs leading-6"
                        style={{ color: colors.muted }}
                      >
                        I confirm this is my original photograph and agree to
                        the{" "}
                      </label>

                      <button
                        type="button"
                        onClick={() => setIsTermsOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold underline decoration-current underline-offset-4 transition hover:opacity-70"
                        style={{ color: colors.accent }}
                      >
                        <FileText size={13} />
                        Terms & Conditions
                      </button>
                    </div>
                  </div>
                </div>

                {/* Community reminder */}
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: colors.accentSoft,
                      color: colors.accent,
                    }}
                  >
                    <Sparkles size={15} />
                  </div>

                  <div>
                    <p className="text-xs font-bold">Share thoughtfully</p>
                    <p
                      className="mt-1 text-xs leading-5"
                      style={{ color: colors.muted }}
                    >
                      Respect people, privacy, and natural habitats captured in
                      your work.
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop publish action */}
              <div
                className="mt-8 hidden border-t pt-6 lg:block"
                style={{ borderColor: colors.border }}
              >
                <button
                  type="submit"
                  disabled={!isReadyToSubmit}
                  className={`${primaryButtonClass} h-12 w-full`}
                  style={primaryButtonStyle}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      <span>Publishing your photograph...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Publish photograph</span>
                    </>
                  )}
                </button>

                <p
                  className="mt-3 text-center text-[11px]"
                  style={{ color: colors.subtle }}
                >
                  {!image
                    ? "Choose a photograph to get started."
                    : !caption.trim()
                      ? "Add a caption to tell its story."
                      : !category
                        ? "Choose a category before publishing."
                        : "Your photograph is ready when you are."}
                </p>
              </div>

              {/* Mobile and tablet publish action */}
              <div className="mt-7 lg:hidden">
                <button
                  type="submit"
                  disabled={!isReadyToSubmit}
                  className={`${primaryButtonClass} h-12 w-full`}
                  style={primaryButtonStyle}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Publish photograph</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        <p
          className="mt-6 text-center text-xs leading-6"
          style={{ color: colors.subtle }}
        >
          A little piece of your world, shared with तस्बिरगंज.
        </p>
      </div>

      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={() => {
          setAgreedToTerms(true);
          setIsTermsOpen(false);
        }}
        isDark={false}
      />
    </main>
  );
}
