# Store Management System

## Store Creation Wizard

### Store Creation Flow
```typescript
interface StoreCreationSteps {
  BASIC_INFO = 'basic_info',
  TEMPLATE_SELECTION = 'template_selection', 
  DOMAIN_SETUP = 'domain_setup',
  PAYMENT_SETUP = 'payment_setup',
  COMPLETION = 'completion'
}

interface StoreCreationData {
  // Basic Info
  storeName: string;
  storeSlug: string;
  description: string;
  category: string;
  country: string;
  currency: string;
  timezone: string;
  
  // Template & Design
  templateId: string;
  primaryColor: string;
  logoUrl?: string;
  
  // Domain
  useSubdomain: boolean;
  customDomain?: string;
  
  // Payment
  paymentProvider: 'stripe' | 'mollie' | 'paypal';
  paymentCredentials: Record<string, string>;
}
```

### Step 1: Basic Information
```typescript
const BasicInfoStep = ({ data, updateData, nextStep }: StepProps) => {
  const [formData, setFormData] = useState({
    storeName: data.storeName || '',
    storeSlug: data.storeSlug || '',
    description: data.description || '',
    category: data.category || '',
    country: data.country || 'NL',
    currency: data.currency || 'EUR',
    timezone: data.timezone || 'Europe/Amsterdam'
  });

  const validateSlug = async (slug: string) => {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();
    
    return !existing;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate slug availability
    const isSlugAvailable = await validateSlug(formData.storeSlug);
    if (!isSlugAvailable) {
      setError('This store name is already taken');
      return;
    }
    
    updateData(formData);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="storeName">Store Name</Label>
        <Input
          id="storeName"
          value={formData.storeName}
          onChange={(e) => {
            setFormData({
              ...formData,
              storeName: e.target.value,
              storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]/gi, '-')
            });
          }}
          placeholder="My Awesome Store"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="storeSlug">Store URL</Label>
        <div className="flex items-center">
          <Input
            id="storeSlug"
            value={formData.storeSlug}
            onChange={(e) => setFormData({
              ...formData,
              storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/gi, '')
            })}
            placeholder="my-store"
            required
          />
          <span className="ml-2 text-sm text-gray-500">.ourplatform.com</span>
        </div>
      </div>
      
      <div>
        <Label htmlFor="category">Store Category</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fashion">Fashion & Clothing</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="home-garden">Home & Garden</SelectItem>
            <SelectItem value="sports">Sports & Outdoors</SelectItem>
            <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
            <SelectItem value="books">Books & Media</SelectItem>
            <SelectItem value="food">Food & Beverages</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" className="w-full">
        Continue to Template Selection
      </Button>
    </form>
  );
};
```

### Step 2: Template Selection
```typescript
interface StoreTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  previewImages: string[];
  demoUrl: string;
  isPremium: boolean;
  price?: number;
  features: string[];
}

const TemplateSelectionStep = ({ data, updateData, nextStep }: StepProps) => {
  const [templates, setTemplates] = useState<StoreTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(data.templateId || '');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    // Fetch available templates based on store category
    const { data: templatesData } = await supabase
      .from('store_templates')
      .select('*')
      .or(`category.eq.${data.category},category.eq.universal`)
      .eq('is_active', true)
      .order('sort_order');
    
    setTemplates(templatesData || []);
  };

  const TemplateCard = ({ template }: { template: StoreTemplate }) => (
    <div 
      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
        selectedTemplate === template.id 
          ? 'border-primary ring-2 ring-primary ring-opacity-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedTemplate(template.id)}
    >
      <div className="aspect-video bg-gray-100">
        <img 
          src={template.previewImages[0]} 
          alt={template.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold">{template.name}</h3>
          {template.isPremium && (
            <Badge variant="secondary">Premium - €{template.price}</Badge>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
        
        <div className="flex flex-wrap gap-1">
          {template.features.slice(0, 3).map(feature => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              window.open(template.demoUrl, '_blank');
            }}
          >
            Preview
          </Button>
          
          {selectedTemplate === template.id && (
            <Button size="sm">
              <Check className="w-4 h-4 mr-1" />
              Selected
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Template</h2>
        <p className="text-gray-600">
          Select a template that matches your store's style. You can customize it later.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
      
      <Button 
        onClick={() => {
          updateData({ templateId: selectedTemplate });
          nextStep();
        }}
        disabled={!selectedTemplate}
        className="w-full"
      >
        Continue to Domain Setup
      </Button>
    </div>
  );
};
```

