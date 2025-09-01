# Platform Admin Panel

## Super Admin Dashboard

### Platform Overview Dashboard
```typescript
interface PlatformStats {
  totalStores: number;
  activeStores: number;
  totalUsers: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  totalOrders: number;
  averageOrderValue: number;
  churnRate: number;
  subscriptionBreakdown: {
    trial: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
}

const PlatformDashboard = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
  }, [timeRange]);

  const fetchPlatformStats = async () => {
    const { data } = await supabase.functions.invoke('get-platform-statistics', {
      body: { timeRange }
    });
    setStats(data);
    setLoading(false);
  };

  const StatCard = ({ title, value, change, icon: Icon }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<any>;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}% from last period
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Stores"
          value={stats?.totalStores || 0}
          change={12}
          icon={Store}
        />
        <StatCard
          title="Active Users"
          value={stats?.totalUsers || 0}
          change={8}
          icon={Users}
        />
        <StatCard
          title="Monthly Revenue"
          value={`€${stats?.monthlyRevenue?.toLocaleString() || 0}`}
          change={stats?.monthlyGrowth}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          change={15}
          icon={ShoppingCart}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart timeRange={timeRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SubscriptionChart data={stats?.subscriptionBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityFeed />
        </CardContent>
      </Card>
    </div>
  );
};
```

### Store Management Interface
```typescript
interface StoreListItem {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  metrics: {
    totalProducts: number;
    totalOrders: number;
    monthlyRevenue: number;
    lastActivity: string;
  };
  isActive: boolean;
  createdAt: string;
}

const StoreManagement = () => {
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'trial'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'trial' | 'starter' | 'professional' | 'enterprise'>('all');

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    filterStores();
  }, [stores, searchTerm, statusFilter, tierFilter]);

  const filterStores = () => {
    let filtered = stores;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'trial') {
        filtered = filtered.filter(store => store.subscriptionTier === 'trial');
      } else {
        filtered = filtered.filter(store => 
          statusFilter === 'active' ? store.isActive : !store.isActive
        );
      }
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(store => store.subscriptionTier === tierFilter);
    }

    setFilteredStores(filtered);
  };

  const StoreRow = ({ store }: { store: StoreListItem }) => (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div>
            <p className="font-medium">{store.name}</p>
            <p className="text-sm text-gray-500">@{store.slug}</p>
            {store.customDomain && (
              <p className="text-xs text-blue-600">{store.customDomain}</p>
            )}
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div>
          <p className="font-medium">{store.owner.firstName} {store.owner.lastName}</p>
          <p className="text-sm text-gray-500">{store.owner.email}</p>
        </div>
      </TableCell>
      
      <TableCell>
        <Badge variant={getSubscriptionBadgeVariant(store.subscriptionTier)}>
          {store.subscriptionTier}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          <p>{store.metrics.totalProducts} products</p>
          <p>{store.metrics.totalOrders} orders</p>
          <p>€{store.metrics.monthlyRevenue} revenue</p>
        </div>
      </TableCell>
      
      <TableCell>
        <Badge variant={store.isActive ? 'default' : 'secondary'}>
          {store.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      
      <TableCell>
        <p className="text-sm">{new Date(store.createdAt).toLocaleDateString()}</p>
        <p className="text-xs text-gray-500">
          Last active: {new Date(store.metrics.lastActivity).toLocaleDateString()}
        </p>
      </TableCell>
      
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => viewStore(store.id)}>
              <Eye className="w-4 h-4 mr-2" />
              View Store
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loginAsUser(store.owner.id)}>
              <LogIn className="w-4 h-4 mr-2" />
              Login as User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => suspendStore(store.id)}>
              <Pause className="w-4 h-4 mr-2" />
              Suspend Store
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => deleteStore(store.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Store
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Store Management</h1>
        <Button onClick={() => navigate('/admin/stores/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Store
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search stores, owners, or domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={tierFilter} onValueChange={(value: any) => setTierFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stores Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores.map(store => (
              <StoreRow key={store.id} store={store} />
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
```

