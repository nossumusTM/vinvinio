'use client';
import { useState } from 'react';
import { TbBrandTelegram, TbBrandTiktok, TbBrandInstagram, TbBrandFacebook, TbBrandX } from 'react-icons/tb';
import { FiYoutube } from "react-icons/fi";
import useMessenger from '@/app/hooks/useMessager';
import Modal from './modals/Modal';
import useLoginModal from '../hooks/useLoginModal';

interface FooterProps {
  currentUser: any; // You can replace `any` with your actual `User` type if available
}

const Footer: React.FC<FooterProps> = ({ currentUser }) => {

  const messenger = useMessenger();
  const [isCancellationOpen, setIsCancellationOpen] = useState(false);
  const [isPromoterGuideOpen, setIsPromoterGuideOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const loginModal = useLoginModal();

  const cancellationContent = (
    <div className="text-gray-700 text-sm space-y-5 leading-relaxed">
      <p>
        Thank you for choosing to book your experience through <strong>Vuoiaggio</strong>, your trusted platform for unique local adventures and curated travel experiences. Our mission is to ensure every guest has a seamless and enriching journey. We understand that plans can change, and our cancellation policy is designed to be fair and transparent while respecting the time and effort of our hosts.
      </p>
  
      <h3 className="text-base font-semibold mt-6">Cancellation Rules for Guests</h3>
      <p>
      All cancellations must be requested through your booking account, by contacting our support team via email, or by sending a message directly to Operator via Messenger.
      </p>
  
      <div className="space-y-3">
        <div>
          <p className="font-medium">1. No Refund (Within 24 Hours of Booking Date):</p>
          <p>
            Cancellations made <strong>within 24 hours</strong> of the scheduled experience will <strong>not</strong> be eligible for any refund, regardless of the reason. This policy ensures our local hosts are fairly compensated for last-minute disruptions.
          </p>
        </div>
  
        <div>
          <p className="font-medium">2. 50% Refund (Within 3 Business Days):</p>
          <p>
            Cancellations made <strong>within 3 business days</strong> of the scheduled experience will receive a <strong>50% refund</strong> of the total booking amount. The remaining amount covers partial compensation to the host and processing fees.
          </p>
        </div>
  
        <div>
          <p className="font-medium">3. Full Refund (At Least 7 Days in Advance):</p>
          <p>
            Guests who cancel <strong>7 or more days</strong> before the scheduled booking date are entitled to a <strong>full refund</strong> of the payment, excluding any third-party payment processing fees.
          </p>
        </div>
      </div>
  
      <h3 className="text-base font-semibold mt-6">Important Notes:</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>Refunds will be processed within 5–10 business days after cancellation approval.</li>
        <li>Business days are Monday through Friday, excluding public holidays.</li>
        <li>No refunds are available once the experience has started.</li>
        <li>In rare cases of emergency or unforeseen events, guests may contact support with documentation for further consideration.</li>
      </ul>
  
      <h3 className="text-base font-semibold mt-6">Need Help?</h3>
      <p>
        If you have any questions about our cancellation policy or need assistance with your booking, feel free to reach out.
      </p>
      <div className="space-y-1 text-sm">
        <p><strong>Vuoiaggio International Srls.</strong></p>
        <p>P.IVA 57483813574</p>
        <p>Via Novacella 18, Rome, Italy</p>
        <p>Phone: +39 371 528 4911</p>
        <p>Email: <a href="mailto:privacy@vuoiaggio.it" className="text-blue-600 underline">privacy@vuoiaggio.it</a></p>
      </div>
    </div>
  );  

  const promotersGuideContent = (
    <div className="text-gray-700 text-sm space-y-5 leading-relaxed">
      <p>
        Welcome to the <strong>Vuoiaggio International Promoters Program</strong> — a unique opportunity for passionate individuals who want to grow with our global travel platform. Whether you&rsquo;re a content creator, travel enthusiast, digital marketer, or just someone who loves connecting people with amazing experiences, we invite you to become a part of our journey.
      </p>
  
      <h3 className="text-base font-semibold mt-6">How to Become a Promoter</h3>
      <p>
        If you&rsquo;re interested in joining our Promoters Program, simply send us an email at <a href="mailto:promoters@vuoiaggio.it" className="text-blue-600 underline">promoters@vuoiaggio.it</a>. Our team will review your request and provide you with access to your unique promoter dashboard, where you&rsquo;ll find your referral tools and track your earnings.
      </p>
  
      <h3 className="text-base font-semibold mt-6">Earning with Vuoiaggio</h3>
      <p>
        As a Promoter, you&rsquo;ll receive <strong>10% of the total revenue</strong> generated through bookings made using your referral ID. Your earnings are calculated monthly and based directly on the bookings confirmed through your shared links.
      </p>
  
      <h3 className="text-base font-semibold mt-6">Global Community, Local Focus</h3>
      <p>
        Our platform welcomes promoters from all corners of the world. While our experiences are currently based in Rome, Italy, you can still join our program no matter where you live. Even if you&rsquo;re outside the EU, you are encouraged to share your unique referral ID and drive traffic to our platform.
      </p>
      <p>
        The more users you engage, the higher your chance to earn. Our referral system tracks navigations and conversions to ensure your efforts are accurately rewarded.
      </p>
  
      <h3 className="text-base font-semibold mt-6">Payouts and Frequency</h3>
      <p>
        Promoters will receive their earnings <strong>twice a month</strong>. Deposits are made to the payout method configured in your account settings. Please ensure your payout information is accurate and up-to-date to avoid any delays.
      </p>
  
      <h3 className="text-base font-semibold mt-6">Need Assistance?</h3>
      <p>
        Our support team is always here to help you succeed. For any questions regarding your account, referral tracking, or earnings, please reach out to us at <a href="mailto:promoters@vuoiaggio.it" className="text-blue-600 underline">promoters@vuoiaggio.it</a>.
      </p>
  
      <div className="space-y-1 text-sm">
        <p><strong>Vuoiaggio International Srls.</strong></p>
        <p>P.IVA 57483813574</p>
        <p>Via Novacella 18, Rome, Italy</p>
        <p>Phone: +39 371 528 4911</p>
        <p>Email: <a href="mailto:privacy@vuoiaggio.it" className="text-blue-600 underline">privacy@vuoiaggio.it</a></p>
      </div>
    </div>
  );  

  const privacyPolicyContent = (
    <div className="text-gray-700 text-sm space-y-5 leading-relaxed">
      <p>
        At <strong>Vuoiaggio International Srls</strong>, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you interact with our platform and services.
      </p>
  
      <h3 className="text-base font-semibold mt-6">1. Information We Collect</h3>
      <ul className="list-disc list-inside space-y-1">
        <li><strong>Personal Data:</strong> When you create an account or make a booking, we collect your name, email, phone number, and billing details.</li>
        <li><strong>Usage Data:</strong> We collect data about your interactions with the platform, such as page visits, preferences, and search activity.</li>
        <li><strong>Device & Location:</strong> We may collect anonymized device data and location (with your consent) to improve your experience.</li>
      </ul>
  
      <h3 className="text-base font-semibold mt-6">2. How We Use Your Data</h3>
      <p>Your information helps us:</p>
      <ul className="list-disc list-inside space-y-1">
        <li>Process bookings and deliver tailored travel experiences.</li>
        <li>Send booking confirmations, important updates, or service-related notifications.</li>
        <li>Improve our platform through analytics and user feedback.</li>
        <li>Ensure security, prevent fraud, and comply with legal obligations.</li>
      </ul>
  
      <h3 className="text-base font-semibold mt-6">3. Sharing Your Information</h3>
      <p>
        We do not sell or rent your personal data. Your information is only shared with:
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Trusted service providers (payment processors, hosting providers) under strict confidentiality agreements.</li>
        <li>Local hosts or guides when needed to facilitate your booking.</li>
        <li>Authorities, only when legally required to comply with laws or defend rights.</li>
      </ul>
  
      <h3 className="text-base font-semibold mt-6">4. Your Rights</h3>
      <p>You have the right to:</p>
      <ul className="list-disc list-inside space-y-1">
        <li>Access, update, or delete your personal data.</li>
        <li>Request a copy of your stored information.</li>
        <li>Withdraw consent for data processing, where applicable.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at <a href="mailto:privacy@vuoiaggio.it" className="text-blue-600 underline">privacy@vuoiaggio.it</a>.
      </p>
  
      <h3 className="text-base font-semibold mt-6">5. Data Security</h3>
      <p>
        We implement strong security measures to protect your data. Your information is stored on secure servers and transmitted using encryption where appropriate.
      </p>
  
      <h3 className="text-base font-semibold mt-6">6. Changes to This Policy</h3>
      <p>
        We may update this Privacy Policy periodically. Changes will be posted on this page and, where appropriate, notified to you via email.
      </p>
  
      <div className="space-y-1 text-sm">
        <p><strong>Vuoiaggio International Srls.</strong></p>
        <p>P.IVA 57483813574</p>
        <p>Via Novacella 18, Rome, Italy</p>
        <p>Phone: +39 371 528 4911</p>
        <p>Email: <a href="mailto:privacy@vuoiaggio.it" className="text-blue-600 underline">privacy@vuoiaggio.it</a></p>
      </div>
    </div>
  );  

  const termsContent = (
    <div className="text-gray-700 text-sm space-y-5 leading-relaxed">
      <p>
        Welcome to <strong>Vuoiaggio International Srls</strong>. By accessing or using our platform, you agree to comply with and be bound by the following Terms of Service. These terms apply to all users, including guests, promoters, and hosts.
      </p>
  
      <h3 className="text-base font-semibold mt-6">1. Use of Our Services</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>You must be at least 18 years old to use our platform or have the consent of a legal guardian.</li>
        <li>You agree to provide accurate and complete information during registration and while using our services.</li>
        <li>Any unauthorized use or access to our platform is prohibited.</li>
      </ul>
  
      <h3 className="text-base font-semibold mt-6">2. Bookings and Payments</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>When booking an experience, you agree to pay the full amount displayed, including applicable taxes and fees.</li>
        <li>All bookings are subject to our <strong>Cancellation Policy</strong>, which must be reviewed before confirming a reservation.</li>
        <li>We reserve the right to cancel a booking in cases of fraud, misrepresentation, or availability conflicts.</li>
      </ul>
  
      <h3 className="text-base font-semibold mt-6">3. User Conduct</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>Users must treat hosts, guests, and our team with respect and courtesy.</li>
        <li>Disruptive, abusive, or unlawful behavior on the platform or during an experience may result in account suspension or removal.</li>
      </ul>
  
      <h3 className="text-base font-semibold mt-6">4. Intellectual Property</h3>
      <p>
        All content on the platform — including logos, media, listings, and design — is owned or licensed by Vuoiaggio International and protected by intellectual property laws. You may not copy, reproduce, or distribute our content without written consent.
      </p>
  
      <h3 className="text-base font-semibold mt-6">5. Limitation of Liability</h3>
      <p>
        Vuoiaggio is not responsible for direct or indirect damages arising from the use of our services, including issues during travel or interactions between users. We act solely as a booking intermediary and do not control the conduct of hosts or guests.
      </p>
  
      <h3 className="text-base font-semibold mt-6">6. Termination</h3>
      <p>
        We reserve the right to suspend or terminate your access to the platform if you breach these terms or engage in behavior that harms the community.
      </p>
  
      <h3 className="text-base font-semibold mt-6">7. Changes to These Terms</h3>
      <p>
        We may update these Terms of Service at any time. Significant changes will be posted on our platform and, if necessary, communicated via email. Continued use of the platform after updates constitutes acceptance of the new terms.
      </p>
  
      <h3 className="text-base font-semibold mt-6">Contact Information</h3>
      <p>
        For questions or concerns regarding these terms, please contact us at:
      </p>
      <div className="space-y-1 text-sm">
        <p><strong>Vuoiaggio International Srls.</strong></p>
        <p>P.IVA 57483813574</p>
        <p>Via Novacella 18, Rome, Italy</p>
        <p>Phone: +39 371 528 4911</p>
        <p>Email: <a href="mailto:privacy@vuoiaggio.it" className="text-blue-600 underline">privacy@vuoiaggio.it</a></p>
      </div>
    </div>
  );  

  return (
    <footer className="bg-[#F9F9F9] text-gray-800 px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-x-4">
        {/* Support Section */}
        <div className="flex flex-col justify-center md:pl-10 md:ml-10">
          <h3 className="font-semibold text-lg mb-4">Support</h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => {
                  if (!currentUser) {
                    loginModal.onOpen();
                    return;
                  }

                  messenger.openChat({
                    id: '67ef2895f045b7ff3d0cf6fc',
                    name: 'Operator',
                    image: '/images/operator.jpg',
                  });
                }}
                className="hover:underline transition"
              >
                Help Center
              </button>
            </li>

            <li>
            <button onClick={() => setIsCancellationOpen(true)} className="hover:underline transition">
                  Cancellation options
                </button>
            </li>
            <li>
            <button onClick={() => setIsPromoterGuideOpen(true)} className="hover:underline transition">
                  Promoters Guide
                </button>
            </li>
          </ul>
        </div>

        {/* Legal Section */}
        <div className="flex flex-col justify-center">
          <h3 className="font-semibold text-lg mb-4">Legal</h3>
          <ul className="space-y-2">
            <li>
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:underline transition">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => setIsTermsOpen(true)} className="hover:underline transition">
                Terms and Conditions
              </button>
            </li>
            <li><a href="#" className="hover:underline transition">Sitemap</a></li>
          </ul>
        </div>

        {/* Right side on desktop */}
        <div className="flex flex-col justify-center">
          {/* <h3 className="font-semibold text-lg mb-4 underline">Social channels</h3> */}
            <div className="flex space-x-4 text-xl">
                <a href="#"><TbBrandTelegram className="hover:text-[#25F4EE] text-3xl transition" /></a>
                <a href="#"><FiYoutube className="hover:text-[#25F4EE] text-3xl transition" /></a>
                <a href="#"><TbBrandTiktok className="hover:text-[#25F4EE] text-3xl transition" /></a>
                <a href="#"><TbBrandInstagram className="hover:text-[#25F4EE] text-3xl transition" /></a>
            </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-gray-300 my-8"></div>

      {/* Bottom Bar */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-center text-center md:text-left gap-4 mt-8 w-full md:pl-10 md:ml-10">
    {/* Left side on desktop */}
    <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
        <p className="text-sm">&copy; 2025 Vuoiaggio International Srls.</p>
        <p className="text-sm">P.IVA 57483813574</p>
    </div>
    </div>

      {/* Cancellation Policy Modal */}
      <Modal
        isOpen={isCancellationOpen}
        onClose={() => setIsCancellationOpen(false)}
        onSubmit={() => setIsCancellationOpen(false)}
        title="Cancellation Policy"
        body={cancellationContent}
        actionLabel="Close"
        className="max-h-[65vh] overflow-y-auto"
      />

      {/* Promoters Guide Modal */}
      <Modal
        isOpen={isPromoterGuideOpen}
        onClose={() => setIsPromoterGuideOpen(false)}
        onSubmit={() => setIsPromoterGuideOpen(false)}
        title="Promoters Guide"
        body={promotersGuideContent}
        actionLabel="Close"
        className="max-h-[65vh] overflow-y-auto"
      />

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onSubmit={() => setIsPrivacyOpen(false)}
        title="Privacy Policy"
        body={privacyPolicyContent}
        actionLabel="Close"
        className="max-h-[65vh] overflow-y-auto"
      />

      {/* Terms of Service Modal */}
      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onSubmit={() => setIsTermsOpen(false)}
        title="Terms of Service"
        body={termsContent}
        actionLabel="Close"
        className="max-h-[65vh] overflow-y-auto"
      />
    </footer>
  );
};

export default Footer;