### Step 3: Domain Setup
```typescript
const DomainSetupStep = ({ data, updateData, nextStep }: StepProps) => {
  const [domainType, setDomainType] = useState<'subdomain' | 'custom'>(
    data.useSubdomain ? 'subdomain' : 'custom'
  );
  const [customDomain, setCustomDomain] = useState(data.customDomain || '');
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyCustomDomain = async (domain: string) => {
    setIsVerifying(true);
    
    try {
      const { data: verification } = await supabase.functions.invoke('verify-domain', {
        body: { domain, organizationId: 'temp' }
      });
      
      return verification.isValid;
    } catch (error) {
      console.error('Domain verification failed:', error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinue = async () => {
    if (domainType === 'custom') {
      if (!customDomain) {
        setError('Please enter a custom domain');
        return;
      }
      
      const isValid = await verifyCustomDomain(customDomain);
      if (!isValid) {
        setError('Domain verification failed. Please check your DNS settings.');
        return;
      }
    }
    
    updateData({ 
      useSubdomain: domainType === 'subdomain',
      customDomain: domainType === 'custom' ? customDomain : undefined
    });
    
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Set Up Your Domain</h2>
        <p className="text-gray-600">
          Choose how customers will access your store.
        </p>
      </div>
      
      <div className="space-y-4">
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            domainType === 'subdomain' ? 'border-primary bg-primary/5' : 'border-gray-200'
          }`}
          onClick={() => setDomainType('subdomain')}
        >
          <div className="flex items-center space-x-3">
            <RadioButton checked={domainType === 'subdomain'} readOnly />
            <div>
              <h3 className="font-semibold">Use Subdomain</h3>
              <p className="text-sm text-gray-600">
                {data.storeSlug}.ourplatform.com
              </p>
              <Badge variant="secondary" className="mt-1">Free</Badge>
            </div>
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            domainType === 'custom' ? 'border-primary bg-primary/5' : 'border-gray-200'
          }`}
          onClick={() => setDomainType('custom')}
        >
          <div className="flex items-center space-x-3">
            <RadioButton checked={domainType === 'custom'} readOnly />
            <div className="flex-1">
              <h3 className="font-semibold">Custom Domain</h3>
              <p className="text-sm text-gray-600">Use your own domain name</p>
              <Badge variant="outline" className="mt-1">€50 setup fee</Badge>
              
              {domainType === 'custom' && (
                <div className="mt-3">
                  <Input
                    placeholder="yourdomain.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                  />
                  
                  <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                    <p className="font-medium mb-1">DNS Setup Instructions:</p>
                    <p>Add a CNAME record pointing to: {data.storeSlug}.ourplatform.com</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handleContinue}
        className="w-full"
        disabled={isVerifying}
      >
        {isVerifying ? 'Verifying Domain...' : 'Continue to Payment Setup'}
      </Button>
    </div>
  );
};
```

## Store Settings Management

### Store Configuration Interface
```typescript
const StoreSettings = () => {
  const { currentOrganization } = useStore();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  interface StoreSettings {
    // Basic Info
    name: string;
    description: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    
    // Business Settings
    currency: string;
    timezone: string;
    taxSettings: {
      includeTaxInPrices: boolean;
      taxRate: number;
      taxNumber?: string;
    };
    
    // Shipping
    shippingSettings: {
      enabled: boolean;
      freeShippingThreshold?: number;
      shippingRates: ShippingRate[];
    };
    
    // Design & Branding
    branding: {
      logoUrl?: string;
      faviconUrl?: string;
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
    };
    
    // SEO
    seo: {
      metaTitle: string;
      metaDescription: string;
      metaKeywords: string;
      googleAnalyticsId?: string;
      facebookPixelId?: string;
    };
    
    // Social Media
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
    
    // Notifications
    notifications: {
      orderNotifications: boolean;
      customerNotifications: boolean;
      marketingEmails: boolean;
      lowStockAlerts: boolean;
    };
  }

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <Button onClick={saveSettings}>Save Changes</Button>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <SettingsSection title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={settings?.name || ''}
                  onChange={(e) => updateSetting('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="storeEmail">Contact Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={settings?.email || ''}
                  onChange={(e) => updateSetting('email', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="storeDescription">Store Description</Label>
              <Textarea
                id="storeDescription"
                value={settings?.description || ''}
                onChange={(e) => updateSetting('description', e.target.value)}
                rows={3}
              />
            </div>
          </SettingsSection>
          
          <SettingsSection title="Business Address">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={settings?.address.street || ''}
                  onChange={(e) => updateSetting('address.street', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={settings?.address.city || ''}
                  onChange={(e) => updateSetting('address.city', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={settings?.address.postalCode || ''}
                  onChange={(e) => updateSetting('address.postalCode', e.target.value)}
                />
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
        
        {/* Additional tabs content here */}
      </Tabs>
    </div>
  );
};
```

