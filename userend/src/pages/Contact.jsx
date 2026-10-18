import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Aperture,
  Camera,
  CheckCircle2,
  Clock3,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

import Footer from "../components/common/Footer";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "";

const contactTopics = [
  "General inquiry",
  "Technical support",
  "Partnership",
  "Photography collaboration",
  "Feedback and suggestions",
  "Other",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Contact() {
  const reduceMotion = useReducedMotion();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General inquiry",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const animationProps = reduceMotion
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.15 },
        variants: fadeUp,
        transition: { duration: 0.65, ease: "easeOut" },
      };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!CONTACT_EMAIL) {
      toast.error(
        "Contact email is not configured yet. Please try again later.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const emailSubject = encodeURIComponent(`[तस्बिरगंज] ${subject}`);

      const emailBody = encodeURIComponent(
        `Hello तस्बिरगंज team,\n\n${message}\n\n` +
          `Regards,\n${name}\n${email}`,
      );

      const mailtoUrl =
        `mailto:${CONTACT_EMAIL}` +
        `?subject=${emailSubject}` +
        `&body=${emailBody}`;

      window.location.href = mailtoUrl;

      toast.success("Your email draft is ready to open.");

      setFormData({
        name: "",
        email: "",
        subject: "General inquiry",
        message: "",
      });
    } catch {
      toast.error("Unable to prepare your email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFDFB] text-[#252321]">
      {/* Hero */}
      <section className="relative px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-16 lg:pt-28">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[#FCE8E8] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-[#F8EEE6] opacity-80 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#F0D9D6] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B71932]">
              <Sparkles size={14} />
              We would love to hear from you
            </div>

            <p className="mb-4 font-['Plus_Jakarta_Sans'] text-sm font-medium tracking-[0.18em] text-[#77716D]">
              A LITTLE CONVERSATION CAN GO A LONG WAY
            </p>

            <h1 className="max-w-3xl font-['Cormorant_Garamond',serif] text-6xl font-medium leading-[0.94] tracking-[-0.045em] sm:text-7xl md:text-8xl">
              Every great story
              <br />
              begins with{" "}
              <span className="font-normal italic text-[#E60023]">hello.</span>
            </h1>

            <p className="mt-8 max-w-xl font-['Plus_Jakarta_Sans'] text-base leading-8 text-[#716B67] sm:text-lg">
              Have a question, an idea, or a photograph that tells a story? We
              are here to listen. Tell us what is on your mind, and let’s make
              something meaningful together.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#contact-form"
                className="group inline-flex items-center gap-3 rounded-full bg-[#E60023] px-7 py-4 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-white shadow-lg shadow-[#E60023]/15 transition duration-300 hover:-translate-y-1 hover:bg-[#C90020]"
              >
                Start a conversation
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>

              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full px-5 py-4 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#393431] transition hover:text-[#E60023]"
              >
                Explore our world
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-4 border-t border-[#EEE5DF] pt-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FCE8E8] text-[#E60023]">
                <Heart size={19} />
              </div>

              <div>
                <p className="font-['Cormorant_Garamond',serif] text-xl font-semibold">
                  Made for the love of stories
                </p>
                <p className="mt-0.5 text-sm text-[#89817B]">
                  From Nepal, for everyone.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Editorial image composition */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="relative aspect-[4/4.6] overflow-hidden rounded-[2rem] bg-[#F0E5DC] sm:rounded-[2.5rem]">
              <img
                src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85"
                alt="A peaceful mountain landscape beneath a soft sky"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#211C19]/70 via-transparent to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs tracking-wide backdrop-blur-md">
                  <Camera size={13} />
                  Stories connect us
                </span>

                <p className="max-w-sm font-['Cormorant_Garamond',serif] text-4xl leading-tight sm:text-5xl">
                  Some things are better shared.
                </p>

                <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
                  Every image holds a moment. Every conversation brings a new
                  perspective.
                </p>
              </div>
            </div>

            <motion.div
              animate={
                reduceMotion ? {} : { y: [0, -7, 0], rotate: [-3, -1, -3] }
              }
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -left-5 top-12 hidden w-36 rotate-[-3deg] rounded-2xl bg-white p-3 shadow-xl shadow-[#31251F]/10 sm:block md:-left-12 md:w-44"
            >
              <img
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80"
                alt="Snow-covered Himalayan peaks"
                className="aspect-[4/5] w-full rounded-xl object-cover"
              />
              <p className="px-1 pb-1 pt-3 font-['Cormorant_Garamond',serif] text-lg italic text-[#51453E]">
                A world of wonder
              </p>
            </motion.div>

            <div className="absolute -bottom-5 -right-3 flex items-center gap-3 rounded-2xl border border-[#F3E5E0] bg-white p-4 shadow-xl shadow-[#31251F]/10 sm:-right-6 sm:p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FCE8E8] text-[#E60023]">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="font-['Cormorant_Garamond',serif] text-xl font-semibold">
                  Your voice matters
                </p>
                <p className="text-xs text-[#827A74]">We are listening.</p>
              </div>
            </div>

            <div className="absolute -right-2 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#E60023] text-white shadow-lg shadow-[#E60023]/20 sm:-right-5 sm:top-8 sm:h-14 sm:w-14">
              <Aperture size={23} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact details and form */}
      <section
        id="contact-form"
        className="relative border-y border-[#EEE5DF] bg-[#FAF5F1] px-5 py-20 sm:px-8 sm:py-28 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div {...animationProps} className="mb-12 max-w-2xl sm:mb-16">
            <p className="mb-4 font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-[0.22em] text-[#E60023]">
              GET IN TOUCH
            </p>

            <h2 className="font-['Cormorant_Garamond',serif] text-5xl font-medium leading-tight tracking-[-0.03em] sm:text-6xl md:text-7xl">
              Let’s make something
              <br />
              <span className="italic text-[#E60023]">worth remembering.</span>
            </h2>

            <p className="mt-5 max-w-xl font-['Plus_Jakarta_Sans'] text-sm leading-7 text-[#716B67] sm:text-base">
              Whether you are sharing feedback, asking for help, or exploring a
              collaboration, there is room for your message here.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            {/* Information panel */}
            <motion.aside
              {...animationProps}
              className="flex flex-col rounded-[1.75rem] bg-[#252321] p-7 text-white sm:rounded-[2rem] sm:p-10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E60023] text-white">
                <Mail size={22} />
              </div>

              <h3 className="mt-7 font-['Cormorant_Garamond',serif] text-4xl leading-tight sm:text-5xl">
                We’re just a message away.
              </h3>

              <p className="mt-4 max-w-md text-sm leading-7 text-white/65">
                The best conversations start with curiosity. Send your message
                and let us know how we can help.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF7A8D]">
                    <Mail size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
                      Email
                    </p>

                    {CONTACT_EMAIL ? (
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="mt-1 block break-all text-sm text-white transition hover:text-[#FF7A8D]"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-white/75">
                        Send us a message using the contact form.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF7A8D]">
                    <MapPin size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
                      Our roots
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      Nepal, the land of stories.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF7A8D]">
                    <Clock3 size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
                      Response time
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      We’ll get back to you as soon as we can.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-12">
                <div className="h-px bg-white/15" />

                <div className="flex items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="font-['Rozha_One','Noto_Serif_Devanagari',serif] text-2xl text-white">
                      तस्बिरगंज
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      The world, through your lens.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
                    <ArrowDownRight size={19} />
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Contact form */}
            <motion.div
              {...animationProps}
              className="rounded-[1.75rem] border border-[#EEE2DB] bg-white p-6 shadow-sm shadow-[#35261F]/[0.03] sm:rounded-[2rem] sm:p-10 lg:p-12"
            >
              <div className="mb-8">
                <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-[0.2em] text-[#E60023]">
                  WRITE TO US
                </p>

                <h3 className="mt-3 font-['Cormorant_Garamond',serif] text-4xl font-medium sm:text-5xl">
                  Send us a note.
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#827A74]">
                  Fill in the details below. Your email application will open
                  with your message ready to send.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-semibold text-[#38332F]"
                    >
                      Your name <span className="text-[#E60023]">*</span>
                    </label>

                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="What should we call you?"
                      required
                      className="w-full rounded-xl border border-[#E9DED7] bg-[#FFFEFD] px-4 py-3.5 text-sm text-[#252321] outline-none transition placeholder:text-[#AAA19A] focus:border-[#E60023] focus:ring-4 focus:ring-[#E60023]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-semibold text-[#38332F]"
                    >
                      Email address <span className="text-[#E60023]">*</span>
                    </label>

                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-xl border border-[#E9DED7] bg-[#FFFEFD] px-4 py-3.5 text-sm text-[#252321] outline-none transition placeholder:text-[#AAA19A] focus:border-[#E60023] focus:ring-4 focus:ring-[#E60023]/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-2 block text-sm font-semibold text-[#38332F]"
                  >
                    What is it about? <span className="text-[#E60023]">*</span>
                  </label>

                  <select
                    id="contact-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none rounded-xl border border-[#E9DED7] bg-[#FFFEFD] px-4 py-3.5 text-sm text-[#38332F] outline-none transition focus:border-[#E60023] focus:ring-4 focus:ring-[#E60023]/10"
                  >
                    {contactTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-semibold text-[#38332F]"
                  >
                    Your message <span className="text-[#E60023]">*</span>
                  </label>

                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what you have in mind..."
                    rows={6}
                    required
                    maxLength={5000}
                    className="w-full resize-y rounded-xl border border-[#E9DED7] bg-[#FFFEFD] px-4 py-3.5 text-sm leading-7 text-[#252321] outline-none transition placeholder:text-[#AAA19A] focus:border-[#E60023] focus:ring-4 focus:ring-[#E60023]/10"
                  />

                  <p className="mt-2 text-right text-xs text-[#9B918A]">
                    {formData.message.length}/5000 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#E60023] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#E60023]/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#C90020] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <Send size={16} />
                  {isSubmitting ? "Preparing email..." : "Send your message"}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>

                <div className="flex items-start gap-3 border-t border-[#F0E7E1] pt-5">
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-[#E60023]"
                  />
                  <p className="text-xs leading-6 text-[#89817B]">
                    Your message will be prepared in your default email
                    application. You will need to send the email yourself.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Closing section */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-16">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[#FCE8E8] opacity-70 blur-3xl" />

        <motion.div
          {...animationProps}
          className="relative mx-auto max-w-4xl text-center"
        >
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FCE8E8] text-[#E60023]">
            <Heart size={24} />
          </div>

          <p className="mb-4 font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-[0.22em] text-[#E60023]">
            UNTIL OUR NEXT STORY
          </p>

          <h2 className="font-['Cormorant_Garamond',serif] text-5xl font-medium leading-tight tracking-[-0.035em] sm:text-6xl md:text-7xl">
            The world feels smaller
            <br />
            when we <span className="italic text-[#E60023]">connect.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#716B67] sm:text-base">
            Discover the people, places, and little moments that make every
            story worth sharing.
          </p>

          <Link
            to="/explore"
            className="group mt-8 inline-flex items-center gap-3 rounded-full border border-[#E6D6CE] bg-white px-7 py-4 text-sm font-semibold text-[#332D29] shadow-sm transition duration-300 hover:border-[#E60023] hover:text-[#E60023]"
          >
            Explore तस्बिरगंज
            <ArrowUpRight
              size={17}
              className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
