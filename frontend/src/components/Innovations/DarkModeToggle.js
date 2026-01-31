// Dark Mode Toggle - Theme switching with persistence
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DarkModeToggle = ({ size = 'md' }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const sizes = {
    sm: { button: 'w-8 h-8', icon: 'text-sm' },
    md: { button: 'w-10 h-10', icon: 'text-lg' },
    lg: { button: 'w-12 h-12', icon: 'text-xl' },
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsDark(!isDark)}
      className={`${sizes[size].button} rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-md relative overflow-hidden`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`${sizes[size].icon} text-yellow-500`}
          >
            🌙
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`${sizes[size].icon} text-yellow-500`}
          >
            ☀️
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

// Global theme observer for system preference changes
export const ThemeObserver = ({ children }) => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return children;
};

export default DarkModeToggle;
