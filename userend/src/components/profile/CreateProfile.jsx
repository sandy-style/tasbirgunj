import { useEffect, useRef, useState } from "react";
import {
  Camera,
  UserRound,
  AtSign,
  AlignLeft,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Check,
  AlertCircle,
  ArrowLeft,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import api from "../../utils/api";
import { useApp } from "../../context/AppContext";

const INITIAL_FORM = {
  name: "",
  username: "",
  bio: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const FIELD_BASE_CLASS =
  "w-full min-w-0 bg-transparent text-sm outline-none " +
  "focus:outline-none focus:ring-0 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "placeholder:opacity-100";

function validateForm(values) {
  const errors = {};

  const name = values.name.trim();
  const username = values.username.trim();
  const bio = values.bio.trim();

  if (!name) {
    errors.name = "Please enter your full name.";
  } else if (name.length > 60) {
    errors.name = "Your name cannot exceed 60 characters.";
  }

  if (!username) {
    errors.username = "Please choose a username.";
  } else if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    errors.username = "Use 3–20 lowercase letters, numbers, or underscores.";
  }

  if (bio.length > 160) {
    errors.bio = "Your bio cannot exceed 160 characters.";
  }

  return errors;
}

function getRequestErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (data?.message) return data.message;

  if (typeof data?.error === "string") {
    return data.error;
  }

  if (Array.isArray(data?.errors)) {
    const messages = data.errors
      .map((item) =>
        typeof item === "string" ? item : item?.message || item?.msg,
      )
      .filter(Boolean);

    if (messages.length) return messages.join(" ");
  }

  if (error?.code === "ERR_NETWORK") {
    return (
      "Cannot connect to the backend. Check that your server is running " +
      "and VITE_API_URL points to the correct port."
    );
  }

  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  if (status === 400) {
    return "The profile information is invalid. Please check your entries.";
  }

  if (status === 401) {
    return "Your session may have expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to create this profile.";
  }

  if (status === 404) {
    return (
      "The profile endpoint was not found. Check the backend route " +
      "mount and the POST /create-profile route."
    );
  }

  if (status === 409) {
    return "That username may already be taken. Please choose another.";
  }

  if (status === 413) {
    return "The uploaded image is too large. Choose an image under 5 MB.";
  }

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (status >= 500) {
    return "The server encountered an error. Please try again shortly.";
  }

  return error?.message || "Unable to create your profile. Please try again.";
}

