import { motion } from 'motion/react';

interface WelcomeScreenProps {
  userName?: string;
  isDark: boolean;
}

export default function WelcomeScreen({ userName = "User", isDark }: WelcomeScreenProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 w-full max-w-xl mx-auto shrink-0 relative select-none pt-1 sm:pt-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2 mb-1.5 sm:mb-2"
      >
        <span
          className={`text-[11px] sm:text-[13px] font-medium tracking-[0.18em] uppercase ${
            isDark ? 'text-[#a78bfa]' : 'text-[#7c3aed]'
          }`}
        >
          {getGreeting()}
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className={`text-[28px] sm:text-4xl md:text-[42px] font-bold tracking-tight text-balance leading-tight ${
          isDark ? 'text-white' : 'text-[#0f172a]'
        }`}
      >
        Welcome,{' '}
        <span className="bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#db2777] bg-clip-text text-transparent">
          {userName}
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className={`mt-1.5 sm:mt-2 text-[13.5px] sm:text-[15px] md:text-base max-w-md leading-relaxed font-normal ${
          isDark ? 'text-zinc-400' : 'text-[#64748b]'
        }`}
      >
        Choose an assistant to begin
      </motion.p>
    </div>
  );
}

