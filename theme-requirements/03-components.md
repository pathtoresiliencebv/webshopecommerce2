# Sensationals - Component Library

**Gebaseerd op:** Screenshot analyse van Sensationals webshop

## 🧩 Core Components

### **1. Buttons**

#### **Primary CTA Button**
```css
.btn-primary {
  /* Visual */
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  color: #1F2937;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  
  /* Typography */
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  /* Effects */
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
}
```

#### **Secondary Button**
```css
.btn-secondary {
  background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
}
```

#### **Outline Button**
```css
.btn-outline {
  background: transparent;
  color: #8B5CF6;
  border: 2px solid #8B5CF6;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: #8B5CF6;
  color: #FFFFFF;
}
```

---

### **2. Cards**

#### **Content Card (Welcome Card)**
```css
.content-card {
  background: #FFFFFF;
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  box-shadow: 0 10px 40px rgba(139, 92, 246, 0.15);
  
  /* Max width for readability */
  max-width: 500px;
  
  /* Backdrop blur effect */
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}
```

#### **Product Card**
```css
.product-card {
  background: #FFFFFF;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #E5E7EB;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
  border-color: #8B5CF6;
}

/* Product Image Container */
.product-card-image {
  position: relative;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%);
  overflow: hidden;
}

/* Product Platform (Gradient Background) */
.product-platform {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: var(--gradient-product);
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
  z-index: 1;
}

/* Product Image */
.product-card-image img {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 2rem;
}

/* Product Info */
.product-card-body {
  padding: 1.5rem;
}

.product-vendor {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8B5CF6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.product-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 0.75rem;
}

.product-price-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-price {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #8B5CF6;
}

.product-price-old {
  font-size: 1rem;
  font-weight: 400;
  color: #9CA3AF;
  text-decoration: line-through;
}
```

---

### **3. Badges**

#### **Sale Badge**
```css
.badge-sale {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: #EF4444;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  z-index: 10;
}
```

#### **Discount Badge**
```css
.badge-discount {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: #FFFFFF;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}
```

#### **Status Badge**
```css
.badge-new {
  background: #10B981;
  color: #FFFFFF;
}

.badge-trending {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  color: #1F2937;
}

.badge-limited {
  background: #8B5CF6;
  color: #FFFFFF;
}
```

---

### **4. Product Platform (Gradient Bases)**

#### **Platform Styles**
```css
.product-platform-1 {
  background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
}

.product-platform-2 {
  background: linear-gradient(135deg, #EC4899 0%, #F59E0B 100%);
}

.product-platform-3 {
  background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
}

.product-platform-4 {
  background: linear-gradient(135deg, #06B6D4 0%, #EC4899 100%);
}

/* 3D Effect */
.product-platform::before {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 10%;
  right: 10%;
  height: 20px;
  background: rgba(0, 0, 0, 0.15);
  filter: blur(15px);
  border-radius: 50%;
}
```

---

### **5. Input Fields**

#### **Text Input**
```css
.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #E5E7EB;
  border-radius: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #1F2937;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.input-field::placeholder {
  color: #9CA3AF;
}
```

#### **Select Dropdown**
```css
.select-field {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #E5E7EB;
  border-radius: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #1F2937;
  background: #FFFFFF;
  background-image: url("data:image/svg+xml,..."); /* Dropdown arrow */
  background-repeat: no-repeat;
  background-position: right 1rem center;
  appearance: none;
}
```

---

### **6. Progress Bar (Free Shipping)**

```css
.progress-container {
  background: #E5E7EB;
  border-radius: 9999px;
  height: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%);
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

### **7. Cart Drawer**

```css
.cart-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  background: #FFFFFF;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.cart-drawer.open {
  transform: translateX(0);
}

.cart-drawer-header {
  padding: 1.5rem;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-drawer-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.cart-drawer-footer {
  padding: 1.5rem;
  border-top: 2px solid #E5E7EB;
  background: #F9FAFB;
}
```

---

### **8. Decorative Elements**

#### **Butterfly SVG**
```html
<svg class="butterfly-decoration" viewBox="0 0 100 100">
  <!-- Butterfly illustration -->
  <path fill="url(#butterfly-gradient)" d="..."/>
  <defs>
    <linearGradient id="butterfly-gradient">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
</svg>
```

```css
.butterfly-decoration {
  width: 80px;
  height: 80px;
  opacity: 0.6;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}
```

---

### **9. Modal / Popup**

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(139, 92, 246, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 1.5rem;
  padding: 2.5rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

### **10. Loading States**

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #E5E7EB 0%,
    #F3F4F6 50%,
    #E5E7EB 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 0.5rem;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E5E7EB;
  border-top-color: #8B5CF6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 📱 Component Responsive Behavior

```css
/* Mobile Adjustments */
@media (max-width: 768px) {
  .content-card {
    padding: 2rem 1.5rem;
  }
  
  .product-card {
    border-radius: 0.75rem;
  }
  
  .cart-drawer {
    width: 100%;
  }
  
  .btn-primary {
    width: 100%;
    padding: 0.875rem 1.5rem;
  }
}
```
