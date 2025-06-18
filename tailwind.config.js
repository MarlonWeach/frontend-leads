/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // ← ESTA LINHA É ESSENCIAL
  ],
  darkMode: 'class', // Habilita dark mode via classe
  theme: {
    extend: {
      // 🎨 Paleta de cores customizada
      colors: {
        background: '#0E1117',
        electric: '#3A8DFF', // Azul elétrico
        violet: '#7C3AED',   // Violeta
        mint: '#2FFFC3',     // Verde menta
        // Exemplo de uso: bg-background, text-electric, etc.
      },
      // 🟦 Radius customizados
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '2rem',
        '3xl': '3rem',
        'full': '9999px',
      },
      // 🌑 Sombras customizadas
      boxShadow: {
        'soft': '0 4px 24px 0 rgba(16, 30, 54, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
      },
      // 💎 Utilitário para glassmorphism
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      backgroundColor: {
        'glass': 'rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}