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
      // 🎨 Paleta de cores customizada - ATUALIZADA
      colors: {
        background: '#0E1117',
        electric: '#3A8DFF', // Azul elétrico - COR PRINCIPAL
        violet: '#8A2BE2',   // Violeta - NOVA COR SECUNDÁRIA
        // Removido: mint (verde menta)
        // Exemplo de uso: bg-background, text-electric, text-violet, etc.
      },
      // 🟦 Radius customizados
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '2rem',
        '3xl': '3rem',
        'full': '9999px',
      },
      // 🌑 Sombras customizadas - ATUALIZADAS
      boxShadow: {
        'soft': '0 4px 24px 0 rgba(16, 30, 54, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        'glass-refined': '0 0 12px rgba(255, 255, 255, 0.05)', // Novo: glassmorphism refinado
      },
      // 💎 Utilitário para glassmorphism - ATUALIZADO
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px', // Atualizado para 12px conforme especificação
        xl: '16px',
        '2xl': '24px',
      },
      backgroundColor: {
        'glass': 'rgba(255,255,255,0.08)',
        'glass-refined': 'rgba(255,255,255,0.05)', // Novo: glassmorphism mais sutil
      },
      borderColor: {
        'glass': 'rgba(255,255,255,0.1)', // Novo: borda para glassmorphism
      },
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // 📝 Tipografia responsiva - ATUALIZADA
      fontSize: {
        'title': ['clamp(1.75rem, 2vw, 2.25rem)', { 
          lineHeight: 'clamp(2.25rem, 2.5vw, 2.75rem)', 
          fontWeight: '700',
          textShadow: '0 0 4px rgba(255, 255, 255, 0.2)' // Brilho sutil em headers
        }],
        'subtitle': ['clamp(1.125rem, 1.5vw, 1.5rem)', { 
          lineHeight: 'clamp(1.5rem, 1.75vw, 2rem)', 
          fontWeight: '500' 
        }],
        'sublabel': ['clamp(0.875rem, 1vw, 1.125rem)', { 
          lineHeight: 'clamp(1.25rem, 1.5vw, 1.625rem)', 
          fontWeight: '400',
          opacity: '0.7',
          textShadow: '0 0 2px rgba(255, 255, 255, 0.1)', // Brilho sutil em sublabels
          letterSpacing: '0.5px'
        }],
      },
      // 📱 Responsividade de espaçamento
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      // 🎯 Utilitários para glassmorphism refinado
      extend: {
        backdropFilter: {
          'glass-refined': 'blur(12px)',
        },
      },
    },
  },
  plugins: [],
}