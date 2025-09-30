import React, { useState } from 'react';
import { AdminSettingsSidebar } from './AdminSettingsSidebar';
import { AdminGeneralSettings } from './AdminGeneralSettings';
import { AdminDomains } from './AdminDomains';
import AdminDNSSetup from './AdminDNSSetup';
import { AdminSubscription } from './AdminSubscription';
import { AdminBilling } from './AdminBilling';
import { PaymentProvidersSettings } from './PaymentProvidersSettings';
import { AdminUsers } from './AdminUsers';
import { AdminLocations } from './AdminLocations';
import { AdminLanguages } from './AdminLanguages';
import { AdminFAQ } from './AdminFAQ';

export function AdminStoreSettings() {
  const [activeSection, setActiveSection] = useState('general');

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return <AdminGeneralSettings />;
      case 'domains':
        return <AdminDomains />;
      case 'dns-setup':
        return <AdminDNSSetup />;
      case 'subscription':
        return <AdminSubscription />;
      case 'billing':
        return <AdminBilling />;
      case 'payment-methods':
        return <PaymentProvidersSettings />;
      case 'users':
        return <AdminUsers />;
      case 'locations':
        return <AdminLocations />;
      case 'languages':
        return <AdminLanguages />;
      case 'faq':
        return <AdminFAQ />;
      default:
        return <AdminGeneralSettings />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSettingsSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}