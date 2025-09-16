import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Globe, 
  CreditCard, 
  Users, 
  MapPin, 
  Languages, 
  HelpCircle,
  Crown,
  Wifi
} from 'lucide-react';

interface AdminSettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const settingsSections = [
  {
    id: 'general',
    label: 'Algemeen',
    icon: Settings,
    description: 'Basis store informatie'
  },
  {
    id: 'domains',
    label: 'Domeinen',
    icon: Globe,
    description: 'Domain management'
  },
  {
    id: 'dns-setup',
    label: 'DNS Setup',
    icon: Wifi,
    description: 'Subdomain configuratie'
  },
  {
    id: 'subscription',
    label: 'Abonnement',
    icon: Crown,
    description: 'Plan & gebruik'
  },
  {
    id: 'billing',
    label: 'Factureren',
    icon: CreditCard,
    description: 'Betalingen & facturen'
  },
  {
    id: 'payment-methods',
    label: 'Betaalmethoden',
    icon: CreditCard,
    description: 'Stripe & betalingen'
  },
  {
    id: 'users',
    label: 'Gebruikers & Machtigingen',
    icon: Users,
    description: 'Team beheer'
  },
  {
    id: 'locations',
    label: 'Locaties',
    icon: MapPin,
    description: 'Store locaties'
  },
  {
    id: 'languages',
    label: 'Talen',
    icon: Languages,
    description: 'Meertaligheid'
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: HelpCircle,
    description: 'Help & ondersteuning'
  }
];

export function AdminSettingsSidebar({ activeSection, onSectionChange }: AdminSettingsSidebarProps) {
  return (
    <div className="w-80 bg-card border-r border-border h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Instellingen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Beheer je store configuratie
        </p>
      </div>
      
      <nav className="p-4">
        <div className="space-y-2">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{section.label}</div>
                  <div className={cn(
                    "text-xs truncate",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {section.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}