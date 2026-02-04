'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BiMessageSquareDots } from 'react-icons/bi';
import { LuBadgeHelp, LuLifeBuoy, LuSparkles } from 'react-icons/lu';
import { RiShieldCheckLine, RiTeamLine } from 'react-icons/ri';

import Container from '../Container';
import FAQ from '../FAQ';
import Newsletter from '../Newsletter';
import Modal from '../modals/Modal';
import useMessenger from '../../hooks/useMessager';
import useLoginModal from '../../hooks/useLoginModal';
import { SafeUser } from '../../types';

interface HelpCenterContentProps {
  currentUser?: SafeUser | null;
}

const OPERATOR_ID = '67ef2895f045b7ff3d0cf6fc';

const faqItems = [
  {
    question: 'How do I contact an Operator for urgent help?',
    answer:
      'Use the Operator chat to message our team directly. If you already have an account, the chat opens inside the site — no extra downloads needed.',
  },
  {
    question: 'Can I change or cancel my reservation?',
    answer:
      'Yes. Go to Reservations from your profile to adjust your booking. Our cancellation policy is summarized below, and the Operator can help with special cases.',
  },
  {
    question: 'What if I am new to Vinvin?',
    answer:
      'Browse experiences without an account. When you are ready to book or chat with an Operator, you can quickly create an account or log in.',
  },
  {
    question: 'How can I become a host or promoter?',
    answer:
      'Visit Become a Provider for hosting or open the promoter guide in the resources below — both outline the steps to join and start earning.',
  },
];

const featureCards = [
  {
    title: 'Live Operator chat',
    description: 'Message a real human for itinerary tweaks, payment questions, or last‑minute changes.',
    icon: <BiMessageSquareDots className="h-5 w-5" />,
  },
  {
    title: 'Guides & policies',
    description: 'Clear policies for cancellations, privacy, and platform rules — all summarized for quick reading.',
    icon: <RiShieldCheckLine className="h-5 w-5" />,
  },
  {
    title: 'Community know-how',
    description: 'Insider tips on joining as a promoter, hosting unforgettable experiences, and keeping guests happy.',
    icon: <RiTeamLine className="h-5 w-5" />,
  },
];

