# Themes Folder - Shopify-style Theme System

This folder contains all theme-related files for the multi-store platform.

## 📁 Folder Structure

```
themes/
├── default/          # Default theme files
│   ├── config.json   # Theme configuration
│   ├── colors.json   # Color palette
│   └── layout.json   # Layout settings
│
├── templates/        # Pre-made theme templates
│   ├── modern-minimal.json
│   ├── bold-colorful.json
│   └── professional-business.json
│
└── exports/          # User-exported themes
    └── [store-name]-[timestamp].json
```

## 🎨 Theme JSON Structure

Each theme file contains:

```json
{
  "name": "Theme Name",
  "version": "1.0.0",
  "author": "Store Name",
  "colors": {
    "primary": "#000000",
    "secondary": "#666666",
    "accent": "#FF6B6B",
    "background": "#FFFFFF",
    "surface": "#F5F5F5",
    "text": "#1A1A1A",
    "textSecondary": "#666666",
    "border": "#E5E5E5",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444"
  },
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem"
    },
    "fontWeight": {
      "light": 300,
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "layout": {
    "borderRadius": "0.5rem",
    "maxWidth": "1280px",
    "containerPadding": "1rem",
    "spacing": {
      "xs": "0.25rem",
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem"
    }
  },
  "components": {
    "button": {
      "borderRadius": "0.5rem",
      "padding": "0.5rem 1.5rem"
    },
    "card": {
      "borderRadius": "1rem",
      "shadow": "0 1px 3px rgba(0,0,0,0.1)"
    }
  },
  "metadata": {
    "exportedFrom": "Store Name",
    "exportedAt": "2025-09-30T12:00:00Z",
    "platform": "Aurelio Multi-Store"
  }
}
```

## 🚀 How to Use

### Export a Theme
1. Go to Admin → Settings → Themes
2. Click "Export Current Theme"
3. Theme JSON file downloads to `themes/exports/`

### Import a Theme
1. Go to Admin → Settings → Themes
2. Click "Import Theme"
3. Select a JSON file from `themes/templates/` or `themes/exports/`
4. Preview and apply

### Share with AI for Improvements
1. Export your theme
2. Send the JSON file to AI/Designer
3. Request improvements
4. Import the improved JSON
5. Apply to your store

## 🎯 Features

- ✅ Export current theme as JSON
- ✅ Import theme from JSON
- ✅ Theme preview before applying
- ✅ Template marketplace
- ✅ Version control
- ✅ Share themes between stores
- ✅ AI-assisted theme improvements

## 📝 Notes

- All themes are validated before import
- Themes are stored in tenant database when applied
- Original exports are kept in this folder for backup
- Templates can be shared publicly or kept private
