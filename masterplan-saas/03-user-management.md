# User Management & Authentication System

## User Role Hierarchy

### Platform-Level Roles
```typescript
enum PlatformRole {
  SUPER_ADMIN = 'super_admin',    // Platform administrators
  SUPPORT = 'support',            // Customer support team
  USER = 'user'                   // Regular platform users
}

enum OrganizationRole {
  OWNER = 'owner',                // Store owner (billing responsible)
  ADMIN = 'admin',                // Store administrator
  MANAGER = 'manager',            // Store manager (limited admin)
  STAFF = 'staff',                // Store staff member
  VIEWER = 'viewer'               // Read-only access
}
```

### Permission Matrix
| Action | Owner | Admin | Manager | Staff | Viewer |
|--------|-------|-------|---------|-------|--------|
| Store Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Billing & Subscription | ✅ | ❌ | ❌ | ❌ | ❌ |
| User Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Product Management | ✅ | ✅ | ✅ | ✅ | ❌ |
| Order Management | ✅ | ✅ | ✅ | ✅ | ❌ |
| Analytics View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customer Support | ✅ | ✅ | ✅ | ✅ | ❌ |

## Database Schema for User Management

### Core User Tables
```sql
-- Enhanced organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'trial',
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  billing_email TEXT,
  max_users INTEGER DEFAULT 1,
  max_products INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Organization relationship
CREATE TABLE public.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role DEFAULT 'staff',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Platform-level user roles
CREATE TABLE public.platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  platform_role platform_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User invitations
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role DEFAULT 'staff',
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);
```

### RLS Policies for User Management
```sql
-- Organization users can only see their own organization's users
CREATE POLICY "org_users_isolation" ON organization_users
FOR ALL USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Only owners and admins can manage users
CREATE POLICY "user_management_permission" ON organization_users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users 
    WHERE user_id = auth.uid() 
    AND organization_id = NEW.organization_id 
    AND role IN ('owner', 'admin')
  )
);
```

## User Authentication Flow

### Registration & Store Creation
```typescript
interface StoreRegistrationData {
  email: string;
  password: string;
  storeName: string;
  storeSlug: string;
  firstName: string;
  lastName: string;
}

const registerStoreOwner = async (data: StoreRegistrationData) => {
  // 1. Create Supabase auth user
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'store_owner'
      }
    }
  });

  if (authError) throw authError;

  // 2. Create organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: data.storeName,
      slug: data.storeSlug,
      subscription_tier: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    })
    .select()
    .single();

  if (orgError) throw orgError;

  // 3. Add user as organization owner
  await supabase
    .from('organization_users')
    .insert({
      organization_id: organization.id,
      user_id: authUser.user!.id,
      role: 'owner',
      joined_at: new Date()
    });

  // 4. Initialize default store data
  await initializeStoreDefaults(organization.id);

  return { user: authUser.user, organization };
};
```

### User Invitation System
```typescript
interface InviteUserData {
  email: string;
  role: OrganizationRole;
  organizationId: string;
}

const inviteUser = async (data: InviteUserData) => {
  const currentUser = await getCurrentUser();
  
  // Verify permission to invite
  const hasPermission = await verifyUserPermission(
    currentUser.id, 
    data.organizationId, 
    ['owner', 'admin']
  );
  
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }

  // Create invitation
  const { data: invitation } = await supabase
    .from('user_invitations')
    .insert({
      organization_id: data.organizationId,
      email: data.email,
      role: data.role,
      invited_by: currentUser.id
    })
    .select()
    .single();

  // Send invitation email
  await sendInvitationEmail(invitation);

  return invitation;
};

const acceptInvitation = async (invitationToken: string, userData: {
  password: string;
  firstName: string;
  lastName: string;
}) => {
  // 1. Verify invitation
  const { data: invitation } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('invitation_token', invitationToken)
    .gt('expires_at', new Date().toISOString())
    .is('accepted_at', null)
    .single();

  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // 2. Create user account
  const { data: authUser } = await supabase.auth.signUp({
    email: invitation.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName
      }
    }
  });

  // 3. Add to organization
  await supabase
    .from('organization_users')
    .insert({
      organization_id: invitation.organization_id,
      user_id: authUser.user!.id,
      role: invitation.role,
      joined_at: new Date()
    });

  // 4. Mark invitation as accepted
  await supabase
    .from('user_invitations')
    .update({ accepted_at: new Date() })
    .eq('id', invitation.id);

  return authUser;
};
```

