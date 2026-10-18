import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, GitBranch } from "lucide-react";

import Footer from "../components/common/Footer";
import lionDeer from "../assets/lion chasing deer.png";
import ocean from "../assets/ocean.png";
import tajmahal from "../assets/tajmahal.png";
import syambhu from "../assets/syambhu.png";

/* Typography */
const serif = "font-['Cormorant_Garamond',Georgia,serif]";
const deva = "font-['Rozha_One','Noto_Serif_Devanagari',serif]";
const body = "font-['Plus_Jakarta_Sans','DM_Sans',sans-serif]";

/* Shared layout */
const h2Base = `${serif} m-0 mt-5 text-[clamp(44px,5.5vw,76px)] font-medium leading-[0.98] tracking-[-0.05em]`;

const bodyBase = "m-0 mt-6 max-w-[620px] text-[14px] leading-[2.05]";

const sectionPad = "py-[clamp(60px,8vw,120px)]";

const gradientText =
  "bg-gradient-to-r from-[#AD081B] via-[#E60023] to-[#F05B70] bg-clip-text text-transparent";

/* Shared animation */
function Reveal({ children, className = "", delay = 0 }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduce ? 0 : 0.7,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* Section eyebrow */
function Eyebrow({ children }) {
  return (
    <p className="m-0 flex items-center gap-3 text-[11px] font-bold uppercase leading-[1.8] tracking-[0.16em] text-[#767676]">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E60023]"
      />
      {children}
    </p>
  );
}

/* Artwork */
function Art({ src, alt, className = "", imgClass = "" }) {
  return (
    <div
      className={`group relative isolate flex min-w-0 items-center justify-center ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[14%] -z-10 rounded-full bg-[#E60023]/[0.07] blur-[55px]"
      />

      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block w-full max-w-full object-contain saturate-[.94] contrast-[1.02] transition-transform duration-700 ease-out group-hover:-translate-y-1 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none ${imgClass}`}
      />
    </div>
  );
}

