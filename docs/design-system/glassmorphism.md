# 🎨 Design System - Glassmorphism e Identidade Visual

## 📋 **Visão Geral**

Este documento define a **identidade visual unificada** para toda a aplicação, garantindo consistência entre todas as páginas e componentes. O design é inspirado no **Apple Vision Pro + Baremetrics** com glassmorphism refinado.

---

## 🎯 **Princípios Fundamentais**

### **1. Identidade Visual Única**
- **Base**: Dark mode (#0E1117) com glassmorphism sofisticado
- **Acentos**: Azul elétrico (#2E5FF2), violeta (#8A2BE2), verde menta (#10B981)
- **Hierarquia**: Clara diferenciação entre elementos através de níveis de glassmorphism

### **2. Consistência Total**
- **Todos os cards** devem usar o componente `<Card>` unificado
- **Mesma tipografia** em todas as páginas (Satoshi)
- **Espaçamentos padronizados** (6, 8, 12, 16, 24px)

### **3. Responsividade Inteligente**
- **Mobile-first** com breakpoints consistentes
- **Animações suaves** em todas as interações
- **Performance otimizada** com fallbacks

---

## 🔮 **Classes de Glassmorphism**

### **Hierarquia Visual**

#### **`.glass-light`** - Elementos Sutis
```css
backdrop-filter: blur(10px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.08);
```
**Uso**: Filtros, badges, elementos secundários

#### **`.glass-medium`** - Cards Principais
```css
backdrop-filter: blur(16px);
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.15);
```
**Uso**: Cards de métricas, containers principais

#### **`.glass-strong`** - Modais e Tooltips
```css
backdrop-filter: blur(24px);
background: rgba(255, 255, 255, 0.15);
border: 1px solid rgba(255, 255, 255, 0.2);
```
**Uso**: Modais, tooltips, elementos em destaque

### **Efeitos Especiais**

#### **`.glass-hover`** - Interações
- Transição suave (400ms)
- Elevação visual (-4px translateY)
- Intensificação do blur e sombras

#### **`.glass-highlight`** - Brilho Superior
- Gradiente sutil no topo dos elementos
- Efeito de luz interna

---

## 🎨 **Paleta de Cores**

### **Cores Principais**
```css
/* Base */
--bg-primary: #0E1117;
--text-primary: #F5F7FA;

/* Acentos */
--primary: #2E5FF2;      /* Azul elétrico */
--accent: #8A2BE2;       /* Violeta */
--success: #10B981;      /* Verde menta */
--warning: #F59E0B;      /* Amarelo */
--error: #EF4444;        /* Vermelho */

/* Glassmorphism */
--glass-light: rgba(255, 255, 255, 0.05);
--glass-medium: rgba(255, 255, 255, 0.1);
--glass-strong: rgba(255, 255, 255, 0.15);
```

### **Uso de Cores**
- **Textos principais**: `text-white`
- **Textos secundários**: `text-white/70`
- **Textos terciários**: `text-white/60`
- **Ícones**: Cores temáticas (blue-500, green-500, orange-500, pink-500)

---

## 📝 **Tipografia Unificada**

### **Classes Principais**

#### **`.text-header`** - Títulos
```css
font-family: 'Satoshi', sans-serif;
font-weight: 700;
font-size: clamp(1.75rem, 2vw, 2.25rem);
text-shadow: 0 0 4px rgba(245, 247, 250, 0.2);
```

#### **`.text-sublabel-refined`** - Subtítulos
```css
font-family: 'Satoshi', sans-serif;
font-weight: 400;
font-size: clamp(0.875rem, 1vw, 1.125rem);
opacity: 0.7;
letter-spacing: 0.5px;
```

---

## 🧩 **Componentes Padronizados**

### **Card Component**

#### **Uso Básico**
```jsx
<Card className="p-6">
  <h3 className="text-header">Título</h3>
  <p className="text-sublabel-refined">Conteúdo</p>
</Card>
```

#### **Card Interativo**
```jsx
<Card className="p-6" interactive>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sublabel-refined text-white/70">Label</p>
      <p className="text-2xl font-bold text-white">Valor</p>
    </div>
    <Icon className="h-8 w-8 text-primary" />
  </div>
</Card>
```

#### **Variantes**
```jsx
<Card variant="light">Sutil</Card>
<Card variant="default">Padrão</Card>
<Card variant="strong">Destaque</Card>
```

---

## 🎭 **Padrões de Layout**

### **Grid de Métricas**
```jsx
<div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
  {metrics.map(metric => (
    <Card key={metric.key} className="p-6" interactive>
      {/* Conteúdo da métrica */}
    </Card>
  ))}
</div>
```

### **Header de Página**
```jsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-header font-bold text-white">Título</h1>
    <p className="text-sublabel-refined text-white/70">Descrição</p>
  </div>
  <div className="flex items-center space-x-4">
    {/* Controles */}
  </div>
</div>
```

---

## ✨ **Animações e Transições**

### **Animações de Cards**
```jsx
// Com Framer Motion
<motion.div
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
>
  <Card className="p-6" interactive>
    {/* Conteúdo */}
  </Card>
</motion.div>
```

### **Transições CSS**
```css
.glass-hover {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-animate {
  animation: glass-appear 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

---

## 🔧 **Implementação por Página**

### **Dashboard** ✅
- Cards unificados com `<Card>`
- Glassmorphism consistente
- Tipografia padronizada
- Animações suaves

### **Performance** ✅
- Mesmo padrão visual do Dashboard
- Cards interativos
- Filtros com glassmorphism
- Cores e espaçamentos consistentes

### **Campanhas** 🔄 (Próximo)
- Aplicar mesmo padrão
- Substituir elementos customizados por `<Card>`
- Unificar tipografia

### **Leads** 🔄 (Próximo)
- Aplicar mesmo padrão
- Glassmorphism em tabelas
- Filtros consistentes

---

## 📱 **Responsividade**

### **Breakpoints**
```css
/* Mobile */
@media (max-width: 768px) {
  .glass-medium { backdrop-filter: blur(12px); }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) {
  .grid-responsive { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-responsive { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
}
```

---

## 🎯 **Checklist de Qualidade**

### **Visual**
- [ ] Glassmorphism visível e consistente
- [ ] Cores da paleta oficial
- [ ] Tipografia Satoshi aplicada
- [ ] Espaçamentos padronizados

### **Interação**
- [ ] Hover states suaves
- [ ] Animações de 300-400ms
- [ ] Feedback visual claro
- [ ] Responsividade testada

### **Performance**
- [ ] Fallbacks para navegadores antigos
- [ ] Otimização de animações
- [ ] Lazy loading implementado
- [ ] Bundle size otimizado

---

## 🚀 **Próximos Passos**

1. **Aplicar padrão em todas as páginas**
2. **Criar componentes reutilizáveis**
3. **Documentar variações específicas**
4. **Testes de acessibilidade**
5. **Otimizações de performance**

---

## 📚 **Referências**

- **Inspiração**: Apple Vision Pro, Baremetrics
- **Tipografia**: Satoshi Font Family
- **Animações**: Framer Motion
- **CSS**: Tailwind CSS + Custom Classes 