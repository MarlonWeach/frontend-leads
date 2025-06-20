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
      // 🎨 Nova paleta de cores da Weach
      colors: {
        background: '#021526',        // Background escuro principal
        primary: '#2E5FF2',          // Azul primário
        secondary: '#416BBF',        // Azul secundário  
        accent: '#1D79F2',           // Azul de destaque
        cta: '#F29D35',             // Laranja para botões e CTAs
        // Mantendo electric para compatibilidade, mas agora aponta para primary
        electric: '#2E5FF2',
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
        'soft': '0 4px 24px 0 rgba(46, 95, 242, 0.12)',
        'glass': '0 8px 32px 0 rgba(46, 95, 242, 0.18)',
        'glass-refined': '0 0 12px rgba(255, 255, 255, 0.05)',
        'glass-light': '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(255, 255, 255, 0.05)',
        'glass-medium': '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(255, 255, 255, 0.08)',
        'glass-strong': '0 16px 48px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(255, 255, 255, 0.1)',
        'glass-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
        'primary-glow': '0 0 20px rgba(46, 95, 242, 0.4)',
        'cta-glow': '0 0 20px rgba(242, 157, 53, 0.4)',
      },
      // 💎 Utilitário para glassmorphism - ATUALIZADO
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      backgroundColor: {
        'glass': 'rgba(46, 95, 242, 0.08)',
        'glass-refined': 'rgba(255, 255, 255, 0.05)',
        'glass-light': 'rgba(255, 255, 255, 0.03)',
        'glass-medium': 'rgba(255, 255, 255, 0.08)',
        'glass-strong': 'rgba(255, 255, 255, 0.12)',
        'glass-hover': 'rgba(255, 255, 255, 0.1)',
      },
      borderColor: {
        'glass': 'rgba(46, 95, 242, 0.2)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'glass-border-light': 'rgba(255, 255, 255, 0.05)',
        'glass-border-strong': 'rgba(255, 255, 255, 0.15)',
      },
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // 📝 Tipografia responsiva - ATUALIZADA
      fontSize: {
        'title': ['clamp(1.75rem, 2vw, 2.25rem)', { 
          lineHeight: 'clamp(2.25rem, 2.5vw, 2.75rem)', 
          fontWeight: '700',
          textShadow: '0 0 4px rgba(245, 247, 250, 0.2)'
        }],
        'subtitle': ['clamp(1.125rem, 1.5vw, 1.5rem)', { 
          lineHeight: 'clamp(1.5rem, 1.75vw, 2rem)', 
          fontWeight: '500' 
        }],
        'sublabel': ['clamp(0.875rem, 1vw, 1.125rem)', { 
          lineHeight: 'clamp(1.25rem, 1.5vw, 1.625rem)', 
          fontWeight: '400',
          opacity: '0.7',
          textShadow: '0 0 2px rgba(245, 247, 250, 0.1)',
          letterSpacing: '0.5px'
        }],
        'metric-value': ['clamp(1.25rem, 2.5vw, 2.25rem)', { 
          lineHeight: 'clamp(1.5rem, 3vw, 2.5rem)', 
          fontWeight: '700',
          textAlign: 'center'
        }],
        'metric-label': ['clamp(0.75rem, 1vw, 0.875rem)', { 
          lineHeight: 'clamp(1rem, 1.25vw, 1.125rem)', 
          fontWeight: '500',
          textAlign: 'center'
        }],
        'metric-subinfo': ['clamp(0.65rem, 0.875vw, 0.75rem)', { 
          lineHeight: 'clamp(0.875rem, 1vw, 1rem)', 
          fontWeight: '400',
          textAlign: 'center',
          opacity: '0.8'
        }],
      },
      // 📱 Responsividade de espaçamento
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      // 🎯 Cores de texto customizadas
      textColor: {
        'primary-text': '#F5F7FA',      // Texto principal
        'secondary-text': 'rgba(245, 247, 250, 0.7)', // Texto secundário
      },
    },
  },
  plugins: [],
}