## Organization Management

### Store Switching Interface
```typescript
const StoreSelector = () => {
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    const { data } = await supabase
      .from('organization_users')
      .select(`
        role,
        joined_at,
        organizations (
          id,
          name,
          slug,
          custom_domain,
          subscription_tier
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    setUserOrganizations(data?.map(item => ({
      ...item.organizations,
      userRole: item.role
    })) || []);
  };

  const switchOrganization = async (orgId: string) => {
    const org = userOrganizations.find(o => o.id === orgId);
    setCurrentOrg(org);
    
    // Update session context
    await updateSessionContext({ organizationId: orgId });
    
    // Redirect to organization dashboard
    navigate(`/admin/dashboard`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Store</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userOrganizations.map(org => (
          <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg">{org.name}</h3>
              <p className="text-sm text-gray-500">@{org.slug}</p>
              <Badge variant="secondary" className="mt-2">
                {org.userRole}
              </Badge>
              <Button 
                className="w-full mt-4"
                onClick={() => switchOrganization(org.id)}
              >
                Enter Store
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button 
        variant="outline" 
        className="mt-6"
        onClick={() => navigate('/create-store')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Create New Store
      </Button>
    </div>
  );
};
```

### User Management Interface
```typescript
const UserManagement = () => {
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const { currentOrganization } = useStore();

  const UserListItem = ({ user }: { user: OrganizationUser }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarFallback>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {user.role}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editUser(user)}>
              Edit Role
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => removeUser(user)}
              className="text-red-600"
            >
              Remove User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Management</h2>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Active Users */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Active Users</h3>
        {organizationUsers.map(user => (
          <UserListItem key={user.id} user={user} />
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Pending Invitations</h3>
          {invitations.map(invitation => (
            <PendingInvitationItem key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}
    </div>
  );
};
```

## Security & Access Control

### Permission Checking System
```typescript
const usePermissions = () => {
  const { user, currentOrganization } = useAuth();
  const [userRole, setUserRole] = useState<OrganizationRole>();

  useEffect(() => {
    if (user && currentOrganization) {
      fetchUserRole();
    }
  }, [user, currentOrganization]);

  const fetchUserRole = async () => {
    const { data } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', currentOrganization.id)
      .single();
    
    setUserRole(data?.role);
  };

  const hasPermission = (requiredPermissions: OrganizationRole[]) => {
    return userRole && requiredPermissions.includes(userRole);
  };

  const canManageUsers = () => hasPermission(['owner', 'admin']);
  const canManageProducts = () => hasPermission(['owner', 'admin', 'manager', 'staff']);
  const canViewAnalytics = () => hasPermission(['owner', 'admin', 'manager', 'staff', 'viewer']);
  const canManageSettings = () => hasPermission(['owner', 'admin']);
  const canManageBilling = () => hasPermission(['owner']);

  return {
    userRole,
    hasPermission,
    canManageUsers,
    canManageProducts,
    canViewAnalytics,
    canManageSettings,
    canManageBilling
  };
};

// HOC for protecting routes
const withPermission = (
  Component: React.ComponentType,
  requiredPermissions: OrganizationRole[]
) => {
  return (props: any) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(requiredPermissions)) {
      return <UnauthorizedPage />;
    }
    
    return <Component {...props} />;
  };
};
```

### Session Management
```typescript
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load user's organizations and set default
          setTimeout(async () => {
            await loadUserOrganizations(session.user.id);
          }, 0);
        } else {
          setCurrentOrganization(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserOrganizations(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserOrganizations = async (userId: string) => {
    const { data } = await supabase
      .from('organization_users')
      .select(`
        role,
        organizations (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    if (data && data.length > 0) {
      // Set the most recently joined organization as default
      setCurrentOrganization(data[0].organizations);
    }
  };

  return {
    user,
    session,
    currentOrganization,
    loading,
    setCurrentOrganization
  };
};
```