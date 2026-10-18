import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import coverImage from "../assets/tasbirgunj-cover.png";

const HERO_IMAGES = [
  coverImage,
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90",
];

const deva = "font-['Rozha_One','Noto_Serif_Devanagari',serif]";
const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const gradientText =
  "bg-gradient-to-r from-[#AD081B] via-[#E60023] to-[#F05B70] bg-clip-text text-transparent";

const sceneryCards = [
  {
    id: "01",
    title: "The Himalayas",
    location: "Annapurna Sanctuary",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85",
    angle: -5,
    shift: 0,
  },
  {
    id: "02",
    title: "Into the Wild",
    location: "Chitwan Woodlands",
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=85",
    angle: 4,
    shift: 28,
  },
  {
    id: "03",
    title: "Quiet Horizons",
    location: "Phewa Waters",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=85",
    angle: -3,
    shift: 6,
  },
  {
    id: "04",
    title: "Sacred Architecture",
    location: "Bhaktapur Durbar",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=85",
    angle: 5,
    shift: 30,
  },
  {
    id: "05",
    title: "Forest Stories",
    location: "Shivapuri Ridge",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=85",
    angle: -4,
    shift: 8,
  },
];

const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13 },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const torchMask =
  "radial-gradient(circle 220px at var(--torch-x, 50%) var(--torch-y, 50%), black 0%, black 30%, rgba(0,0,0,0.94) 43%, rgba(0,0,0,0.68) 59%, rgba(0,0,0,0.24) 77%, transparent 100%)";

