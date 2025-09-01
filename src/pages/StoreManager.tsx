import React from 'react';
import StoreManagementDashboard from '@/components/store/StoreManagementDashboard';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

const StoreManager = () => {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          <StoreManagementDashboard />
        </div>
      </div>
    </AdminProtectedRoute>
  );
};

export default StoreManager;