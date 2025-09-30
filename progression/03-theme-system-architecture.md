# Theme Export/Import System - Template Maker

**Datum:** 30 September 2025  
**Feature:** Thema's maken, exporteren en importeren als templates

## 🎯 Doel

Een systeem waarbij je:
1. ✅ Het huidige thema kunt vastleggen (alle styling, configuratie)
2. ✅ Exporteren als downloadbaar template bestand (.json)
3. ✅ Delen met anderen (of AI) voor verbetering
4. ✅ Importeren van thema templates
5. ✅ Template bibliotheek beheren
6. ✅ Template marketplace (optioneel)

## 🏗️ Database Schema

### Theme Configuration Table
```sql
-- Store theme configurations (tenant database)
CREATE TABLE store_theme_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Summer Collection 2025"
  is_active BOOLEAN DEFAULT false,
  
  -- Visual Design
  colors JSONB NOT NULL DEFAULT '{
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
  }',
  
  -- Typography
  typography JSONB NOT NULL DEFAULT '{
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
    },
    "lineHeight": {
      "tight": 1.25,
      "normal": 1.5,
      "relaxed": 1.75
    }
  }',
  
  -- Layout & Spacing
  layout JSONB NOT NULL DEFAULT '{
    "borderRadius": "0.5rem",
    "spacing": {
      "xs": "0.25rem",
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem",
      "2xl": "3rem"
    },
    "maxWidth": "1280px",
    "containerPadding": "1rem",
    "sectionSpacing": "4rem"
  }',
  
  -- Component Styles
  components JSONB NOT NULL DEFAULT '{
    "button": {
      "primary": {
        "background": "var(--color-primary)",
        "color": "#FFFFFF",
        "borderRadius": "0.5rem",
        "padding": "0.5rem 1.5rem",
        "fontSize": "1rem",
        "fontWeight": 500,
        "hover": {
          "background": "var(--color-primary-dark)",
          "transform": "translateY(-2px)",
          "shadow": "0 4px 12px rgba(0,0,0,0.15)"
        }
      },
      "secondary": {...},
      "outline": {...}
    },
    "card": {
      "background": "#FFFFFF",
      "borderRadius": "1rem",
      "shadow": "0 1px 3px rgba(0,0,0,0.1)",
      "padding": "1.5rem",
      "hover": {
        "shadow": "0 10px 30px rgba(0,0,0,0.1)",
        "transform": "translateY(-4px)"
      }
    },
    "input": {...},
    "header": {
      "background": "#FFFFFF",
      "height": "4rem",
      "sticky": true,
      "shadow": "0 1px 3px rgba(0,0,0,0.1)"
    },
    "footer": {...},
    "productCard": {
      "imageAspectRatio": "1/1",
      "showQuickView": true,
      "hoverEffect": "zoom",
      "badgeStyle": "modern"
    }
  }',
  
  -- Advanced Settings
  animations JSONB DEFAULT '{
    "enabled": true,
    "duration": 300,
    "easing": "ease-in-out",
    "pageTransitions": true,
    "hoverEffects": true
  }',
  
  custom_css TEXT, -- Additional CSS overrides
  
  -- Metadata
  created_by UUID, -- User who created this theme
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Theme template library (central database)
CREATE TABLE theme_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- modern, minimal, colorful, professional
  
  -- Preview
  preview_image_url TEXT,
  demo_url TEXT,
  screenshots JSONB DEFAULT '[]',
  
  -- Template data (full theme config)
  theme_config JSONB NOT NULL,
  
  -- Marketplace
  is_public BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  
  -- Stats
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  
  -- Author
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id), -- Store that created it
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User theme library (saved/favorited templates)
CREATE TABLE user_theme_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES theme_templates(id),
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎨 Theme Export/Import Interface

### Admin Theme Manager Component
```typescript
// src/components/admin/ThemeExportImport.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Save, Eye, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';

interface ThemeConfig {
  name: string;
  colors: Record<string, string>;
  typography: object;
  layout: object;
  components: object;
  animations: object;
  custom_css?: string;
  version: number;
}