function handleHeroImageError(event) {
  const image = event.currentTarget;

  if (image.dataset.fallback === "true") {
    image.style.display = "none";
    return;
  }

  image.dataset.fallback = "true";
  image.src = coverImage;
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? false;

  const heroRef = useRef(null);

  const [loaded, setLoaded] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [torchEnabled, setTorchEnabled] = useState(false);

  // Enable the torch only for mouse/trackpad-style devices.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    const updateTorchCapability = () => {
      setTorchEnabled(mediaQuery.matches && !shouldReduceMotion);
    };

    updateTorchCapability();
    mediaQuery.addEventListener("change", updateTorchCapability);

    return () => {
      mediaQuery.removeEventListener("change", updateTorchCapability);
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    const entranceTimer = window.setTimeout(() => {
      setLoaded(true);
    }, 100);

    // Preload images so the cross-fades feel smoother.
    HERO_IMAGES.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    const backgroundTimer = shouldReduceMotion
      ? null
      : window.setInterval(() => {
          setBackgroundIndex((current) => (current + 1) % HERO_IMAGES.length);
        }, 7000);

    return () => {
      window.clearTimeout(entranceTimer);

      if (backgroundTimer !== null) {
        window.clearInterval(backgroundTimer);
      }
    };
  }, [shouldReduceMotion]);

  // Update CSS variables directly instead of re-rendering on every mouse move.
  const handlePointerMove = (event) => {
    if (!torchEnabled || event.pointerType === "touch") return;

    const hero = heroRef.current;
    if (!hero) return;

    const rect = hero.getBoundingClientRect();

    hero.style.setProperty("--torch-x", `${event.clientX - rect.left}px`);

    hero.style.setProperty("--torch-y", `${event.clientY - rect.top}px`);
  };

  const handlePointerLeave = () => {
    const hero = heroRef.current;
    if (!hero) return;

    // Move the spotlight out of view when the pointer leaves the hero.
    hero.style.setProperty("--torch-x", "-500px");
    hero.style.setProperty("--torch-y", "-500px");
  };

  const copyVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : heroItemVariants;

  const desktopCards = sceneryCards.slice(0, 4);

  return (
    <main className="w-full overflow-hidden bg-white font-['Plus_Jakarta_Sans',sans-serif] text-[#111111]">
      <section
        id="home"
        ref={heroRef}
        aria-label="तस्बिरगंज introduction"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={`relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#F5F6F2] ${
          torchEnabled ? "tg-torch-active" : ""
        }`}
        style={{
          "--torch-x": "50%",
          "--torch-y": "45%",
        }}
      >
        {/* Base photographs: grayscale on desktop, full colour on touch devices. */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#E8EBE6]">
          {HERO_IMAGES.map((image, index) => (
            <motion.img
              key={`base-${image}`}
              src={image}
              alt=""
              aria-hidden="true"
              fetchPriority={index === backgroundIndex ? "high" : "auto"}
              loading="eager"
              decoding="async"
              initial={false}
              animate={{
                opacity: index === backgroundIndex ? 1 : 0,
              }}
              transition={{
                opacity: {
                  duration: shouldReduceMotion ? 0 : 2.4,
                  ease: "easeInOut",
                },
              }}
              onError={handleHeroImageError}
              className={`absolute inset-0 h-full w-full scale-[1.04] object-cover transition-[filter] duration-700 ${
                torchEnabled ? "grayscale" : "grayscale-0"
              }`}
            />
          ))}
        </div>

        {/* Readability overlays: intentionally lighter to retain image detail. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/[0.82] via-white/[0.55] to-white/[0.10]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-white/[0.58] via-white/[0.04] to-white/[0.14]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-[3] hidden w-[55%] bg-[radial-gradient(ellipse_at_100%_50%,rgba(66,109,101,0.13)_0%,rgba(66,109,101,0.04)_35%,transparent_72%)] lg:block"
        />

        {/* Full-colour image layer: the cursor mask reveals it through the overlays. */}
        {torchEnabled &&
          HERO_IMAGES.map((image, index) => (
            <motion.img
              key={`colour-${image}`}
              src={image}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              initial={false}
              animate={{
                opacity: index === backgroundIndex ? 1 : 0,
              }}
              transition={{
                opacity: {
                  duration: 2.4,
                  ease: "easeInOut",
                },
              }}
              onError={handleHeroImageError}
              className="tg-torch-colour-layer pointer-events-none absolute inset-0 z-[4] h-full w-full scale-[1.04] object-cover"
              style={{
                maskImage: torchMask,
                WebkitMaskImage: torchMask,
              }}
            />
          ))}

        {/* Soft, feathered torch glow. It never blocks interaction. */}
        {torchEnabled && (
          <div
            aria-hidden="true"
            className="tg-torch-glow pointer-events-none absolute inset-0 z-[5]"
          />
        )}

        {/* Main layout */}
        <div className="relative z-10 flex h-full flex-col px-6 pb-5 pt-6 sm:px-12 sm:pb-7 sm:pt-8 md:px-14 lg:pl-[8%] lg:pr-[230px] xl:pl-[9%] xl:pr-[290px]">
          {/* Minimal top line — no slide toggler. */}
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[#555F5A] sm:text-xs">
              <span className="text-[9px] text-[#426D65]">●</span>A home for
              every perspective
            </p>

            <p className="hidden text-[9px] font-medium tracking-[0.2em] text-[#59645E] sm:block">
              PHOTOGRAPHY · STORIES · NEPAL
            </p>
          </div>

          {/* Main hero copy */}
          <motion.div
            initial="hidden"
            animate={loaded ? "visible" : "hidden"}
            variants={heroContainerVariants}
            className="flex flex-1 flex-col justify-center"
          >
            <div className="w-full max-w-[620px] sm:max-w-[680px] xl:max-w-[760px]">
              <motion.h1
                variants={copyVariants}
                className={`${deva} m-0 whitespace-nowrap text-[clamp(58px,10.5vw,148px)] font-normal leading-[1.12] tracking-[-0.045em] ${gradientText}`}
              >
                तस्बिरगंज
              </motion.h1>

              <motion.h2
                variants={copyVariants}
                className="mt-1 max-w-[580px] text-[clamp(1.75rem,3.8vw,2.85rem)] font-medium leading-[1.15] tracking-[-0.035em] text-[#182520]"
                style={serif}
              >
                The world, through{" "}
                <span className="italic text-[#426D65]">your lens.</span>
              </motion.h2>

              <motion.p
                variants={copyVariants}
                className="mt-4 max-w-[440px] text-sm leading-6 text-[#3F4944] sm:mt-5 sm:text-base sm:leading-7"
              >
                A moment. A feeling. A different perspective. Discover
                extraordinary photographs and share the world as you see it.
              </motion.p>

              {/* Frosted-glass Explore button */}
              <motion.div variants={copyVariants} className="mt-7 sm:mt-9">
                <Link
                  to="/explore"
                  className="tg-explore-button group inline-flex min-h-[76px] items-center gap-5 rounded-2xl border border-white/75 bg-white/40 px-5 py-3.5 text-left text-[#203C34] shadow-[0_12px_36px_rgba(31,55,45,0.10)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white hover:bg-white/60 hover:shadow-[0_18px_46px_rgba(31,55,45,0.17)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#426D65] sm:min-h-[82px] sm:px-6"
                >
                  <span className="flex flex-col items-start">
                    <span className="flex items-baseline gap-2.5">
                      <span
                        className="text-[29px] font-medium leading-none tracking-[-0.035em] text-[#203C34] sm:text-[33px]"
                        style={serif}
                      >
                        Explore
                      </span>

                      <span
                        lang="ne"
                        className={`${deva} text-[23px] leading-none text-red-600 text-[26px]`}
                      >
                        तस्बिरगंज
                      </span>
                    </span>

                    <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.19em] text-red-700 sm:text-[10px]">
                      A world through the lens
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#426D65]/25 bg-white/45 text-red-700 transition-all duration-500 group-hover:border-[#426D65] group-hover:bg-[#f11e1e] group-hover:text-white sm:h-11 sm:w-11"
                  >
                    <ArrowUpRight
                      size={21}
                      strokeWidth={1.5}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </Link>
              </motion.div>

              {/* Desktop-only hint for the interactive effect */}
              {torchEnabled && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: loaded ? 0.75 : 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="mt-5 hidden items-center gap-2 text-[9px] font-medium uppercase tracking-[0.17em] text-[#56665D] lg:flex"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#426D65]" />
                  Move your cursor to reveal the colours
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Bottom band */}
          <div className="relative">
            {/* Mobile photography carousel */}
            <section
              aria-label="Photography collection"
              className="-mx-6 mb-5 overflow-hidden sm:-mx-12 sm:mb-6 md:-mx-14 lg:hidden"
            >
              <motion.div
                className="flex w-max gap-3 px-6 sm:px-12"
                animate={shouldReduceMotion ? { x: 0 } : { x: ["0%", "-50%"] }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 30,
                        ease: "linear",
                        repeat: Infinity,
                      }
                }
              >
                {[...sceneryCards, ...sceneryCards].map((card, index) => (
                  <article
                    key={`${card.id}-${index}`}
                    aria-hidden={index >= sceneryCards.length}
                    className="relative aspect-[3/4] w-[clamp(84px,24vw,120px)] shrink-0 overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                  >
                    <img
                      src={card.image}
                      alt={index < sceneryCards.length ? card.title : ""}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      className="h-full w-full object-cover"
                    />
                  </article>
                ))}
              </motion.div>
            </section>

            {/* Nepali signature */}
            <div className="pointer-events-none flex flex-col items-start">
              <p
                lang="ne"
                className="origin-left -rotate-3 text-sm tracking-wide text-[#426D65] sm:text-base"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                हरेक तस्बिरको आफ्नै कथा।
              </p>

              <div className="ml-1 mt-2 flex -rotate-3 flex-col gap-[4px]">
                <div className="w-24 border-t border-dashed border-[#426D65]/30 sm:w-28" />
                <div className="ml-5 w-16 border-t border-dashed border-[#426D65]/30 sm:w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop photography cascade */}
        <aside
          aria-label="Curated photography gallery"
          className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[220px] flex-col justify-evenly py-10 lg:flex xl:w-[270px]"
          onMouseLeave={() => setHoveredCard(null)}
        >
          {desktopCards.map((card, index) => {
            const active = hoveredCard === index;
            const anotherActive = hoveredCard !== null;

            return (
              <div
                key={card.id}
                className="relative flex justify-end"
                style={{ paddingRight: card.shift + 16 }}
              >
                <motion.article
                  role="button"
                  tabIndex={0}
                  aria-label={`${card.title} - ${card.location}`}
                  aria-pressed={active}
                  onMouseEnter={() => setHoveredCard(index)}
                  onFocus={() => setHoveredCard(index)}
                  onBlur={(event) => {
                    if (
                      !event.currentTarget.parentElement?.parentElement?.contains(
                        event.relatedTarget,
                      )
                    ) {
                      setHoveredCard(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setHoveredCard((current) =>
                        current === index ? null : index,
                      );
                    }

                    if (event.key === "Escape") {
                      setHoveredCard(null);
                    }
                  }}
                  onClick={() =>
                    setHoveredCard((current) =>
                      current === index ? null : index,
                    )
                  }
                  initial={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : 12,
                  }}
                  animate={{
                    opacity: active ? 1 : 0.88,
                    x: anotherActive ? (active ? -28 : 8) : 0,
                    rotate: active ? 0 : card.angle,
                    scale: anotherActive ? (active ? 1.08 : 0.95) : 1,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.5,
                    delay:
                      !shouldReduceMotion && hoveredCard === null
                        ? 0.22 + index * 0.1
                        : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`pointer-events-auto relative aspect-[3/4] w-auto cursor-pointer rounded-[14px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#426D65] ${
                    active ? "grayscale-0" : "grayscale"
                  }`}
                  style={{
                    height: "clamp(120px, calc((100svh - 11rem) / 4), 210px)",
                  }}
                >
                  {/* Floating caption */}
                  <div
                    className={`pointer-events-none absolute right-[108%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/80 bg-white/70 px-3.5 py-2.5 text-left text-[#203C34] shadow-[0_12px_35px_rgba(0,0,0,0.10)] backdrop-blur-xl transition-all duration-300 ${
                      active
                        ? "translate-x-0 opacity-100"
                        : "translate-x-3 opacity-0"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-wider text-[#426D65]">
                        {card.id}
                      </span>

                      <span className="h-1 w-1 rounded-full bg-current opacity-40" />

                      <p className="text-xs font-medium tracking-wide">
                        {card.title}
                      </p>
                    </div>

                    <p className="mt-1 text-[10px] tracking-wider text-[#64746B]">
                      {card.location}
                    </p>
                  </div>

                  <div className="pointer-events-none h-full w-full overflow-hidden rounded-[14px] border border-white/90 bg-white shadow-[0_16px_38px_rgba(0,0,0,0.16)]">
                    <img
                      src={card.image}
                      alt={card.title}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      className={`h-full w-full object-cover transition-transform duration-700 ${
                        active ? "scale-110" : "scale-100"
                      }`}
                    />
                  </div>
                </motion.article>
              </div>
            );
          })}
        </aside>

        {/* Spotlight styling */}
        <style>{`
          .tg-torch-colour-layer {
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
            will-change: opacity, -webkit-mask-image, mask-image;
          }

          .tg-torch-glow {
            background: radial-gradient(
              circle 245px at var(--torch-x, 50%) var(--torch-y, 45%),
              rgba(255, 255, 255, 0.08) 0%,
              rgba(255, 255, 255, 0.025) 45%,
              transparent 100%
            );
          }

          @media (prefers-reduced-motion: reduce) {
            .tg-torch-colour-layer,
            .tg-torch-glow {
              display: none !important;
            }
          }

          @media (hover: none), (pointer: coarse) {
            .tg-torch-colour-layer,
            .tg-torch-glow {
              display: none !important;
            }
          }

          @media (max-width: 1023px) {
            .tg-torch-colour-layer,
            .tg-torch-glow {
              display: none !important;
            }
          }

          @media (max-width: 640px) {
            .tg-explore-button {
              min-height: 70px;
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
            }
          }
        `}</style>
      </section>
    </main>
  );
}