### User Management System
```typescript
interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: 'super_admin' | 'support' | 'user';
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  organizations: {
    id: string;
    name: string;
    role: string;
  }[];
  totalOrders: number;
  totalSpent: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const UserDetailsModal = () => (
    <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        {selectedUser && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <Label>Platform Role</Label>
                <Badge>{selectedUser.platformRole}</Badge>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Organizations */}
            <div>
              <Label className="text-lg">Organizations</Label>
              <div className="mt-2 space-y-2">
                {selectedUser.organizations.map(org => (
                  <div key={org.id} className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium">{org.name}</span>
                    <Badge variant="outline">{org.role}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold">{selectedUser.totalOrders}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold">€{selectedUser.totalSpent}</p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold">{selectedUser.organizations.length}</p>
                <p className="text-sm text-gray-500">Organizations</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => impersonateUser(selectedUser.id)}>
                <LogIn className="w-4 h-4 mr-2" />
                Login as User
              </Button>
              <Button 
                variant="outline"
                onClick={() => suspendUser(selectedUser.id)}
              >
                <Pause className="w-4 h-4 mr-2" />
                Suspend User
              </Button>
              <Button 
                variant="outline"
                onClick={() => resetPassword(selectedUser.id)}
              >
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => navigate('/admin/users/invite')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.platformRole === 'super_admin' ? 'default' : 'secondary'}>
                    {user.platformRole.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{user.organizations.length} organizations</p>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{user.totalOrders} orders</p>
                    <p>€{user.totalSpent} spent</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</p>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserDetails(true);
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <UserDetailsModal />
    </div>
  );
};
```

## Billing & Subscription Management

### Subscription Dashboard
```typescript
interface SubscriptionMetrics {
  totalMRR: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number;
  averageLifetimeValue: number;
  subscriptionGrowth: number;
  trialConversionRate: number;
  tierDistribution: {
    trial: { count: number; revenue: number };
    starter: { count: number; revenue: number };
    professional: { count: number; revenue: number };
    enterprise: { count: number; revenue: number };
  };
}

const BillingDashboard = () => {
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const SubscriptionCard = ({ subscription }: { subscription: Subscription }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">{subscription.organizationName}</h3>
            <p className="text-sm text-gray-500">{subscription.ownerEmail}</p>
          </div>
          <Badge variant={getSubscriptionStatusVariant(subscription.status)}>
            {subscription.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Plan</p>
            <p className="font-medium">{subscription.tier}</p>
          </div>
          <div>
            <p className="text-gray-500">Monthly Revenue</p>
            <p className="font-medium">€{subscription.monthlyAmount}</p>
          </div>
          <div>
            <p className="text-gray-500">Next Billing</p>
            <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Customer Since</p>
            <p className="font-medium">{new Date(subscription.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline">
            View Details
          </Button>
          <Button size="sm" variant="outline">
            Modify Plan
          </Button>
          {subscription.status === 'past_due' && (
            <Button size="sm" variant="outline" className="text-red-600">
              Send Reminder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            Export Data
          </Button>
          <Button>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">€{metrics?.totalMRR?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
            <p className="text-xs text-green-600 mt-1">
              +{metrics?.subscriptionGrowth}% this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{metrics?.newSubscriptions}</p>
            <p className="text-sm text-gray-500">New Subscriptions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{metrics?.churnRate}%</p>
            <p className="text-sm text-gray-500">Churn Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{metrics?.trialConversionRate}%</p>
            <p className="text-sm text-gray-500">Trial Conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanDistributionChart data={metrics?.tierDistribution} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueByPlanChart data={metrics?.tierDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Subscriptions</h2>
        <div className="grid gap-4">
          {subscriptions.map(subscription => (
            <SubscriptionCard key={subscription.id} subscription={subscription} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Support Ticket System

### Support Dashboard
```typescript
interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other';
  customer: {
    id: string;
    name: string;
    email: string;
    organizationName: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  responseTime?: number; // in hours
  resolutionTime?: number; // in hours
}

const SupportDashboard = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState({
    openTickets: 0,
    averageResponseTime: 0,
    averageResolutionTime: 0,
    customerSatisfaction: 0
  });

  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{ticket.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant={getStatusVariant(ticket.status)}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <Badge variant={getPriorityVariant(ticket.priority)}>
              {ticket.priority}
            </Badge>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>
            <p>{ticket.customer.name} ({ticket.customer.organizationName})</p>
            <p>{ticket.category}</p>
          </div>
          <div className="text-right">
            <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
            {ticket.assignedTo && (
              <p>Assigned to {ticket.assignedTo.name}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Support Dashboard</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Support Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
            <p className="text-sm text-gray-500">Open Tickets</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{stats.averageResponseTime}h</p>
            <p className="text-sm text-gray-500">Avg Response Time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{stats.averageResolutionTime}h</p>
            <p className="text-sm text-gray-500">Avg Resolution Time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{stats.customerSatisfaction}%</p>
            <p className="text-sm text-gray-500">Customer Satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Filters */}
      <div className="flex gap-4">
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        
        <Input 
          placeholder="Search tickets..." 
          className="flex-1"
        />
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
};
```