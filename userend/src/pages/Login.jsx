import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";

import cover from "../assets/tasbirgunj-cover.png";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { validateEmail } from "../utils/validators";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) return "Email address is required.";

      if (!validateEmail(value.trim())) {
        return "Please enter a valid email address.";
      }
    }

    if (name === "password") {
      if (!value) return "Password is required.";

      if (value.length < 8) {
        return "Password must be at least 8 characters long.";
      }

      if (value.length > 128) {
        return "Password must not exceed 128 characters.";
      }
    }

    return "";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (touched[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouched((previous) => ({
      ...previous,
      [name]: true,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: validateField(name, value),
    }));
  };

  const getRedirectPath = () => {
    const requestedPath = location.state?.from?.pathname;

    if (
      typeof requestedPath === "string" &&
      requestedPath.startsWith("/") &&
      !requestedPath.startsWith("//")
    ) {
      return requestedPath;
    }

    return "/";
  };

  // Shared session handling for email/password and Google login.
  const finishLogin = async (data) => {
    const token = data?.token;

    if (typeof token !== "string" || !token.trim()) {
      toast.error("The server did not return a valid login token.");
      return;
    }

    const authenticatedUser =
      data.user ??
      data.userData ??
      (data.name || data.email
        ? {
            name: data.name || "",
            email: data.email || "",
            isVerified: true,
          }
        : null);

    // Keep the existing AuthContext in control of the session.
    login(token, authenticatedUser);

    const redirectTo = getRedirectPath();

    try {
      await refreshProfile();
    } catch (profileError) {
      if (import.meta.env.DEV) {
        console.error("Profile refresh failed:", profileError);
      }

      toast.error("You're signed in, but we couldn't refresh your profile.");
    }

    navigate(redirectTo, { replace: true });
  };

  // Existing email/password login.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || googleLoading) return;

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    const nextErrors = {
      email: validateField("email", email),
      password: validateField("password", password),
    };

    setErrors(nextErrors);
    setTouched({
      email: true,
      password: true,
    });

    if (nextErrors.email || nextErrors.password) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const data = response?.data;

      if (!data || typeof data !== "object") {
        toast.error("Unexpected server response. Please try again.");
        return;
      }

      if (data.verify === false) {
        toast.info(
          data.message || "Please verify your email before signing in.",
        );

        navigate("/verify-email", {
          replace: true,
          state: { email },
        });

        return;
      }

      if (data.success === false) {
        toast.error(data.message || "Login failed. Please try again.");
        return;
      }

      const authenticatedUser = data.user ?? data.userData ?? null;

      if (
        authenticatedUser &&
        (authenticatedUser.verify === false ||
          authenticatedUser.isVerified === false ||
          authenticatedUser.emailVerified === false)
      ) {
        toast.info("Please verify your email before signing in.");

        navigate("/verify-email", {
          replace: true,
          state: { email },
        });

        return;
      }

      await finishLogin(data);
      toast.success("Welcome back to तस्बिरगंज!");
    } catch (error) {
      const status = error?.response?.status;
      const responseData = error?.response?.data;

      if (status === 429) {
        toast.error(
          responseData?.message ||
            "Too many attempts. Please wait before trying again.",
        );
      } else if (!error?.response) {
        toast.error(
          "Unable to connect. Check your internet connection and try again.",
        );
      } else if (status === 401) {
        toast.error(responseData?.message || "Invalid email or password.");
      } else if (status === 403) {
        toast.error(
          responseData?.message ||
            "Please verify your email before signing in.",
        );

        navigate("/verify-email", {
          replace: true,
          state: { email },
        });
      } else {
        toast.error(
          responseData?.message || "Something went wrong. Please try again.",
        );
      }

      if (import.meta.env.DEV) {
        console.error("Login error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in: Google ID token -> Express -> application JWT.
  const handleGoogleSuccess = async (credentialResponse) => {
    if (loading || googleLoading) return;

    const credential = credentialResponse?.credential;

    if (!credential) {
      toast.error(
        "Google did not return a valid credential. Please try again.",
      );
      return;
    }

    setGoogleLoading(true);

    try {
      const googleEndpoint =
        API_ENDPOINTS.AUTH.GOOGLE_LOGIN || "/api/auth/google-login";

      const response = await api.post(googleEndpoint, {
        credential,
      });

      const data = response?.data;

      if (data?.success !== true || !data?.token) {
        toast.error(
          data?.message || "Google sign-in failed. Please try again.",
        );
        return;
      }

      await finishLogin(data);
      toast.success("Welcome back to तस्बिरगंज!");
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 429) {
        toast.error(message || "Too many attempts. Please try again later.");
      } else if (status === 409) {
        toast.error(
          message ||
            "This Google account conflicts with an existing account. Please use your original sign-in method.",
        );
      } else if (status === 401) {
        toast.error(
          message || "Google authentication failed. Please try again.",
        );
      } else if (!error?.response) {
        toast.error(
          "Unable to connect to the server. Please check your connection.",
        );
      } else {
        toast.error(message || "Google sign-in failed. Please try again.");
      }

      if (import.meta.env.DEV) {
        console.error("Google login error:", error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-in was cancelled or could not be completed.");
  };

  const busy = loading || googleLoading;

  return (
    <main
      className="min-h-screen w-full bg-white font-['Inter',sans-serif] text-[#211F1F]"
      style={{
        "--pin-red": "#E60023",
        "--pin-red-hover": "#AD081B",
        "--pin-background": "#F7F7F5",
        "--pin-surface": "#FFFFFF",
        "--pin-text": "#211F1F",
        "--pin-muted": "#767676",
        "--pin-border": "#CDCDCD",
      }}
    >
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Photography panel */}
        <section className="relative hidden min-h-screen overflow-hidden bg-[#252222] lg:block">
          <img
            src={cover}
            alt="A peaceful landscape in soft morning light"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/80"
          />

          <Link
            to="/"
            className="absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 px-5 py-4 text-[13px] text-white/85 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white xl:px-10"
          >
            <ArrowLeft size={14} strokeWidth={1.7} aria-hidden="true" />
            Back to home
          </Link>

          <div className="absolute bottom-9 left-10 right-10 z-10 flex items-end justify-between gap-4 xl:left-16 xl:right-16">
            <div>
              <p
                lang="ne"
                className="font-['Mukta',sans-serif] text-3xl font-bold text-white"
              >
                तस्बिरगंज
              </p>

              <p className="mt-1 text-xs tracking-wide text-white/70">
                Inspiration lives here.
              </p>
            </div>
          </div>
        </section>

        {/* Login panel */}
        <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-20 sm:px-10 lg:px-12 lg:py-12 xl:px-20">
          <Link
            to="/"
            aria-label="Back to home"
            className="absolute left-0 top-0 inline-flex items-center gap-1.5 px-5 py-4 text-[13px] text-[#767676] transition-colors hover:text-[#E60023] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E60023] lg:hidden"
          >
            <ArrowLeft size={14} strokeWidth={1.7} aria-hidden="true" />
            Back to home
          </Link>

          <div className="w-full max-w-[400px]">
            <Link
              to="/"
              className="mb-9 inline-flex items-center gap-2.5"
              aria-label="तस्बिरगंज home"
            >
              <span
                lang="ne"
                className="font-['Mukta',sans-serif] text-3xl font-bold tracking-tight text-[#211F1F]"
              >
                तस्बिरगंज
              </span>
            </Link>

            <div className="mb-7">
              <p className="mb-3 text-xs font-bold tracking-[0.16em] text-[#E60023] uppercase">
                Your creative space
              </p>

              <h2 className="text-4xl font-bold tracking-[-0.045em] text-[#211F1F] sm:text-5xl">
                Welcome back.
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#767676]">
                Pick up where your inspiration left off.
              </p>
            </div>

            {/* Google sign-in */}
            <div
              className={`mb-5 flex min-h-[44px] w-full justify-center ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
              aria-busy={googleLoading}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                shape="pill"
                theme="outline"
                size="large"
                width="400"
                logo_alignment="left"
                useOneTap={false}
              />
            </div>

            {googleLoading && (
              <p
                className="mb-4 text-center text-xs text-[#767676]"
                role="status"
              >
                Signing you in with Google...
              </p>
            )}

            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E5E5E5]" />

              <span className="text-[10px] font-semibold tracking-[0.12em] text-[#767676]">
                OR CONTINUE WITH EMAIL
              </span>

              <div className="h-px flex-1 bg-[#E5E5E5]" />
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              aria-busy={loading}
              noValidate
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-semibold text-[#211F1F]"
                >
                  Email address
                </label>

                <div
                  className={`group flex h-[52px] items-center gap-3 rounded-2xl border bg-white px-4 transition focus-within:border-[#211F1F] focus-within:ring-2 focus-within:ring-[#211F1F]/10 ${
                    errors.email && touched.email
                      ? "border-red-600"
                      : "border-[#CDCDCD]"
                  }`}
                >
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#767676] transition group-focus-within:text-[#211F1F]"
                  />

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(errors.email && touched.email)}
                    aria-describedby={
                      errors.email && touched.email
                        ? "login-email-error"
                        : undefined
                    }
                    required
                    disabled={busy}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-[#211F1F] outline-none placeholder:text-[#767676] disabled:opacity-60"
                  />
                </div>

                {errors.email && touched.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="mt-2 text-xs font-medium text-red-600"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-[#211F1F]"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#E60023] transition hover:text-[#AD081B] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E60023]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div
                  className={`group flex h-[52px] items-center gap-3 rounded-2xl border bg-white px-4 transition focus-within:border-[#211F1F] focus-within:ring-2 focus-within:ring-[#211F1F]/10 ${
                    errors.password && touched.password
                      ? "border-red-600"
                      : "border-[#CDCDCD]"
                  }`}
                >
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#767676] transition group-focus-within:text-[#211F1F]"
                  />

                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(errors.password && touched.password)}
                    aria-describedby={
                      errors.password && touched.password
                        ? "login-password-error"
                        : undefined
                    }
                    required
                    disabled={busy}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-[#211F1F] outline-none placeholder:text-[#767676] disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={busy}
                    className="shrink-0 rounded-full p-1 text-[#767676] transition hover:text-[#E60023] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E60023]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password && touched.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="mt-2 text-xs font-medium text-red-600"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="group mt-2 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#E60023] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#AD081B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E60023] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? "Signing you in..." : "Sign in"}</span>

                {loading ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                ) : (
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E5E5E5]" />

              <span className="text-[10px] font-semibold tracking-[0.12em] text-[#767676]">
                NEW HERE?
              </span>

              <div className="h-px flex-1 bg-[#E5E5E5]" />
            </div>

            <Link
              to="/register"
              className="flex min-h-[50px] w-full items-center justify-center rounded-full border border-[#CDCDCD] bg-white px-5 py-3 text-sm font-bold text-[#211F1F] transition hover:border-[#211F1F] hover:bg-[#F7F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#211F1F]"
            >
              Create an account
            </Link>

            <p className="mt-7 text-center text-[11px] leading-6 text-[#767676]">
              By continuing, you agree to use तस्बिरगंज respectfully and help
              keep our creative community welcoming.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E60023]" />

              <span className="text-[9px] font-semibold tracking-[0.16em] text-[#767676]">
                A SPACE FOR EVERY PERSPECTIVE
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
