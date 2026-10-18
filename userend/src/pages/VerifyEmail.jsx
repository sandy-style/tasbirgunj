import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

import cover from "../assets/tasbirgunj-cover.png";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { validateEmail, validateVerificationCode } from "../utils/validators";
import useAuth from "../hooks/useAuth";
import CreateProfile from "../components/profile/CreateProfile";

const RESEND_COOLDOWN = 120;

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, refreshProfile } = useAuth();

  const registeredEmail = location.state?.email;

  const email =
    typeof registeredEmail === "string"
      ? registeredEmail.trim().toLowerCase()
      : "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [profileStep, setProfileStep] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (!email || !validateEmail(email)) {
      toast.error("Please register first to verify your email.");
      navigate("/register", { replace: true });
      return;
    }

    inputRef.current?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);

    setOtp(value);

    if (otpError) {
      setOtpError("");
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!email || !validateEmail(email)) {
      toast.error("Registered email is missing. Please register again.");
      navigate("/register", { replace: true });
      return;
    }

    if (!validateVerificationCode(otp)) {
      setOtpError("Please enter the complete 6-digit code.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY, {
        email,
        verificationCode: otp,
      });

      const data = response?.data;

      if (!data?.success) {
        toast.error(data?.message || "Email verification failed.");
        return;
      }

      if (!data.token) {
        toast.error(
          "Your email was verified, but no authentication token was returned. Please sign in.",
        );

        navigate("/login", {
          replace: true,
          state: { email },
        });

        return;
      }

      login(data.token, data.user ?? data.userData ?? null);
      setProfileStep(true);

      toast.success("Email verified! Let's create your profile.");
    } catch (error) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        "Unable to verify your email. Please try again.";

      if (status === 429) {
        toast.error(message);
      } else if (!error?.response) {
        toast.error("Unable to connect to the server.");
      } else {
        toast.error(message);
      }

      if (import.meta.env.DEV) {
        console.error("Email verification error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !validateEmail(email)) {
      toast.error("Registered email is missing. Please register again.");
      navigate("/register", { replace: true });
      return;
    }

    if (countdown > 0 || resending || profileStep || loading) return;

    setResending(true);

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        email,
      });

      const data = response?.data;

      if (!data?.success) {
        toast.error(data?.message || "Unable to resend the code.");
        return;
      }

      setOtp("");
      setOtpError("");
      setCountdown(RESEND_COOLDOWN);

      toast.success(data.message || "A new verification code has been sent.");
      inputRef.current?.focus();
    } catch (error) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        "Unable to resend the verification code.";

      if (status === 429) {
        toast.error(message);
      } else if (!error?.response) {
        toast.error("Unable to connect to the server.");
      } else {
        toast.error(message);
      }

      if (import.meta.env.DEV) {
        console.error("Resend verification error:", error);
      }
    } finally {
      setResending(false);
    }
  };

  const handleProfileCreated = async () => {
    try {
      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Could not refresh profile:", error);
      }
    }

    navigate("/", { replace: true });
  };

  const handleCloseProfile = () => {
    navigate("/", { replace: true });
  };

  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  if (profileStep) {
    return (
      <CreateProfile
        isOpen={profileStep}
        open={profileStep}
        onClose={handleCloseProfile}
        onCreated={handleProfileCreated}
        onProfileCreated={handleProfileCreated}
        onSuccess={handleProfileCreated}
      />
    );
  }

  return (
    <main className="min-h-screen w-full bg-white font-['Inter',sans-serif] text-[#211F1F]">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Full-height photography panel — matches Register */}
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

        {/* Verification panel — same dimensions and styling as Register */}
        <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-14 sm:px-10 lg:px-12 lg:py-10 xl:px-20">
          {/* Mobile home link */}
          <Link
            to="/"
            aria-label="Back to home"
            className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-[#767676] transition hover:text-[#E60023] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E60023] lg:hidden"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Home
          </Link>

          <div className="w-full max-w-[400px]">
            {/* Brand wordmark */}
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

            {/* Heading */}
            <div className="mb-7">
              <p className="mb-3 text-xs font-bold tracking-[0.16em] text-[#E60023] uppercase">
                One last step
              </p>

              <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-[#211F1F] sm:text-5xl">
                Verify your email.
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#767676]">
                You're almost there. Confirm your email address to finish
                creating your तस्बिरगंज account.
              </p>
            </div>

            <form
              onSubmit={handleVerify}
              className="space-y-4"
              aria-busy={loading}
              noValidate
            >
              {/* Registered email */}
              <div>
                <label
                  htmlFor="registered-email"
                  className="mb-2 block text-sm font-semibold text-[#211F1F]"
                >
                  Email address
                </label>

                <div className="group flex h-[52px] items-center gap-3 rounded-2xl border border-[#CDCDCD] bg-[#F7F7F7] px-4 transition">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#767676]"
                  />

                  <input
                    id="registered-email"
                    name="email"
                    type="email"
                    value={email}
                    readOnly
                    aria-readonly="true"
                    className="h-full w-full min-w-0 cursor-not-allowed bg-transparent text-sm text-[#555555] outline-none"
                  />

                  <span
                    title="Email address confirmed"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E7F6EA] text-[#238443]"
                  >
                    <Check size={13} aria-hidden="true" />
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#767676]">
                  This is the address you used during registration.
                </p>
              </div>

              {/* Verification code */}
              <div>
                <label
                  htmlFor="verification-code"
                  className="mb-2 block text-sm font-semibold text-[#211F1F]"
                >
                  Six-digit verification code
                </label>

                <div className="group flex h-[58px] items-center gap-3 rounded-2xl border border-[#CDCDCD] bg-white px-4 transition focus-within:border-[#211F1F] focus-within:ring-2 focus-within:ring-[#211F1F]/10">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#767676] transition group-focus-within:text-[#211F1F]"
                  />

                  <input
                    ref={inputRef}
                    id="verification-code"
                    name="verificationCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="000000"
                    disabled={loading}
                    required
                    aria-invalid={Boolean(otpError)}
                    aria-describedby={
                      otpError ? "verification-code-error" : "otp-hint"
                    }
                    className="h-full w-full min-w-0 bg-transparent text-center text-xl font-semibold tracking-[0.45em] text-[#211F1F] outline-none placeholder:text-[#CDCDCD] disabled:opacity-60"
                  />
                </div>

                {otpError ? (
                  <p
                    id="verification-code-error"
                    role="alert"
                    className="mt-2 text-xs text-red-600"
                  >
                    {otpError}
                  </p>
                ) : (
                  <p
                    id="otp-hint"
                    className="mt-2 text-xs leading-5 text-[#767676]"
                  >
                    Check your inbox and spam folder for the code.
                  </p>
                )}
              </div>

              {/* Primary action */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#E60023] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#AD081B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E60023] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? "Verifying email..." : "Verify email"}</span>

                {loading ? (
                  <LoaderCircle
                    size={17}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>

              {/* Resend verification code */}
              <div className="pt-2">
                <p className="text-center text-xs leading-6 text-[#767676]">
                  Didn't receive the code?
                </p>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0 || loading}
                  className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[#CDCDCD] bg-white px-5 py-3 text-sm font-bold text-[#211F1F] transition hover:border-[#211F1F] hover:bg-[#F7F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#211F1F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending ? (
                    <LoaderCircle
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw size={15} aria-hidden="true" />
                  )}

                  <span>
                    {resending
                      ? "Sending verification code..."
                      : countdown > 0
                        ? `Resend code in ${formatCountdown(countdown)}`
                        : "Resend verification code"}
                  </span>
                </button>
              </div>
            </form>

            {/* Security note */}
            <div className="mt-7 flex items-center justify-center gap-2 text-center">
              <ShieldCheck
                size={15}
                aria-hidden="true"
                className="shrink-0 text-[#E60023]"
              />

              <p className="text-[11px] leading-5 text-[#767676]">
                Your email helps keep your account secure.
              </p>
            </div>

            {/* Registration navigation */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E5E5E5]" />

              <span className="text-[10px] font-semibold tracking-[0.12em] text-[#767676]">
                WRONG EMAIL?
              </span>

              <div className="h-px flex-1 bg-[#E5E5E5]" />
            </div>

            <Link
              to="/register"
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-[#CDCDCD] bg-white px-5 py-3 text-sm font-bold text-[#211F1F] transition hover:border-[#211F1F] hover:bg-[#F7F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#211F1F]"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to registration
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

export default VerifyEmail;