/* About page */
export default function About() {
  const reduce = useReducedMotion();

  const pillars = [
    {
      label: "Create",
      title: "Your work, your voice.",
      text: "Share photographs in your own style and give the moments you notice a place to be seen.",
    },
    {
      label: "Connect",
      title: "People over numbers.",
      text: "Discover photographers, follow their journeys, and connect through a shared love of visual storytelling.",
    },
    {
      label: "Discover",
      title: "Every perspective matters.",
      text: "From everyday details to sweeping landscapes, there is room for every way of seeing.",
    },
  ];

  return (
    <main
      className={`relative isolate w-full overflow-x-clip bg-white text-[#111111] ${body}`}
    >
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 -z-10 h-[620px] w-[620px] rounded-full bg-[#E60023]/[0.07] blur-[120px]"
        />

        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-14 px-[clamp(20px,5.2vw,88px)] pb-[clamp(60px,8vw,110px)] pt-[clamp(70px,9vw,130px)] lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-10"
          >
            <Eyebrow>About us</Eyebrow>

            <p
              className={`${serif} m-0 mt-8 text-[clamp(26px,3vw,38px)] font-medium italic leading-none tracking-[-0.02em] text-[#767676]`}
            >
              What is
            </p>

            <h1
              className={`${deva} m-0 mt-2 whitespace-nowrap text-[clamp(58px,10.5vw,148px)] font-normal leading-[1.12] tracking-[-0.045em]`}
            >
              <span className={gradientText}>तस्बिरगंज</span>
              <span className="text-[#E60023]">.</span>
            </h1>

            <p
              className={`${serif} m-0 mt-8 max-w-[640px] text-[clamp(24px,2.6vw,34px)] font-medium leading-[1.25] tracking-[-0.02em]`}
            >
              A place to explore the unseen vision of the world, through
              pictures captured by the people who live in it.
            </p>

            <p className={`${bodyBase} max-w-[560px] text-[#767676]`}>
              Every photograph here is someone&apos;s way of looking: a street
              they walk daily, a light they waited for, a moment only they
              noticed. तस्बिरगंज gathers those views in one place, so you can
              see the world through eyes that aren&apos;t your own.
            </p>

            <div className="mt-9 max-w-[520px] border-t border-[#E5E5E5] pt-6">
              <p
                className={`${serif} m-0 text-[clamp(30px,3.5vw,46px)] font-semibold leading-[1.08] tracking-[-0.03em]`}
              >
                There is a photographer{" "}
                <span className={gradientText}>in you.</span>
              </p>
            </div>

            <Link
              to="/explore"
              className="group mt-9 inline-flex min-h-[80px] w-full max-w-[380px] items-center justify-between gap-6 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F7] px-7 py-4 shadow-[0_8px_30px_rgba(17,17,17,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#E60023] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E60023]"
            >
              <span className="flex flex-col gap-2">
                <span className={`${serif} text-[30px] leading-none`}>
                  Start exploring
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#767676]">
                  See the world through others
                </span>
              </span>

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#E60023] transition duration-300 group-hover:translate-x-1">
                <ArrowUpRight size={22} strokeWidth={1.8} />
              </span>
            </Link>
          </motion.div>

          {/* Editorial artwork */}
          <motion.div
            initial={{ opacity: 0, scale: reduce ? 1 : 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: reduce ? 0 : 1.1,
              delay: reduce ? 0 : 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative mx-auto h-[420px] w-full max-w-[560px] sm:h-[540px] lg:h-[640px]"
            aria-label="A collection of artwork representing different perspectives"
          >
            <figure className="absolute left-0 top-[4%] m-0 w-[58%] -rotate-6 rounded-sm bg-white p-3 pb-9 shadow-[0_20px_50px_-22px_rgba(17,17,17,0.24)] transition-transform duration-500 hover:-rotate-3">
              <img
                src={ocean}
                alt="Artwork inspired by the ocean"
                loading="lazy"
                className="aspect-[4/5] w-full object-contain saturate-[.94]"
              />
            </figure>

            <figure className="absolute right-0 top-0 z-10 m-0 w-[52%] rotate-[5deg] rounded-sm bg-white p-3 pb-9 shadow-[0_20px_50px_-22px_rgba(17,17,17,0.24)] transition-transform duration-500 hover:rotate-2">
              <img
                src={syambhu}
                alt="Artwork of Swayambhu"
                loading="lazy"
                className="aspect-[4/5] w-full object-contain saturate-[.94]"
              />
            </figure>

            <figure className="absolute bottom-0 left-[22%] z-20 m-0 w-[60%] -rotate-2 rounded-sm bg-white p-3 pb-9 shadow-[0_20px_50px_-22px_rgba(17,17,17,0.24)] transition-transform duration-500 hover:rotate-0">
              <img
                src={lionDeer}
                alt="Artwork depicting a lion chasing a deer"
                loading="lazy"
                className="aspect-[5/4] w-full object-contain saturate-[.94]"
              />

              <figcaption className="absolute bottom-2.5 left-0 right-0 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-[#767676]">
                Instinct, movement, life
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1400px] px-[clamp(20px,5.2vw,88px)]">
        {/* THE IDEA */}
        <section
          className={`grid items-center gap-[clamp(28px,5vw,90px)] md:grid-cols-2 ${sectionPad}`}
        >
          <Reveal className="min-w-0">
            <Eyebrow>The idea</Eyebrow>

            <h2 className={h2Base}>
              Different eyes.
              <br />
              Different stories.
              <br />
              <em className={`pr-2 ${gradientText}`}>One shared space.</em>
            </h2>

            <p className={`${bodyBase} text-[#767676]`}>
              A landscape, a fleeting expression, a familiar street, or the
              movement of the sea. Every frame reveals a point of view.
              तस्बिरगंज brings those perspectives together so people can share
              their work, discover new creators, and see familiar things
              differently.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0">
            <Art
              src={lionDeer}
              alt="Watercolor artwork of a lion chasing a deer through a green landscape"
              className="min-h-[300px]"
              imgClass="max-h-[560px]"
            />
          </Reveal>
        </section>

        {/* PERSPECTIVES */}
        <section
          className={`grid items-center gap-[clamp(28px,5vw,90px)] md:grid-cols-2 ${sectionPad}`}
        >
          <Reveal className="min-w-0 max-md:order-2">
            <Art
              src={ocean}
              alt="Watercolor artwork inspired by the ocean and its horizons"
              className="min-h-[300px]"
              imgClass="max-h-[560px]"
            />

            <p className="mt-2 text-right text-[10px] uppercase tracking-[0.1em] text-[#767676]">
              Find your own horizon
            </p>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0 max-md:order-1">
            <Eyebrow>A world of perspectives</Eyebrow>

            <h2 className={h2Base}>
              There is always
              <br />
              another way to
              <br />
              <em className={`pr-2 ${gradientText}`}>see the world.</em>
            </h2>

            <p className={`${bodyBase} text-[#767676]`}>
              One person sees a horizon. Another sees a memory, a journey, or a
              moment of stillness. Photography lets those interpretations exist
              side by side, and the most ordinary scene can feel new when
              someone else shows you how they see it.
            </p>

            <div className="mt-7 border-t border-[#E5E5E5] pt-4 text-[12px] leading-[1.8] text-[#767676]">
              Every frame offers a different point of view.
            </div>
          </Reveal>
        </section>

        {/* WHY TASBIRGUNJ */}
        <section className={sectionPad} aria-labelledby="why-title">
          <div className="grid items-center gap-[clamp(28px,5vw,84px)] md:grid-cols-[1.1fr_0.9fr]">
            <Reveal className="min-w-0">
              <Eyebrow>Why तस्बिरगंज</Eyebrow>

              <h2 id="why-title" className={h2Base}>
                Photography feels better when it is{" "}
                <em className={`pr-2 ${gradientText}`}>shared.</em>
              </h2>

              <p className={`${bodyBase} max-w-[700px] text-[#767676]`}>
                तस्बिरगंज is built around a simple idea: photography connects
                people. Every image can begin a conversation, introduce a new
                creator, or inspire someone to look closer at the world.
              </p>
            </Reveal>

            <Reveal delay={0.08} className="min-w-0">
              <Art
                src={tajmahal}
                alt="Watercolor artwork of the Taj Mahal"
                className="min-h-[300px]"
                imgClass="max-h-[520px]"
              />
            </Reveal>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-7">
            {pillars.map(({ label, title, text }, i) => (
              <Reveal key={label} delay={i * 0.06}>
                <article className="group border-t border-[#E5E5E5] pt-5 transition-colors duration-300 hover:border-[#E60023]">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.13em] text-[#AD081B]">
                    {label}
                  </p>

                  <h3
                    className={`${serif} m-0 mb-2 mt-3 text-[30px] font-medium leading-[1.05]`}
                  >
                    {title}
                  </h3>

                  <p className="m-0 max-w-[420px] text-[13px] leading-[1.9] text-[#767676]">
                    {text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* DEVELOPER */}
        <section className={sectionPad}>
          <div className="grid items-center gap-[clamp(32px,6vw,95px)] md:grid-cols-2">
            <Reveal className="min-w-0">
              <Eyebrow>Behind तस्बिरगंज</Eyebrow>

              <h2 className={h2Base}>
                Built with curiosity.
                <br />
                <em className={`pr-2 ${gradientText}`}>
                  Made for perspective.
                </em>
              </h2>

              <p className={`${bodyBase} text-[#767676]`}>
                तस्बिरगंज is an independent project shaped by an interest in
                photography, thoughtful design, and building useful things on
                the web. The ambition is a welcoming space where people can
                share photographs, discover creators, and experience different
                ways of seeing.
              </p>

              <div className="mt-8 grid grid-cols-[68px_minmax(0,1fr)] items-center gap-4 border-y border-[#E5E5E5] py-6 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-[22px]">
                <a
                  href="https://github.com/sandy-style"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Sandy on GitHub"
                  className="block h-[68px] w-[68px] overflow-hidden rounded-full border border-[#E5E5E5] bg-[#F7F7F7] sm:h-[92px] sm:w-[92px]"
                >
                  <img
                    src="https://avatars.githubusercontent.com/u/281124027?s=400&v=4"
                    alt="Sandy, developer of तस्बिरगंज"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.06]"
                  />
                </a>

                <div className="min-w-0">
                  <Eyebrow>The developer</Eyebrow>

                  <h3
                    className={`${serif} m-0 mt-2 text-[29px] font-medium leading-none sm:text-[35px]`}
                  >
                    Built by Sandy.
                  </h3>

                  <p className="m-0 mt-3 text-[12px] leading-[1.95] text-[#767676] sm:text-[13px]">
                    I&apos;m Sandy (Sandesh Poudel), a student developer
                    building तस्बिरगंज as part of my journey of learning,
                    experimenting, and turning ideas into something real.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-5">
                    <a
                      href="https://github.com/sandy-style"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[12px] font-bold text-[#AD081B] transition-colors hover:text-[#E60023]"
                    >
                      <GitBranch size={16} strokeWidth={2} />
                      GitHub
                      <ArrowUpRight size={13} />
                    </a>

                    <a
                      href="https://sandyway.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#AD081B] transition-colors hover:text-[#E60023]"
                    >
                      Portfolio
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="min-w-0">
              <Art
                src={syambhu}
                alt="Watercolor artwork of Swayambhu"
                className="min-h-[300px]"
                imgClass="max-h-[600px]"
              />
            </Reveal>
          </div>
        </section>

        {/* CLOSING */}
        <Reveal>
          <section
            className={`mb-12 grid items-center gap-[clamp(20px,5vw,75px)] overflow-hidden border border-[#E5E5E5] bg-[#F7F7F7] px-0 py-7 transition-colors duration-300 sm:mb-20 sm:p-[clamp(30px,5vw,72px)] max-sm:border-x-0 md:grid-cols-[1fr_0.95fr]`}
            aria-labelledby="closing-title"
          >
            <div>
              <Eyebrow>Your next perspective</Eyebrow>

              <h2 id="closing-title" className={h2Base}>
                The world is bigger than one{" "}
                <em className={`pr-2 ${gradientText}`}>point of view.</em>
              </h2>

              <p className={`${bodyBase} max-w-[560px] text-[#767676]`}>
                Find photographs that make you pause, discover the people behind
                them, and explore the world through another lens.
              </p>

              <Link
                to="/explore"
                className="group mt-7 inline-flex items-center gap-3 border-b border-[#E5E5E5] pb-2 text-[13px] font-bold transition-colors duration-200 hover:border-[#E60023]"
              >
                Discover the community
                <ArrowRight
                  size={16}
                  className="text-[#E60023] transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>

            <Art
              src={ocean}
              alt="Watercolor ocean scene"
              className="min-h-[220px]"
              imgClass="max-h-[400px]"
            />
          </section>
        </Reveal>
      </div>

      <Footer />
    </main>
  );
}
