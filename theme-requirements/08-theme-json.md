# Sensationals - Complete Theme JSON

**Final theme configuration ready for import**

```json
{
  "name": "Sensationals Dreamy Gradient",
  "version": "1.0.0",
  "description": "Luxe, dreamy thema met gradient aesthetics voor Sensationals - beauty & parfum webshop",
  "category": "colorful",
  "author": "Aurelio Team",
  "compatible": "1.0.0",
  
  "colors": {
    "primary": "#8B5CF6",
    "primaryDark": "#7C3AED",
    "primaryLight": "#A78BFA",
    
    "secondary": "#EC4899",
    "secondaryDark": "#DB2777",
    "secondaryLight": "#F472B6",
    
    "accent": "#F59E0B",
    "accentDark": "#D97706",
    "accentLight": "#FBBF24",
    
    "background": "#FFFFFF",
    "surface": "#F9FAFB",
    "surfaceElevated": "#FFFFFF",
    
    "text": "#1F2937",
    "textSecondary": "#6B7280",
    "textTertiary": "#9CA3AF",
    "textOnPrimary": "#FFFFFF",
    "textOnAccent": "#1F2937",
    
    "border": "#E5E7EB",
    "divider": "#F3F4F6",
    "borderFocus": "#8B5CF6",
    
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
    
    "sale": "#EF4444",
    "new": "#10B981",
    "trending": "#F59E0B"
  },
  
  "gradients": {
    "hero": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)",
    "button": "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
    "buttonHover": "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
    "secondary": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    
    "productPlatform1": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    "productPlatform2": "linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)",
    "productPlatform3": "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
    "productPlatform4": "linear-gradient(135deg, #06B6D4 0%, #EC4899 100%)",
    
    "progress": "linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)",
    "badge": "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
  },
  
  "typography": {
    "headingFont": "Poppins",
    "bodyFont": "Inter",
    "monoFont": "Courier New",
    
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
      "7xl": "4.5rem"
    },
    
    "fontWeight": {
      "light": 300,
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700,
      "extrabold": 800
    },
    
    "lineHeight": {
      "none": 1,
      "tight": 1.2,
      "snug": 1.3,
      "normal": 1.5,
      "relaxed": 1.6,
      "loose": 1.8
    },
    
    "letterSpacing": {
      "tight": "-0.02em",
      "normal": "0",
      "wide": "0.025em",
      "wider": "0.05em"
    }
  },
  
  "layout": {
    "borderRadius": "1rem",
    "borderRadiusSm": "0.5rem",
    "borderRadiusLg": "1.5rem",
    "borderRadiusFull": "9999px",
    
    "maxWidth": "1280px",
    "maxWidthNarrow": "960px",
    "maxWidthWide": "1440px",
    
    "containerPadding": "1rem",
    "containerPaddingMobile": "1rem",
    "containerPaddingDesktop": "2rem",
    
    "sectionSpacing": "5rem",
    "sectionSpacingMobile": "3rem",
    
    "spacing": {
      "xs": "0.25rem",
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem",
      "2xl": "3rem",
      "3xl": "4rem",
      "4xl": "6rem"
    }
  },
  
  "components": {
    "button": {
      "primary": {
        "background": "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
        "color": "#1F2937",
        "borderRadius": "0.5rem",
        "padding": "1rem 2rem",
        "fontSize": "1rem",
        "fontWeight": 700,
        "textTransform": "uppercase",
        "letterSpacing": "0.05em",
        "shadow": "0 4px 12px rgba(245, 158, 11, 0.3)",
        "hover": {
          "background": "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
          "transform": "translateY(-2px)",
          "shadow": "0 6px 20px rgba(245, 158, 11, 0.4)"
        }
      },
      "secondary": {
        "background": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
        "color": "#FFFFFF",
        "borderRadius": "0.5rem",
        "padding": "0.75rem 1.5rem",
        "fontSize": "0.875rem",
        "fontWeight": 600
      },
      "outline": {
        "background": "transparent",
        "color": "#8B5CF6",
        "border": "2px solid #8B5CF6",
        "borderRadius": "0.5rem",
        "padding": "0.75rem 1.5rem",
        "fontWeight": 600,
        "hover": {
          "background": "#8B5CF6",
          "color": "#FFFFFF"
        }
      }
    },
    
    "card": {
      "background": "#FFFFFF",
      "borderRadius": "1rem",
      "shadow": "0 4px 12px rgba(139, 92, 246, 0.15)",
      "border": "1px solid #E5E7EB",
      "padding": "1.5rem",
      "hover": {
        "shadow": "0 12px 40px rgba(139, 92, 246, 0.2)",
        "transform": "translateY(-8px)",
        "borderColor": "#8B5CF6"
      }
    },
    
    "productCard": {
      "imageAspectRatio": "1/1",
      "showQuickView": true,
      "hoverEffect": "lift",
      "badgeStyle": "gradient",
      "platformGradient": true,
      "platformHeight": "60%",
      "platformShape": "curved"
    },
    
    "input": {
      "background": "#FFFFFF",
      "border": "2px solid #E5E7EB",
      "borderRadius": "0.5rem",
      "padding": "0.875rem 1rem",
      "fontSize": "1rem",
      "focus": {
        "borderColor": "#8B5CF6",
        "shadow": "0 0 0 3px rgba(139, 92, 246, 0.1)"
      }
    },
    
    "header": {
      "background": "#FFFFFF",
      "height": "5rem",
      "sticky": true,
      "shadow": "0 2px 8px rgba(0, 0, 0, 0.05)",
      "backdropBlur": true
    },
    
    "hero": {
      "background": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)",
      "minHeight": "600px",
      "overlay": "rgba(139, 92, 246, 0.1)",
      "contentMaxWidth": "500px",
      "contentBackground": "rgba(255, 255, 255, 0.95)",
      "contentPadding": "3rem 2.5rem",
      "contentBorderRadius": "1.5rem",
      "contentShadow": "0 10px 40px rgba(139, 92, 246, 0.15)"
    },
    
    "badge": {
      "sale": {
        "background": "#EF4444",
        "color": "#FFFFFF",
        "fontSize": "0.75rem",
        "fontWeight": 700,
        "padding": "0.375rem 0.75rem",
        "borderRadius": "0.375rem",
        "textTransform": "uppercase"
      },
      "new": {
        "background": "#10B981",
        "color": "#FFFFFF"
      },
      "trending": {
        "background": "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
        "color": "#1F2937"
      }
    },
    
    "progressBar": {
      "background": "#E5E7EB",
      "fill": "linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)",
      "height": "8px",
      "borderRadius": "9999px",
      "animation": "shimmer"
    }
  },
  
  "animations": {
    "enabled": true,
    "duration": 400,
    "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
    "pageTransitions": true,
    "hoverEffects": true,
    "scrollReveal": true,
    
    "effects": {
      "float": {
        "duration": "6s",
        "translateY": "-20px",
        "rotate": "5deg"
      },
      "shimmer": {
        "duration": "2s",
        "infinite": true
      },
      "slideIn": {
        "duration": "0.3s",
        "from": {
          "opacity": 0,
          "translateY": "-20px",
          "scale": 0.95
        },
        "to": {
          "opacity": 1,
          "translateY": "0",
          "scale": 1
        }
      }
    }
  },
  
  "decorative": {
    "butterflies": {
      "enabled": true,
      "color": "#8B5CF6",
      "opacity": 0.6,
      "size": "80px",
      "animation": "float"
    },
    "gradientOverlays": {
      "enabled": true,
      "opacity": 0.1
    },
    "backgroundPatterns": {
      "enabled": false
    }
  },
  
  "responsive": {
    "breakpoints": {
      "mobile": "768px",
      "tablet": "1024px",
      "desktop": "1280px"
    },
    "mobile": {
      "fontSize": {
        "hero": "2rem",
        "h1": "1.875rem",
        "h2": "1.5rem",
        "h3": "1.25rem"
      },
      "spacing": {
        "section": "3rem",
        "container": "1rem"
      }
    },
    "tablet": {
      "fontSize": {
        "hero": "3rem",
        "h1": "2.25rem",
        "h2": "1.875rem",
        "h3": "1.5rem"
      }
    },
    "desktop": {
      "fontSize": {
        "hero": "3.75rem",
        "h1": "2.25rem",
        "h2": "1.875rem",
        "h3": "1.5rem"
      }
    }
  },
  
  "metadata": {
    "previewImage": "/themes/sensationals-preview.jpg",
    "demoUrl": "https://sensationals.myaurelio.com",
    "tags": ["gradient", "colorful", "modern", "beauty", "luxury", "dreamy"],
    "screenshots": [
      "/themes/sensationals-home.jpg",
      "/themes/sensationals-products.jpg",
      "/themes/sensationals-cart.jpg"
    ],
    "createdAt": "2025-09-30T00:00:00Z",
    "updatedAt": "2025-09-30T00:00:00Z"
  }
}
```
