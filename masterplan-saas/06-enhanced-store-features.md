# Enhanced Store Features

## Advanced Product Management

### Bulk Product Operations
```typescript
interface BulkOperation {
  type: 'price_update' | 'category_change' | 'status_change' | 'inventory_update' | 'seo_update';
  productIds: string[];
  changes: Record<string, any>;
}

const BulkProductManager = () => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const BulkEditModal = () => (
    <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Edit Products ({selectedProducts.length} selected)</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="pricing" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price Action</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Set Price</SelectItem>
                    <SelectItem value="increase_percent">Increase by %</SelectItem>
                    <SelectItem value="decrease_percent">Decrease by %</SelectItem>
                    <SelectItem value="increase_amount">Increase by Amount</SelectItem>
                    <SelectItem value="decrease_amount">Decrease by Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Value</Label>
                <Input type="number" placeholder="Enter value" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="apply-sale" />
              <Label htmlFor="apply-sale">Apply sale price</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Action</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Set Stock Level</SelectItem>
                    <SelectItem value="add">Add to Stock</SelectItem>
                    <SelectItem value="subtract">Remove from Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Quantity</Label>
                <Input type="number" placeholder="Enter quantity" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="track-inventory" />
                <Label htmlFor="track-inventory">Track inventory</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="allow-backorders" />
                <Label htmlFor="allow-backorders">Allow backorders</Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button onClick={executeBulkOperation}>
            Apply Changes ({selectedProducts.length} products)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const executeBulkOperation = async () => {
    const { data, error } = await supabase.functions.invoke('bulk-update-products', {
      body: {
        productIds: selectedProducts,
        operation: bulkOperation,
        organizationId: currentOrganization.id
      }
    });

    if (error) {
      toast.error('Bulk operation failed');
    } else {
      toast.success(`Successfully updated ${selectedProducts.length} products`);
      setShowBulkModal(false);
      setSelectedProducts([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={selectedProducts.length === products.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">
            {selectedProducts.length > 0 
              ? `${selectedProducts.length} selected` 
              : 'Select all'
            }
          </span>
        </div>
        
        {selectedProducts.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBulkModal(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Bulk Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportSelected}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={duplicateSelected}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
          </div>
        )}
      </div>
      
      <BulkEditModal />
    </div>
  );
};
```

### Product Import/Export System
```typescript
interface ImportMapping {
  csvColumn: string;
  productField: string;
  transformer?: (value: string) => any;
}

const ProductImportExport = () => {
  const [importData, setImportData] = useState<any[]>([]);
  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'mapping' | 'importing' | 'complete'>('idle');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const parsed = parseCSV(csv);
      setImportData(parsed);
      setImportStatus('mapping');
    };
    reader.readAsText(file);
  };

  const FieldMappingStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Map CSV Columns to Product Fields</h3>
      
      <div className="grid gap-4">
        {Object.keys(importData[0] || {}).map(csvColumn => (
          <div key={csvColumn} className="flex items-center space-x-4">
            <div className="w-48">
              <Label className="font-medium">{csvColumn}</Label>
              <p className="text-sm text-gray-500">
                Sample: {importData[0]?.[csvColumn]}
              </p>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <Select
              value={mappings.find(m => m.csvColumn === csvColumn)?.productField || ''}
              onValueChange={(value) => updateMapping(csvColumn, value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Skip this column</SelectItem>
                <SelectItem value="name">Product Name</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
                <SelectItem value="stock_quantity">Stock Quantity</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="tags">Tags (comma separated)</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="meta_title">SEO Title</SelectItem>
                <SelectItem value="meta_description">SEO Description</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => setImportStatus('idle')}>
          Back
        </Button>
        <Button onClick={startImport}>
          Start Import ({importData.length} products)
        </Button>
      </div>
    </div>
  );

  const startImport = async () => {
    setImportStatus('importing');
    
    try {
      const { data, error } = await supabase.functions.invoke('import-products', {
        body: {
          data: importData,
          mappings: mappings,
          organizationId: currentOrganization.id
        }
      });

      if (error) throw error;
      
      setImportStatus('complete');
      toast.success(`Successfully imported ${data.imported} products`);
    } catch (error) {
      toast.error('Import failed: ' + error.message);
      setImportStatus('mapping');
    }
  };

  const exportProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        product_images(image_url),
        product_tags(tags(name))
      `)
      .eq('organization_id', currentOrganization.id);

    const csv = generateCSV(data);
    downloadCSV(csv, `products-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Import/Export Products</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportProducts}>
            <Download className="w-4 h-4 mr-2" />
            Export All Products
          </Button>
          <Button onClick={() => downloadTemplate()}>
            <FileText className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      {importStatus === 'idle' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Import Products from CSV</h3>
              <p className="text-gray-600 mb-4">
                Upload a CSV file to bulk import products into your store.
              </p>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <Button asChild>
                  <span>Choose CSV File</span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {importStatus === 'mapping' && <FieldMappingStep />}

      {importStatus === 'importing' && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Importing Products...</h3>
            <p className="text-gray-600">Please wait while we process your file.</p>
          </CardContent>
        </Card>
      )}

      {importStatus === 'complete' && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Import Complete!</h3>
            <p className="text-gray-600 mb-4">
              Your products have been successfully imported.
            </p>
            <Button onClick={() => navigate('/admin/products')}>
              View Products
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

## Advanced Analytics & Reporting

### Store Analytics Dashboard
```typescript
interface StoreAnalytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
    topSellingProducts: Array<{
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
  };
  traffic: {
    uniqueVisitors: number;
    pageViews: number;
    bounceRate: number;
    averageSessionDuration: number;
    topPages: Array<{
      path: string;
      views: number;
      uniqueViews: number;
    }>;
  };
  customers: {
    newCustomers: number;
    returningCustomers: number;
    customerLifetimeValue: number;
    topCustomers: Array<{
      id: string;
      name: string;
      email: string;
      totalSpent: number;
      orderCount: number;
    }>;
  };
  geography: {
    countries: Array<{
      country: string;
      orders: number;
      revenue: number;
    }>;
    cities: Array<{
      city: string;
      orders: number;
      revenue: number;
    }>;
  };
}

