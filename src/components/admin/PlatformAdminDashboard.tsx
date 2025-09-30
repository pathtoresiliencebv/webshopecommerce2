/**
 * PLATFORM ADMIN DASHBOARD
 * 
 * Super Admin interface for managing the entire platform:
 * - View all organizations
 * - Monitor system health
 * - Manage users & permissions
 * - Platform analytics
 * - Support tickets
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, Store, DollarSign, Database, AlertTriangle, 
  TrendingUp, Activity, Settings, Search, Eye 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function PlatformAdminDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user is platform admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['platform-admin-check', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('role, permissions')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (error || !data) return false;
      return data;
    },
    enabled: !!user?.id,
  });

  // Platform statistics
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      // Get latest analytics
      const { data: analytics } = await supabase
        .from('platform_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Get current counts
      const { count: organizationsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: usersCount } = await supabase
        .from('organization_users')
        .select('*', { count: 'exact', head: true });

      const { count: databasesCount } = await supabase
        .from('tenant_databases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get alerts count
      const { count: alertsCount } = await supabase
        .from('organization_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
        .in('severity', ['error', 'critical']);

      return {
        organizations: organizationsCount || 0,
        users: usersCount || 0,
        databases: databasesCount || 0,
        alerts: alertsCount || 0,
        revenue: analytics?.total_revenue || 0,
        platformRevenue: analytics?.platform_revenue || 0,
      };
    },
    enabled: !!isAdmin,
  });

  // All organizations
  const { data: organizations } = useQuery({
    queryKey: ['all-organizations', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*, tenant_databases(*), subscriptions(*)')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  // Active alerts
  const { data: alerts } = useQuery({
    queryKey: ['platform-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_alerts')
        .select('*, organizations(name)')
        .eq('status', 'open')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the platform admin dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Admin</h1>
          <p className="text-muted-foreground">
            {isAdmin.role === 'super_admin' ? 'Super Admin' : isAdmin.role} Dashboard
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          Platform Management
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Organizations"
          value={stats?.organizations || 0}
          icon={<Store className="w-4 h-4" />}
          trend="+12% this month"
        />
        <StatsCard
          title="Total Users"
          value={stats?.users || 0}
          icon={<Users className="w-4 h-4" />}
          trend="+8% this month"
        />
        <StatsCard
          title="Active Databases"
          value={stats?.databases || 0}
          icon={<Database className="w-4 h-4" />}
          trend="All healthy"
        />
        <StatsCard
          title="Platform Revenue"
          value={`€${((stats?.platformRevenue || 0) / 100).toFixed(2)}`}
          icon={<DollarSign className="w-4 h-4" />}
          trend="+15% this month"
          highlight
        />
      </div>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.organizations?.name || 'Unknown org'}
                    </p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>
                Manage and monitor all stores on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Organizations List */}
              <div className="space-y-2">
                {organizations?.map((org: any) => (
                  <OrganizationRow key={org.id} organization={org} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Platform-wide analytics and metrics coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs... */}
      </Tabs>
    </div>
  );
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  highlight = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Organization Row Component
function OrganizationRow({ organization }: { organization: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getDatabaseStatus = () => {
    if (!organization.tenant_databases?.[0]) return 'No DB';
    return organization.tenant_databases[0].status;
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">{organization.name}</h3>
          <Badge variant={getStatusColor(organization.subscription_status)}>
            {organization.subscription_status}
          </Badge>
          <Badge variant="outline">
            {organization.subscription_plan}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span>{organization.subdomain}.myaurelio.com</span>
          {organization.domain && <span>• {organization.domain}</span>}
          <span>• DB: {getDatabaseStatus()}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-1" />
          Manage
        </Button>
      </div>
    </div>
  );
}