export default function CreateProfile({ onClose, onSuccess, onCreated }) {
  const { isDark } = useApp();

  const [form, setForm] = useState(INITIAL_FORM);
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const bioInputRef = useRef(null);
  const submittingRef = useRef(false);

  const handleCreated = onSuccess ?? onCreated;

  // Pinterest-inspired color palette.
  const palette = isDark
    ? {
        page: "bg-[#121212] text-[#F5F5F5]",
        muted: "text-[#B5B5B5]",
        subtle: "text-[#858585]",
        label: "text-[#F0F0F0]",
        accent: "text-[#FF4B65]",
        iconPanel: "bg-[#E60023]/15 text-[#FF4B65]",
        fieldBackground: "bg-[#202020] focus-within:bg-[#292929]",
        fieldText: "text-[#F5F5F5] placeholder:text-[#858585] caret-[#E60023]",
        fieldIcon: "text-[#A3A3A3]",
        normalBorder: "border-white/10",
        avatar: "border-white/10 bg-[#202020]",
        photoButton:
          "border-[#121212] bg-[#E60023] text-white hover:bg-[#C90020]",
        primaryButton: "bg-[#E60023] text-white hover:bg-[#C90020]",
        secondaryHover: "hover:bg-white/10 hover:text-white",
        divider: "border-white/10",
        glow: "bg-[#E60023]/10",
        error: "text-[#FF777F]",
        ringOffset: "focus-visible:ring-offset-[#121212]",
      }
    : {
        page: "bg-[#FFFCFC] text-[#1F1F1F]",
        muted: "text-[#767676]",
        subtle: "text-[#999999]",
        label: "text-[#333333]",
        accent: "text-[#E60023]",
        iconPanel: "bg-[#E60023]/[0.07] text-[#E60023]",
        fieldBackground: "bg-[#F7F7F7] focus-within:bg-white",
        fieldText: "text-[#1F1F1F] placeholder:text-[#999999] caret-[#E60023]",
        fieldIcon: "text-[#888888]",
        normalBorder: "border-[#E5E5E5]",
        avatar: "border-[#E5E5E5] bg-[#F7F7F7]",
        photoButton:
          "border-[#FFFCFC] bg-[#E60023] text-white hover:bg-[#C90020]",
        primaryButton: "bg-[#E60023] text-white hover:bg-[#C90020]",
        secondaryHover: "hover:bg-black/5 hover:text-[#1F1F1F]",
        divider: "border-[#EAEAEA]",
        glow: "bg-[#E60023]/[0.06]",
        error: "text-[#C62828]",
        ringOffset: "focus-visible:ring-offset-[#FFFCFC]",
      };

  const getFieldWrapperClass = (hasError = false) =>
    [
      "flex min-h-[52px] items-center gap-3 rounded-2xl border px-4",
      "transition-colors duration-200",
      palette.fieldBackground,
      hasError ? "border-[#E60023]/70" : palette.normalBorder,
      "focus-within:border-[#E60023]/60 focus-within:ring-0",
    ].join(" ");

  const fieldClass = `${FIELD_BASE_CLASS} ${palette.fieldText}`;

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!profileImage) {
      setPreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profileImage);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    const nextValue =
      name === "username" ? value.toLowerCase().replace(/\s/g, "") : value;

    const nextForm = {
      ...form,
      [name]: nextValue,
    };

    setForm(nextForm);
    setSubmitError("");

    if (attemptedSubmit) {
      setFieldErrors(validateForm(nextForm));
    } else {
      setFieldErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    const validType =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      (!file.type && ALLOWED_IMAGE_EXTENSIONS.includes(extension));

    if (!validType) {
      const message = "Choose a JPG, PNG, or WebP image.";

      setImageError(message);
      toast.error(message);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const message = "Your image must be 5 MB or smaller.";

      setImageError(message);
      toast.error(message);
      event.target.value = "";
      return;
    }

    setProfileImage(file);
    setImageError("");
    event.target.value = "";
  };

  const removeImage = () => {
    setProfileImage(null);
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (submittingRef.current) return;
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    setAttemptedSubmit(true);
    setSubmitError("");

    const errors = validateForm(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstInvalidField = Object.keys(errors)[0];

      const inputRefs = {
        name: nameInputRef,
        username: usernameInputRef,
        bio: bioInputRef,
      };

      inputRefs[firstInvalidField]?.current?.focus();
      toast.error(errors[firstInvalidField]);
      return;
    }

    let token;

    try {
      token = localStorage.getItem("token");
    } catch (error) {
      console.error("Could not read the authentication token:", error);
    }

    if (!token) {
      const message = "Your session has expired. Please sign in again.";

      setSubmitError(message);
      toast.error(message);
      return;
    }

    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("username", form.username.trim());
    formData.append("bio", form.bio.trim());

    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const response = await api.post("/api/profile/create-profile", formData, {
        headers: {
          token,
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response?.data;

      if (result?.success === false) {
        throw new Error(result.message || "Unable to create your profile.");
      }

      const createdProfile =
        result?.profile ??
        result?.profileData ??
        result?.data?.profile ??
        result?.data ??
        result;

      setForm(INITIAL_FORM);
      setProfileImage(null);
      setFieldErrors({});
      setImageError("");
      setSubmitError("");
      setAttemptedSubmit(false);

      toast.success("Your profile has been created!");

      try {
        await handleCreated?.(createdProfile);
      } catch (callbackError) {
        console.error("Profile success callback failed:", callbackError);

        toast.error(
          "Your profile was created, but the page could not refresh.",
        );
      }

      try {
        onClose?.();
      } catch (closeError) {
        console.error("Could not close the profile form:", closeError);
      }
    } catch (error) {
      console.error("Create profile request failed:", {
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        status: error?.response?.status,
        response: error?.response?.data,
        message: error?.message,
      });

      const message = getRequestErrorMessage(error);

      setSubmitError(message);
      toast.error(message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-white-25 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-profile-title"
        data-theme={isDark ? "dark" : "light"}
        className={[
          "relative my-auto w-full max-w-xl overflow-hidden rounded-3xl",
          "border shadow-2xl transition-colors duration-300",
          isDark
            ? "border-white/10 bg-[#191919] text-[#F5F5F5]"
            : "border-black/5 bg-[#FFFCFC] text-[#1F1F1F]",
        ].join(" ")}
      >
        {/* Pinterest-red accent */}
        <div className="h-1.5 w-full bg-[#E60023]" />

        {/* Header */}
        <header className="flex items-center justify-between px-6 pb-3 pt-5 sm:px-8">
          <span
            lang="ne"
            className="font-['Mukta',sans-serif] text-xl font-bold text-[#E60023]"
          >
            तस्बिरगंज
          </span>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close create profile"
            className={[
              "rounded-full p-2 transition-colors",
              isDark
                ? "text-[#B5B5B5] hover:bg-white/10 hover:text-white"
                : "text-[#767676] hover:bg-black/5 hover:text-[#1F1F1F]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <X size={19} />
          </button>
        </header>

        <div className="px-6 pb-7 pt-2 sm:px-8 sm:pb-8">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E60023]">
              Profile setup
            </p>

            <h2
              id="create-profile-title"
              className="tg-type-editorial text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Your story starts here.
            </h2>

            <p
              className={[
                "mt-2 text-sm leading-6",
                isDark ? "text-[#B5B5B5]" : "text-[#767676]",
              ].join(" ")}
            >
              Create your profile and let the community discover your
              perspective.
            </p>
          </div>

          {submitError && (
            <div
              role="alert"
              className={[
                "mb-5 flex items-start gap-2.5 rounded-xl border p-3",
                isDark
                  ? "border-[#FF777F]/25 bg-[#E60023]/10 text-[#FF999F]"
                  : "border-[#E60023]/20 bg-[#E60023]/5 text-[#C62828]",
              ].join(" ")}
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-5">{submitError}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={loading}
            className="space-y-5"
          >
            {/* Profile picture */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div
                  className={[
                    "flex h-[76px] w-[76px] items-center justify-center",
                    "overflow-hidden rounded-full border",
                    isDark
                      ? "border-white/10 bg-[#252525]"
                      : "border-[#E5E5E5] bg-[#F7F7F7]",
                  ].join(" ")}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile picture preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound
                      size={30}
                      strokeWidth={1.3}
                      className={isDark ? "text-[#FF4B65]" : "text-[#E60023]"}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  aria-label="Choose profile picture"
                  className={[
                    "absolute bottom-0 right-0 flex h-8 w-8 items-center",
                    "justify-center rounded-full border-2 border-[#FFFCFC]",
                    "bg-[#E60023] text-white transition-colors hover:bg-[#C90020]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  ].join(" ")}
                >
                  <Camera size={14} />
                </button>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">Profile picture</p>
                <p
                  className={[
                    "mt-1 text-xs leading-5",
                    isDark ? "text-[#B5B5B5]" : "text-[#767676]",
                  ].join(" ")}
                >
                  Optional · JPG, PNG or WebP · Max 5 MB
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E60023] hover:text-[#C90020] disabled:opacity-50"
                  >
                    <ImagePlus size={15} />
                    {preview ? "Change photo" : "Upload photo"}
                  </button>

                  {preview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-sm text-[#E60023] hover:opacity-70 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={loading}
                aria-label="Profile picture file"
                className="hidden"
              />
            </div>

            {imageError && (
              <p role="alert" className="text-xs text-[#E60023]">
                {imageError}
              </p>
            )}

            {/* Full name */}
            <div>
              <label
                htmlFor="profile-name"
                className="mb-2 block text-sm font-semibold"
              >
                Full name <span className="text-[#E60023]">*</span>
              </label>

              <div className={getFieldWrapperClass(!!fieldErrors.name)}>
                <UserRound
                  size={17}
                  className={`shrink-0 ${palette.fieldIcon}`}
                />
                <input
                  ref={nameInputRef}
                  id="profile-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  maxLength={60}
                  required
                  disabled={loading}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={
                    fieldErrors.name ? "profile-name-error" : undefined
                  }
                  className={fieldClass}
                />
              </div>

              {fieldErrors.name && (
                <p
                  id="profile-name-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[#E60023]"
                >
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="profile-username"
                className="mb-2 block text-sm font-semibold"
              >
                Username <span className="text-[#E60023]">*</span>
              </label>

              <div className={getFieldWrapperClass(!!fieldErrors.username)}>
                <AtSign size={17} className={`shrink-0 ${palette.fieldIcon}`} />
                <input
                  ref={usernameInputRef}
                  id="profile-username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="your_username"
                  autoComplete="username"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_]{3,20}"
                  required
                  disabled={loading}
                  aria-invalid={!!fieldErrors.username}
                  aria-describedby={
                    fieldErrors.username
                      ? "profile-username-error"
                      : "profile-username-help"
                  }
                  className={fieldClass}
                />
              </div>

              {fieldErrors.username ? (
                <p
                  id="profile-username-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[#E60023]"
                >
                  {fieldErrors.username}
                </p>
              ) : (
                <p
                  id="profile-username-help"
                  className={[
                    "mt-2 text-xs",
                    isDark ? "text-[#B5B5B5]" : "text-[#767676]",
                  ].join(" ")}
                >
                  3–20 lowercase letters, numbers or underscores.
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="profile-bio" className="text-sm font-semibold">
                  Bio{" "}
                  <span
                    className={
                      isDark
                        ? "font-normal text-[#858585]"
                        : "font-normal text-[#999999]"
                    }
                  >
                    (optional)
                  </span>
                </label>

                <span
                  className={[
                    "text-xs tabular-nums",
                    form.bio.length >= 150
                      ? "text-[#E60023]"
                      : isDark
                        ? "text-[#858585]"
                        : "text-[#999999]",
                  ].join(" ")}
                >
                  {form.bio.length}/160
                </span>
              </div>

              <div
                className={[
                  getFieldWrapperClass(!!fieldErrors.bio),
                  "items-start py-3",
                ].join(" ")}
              >
                <AlignLeft
                  size={17}
                  className={`mt-1 shrink-0 ${palette.fieldIcon}`}
                />
                <textarea
                  ref={bioInputRef}
                  id="profile-bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell the community about yourself..."
                  rows={3}
                  maxLength={160}
                  disabled={loading}
                  aria-invalid={!!fieldErrors.bio}
                  aria-describedby={
                    fieldErrors.bio ? "profile-bio-error" : undefined
                  }
                  className={`${fieldClass} resize-none leading-6`}
                />
              </div>

              {fieldErrors.bio && (
                <p
                  id="profile-bio-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[#E60023]"
                >
                  {fieldErrors.bio}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={[
                "flex min-h-[50px] w-full items-center justify-center gap-2",
                "rounded-full bg-[#E60023] px-5 py-3 text-sm font-semibold text-white",
                "transition-colors hover:bg-[#C90020]",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[#E60023] focus-visible:ring-offset-2",
                isDark
                  ? "focus-visible:ring-offset-[#191919]"
                  : "focus-visible:ring-offset-[#FFFCFC]",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Creating profile...
                </>
              ) : (
                <>
                  <Check size={17} />
                  Create profile
                </>
              )}
            </button>

            <p
              className={[
                "text-center text-xs",
                isDark ? "text-[#858585]" : "text-[#767676]",
              ].join(" ")}
            >
              You can update your profile details anytime.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
