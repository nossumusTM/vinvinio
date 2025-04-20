'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

const FAQ: React.FC<FAQProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="mt-10 space-y-4">
      <h3 className="text-xl font-semibold text-center">Things You Might Wonder</h3>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={`bg-white shadow-md transition-all duration-300 ${
              isOpen ? 'rounded-xl' : 'rounded-xl'
            }`}
          >
            <button
              className={`flex justify-between items-center w-full px-4 py-3 text-left text-base font-medium hover:bg-gray-100 rounded-xl transition`}
              onClick={() => toggleIndex(index)}
            >
              {item.question}
              {isOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            <div
              className={`transition-all overflow-hidden px-4 ${
                isOpen ? 'max-h-[500px] pb-6 pt-2 opacity-100' : 'max-h-0 opacity-0'
              } text-sm text-neutral-700`}
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FAQ;
