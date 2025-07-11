'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <AnimatePresence>
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute z-50 px-2 py-1 text-sm text-white bg-glass rounded-2xl shadow-glass backdrop-blur-lg whitespace-nowrap transform -translate-x-1/2 left-1/2 -top-8"
          >
            {content}
            <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
} 