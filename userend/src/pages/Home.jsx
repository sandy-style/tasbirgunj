import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import coverImage from "../assets/tasbirgunj-cover.png";
import About from "./About";

const HERO_IMAGES = [
  coverImage,
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90",
];
const deva = "font-['Rozha_One','Noto_Serif_Devanagari',serif]";
const sceneryCards = [
  {
    id: "01",
    title: "The Himalayas",
    nepaliTitle: "हिमालको सास",
    location: "Annapurna Sanctuary",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85",
    top: "3%",
    right: "12px",
    angle: -5,
  },
  {
    id: "02",
    title: "Into the Wild",
    nepaliTitle: "जङ्गली संसार",
    location: "Chitwan Woodlands",
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=85",
    top: "21%",
    right: "36px",
    angle: 4,
  },
  {
    id: "03",
    title: "Quiet Horizons",
    nepaliTitle: "शान्त क्षितिज",
    location: "Phewa Waters",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=85",
    top: "39%",
    right: "16px",
    angle: -3,
  },
  {
    id: "04",
    title: "Sacred Architecture",
    nepaliTitle: "पवित्र सम्पदा",
    location: "Bhaktapur Durbar",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=85",
    top: "57%",
    right: "40px",
    angle: 5,
  },
  {
    id: "05",
    title: "Forest Stories",
    nepaliTitle: "वनको सुसेली",
    location: "Shivapuri Ridge",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=85",
    top: "75%",
    right: "20px",
    angle: -4,
  },
];

const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.13,
    },
  },
};
const gradientText =
  "bg-gradient-to-r from-[#AD081B] via-[#E60023] to-[#F05B70] bg-clip-text text-transparent";
const heroItemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Home() {
  const reduceMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion ?? false;

  const [loaded, setLoaded] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const entranceTimer = window.setTimeout(() => {
      setLoaded(true);
    }, 100);

    // Preload the hero images for smoother cross-fades.
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

  const copyVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : heroItemVariants;

  return (
    <>
      <main className="w-full overflow-hidden bg-white font-['Plus_Jakarta_Sans',sans-serif] text-[#111111]">
        {/* Hero */}
        <section
          id="home"
          aria-label="तस्बिरगंज introduction"
          className="relative isolate h-[100svh] min-h-[700px] w-full overflow-hidden bg-white sm:min-h-[640px]"
        >
          {/* Cross-fading hero backgrounds */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#F7F7F7]">
            {HERO_IMAGES.map((image, index) => (
              <motion.img
                key={image}
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
                onError={(event) => {
                  const target = event.currentTarget;

                  if (target.dataset.fallback === "true") {
                    target.style.display = "none";
                    return;
                  }

                  target.dataset.fallback = "true";
                  target.src = coverImage;
                }}
                className="absolute inset-0 h-full w-full scale-[1.04] object-cover"
              />
            ))}
          </div>

          {/* Bright Pinterest-inspired white overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/[0.96] via-white/[0.84] to-white/[0.42]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-white/[0.92] via-white/[0.12] to-white/[0.34]"
          />

          {/* Subtle Pinterest-red glow on the right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-[3] hidden w-[55%] bg-[radial-gradient(ellipse_at_100%_50%,rgba(230,0,35,0.13)_0%,rgba(230,0,35,0.045)_35%,transparent_72%)] lg:block"
          />

          {/* Main hero content */}
          <div className="relative z-10 flex h-full items-center px-6 sm:px-12 md:px-14 lg:pr-[220px] lg:pl-[8%] xl:pr-[280px] xl:pl-[9%]">
            <motion.div
              initial="hidden"
              animate={loaded ? "visible" : "hidden"}
              variants={heroContainerVariants}
              className="w-full max-w-[620px] -translate-y-8 sm:max-w-[680px] sm:-translate-y-6 md:-translate-y-4 xl:max-w-[760px]"
            >
              <motion.p
                variants={copyVariants}
                className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#767676] sm:mb-6 sm:text-xs"
              >
                <span className="text-[9px] text-[#E60023]">●</span>A home for
                every perspective
              </motion.p>

              <motion.h1
                variants={copyVariants}
                className={`${deva} m-0 mt-2 whitespace-nowrap text-[clamp(58px,10.5vw,148px)] font-normal leading-[1.12] tracking-[-0.045em] ${gradientText}`}
              >
                तस्बिरगंज
              </motion.h1>

              <motion.h2
                variants={copyVariants}
                className="max-w-[580px] text-[clamp(1.75rem,3.8vw,2.85rem)] font-medium leading-[1.15] tracking-[-0.035em] text-[#111111]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                }}
              >
                The world, through{" "}
                <span className="italic text-[#E60023]">your lens.</span>
              </motion.h2>

              <motion.p
                variants={copyVariants}
                className="mt-4 max-w-[460px] text-xs leading-6 text-[#555555] sm:mt-5 sm:text-base sm:leading-7"
              >
                A moment. A feeling. A different perspective. Discover
                extraordinary photographs and share the world as you see it.
              </motion.p>

              {/* Explore button */}
              <motion.div
                variants={copyVariants}
                className="mt-7 flex flex-wrap items-stretch gap-3 sm:mt-9 sm:gap-4"
              >
                <Link
                  to="/explore"
                  className="group inline-flex min-h-[78px] items-center justify-between gap-5 rounded-2xl border border-[#E5E5E5] bg-white/95 px-5 py-3.5 text-left text-[#111111] shadow-[0_12px_38px_rgba(0,0,0,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#E60023]/35 hover:shadow-[0_16px_42px_rgba(0,0,0,0.13)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E60023] sm:px-6"
                >
                  <span className="flex flex-col items-start">
                    <span
                      className="text-[25px] font-semibold leading-none tracking-[-0.035em] sm:text-[28px]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                      }}
                    >
                      Explore तस्बिरगंज
                    </span>

                    <span className="mt-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#767676] sm:text-[10px] sm:tracking-[0.15em]">
                      A world through the lens
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center border-l border-[#E5E5E5] pl-3 text-[#E60023] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 sm:pl-4"
                  >
                    <ArrowUpRight size={20} strokeWidth={1.7} />
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Desktop photography cascade */}
          <aside
            aria-label="Curated photography gallery"
            className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[220px] lg:block xl:w-[260px] 2xl:w-[280px]"
            onMouseLeave={() => setHoveredCard(null)}
          >
            {sceneryCards.map((card, index) => {
              const active = hoveredCard === index;
              const anotherActive = hoveredCard !== null;

              return (
                <motion.article
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${card.title} - ${card.location}`}
                  aria-pressed={active}
                  onMouseEnter={() => setHoveredCard(index)}
                  onFocus={() => setHoveredCard(index)}
                  onBlur={(event) => {
                    if (
                      !event.currentTarget.parentElement?.contains(
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
                    opacity: active ? 1 : 0.86,
                    x: anotherActive ? (active ? -40 : 12) : 0,
                    y: anotherActive && active ? -2 : 0,
                    rotate: active ? 0 : card.angle,
                    scale: anotherActive ? (active ? 1.1 : 0.94) : 1,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.5,
                    delay:
                      !shouldReduceMotion && hoveredCard === null
                        ? 0.22 + index * 0.1
                        : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`pointer-events-auto absolute w-[95px] cursor-pointer rounded-[11px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E60023] lg:w-[120px] lg:rounded-[14px] xl:w-[140px] 2xl:w-[155px] ${
                    active ? "grayscale-0" : "grayscale"
                  }`}
                  style={{
                    top: card.top,
                    right: card.right,
                  }}
                >
                  {/* Floating photo caption */}
                  <div
                    className={`pointer-events-none absolute right-[108%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-left text-[#111111] shadow-[0_12px_35px_rgba(0,0,0,0.10)] transition-all duration-300 ${
                      active
                        ? "translate-x-0 opacity-100"
                        : "translate-x-3 opacity-0"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold tracking-wider text-[#E60023]">
                        {card.id}
                      </span>

                      <span className="h-1 w-1 rounded-full bg-current opacity-40" />

                      <p className="text-xs font-medium tracking-wide">
                        {card.title}
                      </p>
                    </div>

                    <p className="mt-1 text-[10px] tracking-wider text-[#767676]">
                      {card.location}
                    </p>
                  </div>

                  <div className="pointer-events-none aspect-[3/4] overflow-hidden rounded-[11px] border border-white bg-white shadow-[0_16px_38px_rgba(0,0,0,0.16)] lg:rounded-[14px]">
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
              );
            })}
          </aside>

          {/* Mobile photography carousel */}
          <section
            aria-label="Photography collection"
            className="absolute bottom-16 left-0 right-0 z-20 overflow-hidden sm:bottom-20 lg:hidden"
          >
            <div className="overflow-hidden py-3">
              <motion.div
                className="flex w-max gap-3"
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
                    className="relative aspect-[3/4] w-[84px] shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:w-[98px]"
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
            </div>
          </section>

          {/* Nepali signature */}
          <div className="pointer-events-none absolute bottom-5 left-6 z-10 sm:bottom-7 sm:left-12 lg:left-[9%]">
            <div className="flex flex-col items-start">
              <p
                lang="ne"
                className="origin-left -rotate-3 text-sm tracking-wide text-[#E60023] sm:text-base"
                style={{
                  fontFamily: "'Kalam', cursive",
                }}
              >
                हरेक तस्बिरको आफ्नै कथा।
              </p>

              <div className="ml-1 mt-2 flex -rotate-3 flex-col gap-[4px]">
                <div className="w-24 border-t border-dashed border-[#E5E5E5] sm:w-28" />
                <div className="ml-5 w-16 border-t border-dashed border-[#E5E5E5] sm:w-20" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
