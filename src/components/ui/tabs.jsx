import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Tabs({ tabs, activeTab, onTabChange, className = '' }) {
  return (
    <div className={`flex space-x-1 glass-card backdrop-blur-lg p-2 rounded-2xl ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-2 rounded-xl text-sublabel-refined font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-electric text-background shadow-glass'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className}`}
      {...props}
    />
  );
}

export function TabsContent({ value, className, children, ...props }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 