import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const FAQS = [
  {
    question: 'How do I start a new chat?',
    answer: 'Click the "New chat" button in the top right corner of the header. This will clear the current workspace context and let you start fresh.'
  },
  {
    question: 'What is the Smart Prompt Enhancer?',
    answer: 'The Smart Prompt Enhancer (the magic wand icon) automatically refines your short or simple prompts into highly detailed instructions before sending them, giving you much better results every time.'
  },
  {
    question: 'How do I change the theme?',
    answer: 'Go to Settings > General > Appearance to switch between Light and Dark mode.'
  },
  {
    question: 'Are my chats saved?',
    answer: 'Yes, your chats are saved locally on your device for each specific workspace. You can view your overall history by opening the sidebar and clicking "Recent Chats".'
  },
  {
    question: 'How do I clear my data?',
    answer: 'Navigate to Settings > Data Controls. Here you can permanently delete all conversation history across all workspaces.'
  }
];

export default function HelpModal({ isOpen, onClose, isDark }: HelpModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl ${
            isDark ? 'bg-[#121212] border border-white/10' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                <HelpCircle size={24} />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Help & FAQ</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto hide-scrollbar">
            <div className="space-y-3">
              {FAQS.map((faq, index) => (
                <div 
                  key={index}
                  className={`rounded-2xl border overflow-hidden transition-colors ${
                    isDark ? 'border-white/5 bg-white/5' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors"
                  >
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {faq.question}
                    </span>
                    <ChevronDown 
                      size={20} 
                      className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} 
                    />
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className={`px-5 pb-5 leading-relaxed text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            
            <div className={`mt-8 p-5 rounded-2xl border flex items-start gap-4 ${isDark ? 'border-indigo-500/20 bg-indigo-500/10' : 'border-indigo-100 bg-indigo-50'}`}>
              <div className="flex-1">
                <h4 className={`font-bold mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Still need help?</h4>
                <p className={`text-sm ${isDark ? 'text-indigo-200/70' : 'text-indigo-600/80'}`}>
                  If you have a question that isn't covered here, feel free to ask the Chat Assistant directly for guidance on how to use this application.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
