import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const Register = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Regular email/password registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || googleLoading) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!password) {
      toast.error("Please create a password.");
      return;
    }

    if (password.length < 8) {
      toast.error("Your password must contain at least 8 characters.");
      return;
    }

    if (password.length > 128) {
      toast.error("Your password must not exceed 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
        email: normalizedEmail,
        password,
      });

      const data = response?.data;

      if (data?.success !== true) {
        toast.error(data?.message || "Unable to create your account.");
        return;
      }

      toast.success(
        data.message || "Account created! Please verify your email.",
      );

      navigate("/verify-email", {
        state: { email: normalizedEmail },
        replace: true,
      });
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 429) {
        toast.error(message || "Too many attempts. Please try again later.");
      } else if (!error?.response) {
        toast.error(
          "Unable to connect to the server. Please check your connection.",
        );
      } else {
        toast.error(message || "Registration failed. Please try again.");
      }

      if (import.meta.env.DEV) {
        console.error("Registration error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google credential -> Express backend -> application JWT
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
          data?.message || "Google sign-up failed. Please try again.",
        );
        return;
      }

      // Use the same token key as the existing application.
      localStorage.setItem("token", data.token);

      toast.success(data.message || "Signed in with Google!");

      // Reload so AuthContext can initialize from the saved JWT.
      // Your protected routes/profile flow should then determine
      // whether the user needs to create a profile.
      window.location.assign("/");
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 429) {
        toast.error(message || "Too many attempts. Please try again later.");
      } else if (status === 409) {
        toast.error(
          message ||
            "This email is linked to a different account. Please sign in using your existing method.",
        );
      } else if (!error?.response) {
        toast.error(
          "Unable to connect to the server. Please check your connection.",
        );
      } else {
        toast.error(message || "Google sign-up failed. Please try again.");
      }

      if (import.meta.env.DEV) {
        console.error("Google sign-up error:", error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    toast.error("Google sign-up was cancelled or could not be completed.");
  };

  return (
    <main className="min-h-screen w-full bg-white font-['Inter',sans-serif] text-[#211F1F]">
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

          <div className="absolute bottom-9 left-10 right-10 z-10 xl:left-16 xl:right-16">
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
        </section>

        {/* Registration panel */}
        <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-14 sm:px-10 lg:px-12 lg:py-10 xl:px-20">
          <Link
            to="/"
            aria-label="Back to home"
            className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-[#767676] transition hover:text-[#E60023] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E60023] lg:hidden"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Home
          </Link>

          <div className="w-full max-w-[400px]">
            <Link
              to="/"
              className="mb-7 inline-flex items-center gap-2.5"
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
                Begin your journey
              </p>

              <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-[#211F1F] sm:text-5xl">
                Create your account.
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#767676]">
                Join a community inspired by the world around us.
              </p>
            </div>

            {/* Google sign-up */}
            <div
              className={`mb-5 flex min-h-[44px] w-full justify-center ${
                googleLoading || loading ? "pointer-events-none opacity-60" : ""
              }`}
              aria-busy={googleLoading}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                shape="pill"
                theme="outline"
                size="large"
                width="400"
                logo_alignment="left"
                useOneTap={false}
                click_listener={() => {
                  if (loading || googleLoading) {
                    return false;
                  }
                }}
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

            <div className="mb-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E5E5E5]" />
              <span className="text-[10px] font-semibold tracking-[0.12em] text-[#767676]">
                OR SIGN UP WITH EMAIL
              </span>
              <div className="h-px flex-1 bg-[#E5E5E5]" />
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-busy={loading}
              noValidate
            >
              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-sm font-semibold text-[#211F1F]"
                >
                  Email address
                </label>

                <div className="group flex h-[52px] items-center gap-3 rounded-2xl border border-[#CDCDCD] bg-white px-4 transition focus-within:border-[#211F1F] focus-within:ring-2 focus-within:ring-[#211F1F]/10">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#767676] transition group-focus-within:text-[#211F1F]"
                  />

                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading || googleLoading}
                    required
                    maxLength={254}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-[#211F1F] outline-none placeholder:text-[#767676] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-sm font-semibold text-[#211F1F]"
                >
                  Password
                </label>

                <div className="group flex h-[52px] items-center gap-3 rounded-2xl border border-[#CDCDCD] bg-white px-4 transition focus-within:border-[#211F1F] focus-within:ring-2 focus-within:ring-[#211F1F]/10">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#767676] transition group-focus-within:text-[#211F1F]"
                  />

                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading || googleLoading}
                    required
                    minLength={8}
                    maxLength={128}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-[#211F1F] outline-none placeholder:text-[#767676] disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="shrink-0 rounded-full p-1 text-[#767676] transition hover:text-[#E60023] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E60023]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={loading || googleLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="mb-2 block text-sm font-semibold text-[#211F1F]"
                >
                  Confirm password
                </label>

                <div className="group flex h-[52px] items-center gap-3 rounded-2xl border border-[#CDCDCD] bg-white px-4 transition focus-within:border-[#211F1F] focus-within:ring-2 focus-within:ring-[#211F1F]/10">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#767676] transition group-focus-within:text-[#211F1F]"
                  />

                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={loading || googleLoading}
                    required
                    maxLength={128}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-[#211F1F] outline-none placeholder:text-[#767676] disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="shrink-0 rounded-full p-1 text-[#767676] transition hover:text-[#E60023] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E60023]"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                    disabled={loading || googleLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <p className="pt-1 text-xs leading-5 text-[#767676]">
                By creating an account, you agree to use तस्बिरगंज respectfully
                and share content you have the right to post.
              </p>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="group mt-2 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#E60023] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#AD081B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E60023] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {loading ? "Creating account..." : "Create account"}
                </span>

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
                ALREADY A MEMBER?
              </span>
              <div className="h-px flex-1 bg-[#E5E5E5]" />
            </div>

            <Link
              to="/login"
              className="flex min-h-[50px] w-full items-center justify-center rounded-full border border-[#CDCDCD] bg-white px-5 py-3 text-sm font-bold text-[#211F1F] transition hover:border-[#211F1F] hover:bg-[#F7F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#211F1F]"
            >
              Sign in
            </Link>

            <p className="mt-7 text-center text-[11px] leading-6 text-[#767676]">
              Made for the moments that matter.
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

export default Register;
