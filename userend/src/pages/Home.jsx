import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import coverImage from "../assets/tasbirgunj-cover.png";
import himalayas from "../assets/himalayas.png";
// High-resolution fallback cover in case the local asset is missing or resolving
const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=2400&q=85";

// Curated photography frames with distinct right-anchored offsets and metadata
const sceneryCards = [
  {
    id: "01",
    title: "The Himalayas",
    nepaliTitle: "हिमालको सास",
    location: "Annapurna Sanctuary",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85",
    top: "3%",
    rightOffset: "12px",
    angle: "-5deg",
  },
  {
    id: "02",
    title: "Into the Wild",
    nepaliTitle: "जङ्गली संसार",
    location: "Chitwan Woodlands",
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=85",
    top: "21%",
    rightOffset: "36px",
    angle: "4deg",
  },
  {
    id: "03",
    title: "Quiet Horizons",
    nepaliTitle: "शान्त क्षितिज",
    location: "Phewa Waters",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=85",
    top: "39%",
    rightOffset: "16px",
    angle: "-3deg",
  },
  {
    id: "04",
    title: "Sacred Architecture",
    nepaliTitle: "पवित्र सम्पदा",
    location: "Bhaktapur Durbar",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=85",
    top: "57%",
    rightOffset: "40px",
    angle: "5deg",
  },
  {
    id: "05",
    title: "Forest Stories",
    nepaliTitle: "वनको सुसेली",
    location: "Shivapuri Ridge",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=85",
    top: "75%",
    rightOffset: "20px",
    angle: "-4deg",
  },
];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className={`relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#181d1e] text-white select-none ${
        loaded ? "hero-loaded" : ""
      }`}
    >
      <style>{`
        @keyframes heroFade {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes backgroundFade {
          from { opacity: .6; transform: scale(1.08) translateX(-1%); }
          to { opacity: 1; transform: scale(1.05) translateX(0); }
        }

        .hero-background {
          animation: backgroundFade 1.6s ease-out both;
          transform-origin: center;
        }

        .hero-copy {
          opacity: 0;
        }

        .hero-loaded .hero-copy {
          animation: heroFade .85s cubic-bezier(.22, 1, .36, 1) forwards;
        }

        .hero-loaded .copy-one { animation-delay: .12s; }
        .hero-loaded .copy-two { animation-delay: .25s; }
        .hero-loaded .copy-three { animation-delay: .4s; }
        .hero-loaded .copy-four { animation-delay: .55s; }

        /* Photography gallery card styling */
        .photo-card {
          opacity: 0;
          animation: cardEntrance .85s cubic-bezier(.22, 1, .36, 1) var(--delay) forwards;
          transform-origin: center right;
          filter: grayscale(1);
          transition:
            filter .5s ease,
            opacity .45s ease,
            transform .55s cubic-bezier(.22, 1, .36, 1);
          will-change: transform, filter, opacity;
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translate3d(24px, 12px, 0);
          }
          to {
            opacity: .82;
            transform: translate3d(0, 0, 0);
          }
        }

        .photo-card:hover,
        .photo-card:focus-visible,
        .photo-card.is-active {
          filter: grayscale(0);
          opacity: 1;
        }

        .photo-card .photo-img {
          transition: transform .65s cubic-bezier(.22, 1, .36, 1);
        }

        .photo-card:hover .photo-img,
        .photo-card:focus-visible .photo-img,
        .photo-card.is-active .photo-img {
          transform: scale(1.08);
        }

        .photo-card:focus-visible {
          outline: 2px solid #F0C49A;
          outline-offset: 4px;
        }

        /* Hide scrollbars on mobile horizontal rail */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-background,
          .hero-loaded .hero-copy,
          .photo-card {
            animation: none !important;
            opacity: 1 !important;
          }

          .photo-card,
          .photo-card .photo-img {
            transition: none !important;
          }
        }
          @keyframes mobileCarousel {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-50% - 6px));
  }
}

.mobile-carousel-track {
  width: max-content;
  animation: mobileCarousel 30s linear infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-carousel-track {
    animation: none;
  }
}
      `}</style>
      {/* Hero background artwork with high-res fallback */}
      <img
        src={coverImage || FALLBACK_COVER}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK_COVER;
        }}
        alt="Tasbirgunj photography and Nepali cultural landscape"
        fetchPriority="high"
        decoding="async"
        className="hero-background absolute inset-0 h-full w-full object-cover"
      />
      {/* Cinematic gradient overlays for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#121617]/90 via-[#121617]/55 to-[#121617]/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#121617]/80 via-transparent to-[#121617]/25" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#121617]/95 via-[#121617]/50 to-transparent" />
      {/* Hero copy container */}
      <section className="relative z-10 flex h-full items-center px-6 sm:px-12 md:px-14 lg:px-[8%] xl:px-[9%]">
        <div className="w-full max-w-[620px] lg:max-w-[680px] xl:max-w-[760px] -translate-y-8 sm:-translate-y-6 md:-translate-y-4">
          <p className="hero-copy copy-one mb-4 sm:mb-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75 sm:text-xs">
            <span className="mr-2 text-[#F0C49A]">●</span>A home for every
            perspective
          </p>
          <h1
            lang="ne"
            className="hero-copy copy-two mb-3 sm:mb-5 w-fit max-w-full pb-[0.08em] pr-[0.1em] text-[clamp(3.8rem,9vw,8.2rem)] font-normal leading-[1.18] text-[#FFF9F0]"
            style={{
              fontFamily:
                '"AMS Kashifont", "Tiro Devanagari Nepali", "Noto Serif Devanagari", serif',
              textShadow: "0 4px 35px rgba(0,0,0,0.35)",
            }}
          >
            तस्बिरगंज
          </h1>
          <h2 className="hero-copy copy-three max-w-[580px] font-serif text-[clamp(1.75rem,3.8vw,2.85rem)] leading-[1.15] tracking-[-0.03em] text-[#F8F5EE]">
            The world, through{" "}
            <span className="italic text-[#F0C49A]">your lens.</span>
          </h2>
          <p className="hero-copy copy-three mt-4 sm:mt-5 max-w-[460px] text-xs leading-6 sm:text-base sm:leading-7 text-white/80">
            A moment. A feeling. A different perspective. Discover extraordinary
            photographs and share the world as you see it.
          </p>

          <div className="hero-copy copy-four mt-7 sm:mt-9">
            <Link
              to="/explore"
              className="group relative inline-flex items-center gap-5 overflow-hidden rounded-2xl border border-white/35 bg-white/[0.10] px-7 py-4 text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 hover:border-white/60 hover:bg-white/[0.17] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:gap-6 sm:px-9 sm:py-5"
            >
              {/* Subtle glass highlight */}
              <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

              {/* Elegant text */}
              <span className="relative flex flex-col items-start gap-1.5">
                <span
                  className="text-[23px] leading-tight tracking-wide text-white drop-shadow-sm sm:text-[28px]"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  Explore तस्बिरगंज
                </span>

                <span
                  className="text-[9px] font-medium uppercase tracking-[0.24em] text-white/75 sm:text-[10px]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  A world through the lens
                </span>
              </span>

              {/* Small decorative accent */}
              <span className="relative ml-1 h-8 w-px bg-gradient-to-b from-transparent via-white/60 to-transparent transition-all duration-500 group-hover:via-white sm:h-10" />
            </Link>
          </div>
        </div>
      </section>
      {/* ==================================================================== */}
      {/* DESKTOP & LARGE SCREENS: Farthest Right Vertical Cascading Gallery   */}
      {/* ==================================================================== */}
      <aside
        aria-label="Curated photography gallery"
        className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden md:block w-[180px] lg:w-[220px] xl:w-[260px] 2xl:w-[280px]"
        onMouseLeave={() => setHoveredCard(null)}
      >
        {sceneryCards.map((card, index) => {
          const active = hoveredCard === index;
          const anotherActive = hoveredCard !== null;

          let shiftX = 0;
          let shiftY = 0;
          let scale = 1;

          if (anotherActive) {
            if (active) {
              shiftX = -40; // Glides inward from the far right edge
              shiftY = -2;
              scale = 1.1;
            } else {
              shiftX = 12; // Inactive cards step back
              scale = 0.94;
            }
          }

          return (
            <article
              key={card.id}
              role="button"
              tabIndex={0}
              aria-label={`${card.title} - ${card.location}`}
              aria-pressed={active}
              onMouseEnter={() => setHoveredCard(index)}
              onFocus={() => setHoveredCard(index)}
              onBlur={(e) => {
                if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                  setHoveredCard(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setHoveredCard((current) =>
                    current === index ? null : index,
                  );
                }
              }}
              onClick={() =>
                setHoveredCard((current) => (current === index ? null : index))
              }
              className={`photo-card pointer-events-auto absolute cursor-pointer rounded-[11px] sm:rounded-[14px] ${
                active ? "is-active" : ""
              } w-[95px] lg:w-[120px] xl:w-[140px] 2xl:w-[155px]`}
              style={{
                "--delay": `${220 + index * 100}ms`,
                top: card.top,
                right: card.rightOffset, // Pinned to the farthest right
                zIndex: active ? 100 : index + 1,
                transform: `
                  translate3d(${shiftX}px, ${shiftY}px, 0)
                  rotate(${active ? 0 : card.angle})
                  scale(${scale})
                `,
              }}
            >
              {/* Floating editorial caption badge on hover */}
              <div
                className={`pointer-events-none absolute right-[108%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/20 bg-[#161b1c]/90 px-3.5 py-2 text-left shadow-2xl backdrop-blur-md transition-all duration-300 ${
                  active
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-3 pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-[#F0C49A]">
                    {card.id}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  <p className="text-xs font-medium text-white tracking-wide">
                    {card.title}
                  </p>
                </div>
                <p className="text-[10px] text-white/60 tracking-wider mt-0.5">
                  {card.location}
                </p>
              </div>

              {/* Photo thumbnail */}
              <div className="aspect-[3/4] overflow-hidden rounded-[11px] sm:rounded-[14px] border border-white/15 bg-[#121617] shadow-xl shadow-black/40">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  className="photo-img h-full w-full object-cover"
                />
              </div>
            </article>
          );
        })}
      </aside>
      {/* ==================================================================== */}
      {/* MOBILE & COMPACT SCREENS: Horizontal Interactive Gallery Rail         */}
      {/* ==================================================================== */}
      ```jsx
      {/* MOBILE: Infinite Photography Carousel */}
      <section
        aria-label="Photography collection"
        className="absolute bottom-16 sm:bottom-20 left-0 right-0 z-20 md:hidden overflow-hidden"
      >
        <div className="overflow-hidden py-2">
          <div className="mobile-carousel-track flex w-max gap-3">
            {/* Duplicate the cards for a seamless loop */}
            {[...sceneryCards, ...sceneryCards].map((card, index) => (
              <article
                key={`${card.id}-${index}`}
                className="relative flex-shrink-0 overflow-hidden rounded-[12px] border border-white/20 w-[84px] sm:w-[98px] aspect-[3/4]"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  className="h-full w-full object-cover"
                />
              </article>
            ))}
          </div>
        </div>
      </section>
      ```
      {/* Footer signature */}
      <div className="pointer-events-none absolute bottom-5 sm:bottom-7 left-6 sm:left-12 lg:left-[9%] z-10">
        <div className="flex flex-col items-start">
          <p
            lang="ne"
            className="text-sm sm:text-base tracking-wide -rotate-3 origin-left"
            style={{
              fontFamily:
                '"AMS Kashifont", "Tiro Devanagari Nepali", "Noto Serif Devanagari", serif',
              color: "#E8C58F",
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
            }}
          >
            हरेक तस्बिरको आफ्नै कथा।
          </p>

          <div className="mt-2 ml-1 flex -rotate-3 flex-col gap-[4px]">
            <div className="w-24 sm:w-28 border-t border-dashed border-[#E8C58F]/80" />
            <div className="ml-5 w-16 sm:w-20 border-t border-dashed border-[#E8C58F]/50" />
          </div>
        </div>
      </div>
    </main>
  );
}
