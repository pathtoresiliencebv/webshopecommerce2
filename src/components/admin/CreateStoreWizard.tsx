/**
 * CREATE STORE WIZARD
 * 
 * Multi-step wizard for creating new webshops with:
 * - Basic info & branding
 * - Template selection
 * - Domain setup (subdomain + custom)
 * - Automatic tenant database provisioning
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { provisionTenantDatabase } from '@/lib/tenant-database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Store, Palette, Globe, Check, Loader2, 
  ArrowRight, ArrowLeft, Sparkles 
} from 'lucide-react';

type WizardStep = 'info' | 'template' | 'domain' | 'provisioning' | 'complete';

interface StoreData {
  name: string;
  slug: string;
  description: string;
  category: string;
  subdomain: string;
  customDomain?: string;
  templateId?: string;
}

const CATEGORIES = [
  { value: 'fashion', label: 'Fashion & Clothing' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'other', label: 'Other' },
];

export function CreateStoreWizard() {
  const navigate = useNavigate();
  const { createOrganization, refreshOrganizations } = useOrganization();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('info');
  const [storeData, setStoreData] = useState<StoreData>({
    name: '',
    slug: '',
    description: '',
    category: 'fashion',
    subdomain: '',
  });

  const steps = [
    { key: 'info', label: 'Store Info', icon: Store },
    { key: 'template', label: 'Template', icon: Palette },
    { key: 'domain', label: 'Domain', icon: Globe },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setStoreData(prev => ({ 
      ...prev, 
      name, 
      slug,
      subdomain: slug 
    }));
  };

  // Create organization mutation
  const createStoreMutation = useMutation({
    mutationFn: async () => {
      // 1. Create organization in central DB
      const { data: org, error } = await createOrganization({
        name: storeData.name,
        slug: storeData.slug,
        description: storeData.description,
      });

      if (error || !org) {
        throw new Error(error?.message || 'Failed to create organization');
      }

      // 2. Provision tenant database (Neon)
      const provisionResult = await provisionTenantDatabase(
        org.id,
        storeData.name,
        'eu-central-1' // Default region
      );

      if (!provisionResult.success) {
        throw new Error(provisionResult.error || 'Failed to provision database');
      }

      return { org, tenantDbId: provisionResult.tenantDatabaseId };
    },
    onSuccess: async (data) => {
      console.log('✅ Store created successfully:', data);
      
      // Refresh organizations
      await refreshOrganizations();
      
      // Show completion
      setCurrentStep('complete');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate(`/admin/store/${data.org.id}`);
      }, 3000);
    },
    onError: (error: Error) => {
      console.error('❌ Store creation failed:', error);
      toast.error(error.message || 'Failed to create store');
    },
  });

  const handleNext = () => {
    const stepIndex = steps.findIndex(s => s.key === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].key as WizardStep);
    } else {
      // Final step - create store
      setCurrentStep('provisioning');
      createStoreMutation.mutate();
    }
  };

  const handleBack = () => {
    const stepIndex = steps.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].key as WizardStep);
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 'info':
        return storeData.name && storeData.slug && storeData.category;
      case 'template':
        return true; // Optional
      case 'domain':
        return storeData.subdomain;
      default:
        return false;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Store</h1>
        <p className="text-muted-foreground">
          Set up your new e-commerce store in minutes
        </p>
      </div>

      {/* Progress Bar */}
      {currentStep !== 'complete' && currentStep !== 'provisioning' && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === currentStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${isActive ? 'bg-primary text-primary-foreground' : ''}
                    ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                    ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                  `}>
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{step.label}</span>
                    {isCompleted && <Check className="w-4 h-4" />}
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Basic Info */}
          {currentStep === 'info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Store Information</h2>
                <p className="text-muted-foreground">
                  Tell us about your new store
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Store Name *</Label>
                  <Input
                    id="name"
                    value={storeData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Awesome Store"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Store Slug (URL-friendly)</Label>
                  <Input
                    id="slug"
                    value={storeData.slug}
                    onChange={(e) => setStoreData(prev => ({ 
                      ...prev, 
                      slug: e.target.value,
                      subdomain: e.target.value 
                    }))}
                    placeholder="my-awesome-store"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be your store URL: <strong>{storeData.slug || 'your-store'}.myaurelio.com</strong>
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={storeData.description}
                    onChange={(e) => setStoreData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your store..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Store Category *</Label>
                  <Select 
                    value={storeData.category} 
                    onValueChange={(value) => setStoreData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Choose Template</h2>
                <p className="text-muted-foreground">
                  Select a design template for your store (you can customize later)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Modern Minimal', 'Colorful Creative', 'Professional Business'].map(template => (
                  <Card 
                    key={template}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      storeData.templateId === template ? 'border-primary ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setStoreData(prev => ({ ...prev, templateId: template }))}
                  >
                    <CardHeader>
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-2" />
                      <CardTitle className="text-lg">{template}</CardTitle>
                      <CardDescription>Clean and modern design</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                💡 You can customize colors, fonts, and layout after creation
              </p>
            </div>
          )}

          {/* Step 3: Domain Setup */}
          {currentStep === 'domain' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Domain Setup</h2>
                <p className="text-muted-foreground">
                  Configure your store's web address
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-accent">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <Label className="text-lg font-medium">Free Subdomain (Included)</Label>
                  </div>
                  <Input
                    value={storeData.subdomain}
                    onChange={(e) => setStoreData(prev => ({ ...prev, subdomain: e.target.value }))}
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Your store will be accessible at: <strong>{storeData.subdomain}.myaurelio.com</strong>
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-lg font-medium">Custom Domain (Optional)</Label>
                    <Badge variant="outline">€50 setup fee</Badge>
                  </div>
                  <Input
                    value={storeData.customDomain || ''}
                    onChange={(e) => setStoreData(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="www.yourstore.com"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    You can add a custom domain later in settings
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Provisioning State */}
          {currentStep === 'provisioning' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Creating Your Store...</h2>
                <p className="text-muted-foreground">
                  Please wait while we set up everything for you
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-2 text-left text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Creating organization...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Provisioning database (Neon)...</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-4 h-4" />
                  <span>Running migrations...</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-4 h-4" />
                  <span>Setting up store...</span>
                </div>
              </div>
            </div>
          )}

          {/* Complete State */}
          {currentStep === 'complete' && (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Store Created Successfully! 🎉</h2>
                <p className="text-muted-foreground">
                  Your store is ready at: <strong>{storeData.subdomain}.myaurelio.com</strong>
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <p className="text-sm">Redirecting to your store dashboard...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep !== 'provisioning' && currentStep !== 'complete' && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canContinue()}
          >
            {currentStepIndex === steps.length - 1 ? 'Create Store' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
