import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import StoreManager from '@/pages/StoreManager';
import { Loader2 } from 'lucide-react';

const StoreManagerRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: orgLoading } = useOrganization();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/auth" replace />;
  }

  return <StoreManager />;
};

export default StoreManagerRoute;