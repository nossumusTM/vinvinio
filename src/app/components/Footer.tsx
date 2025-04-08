'use client';

import { TbBrandTelegram, TbBrandTiktok, TbBrandInstagram, TbBrandFacebook, TbBrandX } from 'react-icons/tb';
import useMessenger from '@/app/hooks/useMessager';

const Footer = () => {

  const messenger = useMessenger();

  return (
    <footer className="bg-[#F9F9F9] text-gray-800 px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-x-4">
        {/* Support Section */}
        <div className="flex flex-col justify-center md:pl-10 md:ml-10">
          <h3 className="font-semibold text-lg mb-4 underline">Support</h3>
          <ul className="space-y-2">
          <li>
            <button
              onClick={() => messenger.openChat({ id: '67ef2895f045b7ff3d0cf6fc', name: 'Customer Service', image: '/images/customerservice.png' })}
              className="hover:underline"
            >
              Help Center
            </button>
          </li>

            <li><a href="#" className="hover:underline">Cancellation options</a></li>
            <li><a href="#" className="hover:underline">Promoters Guide</a></li>
          </ul>
        </div>

        {/* Legal Section */}
        <div className="flex flex-col justify-center">
          <h3 className="font-semibold text-lg mb-4 underline">Legal</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Privacy Policy</a></li>
            <li><a href="#" className="hover:underline">Terms and Conditions</a></li>
            <li><a href="#" className="hover:underline">Sitemap</a></li>
          </ul>
        </div>

        {/* Right side on desktop */}
        <div className="flex flex-col justify-center">
          <h3 className="font-semibold text-lg mb-4 underline">Social channels</h3>
            <div className="flex space-x-4 text-xl">
                <a href="#"><TbBrandTelegram className="hover:text-[#25F4EE] text-3xl" /></a>
                <a href="#"><TbBrandX className="hover:text-[#25F4EE] text-3xl" /></a>
                <a href="#"><TbBrandInstagram className="hover:text-[#25F4EE] text-3xl" /></a>
                <a href="#"><TbBrandTiktok className="hover:text-[#25F4EE] text-3xl" /></a>
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
    </footer>
  );
};

export default Footer;
