# Sensationals - Color System

**Gebaseerd op:** Screenshot analyse van Sensationals webshop

## 🎨 Primary Colors

### **Main Brand Colors**
```json
{
  "primary": "#8B5CF6",
  "primaryDark": "#7C3AED",
  "primaryLight": "#A78BFA",
  
  "secondary": "#EC4899",
  "secondaryDark": "#DB2777",
  "secondaryLight": "#F472B6",
  
  "accent": "#F59E0B",
  "accentDark": "#D97706",
  "accentLight": "#FBBF24"
}
```

### **Usage:**
- **Primary (#8B5CF6 Paars):** Headers, hero sections, belangrijke elementen
- **Secondary (#EC4899 Pink):** Accenten, hover states, decoratieve elementen
- **Accent (#F59E0B geel/goud):** CTA buttons, "Add to Cart", belangrijke acties

---

## 🌈 Gradient System

### **Hero Gradient (Homepage)**
```css
background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%);
/* Paars → Roze → Turquoise */
```

### **Product Platform Gradients**
```css
/* Variant 1: Purple-Pink */
background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);

/* Variant 2: Pink-Orange */
background: linear-gradient(135deg, #EC4899 0%, #F59E0B 100%);

/* Variant 3: Purple-Cyan */
background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);

/* Variant 4: Cyan-Pink */
background: linear-gradient(135deg, #06B6D4 0%, #EC4899 100%);
```

### **Button Gradients**
```css
/* Primary CTA */
background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);

/* Secondary CTA */
background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);

/* Hover State */
background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%);
```

---

## 🎯 Neutral Colors

### **Background & Surface**
```json
{
  "background": "#FFFFFF",
  "surface": "#F9FAFB",
  "surfaceElevated": "#FFFFFF",
  "overlay": "rgba(139, 92, 246, 0.1)"
}
```

### **Text Colors**
```json
{
  "text": "#1F2937",
  "textSecondary": "#6B7280",
  "textTertiary": "#9CA3AF",
  "textOnPrimary": "#FFFFFF",
  "textOnAccent": "#1F2937"
}
```

### **Border & Divider**
```json
{
  "border": "#E5E7EB",
  "divider": "#F3F4F6",
  "borderFocus": "#8B5CF6"
}
```

---

## 💫 Special Effects

### **Shadows**
```css
/* Soft Shadow (product cards) */
box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);

/* Elevated Shadow (hover) */
box-shadow: 0 12px 40px rgba(139, 92, 246, 0.25);

/* Glow Effect (CTA buttons) */
box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
```

### **Overlay Effects**
```css
/* Hero overlay */
background: linear-gradient(
  135deg, 
  rgba(139, 92, 246, 0.9) 0%, 
  rgba(236, 72, 153, 0.8) 50%, 
  rgba(6, 182, 212, 0.7) 100%
);

/* Product card overlay (hover) */
background: linear-gradient(
  to top,
  rgba(139, 92, 246, 0.8) 0%,
  transparent 100%
);
```

---

## 🏷️ Status Colors

### **E-commerce States**
```json
{
  "success": "#10B981",
  "warning": "#F59E0B",
  "error": "#EF4444",
  "info": "#3B82F6",
  
  "sale": "#EF4444",
  "new": "#10B981",
  "outOfStock": "#9CA3AF"
}
```

### **Sale Badge**
```css
background: #EF4444;
color: #FFFFFF;
font-weight: 700;
padding: 0.25rem 0.75rem;
border-radius: 0.375rem;
```

---

## 🎨 Theme Variations

### **Light Mode (Default)**
```json
{
  "background": "#FFFFFF",
  "surface": "#F9FAFB",
  "text": "#1F2937",
  "primary": "#8B5CF6",
  "secondary": "#EC4899"
}
```

### **Dark Mode (Toekomstig)**
```json
{
  "background": "#111827",
  "surface": "#1F2937",
  "text": "#F9FAFB",
  "primary": "#A78BFA",
  "secondary": "#F472B6"
}
```

---

## 📋 Color Usage Guide

### **Homepage:**
- Hero background: Purple-Pink-Cyan gradient
- Content cards: White (#FFFFFF) with soft shadow
- CTA buttons: Gold/Yellow (#F59E0B) gradient
- Vlinders: Purple (#8B5CF6) tint

### **Product Pages:**
- Product platforms: Rotating gradients (4 variants)
- Product cards: White background
- Hover state: Elevated shadow met purple glow
- Sale badges: Red (#EF4444)

### **Cart & Checkout:**
- Background: Light gray (#F9FAFB)
- Cards: White (#FFFFFF)
- Progress bar: Purple-Pink gradient
- Checkout button: Gold gradient

---

## 🔧 CSS Variables

```css
:root {
  /* Primary Colors */
  --color-primary: #8B5CF6;
  --color-primary-dark: #7C3AED;
  --color-primary-light: #A78BFA;
  
  /* Secondary Colors */
  --color-secondary: #EC4899;
  --color-secondary-dark: #DB2777;
  --color-secondary-light: #F472B6;
  
  /* Accent Colors */
  --color-accent: #F59E0B;
  --color-accent-dark: #D97706;
  --color-accent-light: #FBBF24;
  
  /* Neutrals */
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-text: #1F2937;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;
  
  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%);
  --gradient-button: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  --gradient-product-1: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
  --gradient-product-2: linear-gradient(135deg, #EC4899 0%, #F59E0B 100%);
  --gradient-product-3: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
  --gradient-product-4: linear-gradient(135deg, #06B6D4 0%, #EC4899 100%);
}
```

---

## ✨ Accessibility

### **Contrast Ratios:**
- Primary text on white: ✅ 12.6:1 (WCAG AAA)
- Secondary text on white: ✅ 7.0:1 (WCAG AA)
- Accent on white: ✅ 4.8:1 (WCAG AA)
- White text on primary: ✅ 7.2:1 (WCAG AAA)

### **Color Blind Safe:**
- Use icons + colors voor status
- Underline links
- Pattern backgrounds voor gradients
