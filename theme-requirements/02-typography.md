# Sensationals - Typography System

**Gebaseerd op:** Screenshot analyse van Sensationals webshop

## 🔤 Font Families

### **Primary Fonts**
```json
{
  "headingFont": "Poppins",
  "bodyFont": "Inter",
  "monoFont": "Courier New"
}
```

### **Font Stack (Fallbacks)**
```css
--font-heading: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'Courier New', Courier, monospace;
```

---

## 📏 Font Sizes

### **Scale System**
```json
{
  "fontSize": {
    "xs": "0.75rem",      // 12px
    "sm": "0.875rem",     // 14px
    "base": "1rem",       // 16px
    "lg": "1.125rem",     // 18px
    "xl": "1.25rem",      // 20px
    "2xl": "1.5rem",      // 24px
    "3xl": "1.875rem",    // 30px
    "4xl": "2.25rem",     // 36px
    "5xl": "3rem",        // 48px
    "6xl": "3.75rem",     // 60px
    "7xl": "4.5rem"       // 72px
  }
}
```

### **Usage per Element**
```css
/* Hero Heading */
.hero-title {
  font-family: var(--font-heading);
  font-size: 3.75rem; /* 60px */
  font-weight: 700;
  line-height: 1.1;
}

/* Section Headings */
.section-heading {
  font-family: var(--font-heading);
  font-size: 2.25rem; /* 36px */
  font-weight: 600;
  line-height: 1.2;
}

/* Product Title */
.product-title {
  font-family: var(--font-heading);
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.3;
}

/* Body Text */
.body-text {
  font-family: var(--font-body);
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.6;
}

/* Small Text */
.text-small {
  font-family: var(--font-body);
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  line-height: 1.5;
}
```

---

## ⚖️ Font Weights

### **Weight Scale**
```json
{
  "fontWeight": {
    "light": 300,
    "normal": 400,
    "medium": 500,
    "semibold": 600,
    "bold": 700,
    "extrabold": 800
  }
}
```

### **Weight Usage**
```css
/* Headers */
h1, h2, h3 { font-weight: 700; }
h4, h5 { font-weight: 600; }
h6 { font-weight: 500; }

/* Body */
body, p { font-weight: 400; }

/* Emphasis */
strong, .font-bold { font-weight: 700; }
em, .font-medium { font-weight: 500; }

/* Buttons */
.btn { font-weight: 600; }
.btn-primary { font-weight: 700; }
```

---

## 📐 Line Heights

### **Line Height Scale**
```json
{
  "lineHeight": {
    "none": 1,
    "tight": 1.2,
    "snug": 1.3,
    "normal": 1.5,
    "relaxed": 1.6,
    "loose": 1.8
  }
}
```

### **Usage**
```css
/* Headings - Tight */
h1, h2, h3 { line-height: 1.2; }

/* Body - Normal */
p, li { line-height: 1.6; }

/* Small text - Relaxed */
.text-sm, .caption { line-height: 1.5; }
```

---

## 🎯 Typography Components

### **Hero Title**
```css
.hero-title {
  font-family: 'Poppins', sans-serif;
  font-size: 3.75rem; /* 60px */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #1F2937;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.25rem; /* 36px */
  }
}
```

### **Welcome Card Title**
```css
.welcome-title {
  font-family: 'Poppins', sans-serif;
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  line-height: 1.2;
  color: #1F2937;
  margin-bottom: 1rem;
}
```

### **Product Name**
```css
.product-name {
  font-family: 'Poppins', sans-serif;
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  line-height: 1.3;
  color: #1F2937;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
```

### **Product Price**
```css
.product-price {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
  line-height: 1;
  color: #8B5CF6;
}

.product-price-old {
  font-size: 1.125rem; /* 18px */
  font-weight: 400;
  color: #9CA3AF;
  text-decoration: line-through;
}

.product-price-discount {
  font-size: 1rem;
  font-weight: 600;
  color: #EF4444;
}
```

### **Button Text**
```css
.btn-text {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem; /* 16px */
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-text-large {
  font-size: 1.125rem; /* 18px */
}
```

### **Section Heading**
```css
.section-heading {
  font-family: 'Poppins', sans-serif;
  font-size: 2.25rem; /* 36px */
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: #1F2937;
  margin-bottom: 2rem;
}

.section-heading::after {
  content: '';
  display: block;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #8B5CF6, #EC4899);
  margin: 1rem auto 0;
  border-radius: 2px;
}
```

### **Body Content**
```css
.body-content {
  font-family: 'Inter', sans-serif;
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.6;
  color: #6B7280;
}

.body-content strong {
  font-weight: 600;
  color: #1F2937;
}
```

### **Badge Text**
```css
.badge {
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem; /* 12px */
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 📱 Responsive Typography

### **Mobile (< 768px)**
```css
@media (max-width: 768px) {
  :root {
    --font-size-hero: 2rem;        /* 32px */
    --font-size-h1: 1.875rem;      /* 30px */
    --font-size-h2: 1.5rem;        /* 24px */
    --font-size-h3: 1.25rem;       /* 20px */
    --font-size-base: 1rem;        /* 16px */
  }
}
```

### **Tablet (768px - 1024px)**
```css
@media (min-width: 768px) and (max-width: 1024px) {
  :root {
    --font-size-hero: 3rem;        /* 48px */
    --font-size-h1: 2.25rem;       /* 36px */
    --font-size-h2: 1.875rem;      /* 30px */
    --font-size-h3: 1.5rem;        /* 24px */
    --font-size-base: 1rem;        /* 16px */
  }
}
```

### **Desktop (> 1024px)**
```css
@media (min-width: 1024px) {
  :root {
    --font-size-hero: 3.75rem;     /* 60px */
    --font-size-h1: 2.25rem;       /* 36px */
    --font-size-h2: 1.875rem;      /* 30px */
    --font-size-h3: 1.5rem;        /* 24px */
    --font-size-base: 1rem;        /* 16px */
  }
}
```

---

## ✨ Special Effects

### **Text Gradient**
```css
.text-gradient {
  background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### **Text Shadow**
```css
.text-shadow-soft {
  text-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
}

.text-shadow-strong {
  text-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
}
```

---

## 📋 CSS Variables

```css
:root {
  /* Font Families */
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  /* Font Sizes */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;
  --font-size-6xl: 3.75rem;
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  
  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;
  
  /* Letter Spacing */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
}
```
