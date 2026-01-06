import Image from 'next/image';
import Link from 'next/link';

import { IoArrowRedoSharp } from "react-icons/io5";
import { VscDebugStart } from "react-icons/vsc";
import { GoBroadcast } from "react-icons/go";

const guidanceHighlights = [
  {
    title: 'Curate your activity narrative',
    description:
      'Explain the flow of your activity from welcome to farewell. Call out signature moments, tastes, or lessons guests will rave about.',
  },
  {
    title: 'Set guest size with intention',
    description:
      'Let travellers know the maximum number of guests and whether you thrive with intimate circles or lively groups.',
  },
  {
    title: 'Define group style and vibe',
    description:
      'Is your experience relaxed and mindful, adventurous and high-energy, or perfect for creative collaborators? Be descriptive.',
  },
  {
    title: 'Detail what guests should prepare',
    description:
      'List any requirements, accessibility notes, or insider tips so visitors arrive confident and excited.',
  },
];

const storytellingCards = [
  {
    image: '/images/paperplane_confetti.png',
    title: 'Paint the journey',
    description:
      'Outline each stage of the experience—arrival, main activity, celebratory send-off—so guests can envision the flow.',
  },
  {
    image: '/images/customerservice.png',
    title: 'Communicate care',
    description:
      'Explain how you stay in touch before the activity, greet everyone warmly, and follow up with memories or photos.',
  },
  {
    image: '/images/location.png',
    title: 'Map the setting',
    description:
      'Provide exact meeting points, transportation tips, and insider neighbourhood stories to build anticipation.',
  },
  {
    image: '/images/info.png',
    title: 'Set expectations',
    description:
      'Clarify what’s included, optional add-ons, and any weather considerations so guests arrive prepared.',
  },
];

const formSteps = [
  {
    heading: '1. Lead with your mission.',
    body: 'Describe why you host, who you collaborate with, and what guests will take away emotionally. Authenticity drives bookings.',
  },
  {
    heading: '2. Specify logistics clearly.',
    body: 'Use the guest size and schedule sections to outline availability, meeting points, duration, and seasonal notes. Transparency builds trust.',
  },
  {
    heading: '3. Personalise the group style.',
    body: 'Mention the type of travellers you thrive with—families, creatives, teammates—and how you adapt the dynamic for them.',
  },
  {
    heading: '4. Showcase expertise.',
    body: 'Introduce yourself and your co-hosts, include certifications, and weave in stories that prove your passion and professionalism.',
  },
  {
    heading: '5. Highlight safety & inclusivity.',
    body: 'Share guidelines, insurance coverage, or accessibility accommodations so every guest feels welcome.',
  },
];

export default function LandingPartnerPage() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-4 md:pt-8 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-[#0000ff] shadow-sm">
              Vuola Host Spotlight
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Inspire travellers with unforgettable experiences
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              Before you complete the Become a Host form, take a moment to craft your story. Use the activity
              form to paint a vivid picture of what guests will do, highlight your ideal guest size and group
              style, and share the small touches that make your experience stand out.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {guidanceHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/become-a-partner"
                className="inline-flex items-center justify-center rounded-full bg-[#0000ff] px-8 py-3 text-base font-semibold text-white shadow-[0_20px_45px_-15px_rgba(0,0,255,0.6)] transition hover:-translate-y-0.5 hover:bg-[#0000e0] focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:ring-offset-2"
              >
                <div className='flex flex-row justify-center items-center'>
                  Start the Form
                </div>
              </Link>
              <p className="text-sm text-slate-500">
                Takes around 10 minutes. You can save and return anytime.
              </p>
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 rounded-[2.75rem] to-blue-300 blur-xs"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white shadow-md ">
              <div className="relative h-80 w-full">
                <Image
                  src="/images/vinvintraveltheworld.png"
                  alt="Hosts welcoming guests to a vibrant cultural workshop"
                  fill
                  priority
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="grid gap-6 border-t border-slate-100 bg-white/80 p-8 backdrop-blur">
                <div className="rounded-2xl bg-white p-5 shadow-lg shadow-blue-100">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#0000ff]">
                    Activity form highlights
                  </p>
                  <p className="mt-2 text-slate-600">
                    Capture your itinerary, hosts, and local partnerships. Add sensory details—sounds, flavours,
                    scenery—to help guests imagine themselves there.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-lg shadow-blue-100">
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Guest experience checklist
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>• Clarify age ranges, accessibility, and any skill levels required.</li>
                    <li>• Suggest what to bring—from comfortable shoes to cameras.</li>
                    <li>• Share how you keep every group size personal and safe.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr,1.1fr]">
          <div className="rounded-[2.5rem] border border-white/70 bg-white/90 p-10 shadow-md shadow-slate-200 backdrop-blur">
            <h2 className="text-2xl font-semibold text-slate-900">
              How to fill the form for a standout listing
            </h2>
            <ol className="mt-6 space-y-5 text-sm text-slate-600">
              {formSteps.map((step) => (
                <li key={step.heading}>
                  <span className="font-semibold text-slate-800">{step.heading}</span> {step.body}
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {storytellingCards.map((card) => (
              <div
                key={card.title}
                className="group flex flex-col gap-4 rounded-3xl border border-transparent bg-white/90 p-6 shadow-xl shadow-slate-200 transition hover:-translate-y-1 hover:border-blue-200"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-blue-50 p-3 shadow-inner">
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                  />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="text-sm text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-[2.75rem] border border-blue-100 bg-gradient-to-r from-[#0000ff] via-blue-500 to-blue-400 p-[1px] shadow-[0_35px_70px_-35px_rgba(37,99,235,0.1)]">
          <div className="flex flex-col gap-8 rounded-[2.5rem] bg-white/95 p-10 text-center shadow-inner shadow-white/30 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0000ff]">
                Ready to impress?
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Launch your experience with confidence
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                We’ll guide you through the activity form, guest size, pricing, and imagery—step by step. You can
                save drafts and return anytime.
              </p>
            </div>
            <div className="sm:w-auto">
              <Link
                href="/become-a-partner"
                className="inline-flex items-center justify-center rounded-full bg-[#0000ff] px-8 py-3 text-base font-semibold text-white shadow-[0_18px_40px_-20px_rgba(0,0,255,0.8)] transition hover:-translate-y-0.5 hover:bg-[#0000e0] focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:ring-offset-2 focus:ring-offset-white"
              >
                <div className='flex flex-row justify-center items-center gap-2'>
                  Proceed
                  <IoArrowRedoSharp />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
