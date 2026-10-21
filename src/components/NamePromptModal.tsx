import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface NamePromptModalProps {
  isOpen: boolean;
  isDark: boolean;
  onSubmit: (name: string) => void;
}

export default function NamePromptModal({ isOpen, isDark, onSubmit }: NamePromptModalProps) {
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-[420px] overflow-hidden rounded-[24px] shadow-2xl ${
              isDark 
                ? 'bg-[#0f0f11] border border-white/[0.08]' 
                : 'bg-white border border-gray-100 shadow-gray-200/50'
            }`}
          >
            <div className="px-8 pt-8 pb-10">
              {/* Icon container */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center mb-6">
                <motion.img 
                  src="/logo.svg" 
                  alt="Logo" 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, ease: "linear", repeat: Infinity }}
                  className="relative z-10 w-16 h-16 object-contain"
                />
              </div>

              <div className="text-center">
                <h2 className={`text-2xl font-semibold tracking-tight mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  How should we call you?
                </h2>
                <p className={`text-[15px] mb-10 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter your name to personalize your workspace across this device.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Your name"
                    className={`w-full px-6 py-4 rounded-2xl text-center text-lg font-medium outline-none transition-all duration-300 ${
                      isDark 
                        ? 'bg-white/[0.04] text-white placeholder-gray-600 focus:bg-white/[0.06]' 
                        : 'bg-gray-50/80 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    style={{
                      boxShadow: isFocused 
                        ? isDark ? '0 0 0 1px rgba(255,255,255,0.3), 0 8px 32px -8px rgba(0,0,0,0.5)' : '0 0 0 1px rgba(0,0,0,0.1), 0 8px 32px -8px rgba(0,0,0,0.08)'
                        : isDark ? '0 0 0 1px rgba(255,255,255,0.05)' : '0 0 0 1px rgba(0,0,0,0.04)'
                    }}
                    autoFocus
                  />
                </div>
                
                <motion.button
                  type="submit"
                  disabled={!name.trim()}
                  whileTap={name.trim() ? { scale: 0.96 } : {}}
                  className={`group relative w-full flex items-center justify-center h-[60px] rounded-2xl font-semibold text-[16px] shadow-sm overflow-hidden transition-all duration-300 ${
                    name.trim() 
                      ? isDark 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'bg-black text-white hover:bg-gray-800'
                      : isDark 
                        ? 'bg-white/5 text-white/30 cursor-not-allowed shadow-none'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span className="relative z-10 flex items-center">
                    Get Started
                    <ArrowRight 
                      className={`ml-2 w-[18px] h-[18px] transition-all duration-300 ${
                        name.trim() ? 'opacity-100 group-hover:translate-x-1' : 'opacity-0 -translate-x-2'
                      }`} 
                    />
                  </span>
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