const StoreAnalytics = () => {
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('get-store-analytics', {
      body: {
        organizationId: currentOrganization.id,
        dateRange
      }
    });
    setAnalytics(data);
    setLoading(false);
  };

  const AnalyticsCard = ({ title, value, change, icon: Icon }: {
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
                {change >= 0 ? '+' : ''}{change}% vs previous period
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  const TopProductsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity Sold</TableHead>
              <TableHead>Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics?.overview.topSellingProducts.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>€{product.revenue.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const GeographyChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Orders by Country</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics?.geography.countries.slice(0, 5).map(country => (
            <div key={country.country} className="flex justify-between items-center">
              <span className="font-medium">{country.country}</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ 
                      width: `${(country.orders / analytics.geography.countries[0].orders) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">{country.orders}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Store Analytics</h1>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Revenue"
          value={`€${analytics?.overview.totalRevenue?.toLocaleString() || 0}`}
          change={15.2}
          icon={DollarSign}
        />
        <AnalyticsCard
          title="Total Orders"
          value={analytics?.overview.totalOrders || 0}
          change={8.1}
          icon={ShoppingCart}
        />
        <AnalyticsCard
          title="Average Order Value"
          value={`€${analytics?.overview.averageOrderValue || 0}`}
          change={-2.4}
          icon={TrendingUp}
        />
        <AnalyticsCard
          title="Conversion Rate"
          value={`${analytics?.overview.conversionRate || 0}%`}
          change={0.8}
          icon={Target}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart dateRange={dateRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics?.traffic.uniqueVisitors || 0}</p>
                <p className="text-sm text-gray-500">Unique Visitors</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics?.traffic.pageViews || 0}</p>
                <p className="text-sm text-gray-500">Page Views</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics?.traffic.bounceRate || 0}%</p>
                <p className="text-sm text-gray-500">Bounce Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics?.traffic.averageSessionDuration || 0}s</p>
                <p className="text-sm text-gray-500">Avg Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsTable />
        <GeographyChart />
      </div>
    </div>
  );
};
```

## Marketing & SEO Tools

### Email Marketing Campaign Builder
```typescript
interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'newsletter' | 'promotional' | 'abandoned_cart' | 'welcome' | 'order_confirmation';
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  scheduledAt?: string;
  sentAt?: string;
  recipients: {
    segmentId?: string;
    customerIds?: string[];
    totalCount: number;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
}

const EmailCampaignBuilder = () => {
  const [campaign, setCampaign] = useState<Partial<EmailCampaign>>({
    type: 'newsletter',
    status: 'draft'
  });
  const [currentStep, setCurrentStep] = useState<'details' | 'design' | 'recipients' | 'review'>('details');

  const CampaignDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="campaignName">Campaign Name</Label>
        <Input
          id="campaignName"
          value={campaign.name || ''}
          onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
          placeholder="Enter campaign name"
        />
      </div>

      <div>
        <Label htmlFor="campaignType">Campaign Type</Label>
        <Select 
          value={campaign.type} 
          onValueChange={(value: any) => setCampaign({ ...campaign, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="promotional">Promotional</SelectItem>
            <SelectItem value="abandoned_cart">Abandoned Cart Recovery</SelectItem>
            <SelectItem value="welcome">Welcome Series</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          value={campaign.subject || ''}
          onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
          placeholder="Enter email subject"
        />
      </div>
    </div>
  );

  const EmailDesignStep = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(template => (
              <div 
                key={template.id}
                className="border rounded-lg cursor-pointer hover:border-primary"
                onClick={() => selectTemplate(template)}
              >
                <img 
                  src={template.thumbnail} 
                  alt={template.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-3">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Email Content</h3>
          <div className="border rounded-lg">
            <EmailEditor
              value={campaign.content || ''}
              onChange={(content) => setCampaign({ ...campaign, content })}
            />
          </div>
        </div>
      </div>
    );
  };

  const RecipientSelectionStep = () => {
    const [segments, setSegments] = useState<CustomerSegment[]>([]);
    const [selectedSegment, setSelectedSegment] = useState<string>('');

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Recipients</h3>
          
          <Tabs defaultValue="segments">
            <TabsList>
              <TabsTrigger value="segments">Customer Segments</TabsTrigger>
              <TabsTrigger value="manual">Manual Selection</TabsTrigger>
              <TabsTrigger value="import">Import List</TabsTrigger>
            </TabsList>
            
            <TabsContent value="segments" className="space-y-4">
              {segments.map(segment => (
                <div 
                  key={segment.id}
                  className={`border rounded-lg p-4 cursor-pointer ${
                    selectedSegment === segment.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedSegment(segment.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-sm text-gray-500">{segment.description}</p>
                    </div>
                    <Badge variant="outline">
                      {segment.customerCount} customers
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create Email Campaign</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft}>
            Save Draft
          </Button>
          <Button onClick={sendTestEmail}>
            Send Test
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {['details', 'design', 'recipients', 'review'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 capitalize">{step}</span>
            {index < 3 && <ChevronRight className="w-4 h-4 ml-4 text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 'details' && <CampaignDetailsStep />}
          {currentStep === 'design' && <EmailDesignStep />}
          {currentStep === 'recipients' && <RecipientSelectionStep />}
          {currentStep === 'review' && <CampaignReviewStep />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 'details'}
        >
          Previous
        </Button>
        
        <Button onClick={goToNextStep}>
          {currentStep === 'review' ? 'Send Campaign' : 'Next'}
        </Button>
      </div>
    </div>
  );
};
```

### SEO Optimization Tools
```typescript
interface SEOAnalysis {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    priority: 'high' | 'medium' | 'low';
    element?: string;
  }>;
  recommendations: string[];
  keywords: Array<{
    keyword: string;
    density: number;
    ranking?: number;
  }>;
}

const SEOManager = () => {
  const [seoData, setSeoData] = useState<SEOAnalysis | null>(null);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const analyzePage = async (pageUrl: string) => {
    setLoading(true);
    
    try {
      const { data } = await supabase.functions.invoke('analyze-seo', {
        body: {
          url: pageUrl,
          organizationId: currentOrganization.id
        }
      });
      
      setSeoData(data);
    } catch (error) {
      toast.error('SEO analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const SEOScoreCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>SEO Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getScoreColor(seoData?.score || 0)}
                strokeWidth="3"
                strokeDasharray={`${seoData?.score || 0}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{seoData?.score || 0}</span>
            </div>
          </div>
          <p className="text-lg font-semibold">
            {getScoreLabel(seoData?.score || 0)}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const IssuesList = () => (
    <Card>
      <CardHeader>
        <CardTitle>SEO Issues</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {seoData?.issues.map((issue, index) => (
            <div 
              key={index}
              className={`flex items-start space-x-3 p-3 rounded-lg ${
                issue.type === 'error' ? 'bg-red-50' :
                issue.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
              }`}
            >
              <div className={`mt-0.5 ${
                issue.type === 'error' ? 'text-red-600' :
                issue.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {issue.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                 issue.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                 <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">{issue.message}</p>
                {issue.element && (
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {issue.element}
                  </code>
                )}
              </div>
              <Badge variant={issue.priority === 'high' ? 'destructive' : 'secondary'}>
                {issue.priority}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const KeywordAnalysis = () => (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {seoData?.keywords.map(keyword => (
            <div key={keyword.keyword} className="flex justify-between items-center">
              <span className="font-medium">{keyword.keyword}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {keyword.density}% density
                </span>
                {keyword.ranking && (
                  <Badge variant="outline">
                    Rank #{keyword.ranking}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={openKeywordResearch}>
            <Search className="w-4 h-4 mr-2" />
            Research New Keywords
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SEO Manager</h1>
        <div className="flex gap-2">
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select page to analyze" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homepage">Homepage</SelectItem>
              <SelectItem value="products">Products Page</SelectItem>
              <SelectItem value="about">About Page</SelectItem>
              <SelectItem value="contact">Contact Page</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => analyzePage(selectedPage)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
          </Button>
        </div>
      </div>

      {seoData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SEOScoreCard />
          
          <div className="lg:col-span-2 space-y-6">
            <IssuesList />
            <KeywordAnalysis />
          </div>
        </div>
      )}

      {/* SEO Recommendations */}
      {seoData?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {seoData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

## Multi-Channel Selling

### Social Media Integration
```typescript
const SocialMediaManager = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'idle' | 'syncing' | 'success' | 'error'>>({});

  interface SocialAccount {
    id: string;
    platform: 'facebook' | 'instagram' | 'tiktok' | 'pinterest';
    accountName: string;
    isConnected: boolean;
    lastSync?: string;
    productCount: number;
  }

  const connectSocialAccount = async (platform: string) => {
    // Implement OAuth flow for social media platform
    const authUrl = await getSocialAuthUrl(platform);
    window.open(authUrl, '_blank', 'width=600,height=600');
  };

  const syncProductsToSocial = async (accountId: string, productIds: string[]) => {
    setSyncStatus(prev => ({ ...prev, [accountId]: 'syncing' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-products-to-social', {
        body: {
          accountId,
          productIds,
          organizationId: currentOrganization.id
        }
      });

      if (error) throw error;
      
      setSyncStatus(prev => ({ ...prev, [accountId]: 'success' }));
      toast.success(`Successfully synced ${productIds.length} products`);
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, [accountId]: 'error' }));
      toast.error('Failed to sync products');
    }
  };

  const SocialAccountCard = ({ account }: { account: SocialAccount }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              account.platform === 'facebook' ? 'bg-blue-600' :
              account.platform === 'instagram' ? 'bg-pink-600' :
              account.platform === 'tiktok' ? 'bg-black' : 'bg-red-600'
            }`}>
              {getSocialIcon(account.platform)}
            </div>
            <div>
              <h3 className="font-semibold capitalize">{account.platform}</h3>
              <p className="text-sm text-gray-500">@{account.accountName}</p>
            </div>
          </div>
          
          <Badge variant={account.isConnected ? 'default' : 'secondary'}>
            {account.isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        
        {account.isConnected ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Products synced:</span>
              <span className="font-medium">{account.productCount}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last sync:</span>
              <span className="font-medium">
                {account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Never'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => openProductSelector(account.id)}
                disabled={syncStatus[account.id] === 'syncing'}
              >
                {syncStatus[account.id] === 'syncing' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Sync Products
              </Button>
              
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => connectSocialAccount(account.platform)}
            className="w-full"
          >
            Connect Account
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Social Media Integration</h1>
        <Button onClick={refreshAllAccounts}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connectedAccounts.map(account => (
          <SocialAccountCard key={account.id} account={account} />
        ))}
      </div>

      {/* Bulk Sync Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Sync Tools</CardTitle>
          <CardDescription>
            Sync multiple products to all connected social media accounts at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select product category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="featured">Featured Products</SelectItem>
                  <SelectItem value="new">New Products</SelectItem>
                  <SelectItem value="sale">On Sale</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={syncAllProducts}>
                Sync to All Platforms
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              This will sync selected products to all connected social media accounts.
              Make sure your products have high-quality images and complete descriptions.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```