const HelpCenterContent = ({ currentUser }: HelpCenterContentProps) => {
  const messenger = useMessenger();
  const loginModal = useLoginModal();

  const [isCancellationOpen, setIsCancellationOpen] = useState(false);
  const [isPromoterGuideOpen, setIsPromoterGuideOpen] = useState(false);
  const [isUserPlaybookOpen, setIsUserPlaybookOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPaymentTermsOpen, setIsPaymentTermsOpen] = useState(false);

  const handleOpenChat = () => {
    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    messenger.openChat({
      id: OPERATOR_ID,
      name: 'Operator',
      image: '/images/operator.png',
    });
  };

  const cancellationContent = useMemo(
    () => (
      <div className="space-y-5 text-sm leading-relaxed text-gray-700">
        <p>
          Thank you for choosing to book your experience through <strong>Vinvin</strong>. Plans can change, so our cancellation
          policy is designed to be fair and transparent while respecting the time and effort of our hosts.
        </p>
        <h3 className="text-base font-semibold">Cancellation Rules for Guests</h3>
        <p>
          All cancellations must be requested through your booking account, by contacting our support team via email, or by
          sending a message directly to Operator via Messenger.
        </p>
        <div className="space-y-3">
          <div>
            <p className="font-medium">1. No Refund (Within 24 Hours of Booking Date):</p>
            <p>
              Cancellations made <strong>within 24 hours</strong> of the scheduled experience will <strong>not</strong> be
              eligible for any refund, regardless of the reason.
            </p>
          </div>
          <div>
            <p className="font-medium">2. 50% Refund (Within 3 Business Days):</p>
            <p>
              Cancellations made <strong>within 3 business days</strong> of the scheduled experience will receive a
              <strong>50% refund</strong> of the total booking amount.
            </p>
          </div>
          <div>
            <p className="font-medium">3. Full Refund (At Least 7 Days in Advance):</p>
            <p>
              Guests who cancel <strong>7 or more days</strong> before the scheduled booking date are entitled to a
              <strong>full refund</strong> of the payment, excluding any third-party fees.
            </p>
          </div>
        </div>
        <h3 className="text-base font-semibold">Important Notes</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Refunds process within 5–10 business days after cancellation approval.</li>
          <li>Business days are Monday through Friday, excluding public holidays.</li>
          <li>No refunds are available once the experience has started.</li>
          <li>
            In rare cases of emergency or unforeseen events, guests may contact support with documentation for further
            consideration.
          </li>
        </ul>
        <p>If you have questions about our cancellation policy, reach out anytime.</p>
      </div>
    ),
    [],
  );

  const promotersGuideContent = useMemo(
    () => (
      <div className="space-y-5 text-sm leading-relaxed text-gray-700">
        <p>
          Welcome to the <strong>Vinvin Network Promoters Program</strong> — an opportunity for creators and travel enthusiasts to
          grow with our platform. Join to share experiences and earn from your community.
        </p>
        <h3 className="text-base font-semibold">How to Become a Promoter</h3>
        <p>
          Email us at <a className="text-blue-600 underline" href="mailto:promoters@vinvin.io">promoters@vinvin.io</a> to get
          started and receive your referral dashboard.
        </p>
        <h3 className="text-base font-semibold">Earning with Vinvin</h3>
        <p>
          Earn <strong>10% of total revenue</strong> from bookings made with your referral ID. Earnings calculate monthly and are
          based directly on confirmed bookings.
        </p>
        <h3 className="text-base font-semibold">Global Community, Local Focus</h3>
        <p>
          We welcome promoters worldwide. Even if you are outside the EU, share your referral ID to drive traffic to our
          platform — the more you engage, the more you earn.
        </p>
        <h3 className="text-base font-semibold">Payouts and Frequency</h3>
        <p>
          Payouts arrive <strong>twice a month</strong> to the configured payout method. Keep your details current to avoid
          delays.
        </p>
        <p>
          Need assistance? Reach our team at{' '}
          <a className="text-blue-600 underline" href="mailto:promoters@vinvin.io">
            promoters@vinvin.io
          </a>
          .
        </p>
      </div>
    ),
    [],
  );

  const userPlaybookContent = useMemo(
    () => (
      <div className="space-y-5 text-sm leading-relaxed text-gray-700">
        <p>
          The Vinvin Playbook is your guide to being a respectful guest, collaborative host, or thoughtful promoter. It keeps our
          community safe, inclusive, and delightful for everyone.
        </p>
        <h3 className="text-base font-semibold">Respect every interaction</h3>
        <p>Be punctual, kind, and communicative with hosts, guests, and Operators. Share changes early so we can help.</p>
        <h3 className="text-base font-semibold">Keep listings and profiles accurate</h3>
        <p>Use clear photos, honest descriptions, and up-to-date contact details so travelers know what to expect.</p>
        <h3 className="text-base font-semibold">Safety first</h3>
        <p>
          Follow local guidelines, avoid sharing sensitive information outside the platform, and report any issues directly to an
          Operator.
        </p>
        <h3 className="text-base font-semibold">Payments stay on-platform</h3>
        <p>Complete transactions through Vinvin to stay protected by our payment and cancellation coverage.</p>
      </div>
    ),
    [],
  );

  const privacyPolicyContent = useMemo(
    () => (
      <div className="space-y-5 text-sm leading-relaxed text-gray-700">
        <p>
          At <strong>Vinvin Network Srls</strong>, we respect your privacy and protect your personal data across bookings, chats,
          and payments.
        </p>
        <h3 className="text-base font-semibold">1. Information We Collect</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Personal Data:</strong> Name, email, phone number, and billing details when you create an account or make a
            booking.
          </li>
          <li>
            <strong>Usage Data:</strong> How you interact with the platform, page visits, preferences, and search activity.
          </li>
          <li>
            <strong>Device & Location:</strong> Anonymized device data and location (with consent) to improve your experience.
          </li>
        </ul>
        <h3 className="text-base font-semibold">2. How We Use Your Data</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Process bookings and deliver tailored travel experiences.</li>
          <li>Send confirmations, updates, and service notifications.</li>
          <li>Improve our platform through analytics and feedback.</li>
          <li>Ensure security, prevent fraud, and meet legal obligations.</li>
        </ul>
        <h3 className="text-base font-semibold">3. Sharing Your Information</h3>
        <p>We do not sell or rent data. We share only with:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Trusted providers (payments, hosting) under confidentiality agreements.</li>
          <li>Local hosts or guides when needed to facilitate bookings.</li>
          <li>Authorities, only when legally required.</li>
        </ul>
        <h3 className="text-base font-semibold">4. Your Rights</h3>
        <p>You can access, update, delete, or request a copy of your data and withdraw consent where applicable.</p>
        <p>
          Contact <a className="text-blue-600 underline" href="mailto:privacy@vuoiaggio.it">privacy@vuoiaggio.it</a> for any
          privacy request.
        </p>
        <h3 className="text-base font-semibold">5. Data Security</h3>
        <p>We store information on secure servers and transmit data using encryption where appropriate.</p>
      </div>
    ),
    [],
  );

  const termsContent = useMemo(
    () => (
      <div className="space-y-5 text-sm leading-relaxed text-gray-700">
        <p>
          Welcome to <strong>Vinvin Network Srls</strong>. By accessing or using our platform, you agree to comply with these
          Terms of Service.
        </p>
        <h3 className="text-base font-semibold">1. Use of Our Services</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>You must be at least 18 years old or have guardian consent.</li>
          <li>Provide accurate and complete information during registration.</li>
          <li>Unauthorized use or access is prohibited.</li>
        </ul>
        <h3 className="text-base font-semibold">2. Bookings and Payments</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Agree to pay the full amount displayed, including taxes and fees.</li>
          <li>Bookings follow the <strong>Cancellation Policy</strong> above.</li>
          <li>We may cancel bookings in cases of fraud, misrepresentation, or conflicts.</li>
        </ul>
        <h3 className="text-base font-semibold">3. User Conduct</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Treat hosts, guests, and our team with respect and courtesy.</li>
          <li>Disruptive or unlawful behavior may result in account suspension or removal.</li>
        </ul>
        <h3 className="text-base font-semibold">4. Intellectual Property</h3>
        <p>
          All content on the platform is owned or licensed by Vinvin Network and protected by law. Do not copy or distribute our
          content without consent.
        </p>
        <h3 className="text-base font-semibold">5. Limitation of Liability</h3>
        <p>
          Vinvin is not responsible for direct or indirect damages from using our services. We act as a booking intermediary and
          do not control host or guest conduct.
        </p>
        <h3 className="text-base font-semibold">6. Termination</h3>
        <p>We may suspend or terminate access if you breach these terms or harm the community.</p>
        <h3 className="text-base font-semibold">7. Changes to These Terms</h3>
        <p>We may update these Terms of Service; continued use after updates constitutes acceptance.</p>
        <p>For questions about these terms, contact us anytime.</p>
      </div>
    ),
    [],
  );

  const paymentTermsContent = useMemo(
    () => (
      <div className="space-y-5 text-sm leading-relaxed text-gray-700">
        <p>
          These payment terms outline how charges, payouts, and refunds work on Vinvin. They complement our Terms of Service and
          Cancellation Policy.
        </p>
        <h3 className="text-base font-semibold">Charges & Authorizations</h3>
        <p>
          You authorize Vinvin to charge the payment method on file at booking confirmation. Some bookings may place a temporary
          authorization before final capture.
        </p>
        <h3 className="text-base font-semibold">Payout Timing</h3>
        <p>Hosts and promoters receive payouts according to their configured method, typically within standard banking times.</p>
        <h3 className="text-base font-semibold">Refunds</h3>
        <p>
          Refunds follow the Cancellation Policy. Processing times depend on your bank or payment provider and may take 5–10
          business days to appear.
        </p>
        <h3 className="text-base font-semibold">Disputes</h3>
        <p>
          If you notice unexpected charges, contact our support team immediately. We investigate disputes and may request
          documentation to resolve them.
        </p>
      </div>
    ),
    [],
  );

  return (
    <div className="bg-white">
      <Container>
        <div className="py-14 md:py-20">
          <div className="flex flex-col gap-10 rounded-3xl border border-neutral-100 bg-white px-6 py-10 shadow-xl md:px-10">
            <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 text-neutral-900">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-100">
                  <LuSparkles className="h-4 w-4" />
                  Help Center
                </div>
                <h1 className="text-3xl font-bold leading-tight md:text-4xl">Experience and provide with total confidence</h1>
                <p className="text-base text-neutral-700 md:text-lg">
                  Find quick answers, open our policy windows, and reach a real Operator in one streamlined place.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <LuLifeBuoy className="h-4 w-4" />
                    Chat with Operator
                  </button>
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
                  >
                    Browse trips
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-neutral-100 bg-sky-50/60 p-6 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-white p-2 text-sky-700 shadow-sm">
                    <LuBadgeHelp className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">24/7 care</p>
                    <p className="text-lg font-semibold">Get a human response — not a bot</p>
                    <p className="text-sm text-neutral-700">Operators reply directly in Messenger with your booking context.</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Fast routes</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold text-neutral-800">
                    <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">Payments & invoices</div>
                    <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">Reservation changes</div>
                    <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">Hosting support</div>
                    <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">Promoter earnings</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <div className="rounded-full bg-sky-50 p-2 text-sky-700">
                    <LuLifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Direct support</p>
                    <p className="text-xs text-neutral-600">
                      Open our key policy windows below or drop us a message for anything urgent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                    {card.icon}
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">{card.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <Container>
        <div className="space-y-10 rounded-2xl border border-neutral-100 bg-white p-6 pb-12 shadow-xl" id="policies">
          <div id="privacy" className="relative -top-24 h-0" aria-hidden />
          <div id="terms" className="relative -top-24 h-0" aria-hidden />
          <div id="promoter-guide" className="relative -top-24 h-0" aria-hidden />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sky-700">Resource library</p>
            <h2 className="text-2xl font-bold text-neutral-900">Need the fine print?</h2>
            <p className="text-sm text-neutral-600">
              Jump to any section below. Each card links directly to the detailed notes inside our footer policies.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsCancellationOpen(true)}
              className="group flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
            >
              <div className="mt-1 rounded-full bg-sky-50 p-2 text-sky-700">
                <LuBadgeHelp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">Cancellation policy</p>
                <p className="text-sm text-neutral-600">
                  Understand timelines, refunds, and what to do when plans change suddenly.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                  Open section
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="group flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
            >
              <div className="mt-1 rounded-full bg-sky-50 p-2 text-sky-700">
                <LuBadgeHelp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">Privacy at Vinvin</p>
                <p className="text-sm text-neutral-600">How we keep your personal data safe across bookings, chats, and payments.</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                  Open section
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="group flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
            >
              <div className="mt-1 rounded-full bg-sky-50 p-2 text-sky-700">
                <LuBadgeHelp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">Terms of service</p>
                <p className="text-sm text-neutral-600">The rules of the road for guests, promoters, and hosts collaborating on Vinvin.</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                  Open section
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPromoterGuideOpen(true)}
              className="group flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
            >
              <div className="mt-1 rounded-full bg-sky-50 p-2 text-sky-700">
                <LuBadgeHelp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">Promoter guide</p>
                <p className="text-sm text-neutral-600">Earn by sharing experiences — payouts, referrals, and best practices.</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                  Open section
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsUserPlaybookOpen(true)}
              className="group flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
            >
              <div className="mt-1 rounded-full bg-sky-50 p-2 text-sky-700">
                <LuBadgeHelp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">User&apos;s Playbook</p>
                <p className="text-sm text-neutral-600">Etiquette, safety, and platform best practices in one place.</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                  Open section
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPaymentTermsOpen(true)}
              className="group flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
            >
              <div className="mt-1 rounded-full bg-sky-50 p-2 text-sky-700">
                <LuBadgeHelp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">Payment terms</p>
                <p className="text-sm text-neutral-600">How payments flow, from authorizations to refunds.</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                  Open section
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </button>
          </div>
        </div>
      </Container>

      <Container className='py-14 md:py-20'>
        <div className="grid gap-8 pb-16 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
            {/* Left: FAQs */}
            <div className="flex h-full flex-col space-y-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
                <div>
                <p className="text-sm font-semibold text-sky-700">Guided answers</p>
                <h2 className="text-2xl font-bold text-neutral-900">Popular FAQs</h2>
                </div>
                {/* <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                Updated
                </span> */}
            </div>
            <div className="flex-1">
                <FAQ items={faqItems} />
            </div>
            </div>

            {/* Right: Newsletter */}
            <div className="flex h-full flex-col space-y-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
                <div>
                <p className="text-sm font-semibold text-sky-700">Stay in the loop</p>
                <h2 className="text-2xl font-bold text-neutral-900">
                    Newsletter
                </h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                Recommended
                </span>
            </div>
            <div className="flex flex-1 items-start justify-center pt-4">
                <Newsletter />
            </div>
            </div>
        </div>
        </Container>

        <Container>
                <p className="text-[11px] font-semibold text-black text-center">Vinvin | Experience World Beyond the Ordinary © 2026</p>
                <p className="text-[8px] font-semibold text-neutral-800 text-center">P.IVA 16688948322 | All Rights Reserved. </p>
        </Container>

      <Modal
        isOpen={isCancellationOpen}
        title="Cancellation policy"
        onClose={() => setIsCancellationOpen(false)}
        onSubmit={() => setIsCancellationOpen(false)}
        actionLabel="Close"
        body={cancellationContent}
        className=""
      />

      <Modal
        isOpen={isPromoterGuideOpen}
        title="Promoter's guide"
        onClose={() => setIsPromoterGuideOpen(false)}
        onSubmit={() => setIsPromoterGuideOpen(false)}
        actionLabel="Close"
        body={promotersGuideContent}
        className=""
      />

      <Modal
        isOpen={isUserPlaybookOpen}
        title="User's Playbook"
        onClose={() => setIsUserPlaybookOpen(false)}
        onSubmit={() => setIsUserPlaybookOpen(false)}
        actionLabel="Close"
        body={userPlaybookContent}
        className=""
      />

      <Modal
        isOpen={isPrivacyOpen}
        title="Privacy at vinvin"
        onClose={() => setIsPrivacyOpen(false)}
        onSubmit={() => setIsPrivacyOpen(false)}
        actionLabel="Close"
        body={privacyPolicyContent}
        className=""
      />

      <Modal
        isOpen={isTermsOpen}
        title="Terms of service"
        onClose={() => setIsTermsOpen(false)}
        onSubmit={() => setIsTermsOpen(false)}
        actionLabel="Close"
        body={termsContent}
        className=""
      />

      <Modal
        isOpen={isPaymentTermsOpen}
        title="Payment terms"
        onClose={() => setIsPaymentTermsOpen(false)}
        onSubmit={() => setIsPaymentTermsOpen(false)}
        actionLabel="Close"
        body={paymentTermsContent}
        className=""
      />
    </div>
  );
};

export default HelpCenterContent;