  import { Link } from "react-router-dom";
import { ArrowUpRight, Mail } from "lucide-react";
import { useApp } from "../../context/AppContext";

const Footer = () => {
  const { isDark } = useApp();
  const token = localStorage.getItem("token");
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: "Home", to: "/" },
    { label: "Explore", to: "/explore" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
  ];

  const theme = isDark
    ? {
        background: "bg-[#121212]",
        text: "text-[#F5F5F5]",
        body: "text-[#A3A3A3]",
        muted: "text-[#777777]",
        border: "border-white/[0.10]",
        hover: "hover:text-[#FF4B65]",
        button: "bg-[#E60023] text-white hover:bg-[#C90020]",
      }
    : {
        background: "bg-white",
        text: "text-[#1F1F1F]",
        body: "text-[#666666]",
        muted: "text-[#909090]",
        border: "border-[#EAEAEA]",
        hover: "hover:text-[#E60023]",
        button: "bg-[#E60023] text-white hover:bg-[#C90020]",
      };

  return (
    <footer
      className={`${theme.background} ${theme.text} border-t ${theme.border} transition-colors duration-300`}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        {/* Main footer */}
        <div className="grid gap-12 py-12 sm:py-14 lg:grid-cols-[1.4fr_0.7fr_1fr] lg:gap-20 lg:py-16">
          {/* Brand */}
          <div>
            <Link to="/" aria-label="तस्बिरगंज home" className="inline-block">
              <span
                className="text-3xl tracking-tight sm:text-[2.1rem]"
                style={{ fontFamily: "'Rozha One', serif" }}
              >
                तस्बिरगंज
              </span>
            </Link>

            <p className={`mt-4 max-w-sm text-sm leading-7 ${theme.body}`}>
              The world, through your lens. A place for photographs,
              perspectives, and stories waiting to be discovered.
            </p>

            <a
              href="mailto:tasbirgunj@gmail.com"
              className={`mt-5 inline-flex items-center gap-2 text-sm transition-colors ${theme.body} ${theme.hover}`}
            >
              <Mail size={15} strokeWidth={1.7} />
              tasbirgunj@gmail.com
              <ArrowUpRight size={13} />
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h3
              className={`mb-5 text-xs font-semibold uppercase tracking-[0.16em] ${theme.muted}`}
            >
              Explore
            </h3>

            <nav
              aria-label="Footer navigation"
              className="flex flex-col items-start gap-3.5"
            >
              {footerLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm transition-colors ${theme.body} ${theme.hover}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Call to action */}
          <div>
            <h2
              className="max-w-sm text-4xl leading-[1.05] tracking-tight sm:text-[2.8rem]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              See the world.
              <span className="block italic text-[#E60023]">
                Share your view.
              </span>
            </h2>

            <p className={`mt-4 max-w-xs text-sm leading-6 ${theme.body}`}>
              {token
                ? "Your next photograph deserves to be seen."
                : "Discover a community shaped by different perspectives."}
            </p>

            <Link
              to={token ? "/create-post" : "/register"}
              className={`mt-6 inline-flex min-h-11 items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${theme.button}`}
            >
              {token ? "Share a photograph" : "Join the community"}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`flex flex-col gap-3 border-t ${theme.border} py-5 sm:flex-row sm:items-center sm:justify-between`}
        >
          <p className={`text-xs ${theme.muted}`}>
            © {currentYear} तस्बिरगंज. All rights reserved.
          </p>

          <p className={`text-xs ${theme.muted}`}>
            Made for the love of seeing things differently.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
