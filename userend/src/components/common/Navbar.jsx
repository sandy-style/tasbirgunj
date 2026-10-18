import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ImagePlus,
  LogOut,
  Menu,
  Plus,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import CreateProfile from "../profile/CreateProfile";

const serif = "font-['Cormorant_Garamond',Georgia,serif]";
const brandFont = "font-['Kalam',cursive]";

const navigation = [
  { label: "Home", path: "/" },
  { label: "Explore", path: "/explore" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

const FOCUSABLE_ELEMENTS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function ProfileAvatar({ avatar, displayName, compact = false }) {
  const size = compact ? "h-9 w-9" : "h-11 w-11";
  const initial = displayName?.charAt(0)?.toUpperCase() || "U";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        loading="lazy"
        className={`${size} shrink-0 rounded-full border border-[#E5E5E5] object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] font-semibold text-[#333333] ring-1 ring-[#E5E5E5]`}
    >
      {initial}
    </span>
  );
}

export default function Navbar() {
  const {
    user,
    isAuthenticated,
    logout,
    profile,
    profileStatus,
    profileError,
    refreshProfile,
  } = useAuth();

  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);

  const mobileNavigationRef = useRef(null);
  const menuToggleRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const dialogRef = useRef(null);
  const dialogCloseRef = useRef(null);

  const isCheckingProfile =
    isAuthenticated &&
    (profileStatus === "loading" || profileStatus === "idle");

  const hasProfile =
    isAuthenticated && profileStatus === "exists" && Boolean(profile);

  const profileMissing = isAuthenticated && profileStatus === "missing";

  const avatar =
    profile?.profileImage ||
    user?.profileImage ||
    user?.avatar ||
    user?.profilePicture ||
    user?.image ||
    "";

  const displayName =
    profile?.username ||
    profile?.name ||
    user?.username ||
    user?.name ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "Your profile";

  const closeMenus = useCallback(() => {
    if (mobileNavigationRef.current?.contains(document.activeElement)) {
      menuToggleRef.current?.focus();
    }

    setMenuOpen(false);
  }, []);

  const closeCreateProfile = useCallback(() => {
    setCreateProfileOpen(false);
  }, []);

  const handleOpenCreateProfile = useCallback(
    (event) => {
      if (!isAuthenticated) return;

      profileTriggerRef.current = event.currentTarget;

      closeMenus();
      setCreateProfileOpen(true);
    },
    [closeMenus, isAuthenticated],
  );

  const handleProfileCreated = useCallback(async () => {
    setCreateProfileOpen(false);

    try {
      await refreshProfile();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Unable to refresh profile:", error);
      }
    }
  }, [refreshProfile]);

  const handleLogout = useCallback(() => {
    closeMenus();
    setCreateProfileOpen(false);
    logout();
  }, [closeMenus, logout]);

  const handleNavigation = useCallback(() => {
    closeMenus();
  }, [closeMenus]);

  const handleProfileAction = useCallback(async () => {
    closeMenus();

    try {
      await refreshProfile();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Unable to refresh profile:", error);
      }
    }
  }, [closeMenus, refreshProfile]);

  // Close the mobile menu when the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Handle Escape for the mobile menu and profile dialog.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (createProfileOpen) {
        event.preventDefault();
        closeCreateProfile();
      } else if (menuOpen) {
        event.preventDefault();
        closeMenus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [createProfileOpen, menuOpen, closeCreateProfile, closeMenus]);

  // Close overlays after logout.
  useEffect(() => {
    if (!isAuthenticated) {
      setCreateProfileOpen(false);
      closeMenus();
    }
  }, [isAuthenticated, closeMenus]);

  // Focus the modal when opened and restore focus when closed.
  useEffect(() => {
    if (createProfileOpen) {
      const frame = window.requestAnimationFrame(() => {
        dialogCloseRef.current?.focus();
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (profileTriggerRef.current?.isConnected) {
      profileTriggerRef.current.focus();
    }
  }, [createProfileOpen]);

  // Prevent background scrolling while the modal is open.
  useEffect(() => {
    if (!createProfileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [createProfileOpen]);

  // Keep keyboard focus inside the profile modal.
  const handleDialogKeyDown = useCallback((event) => {
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll(FOCUSABLE_ELEMENTS),
    ).filter(
      (element) =>
        !element.hasAttribute("hidden") &&
        element.getAttribute("aria-hidden") !== "true" &&
        element.getClientRects().length > 0,
    );

    if (!focusable.length) {
      event.preventDefault();
      dialogCloseRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !dialog.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  // Pinterest-inspired light theme.
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  const iconButtonClass = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#333333] transition-colors hover:bg-[#F2F2F2] ${focusRing}`;

  const actionButtonClass = `inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#E60023] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#AD081B] ${focusRing}`;

  const outlineButtonClass = `inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-medium text-[#333333] transition-colors hover:bg-[#F7F7F7] ${focusRing}`;

  const logoutButtonClass = `inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#555555] transition-colors hover:bg-[#F2F2F2] hover:text-[#111111] ${focusRing}`;

  const navLinkClass = ({ isActive }) =>
    `group relative inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-200 ${focusRing} ${
      isActive ? "text-[#E60023]" : "text-[#333333] hover:text-[#E60023]"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `group flex min-h-14 items-center justify-between gap-3 border-b border-[#E5E5E5] py-3 transition-colors duration-200 ${focusRing} ${
      isActive ? "text-[#E60023]" : "text-[#111111] hover:text-[#E60023]"
    }`;

  const renderProfileAction = (mobile = false) => {
    if (isCheckingProfile) {
      return (
        <button
          type="button"
          disabled
          className={mobile ? iconButtonClass : outlineButtonClass}
          aria-label="Checking profile"
          title="Checking profile"
        >
          <UserRound size={mobile ? 18 : 16} className="animate-pulse" />
          {!mobile && <span>Checking profile</span>}
        </button>
      );
    }

    if (hasProfile) {
      return mobile ? (
        <Link
          to="/create-post"
          onClick={handleNavigation}
          className={iconButtonClass}
          aria-label="Create a post"
          title="Create a post"
        >
          <Plus size={21} />
        </Link>
      ) : (
        <Link
          to="/create-post"
          onClick={handleNavigation}
          className={actionButtonClass}
        >
          <Plus size={17} strokeWidth={2.3} />
          <span>Create post</span>
        </Link>
      );
    }

    if (profileMissing) {
      return (
        <button
          type="button"
          onClick={handleOpenCreateProfile}
          className={mobile ? iconButtonClass : actionButtonClass}
          aria-label={mobile ? "Create profile" : undefined}
          title={mobile ? "Create profile" : undefined}
        >
          <UserRound size={mobile ? 18 : 17} />
          {!mobile && <span>Create profile</span>}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleProfileAction}
        className={mobile ? iconButtonClass : outlineButtonClass}
        aria-label={mobile ? "Retry profile check" : undefined}
        title={profileError || "Retry profile check"}
      >
        <UserRound size={mobile ? 18 : 17} />
        {!mobile && <span>Retry profile check</span>}
      </button>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E5] bg-white/95 text-[#111111] backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6 lg:gap-8 lg:px-8"
        >
          {/* Handwritten brand wordmark */}
          <Link
            to="/"
            onClick={handleNavigation}
            aria-label="तस्बिरगंज home"
            className={`group flex shrink-0 items-center rounded-full py-1 ${focusRing}`}
          >
            <span className="flex flex-col">
              <span
                lang="ne"
                className={`${brandFont} text-[30px] font-normal leading-[1.15] tracking-normal text-[#111111] transition-colors duration-200 group-hover:text-[#E60023] sm:text-[34px]`}
              >
                तस्बिरगंज
              </span>

              <span
                className={`${serif} -mt-0.5 hidden text-[14px] font-medium italic leading-none text-[#767676] sm:block`}
              >
                A world through your lens
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {navigation.map(({ label, path }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                onClick={handleNavigation}
                className={navLinkClass}
              >
                {({ isActive }) => (
                  <>
                    <span>{label}</span>
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-4 bottom-0.5 h-[2px] origin-left rounded-full bg-[#E60023] transition-transform duration-200 ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-50"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <>
                {renderProfileAction(false)}

                {hasProfile && (
                  <Link
                    to="/profile"
                    onClick={handleNavigation}
                    className={`rounded-full p-0.5 transition-opacity hover:opacity-80 ${focusRing}`}
                    aria-label={`View ${displayName}'s profile`}
                    title="My profile"
                  >
                    <ProfileAvatar
                      avatar={avatar}
                      displayName={displayName}
                      compact
                    />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className={logoutButtonClass}
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <Link
                to="/register"
                onClick={handleNavigation}
                className={actionButtonClass}
              >
                Join तस्बिरगंज
                <ArrowUpRight size={17} />
              </Link>
            )}
          </div>

          {/* Mobile and tablet actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:hidden">
            {isAuthenticated && hasProfile && (
              <Link
                to="/profile"
                onClick={handleNavigation}
                className={`rounded-full p-0.5 transition-opacity hover:opacity-80 ${focusRing}`}
                aria-label="My profile"
                title="My profile"
              >
                <ProfileAvatar
                  avatar={avatar}
                  displayName={displayName}
                  compact
                />
              </Link>
            )}

            {isAuthenticated && renderProfileAction(true)}

            <button
              ref={menuToggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={iconButtonClass}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="tg-mobile-navigation"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile navigation */}
        <div
          ref={mobileNavigationRef}
          id="tg-mobile-navigation"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out lg:hidden ${
            menuOpen
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-[#E5E5E5] bg-white px-5 pb-6 pt-5 sm:px-6">
              <p className={`${serif} m-0 text-[17px] italic text-[#767676]`}>
                Discover stories through photography.
              </p>

              <div className="mt-2 sm:grid sm:grid-cols-2 sm:gap-x-8">
                {navigation.map(({ label, path }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === "/"}
                    onClick={handleNavigation}
                    className={mobileLinkClass}
                  >
                    <span
                      className={`${serif} text-[30px] font-medium leading-none tracking-[-0.03em]`}
                    >
                      {label}
                    </span>

                    <ArrowRight
                      size={17}
                      className="text-[#E60023] opacity-60 transition duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                    />
                  </NavLink>
                ))}
              </div>

              {isAuthenticated ? (
                <div className="mt-5 space-y-3">
                  {hasProfile && (
                    <Link
                      to="/profile"
                      onClick={handleNavigation}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E5E5E5] bg-white p-3 transition-colors hover:bg-[#F7F7F7]"
                    >
                      <ProfileAvatar
                        avatar={avatar}
                        displayName={displayName}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#111111]">
                          {displayName}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#767676]">
                          View your profile
                        </span>
                      </span>

                      <ArrowUpRight
                        size={17}
                        className="shrink-0 text-[#E60023]"
                      />
                    </Link>
                  )}

                  {!hasProfile && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#E5E5E5] bg-white p-3">
                      <UserRound
                        size={19}
                        className="shrink-0 text-[#E60023]"
                      />

                      <p className="m-0 min-w-0 flex-1 text-sm text-[#767676]">
                        {isCheckingProfile
                          ? "Checking your profile..."
                          : profileMissing
                            ? "Create a profile to start sharing photographs."
                            : "We couldn't check your profile."}
                      </p>
                    </div>
                  )}

                  {isCheckingProfile ? (
                    <div className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#E5E5E5] px-4 py-3 text-sm text-[#767676]">
                      <UserRound size={17} className="animate-pulse" />
                      Checking profile...
                    </div>
                  ) : hasProfile ? (
                    <Link
                      to="/create-post"
                      onClick={handleNavigation}
                      className={`${actionButtonClass} w-full`}
                    >
                      <ImagePlus size={17} />
                      Create post
                    </Link>
                  ) : profileMissing ? (
                    <button
                      type="button"
                      onClick={handleOpenCreateProfile}
                      className={`${actionButtonClass} w-full`}
                    >
                      <UserRound size={17} />
                      Create a profile
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProfileAction}
                      className={`${outlineButtonClass} w-full`}
                    >
                      <UserRound size={17} />
                      Retry profile check
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`${logoutButtonClass} w-full`}
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              ) : (
                <Link
                  to="/register"
                  onClick={handleNavigation}
                  className={`${actionButtonClass} mt-5 w-full`}
                >
                  Join तस्बिरगंज
                  <ArrowUpRight size={17} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Create Profile modal */}
      {createProfileOpen && isAuthenticated && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateProfile();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Create your profile"
            onKeyDown={handleDialogKeyDown}
            className="my-auto w-full max-w-lg"
          >
            <CreateProfile
              onClose={closeCreateProfile}
              onSuccess={handleProfileCreated}
              closeButtonRef={dialogCloseRef}
            />
          </div>
        </div>
      )}
    </>
  );
}
