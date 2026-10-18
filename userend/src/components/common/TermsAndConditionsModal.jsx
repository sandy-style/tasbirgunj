import { useEffect } from "react";
import { Check, ShieldCheck, X } from "lucide-react";

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  isDark = false,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colors = {
    modalBg: isDark ? "bg-[#181818]" : "bg-white",
    surface: isDark ? "bg-[#202020]" : "bg-[#F7F7F7]",
    textPrimary: isDark ? "text-[#F5F5F5]" : "text-[#1F1F1F]",
    textMuted: isDark ? "text-[#B5B5B5]" : "text-[#767676]",
    border: isDark ? "border-white/10" : "border-[#E5E5E5]",
    accentText: isDark ? "text-[#FF4B65]" : "text-[#E60023]",
    iconBg: isDark ? "bg-[#FF4B65]/10" : "bg-[#E60023]/[0.08]",
  };

  const termsSections = [
    {
      title: "Ownership & Copyright",
      content:
        "You retain full intellectual property rights and copyright to every photograph you publish on तस्बिरगंज. We never claim ownership of your work.",
    },
    {
      title: "Originality & Rights",
      content:
        "You affirm that you are the original photographer or hold the necessary rights, releases, and permissions from identifiable individuals captured in your photograph.",
    },
    {
      title: "Platform Display License",
      content:
        "By publishing, you grant तस्बिरगंज a non-exclusive, royalty-free license to host, display, and share your photograph within our community and discovery feeds, with attribution to your profile.",
    },
    {
      title: "Authentic Photography",
      content:
        "तस्बिरगंज is dedicated to genuine visual storytelling. Uploads must not include plagiarized imagery, misleading watermarks, automated spam, or defamatory content.",
    },
    {
      title: "Cultural & Ethical Respect",
      content:
        "Photographers are encouraged to respect local cultural traditions, wildlife habitats, private property, and personal boundaries across all locations captured.",
    },
  ];

  const handleAccept = () => {
    onAccept?.();
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        className={`relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${colors.modalBg} ${colors.border} ${colors.textPrimary}`}
      >
        {/* Pinterest-red accent */}
        <div className="h-1 w-full shrink-0 bg-[#E60023]" />

        {/* Header */}
        <header
          className={`flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4 sm:px-6 ${colors.border}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colors.iconBg} ${colors.accentText}`}
            >
              <ShieldCheck size={21} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h2
                id="terms-modal-title"
                className="text-sm font-bold tracking-tight sm:text-base"
              >
                Terms & Community Guidelines
              </h2>

              <p className={`mt-0.5 text-xs ${colors.textMuted}`}>
                तस्बिरगंज · Photographer Charter
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close terms dialog"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-neutral-500/10 active:scale-95 ${colors.textMuted}`}
          >
            <X size={19} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div>
            <p className={`text-sm leading-6 ${colors.textMuted}`}>
              Every photograph tells a story. These guidelines help protect
              photographers, respect subjects, and preserve the authenticity of
              our visual community.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E60023]" />
              <span className={`text-xs font-semibold ${colors.accentText}`}>
                Please review before publishing
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {termsSections.map((section, index) => (
              <article
                key={section.title}
                className={`rounded-2xl border p-4 transition-colors ${colors.surface} ${colors.border}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colors.iconBg} ${colors.accentText}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-5">
                      {section.title}
                    </h3>

                    <p
                      className={`mt-1.5 text-xs leading-6 sm:text-sm ${colors.textMuted}`}
                    >
                      {section.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className={`text-xs leading-5 ${colors.textMuted}`}>
            Last revised: October 2026. For questions about copyright or
            licensing, contact the तस्बिरगंज community support team.
          </p>
        </div>

        {/* Footer */}
        <footer
          className={`flex shrink-0 flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6 ${colors.border}`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`h-11 rounded-full px-5 text-sm font-semibold transition active:scale-[0.98] ${
              isDark
                ? "bg-white/[0.08] text-[#F5F5F5] hover:bg-white/[0.13]"
                : "bg-[#EFEFEF] text-[#1F1F1F] hover:bg-[#E5E5E5]"
            }`}
          >
            Close
          </button>

          {onAccept && (
            <button
              type="button"
              onClick={handleAccept}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#E60023] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C90020] active:scale-[0.98]"
            >
              <Check size={16} strokeWidth={2.5} />I Understand & Agree
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