export function ThemeExportImport() {
  const { store, tenantDb } = useStore();
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null);

  // 1. CAPTURE CURRENT THEME
  const captureCurrentTheme = async () => {
    if (!tenantDb) return;

    try {
      // Get active theme from database
      const { data: theme, error } = await tenantDb
        .from('store_theme_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Get computed CSS variables from DOM
      const root = document.documentElement;
      const computedColors = {
        primary: getComputedStyle(root).getPropertyValue('--color-primary').trim(),
        secondary: getComputedStyle(root).getPropertyValue('--color-secondary').trim(),
        accent: getComputedStyle(root).getPropertyValue('--color-accent').trim(),
        // ... capture all CSS variables
      };

      const capturedTheme: ThemeConfig = {
        name: theme.name || `${store?.name} Theme`,
        colors: { ...theme.colors, ...computedColors },
        typography: theme.typography,
        layout: theme.layout,
        components: theme.components,
        animations: theme.animations,
        custom_css: theme.custom_css,
        version: theme.version,
      };

      setCurrentTheme(capturedTheme);
      toast.success('Thema vastgelegd!');
      
      return capturedTheme;
    } catch (error) {
      console.error('Theme capture error:', error);
      toast.error('Fout bij vastleggen thema');
    }
  };

  // 2. EXPORT AS FILE
  const exportTheme = async () => {
    const theme = currentTheme || await captureCurrentTheme();
    if (!theme) return;

    // Create downloadable JSON file
    const themeData = {
      ...theme,
      metadata: {
        exportedFrom: store?.name,
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
      },
    };

    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${store?.slug}-theme-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Thema geëxporteerd! Je kunt dit bestand delen voor verbetering.');
  };

  // 3. IMPORT THEME FROM FILE
  const importTheme = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedTheme: ThemeConfig = JSON.parse(text);

      // Validate theme structure
      if (!importedTheme.colors || !importedTheme.typography) {
        throw new Error('Ongeldig thema bestand');
      }

      setCurrentTheme(importedTheme);
      toast.success('Thema geïmporteerd! Preview beschikbaar.');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Fout bij importeren thema');
    }
  };

  // 4. SAVE AS TEMPLATE
  const saveAsTemplate = async () => {
    if (!currentTheme || !tenantDb) return;

    try {
      // Deactivate current themes
      await tenantDb
        .from('store_theme_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Save new theme
      const { error } = await tenantDb
        .from('store_theme_config')
        .insert({
          name: currentTheme.name,
          colors: currentTheme.colors,
          typography: currentTheme.typography,
          layout: currentTheme.layout,
          components: currentTheme.components,
          animations: currentTheme.animations,
          custom_css: currentTheme.custom_css,
          is_active: true,
          version: (currentTheme.version || 0) + 1,
        });

      if (error) throw error;

      toast.success('Thema opgeslagen en geactiveerd!');
      
      // Reload page to apply new theme
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fout bij opslaan thema');
    }
  };

  // 5. PUBLISH TO MARKETPLACE
  const publishTemplate = async () => {
    if (!currentTheme) return;

    try {
      const { data, error } = await supabase
        .from('theme_templates')
        .insert({
          name: currentTheme.name,
          slug: currentTheme.name.toLowerCase().replace(/\s+/g, '-'),
          description: 'Custom theme exported from store',
          category: 'custom',
          theme_config: currentTheme,
          is_public: false, // Can be made public later
          organization_id: store?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Template opgeslagen in bibliotheek!');
      
      return data;
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Fout bij publiceren template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Thema Export/Import</h2>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button onClick={captureCurrentTheme} variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          Vastleggen
        </Button>

        <Button onClick={exportTheme} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporteren
        </Button>

        <label>
          <Button variant="outline" asChild>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Importeren
            </span>
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={importTheme}
            className="hidden"
          />
        </label>

        <Button onClick={saveAsTemplate}>
          <Save className="w-4 h-4 mr-2" />
          Opslaan
        </Button>
      </div>

      {/* Theme Preview */}
      {currentTheme && (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">{currentTheme.name}</h3>
          
          {/* Color Palette */}
          <div>
            <p className="text-sm font-medium mb-2">Kleuren</p>
            <div className="flex gap-2">
              {Object.entries(currentTheme.colors).map(([name, color]) => (
                <div key={name} className="text-center">
                  <div
                    className="w-12 h-12 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs mt-1">{name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <p className="text-sm font-medium mb-2">Typografie</p>
            <div className="space-y-1 text-sm">
              <p>Heading: {currentTheme.typography.headingFont}</p>
              <p>Body: {currentTheme.typography.bodyFont}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={publishTemplate} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Publiceer in Bibliotheek
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">💡 Hoe te gebruiken:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Klik op "Vastleggen" om huidige thema te capturen</li>
          <li>Klik op "Exporteren" om .json bestand te downloaden</li>
          <li>Deel dit bestand met AI of developers voor verbetering</li>
          <li>Gebruik "Importeren" om verbeterd thema te laden</li>
          <li>Preview het thema en klik "Opslaan" om toe te passen</li>
        </ol>
      </div>
    </div>
  );
}
```

## 🎨 Theme Application System

### CSS Variable Generator
```typescript
// src/lib/theme-generator.ts

export function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement;

  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Apply typography
  root.style.setProperty('--font-heading', theme.typography.headingFont);
  root.style.setProperty('--font-body', theme.typography.bodyFont);

  // Apply layout
  root.style.setProperty('--border-radius', theme.layout.borderRadius);
  root.style.setProperty('--max-width', theme.layout.maxWidth);

  // Inject custom CSS
  if (theme.custom_css) {
    let styleEl = document.getElementById('custom-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'custom-theme-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = theme.custom_css;
  }
}
```

### Theme Provider with Dynamic Loading
```typescript
// src/contexts/ThemeContext.tsx

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantDb, store } = useStore();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    const loadActiveTheme = async () => {
      if (!tenantDb) return;

      const { data } = await tenantDb
        .from('store_theme_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (data) {
        setTheme(data as ThemeConfig);
        applyThemeToDOM(data as ThemeConfig);
      }
    };

    loadActiveTheme();
  }, [tenantDb, store?.id]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 📦 Template Marketplace (Optioneel)

### Browse Templates
```typescript
// src/components/admin/TemplateMarketplace.tsx

export function TemplateMarketplace() {
  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('theme_templates')
        .select('*')
        .eq('is_public', true)
        .order('download_count', { ascending: false });

      setTemplates(data || []);
    };

    fetchTemplates();
  }, []);

  const installTemplate = async (template: ThemeTemplate) => {
    // Apply theme config to store
    await applyThemeToDOM(template.theme_config);
    
    // Save to store
    await saveAsTemplate(template.theme_config);
    
    // Increment download count
    await supabase
      .from('theme_templates')
      .update({ download_count: template.download_count + 1 })
      .eq('id', template.id);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {templates.map(template => (
        <TemplateCard 
          key={template.id} 
          template={template}
          onInstall={() => installTemplate(template)}
        />
      ))}
    </div>
  );
}
```

## 🚀 Implementatie Plan

### Week 1: Core Theme System
- [x] Database schema maken
- [ ] Theme capture functionaliteit
- [ ] Export/Import basis
- [ ] CSS variable generator

### Week 2: UI Components
- [ ] ThemeExportImport admin component
- [ ] Theme preview systeem
- [ ] Import validation
- [ ] Template bibliotheek UI

### Week 3: Advanced Features
- [ ] Template marketplace
- [ ] Theme versioning
- [ ] A/B testing support
- [ ] Theme scheduling

### Week 4: Polish
- [ ] Documentation
- [ ] Video tutorials
- [ ] Pre-made templates
- [ ] Testing & QA

## 💡 Workflow Voorbeeld

**Voor Store Owner:**
```
1. Ontwerp thema in admin panel
2. Klik "Vastleggen" om te exporteren
3. Download .json bestand
4. Deel met AI: "Maak dit professioneler met betere kleuren"
5. Ontvang verbeterd .json bestand
6. Importeer via "Importeren" knop
7. Preview het resultaat
8. Klik "Opslaan" om toe te passen
```

**Voor AI/Developer:**
```
1. Ontvang theme.json bestand
2. Analyseer structuur:
   - colors: welke kleuren worden gebruikt
   - typography: fonts en sizes
   - components: button styles, card styles
3. Verbeter met design best practices
4. Return verbeterd theme.json
```

## 📝 Theme JSON Voorbeeld
```json
{
  "name": "Modern Minimal Pro",
  "colors": {
    "primary": "#2563EB",
    "secondary": "#64748B",
    "accent": "#F59E0B",
    "background": "#FFFFFF",
    "surface": "#F8FAFC",
    "text": "#0F172A",
    "textSecondary": "#475569"
  },
  "typography": {
    "headingFont": "Poppins",
    "bodyFont": "Inter",
    "fontSize": {
      "base": "1rem",
      "lg": "1.125rem"
    }
  },
  "components": {
    "button": {
      "primary": {
        "background": "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
        "borderRadius": "0.75rem",
        "padding": "0.75rem 2rem"
      }
    }
  },
  "metadata": {
    "exportedFrom": "MyStore",
    "exportedAt": "2025-09-30T12:00:00Z"
  }
}
```

**Dit systeem maakt het mogelijk om thema's te delen, verbeteren en hergebruiken! 🎨**