### Theme Customization System
```typescript
interface StoreTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  layout: {
    borderRadius: string;
    spacing: string;
    maxWidth: string;
  };
  components: {
    button: ComponentTheme;
    card: ComponentTheme;
    input: ComponentTheme;
  };
}

const ThemeCustomizer = () => {
  const [currentTheme, setCurrentTheme] = useState<StoreTheme | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const ColorPicker = ({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (color: string) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );

  const FontSelector = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (font: string) => void;
    options: string[];
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(font => (
            <SelectItem key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Theme Editor */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Theme Customizer</h2>
          <Button 
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Exit Preview' : 'Preview Changes'}
          </Button>
        </div>
        
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-4">
            <ColorPicker
              label="Primary Color"
              value={currentTheme?.colors.primary || '#000000'}
              onChange={(color) => updateTheme('colors.primary', color)}
            />
            
            <ColorPicker
              label="Secondary Color"
              value={currentTheme?.colors.secondary || '#666666'}
              onChange={(color) => updateTheme('colors.secondary', color)}
            />
            
            {/* More color pickers */}
          </TabsContent>
          
          <TabsContent value="typography" className="space-y-4">
            <FontSelector
              label="Heading Font"
              value={currentTheme?.typography.headingFont || 'Inter'}
              onChange={(font) => updateTheme('typography.headingFont', font)}
              options={['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato']}
            />
            
            <FontSelector
              label="Body Font"
              value={currentTheme?.typography.bodyFont || 'Inter'}
              onChange={(font) => updateTheme('typography.bodyFont', font)}
              options={['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato']}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex gap-2">
          <Button onClick={saveTheme} className="flex-1">
            Save Theme
          </Button>
          <Button variant="outline" onClick={resetTheme}>
            Reset to Default
          </Button>
        </div>
      </div>
      
      {/* Live Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-2 text-center text-sm font-medium">
          Live Preview
        </div>
        <div className="p-4 min-h-[400px]">
          <StorePreview theme={currentTheme} />
        </div>
      </div>
    </div>
  );
};
```

## Domain Management

### Custom Domain Setup
```typescript
const DomainManagement = () => {
  const { currentOrganization } = useStore();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  interface Domain {
    id: string;
    domain: string;
    status: 'pending' | 'verified' | 'failed';
    isCustom: boolean;
    sslStatus: 'pending' | 'issued' | 'failed';
    verificationToken?: string;
    createdAt: string;
  }

  const DomainCard = ({ domain }: { domain: Domain }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{domain.domain}</h3>
            <p className="text-sm text-gray-500">
              {domain.isCustom ? 'Custom Domain' : 'Subdomain'}
            </p>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <Badge 
              variant={domain.status === 'verified' ? 'default' : 'secondary'}
            >
              {domain.status}
            </Badge>
            
            <Badge 
              variant={domain.sslStatus === 'issued' ? 'default' : 'secondary'}
            >
              SSL: {domain.sslStatus}
            </Badge>
          </div>
        </div>
        
        {domain.status === 'pending' && domain.isCustom && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm font-medium mb-2">DNS Configuration Required</p>
            <div className="space-y-1 text-xs font-mono">
              <div>Type: CNAME</div>
              <div>Name: @ (or your domain)</div>
              <div>Value: {currentOrganization?.slug}.ourplatform.com</div>
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => verifyDomain(domain.id)}
            >
              Verify DNS
            </Button>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Added {new Date(domain.createdAt).toLocaleDateString()}
          </div>
          
          <div className="flex gap-2">
            {domain.status === 'verified' && (
              <Button size="sm" variant="outline">
                <ExternalLink className="w-4 h-4 mr-1" />
                Visit
              </Button>
            )}
            
            {domain.isCustom && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => removeDomain(domain.id)}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AddCustomDomain = () => {
    const [newDomain, setNewDomain] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddDomain = async () => {
      setIsAdding(true);
      
      try {
        const { data } = await supabase.functions.invoke('add-custom-domain', {
          body: {
            domain: newDomain,
            organizationId: currentOrganization?.id
          }
        });
        
        setDomains([...domains, data]);
        setNewDomain('');
        setIsAddingDomain(false);
      } catch (error) {
        console.error('Failed to add domain:', error);
      } finally {
        setIsAdding(false);
      }
    };

    return (
      <Dialog open={isAddingDomain} onOpenChange={setIsAddingDomain}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Domain</DialogTitle>
            <DialogDescription>
              Connect your own domain to your store for a professional appearance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="font-medium mb-1">Setup Fee</p>
              <p>Adding a custom domain costs €50 (one-time fee) and includes:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>SSL certificate</li>
                <li>DNS management</li>
                <li>24/7 monitoring</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingDomain(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDomain} disabled={isAdding || !newDomain}>
              {isAdding ? 'Adding...' : 'Add Domain (€50)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Domain Management</h1>
        <Button onClick={() => setIsAddingDomain(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Domain
        </Button>
      </div>
      
      <div className="grid gap-4">
        {domains.map(domain => (
          <DomainCard key={domain.id} domain={domain} />
        ))}
      </div>
      
      <AddCustomDomain />
    </div>
  );
};
```