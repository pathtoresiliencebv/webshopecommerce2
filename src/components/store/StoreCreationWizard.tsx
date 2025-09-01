import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Store, 
  Palette, 
  Globe, 
  CreditCard,
  Check,
  Sparkles 
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface StoreTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image: string;
  is_premium: boolean;
}

interface StoreCreationWizardProps {
  open: boolean;
  onClose: () => void;
}

const mockTemplates: StoreTemplate[] = [
  {
    id: 'modern-furniture',
    name: 'Modern Furniture',
    description: 'Clean, minimalist design perfect for furniture stores',
    category: 'Furniture',
    preview_image: '/api/placeholder/400/250',
    is_premium: false
  },
  {
    id: 'luxury-boutique',
    name: 'Luxury Boutique', 
    description: 'Elegant design with premium feel',
    category: 'Fashion',
    preview_image: '/api/placeholder/400/250',
    is_premium: true
  },
  {
    id: 'tech-store',
    name: 'Tech Store',
    description: 'Modern tech-focused design',
    category: 'Electronics',
    preview_image: '/api/placeholder/400/250',
    is_premium: false
  }
];

const WizardStep = ({ 
  number, 
  title, 
  isActive, 
  isCompleted 
}: { 
  number: number; 
  title: string; 
  isActive: boolean; 
  isCompleted: boolean; 
}) => (
  <div className="flex items-center space-x-3">
    <div className={`
      flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
      ${isCompleted ? 'bg-primary border-primary text-primary-foreground' :
        isActive ? 'border-primary text-primary' : 
        'border-muted-foreground text-muted-foreground'}
    `}>
      {isCompleted ? <Check className="w-4 h-4" /> : number}
    </div>
    <span className={`text-sm font-medium ${
      isActive ? 'text-foreground' : 'text-muted-foreground'
    }`}>
      {title}
    </span>
  </div>
);

export default function StoreCreationWizard({ open, onClose }: StoreCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    template: '',
    domain: '',
    subdomain: '',
    plan: 'starter'
  });
  const [loading, setLoading] = useState(false);
  const { createOrganization } = useOrganization();

  const steps = [
    { number: 1, title: 'Store Info', icon: Store },
    { number: 2, title: 'Template', icon: Palette },
    { number: 3, title: 'Domain', icon: Globe },
    { number: 4, title: 'Plan', icon: CreditCard }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCreateStore();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCreateStore = async () => {
    setLoading(true);
    try {
      const { error } = await createOrganization({
        name: formData.name,
        slug: formData.slug,
        description: formData.description
      });

      if (error) throw error;

      toast.success(`Store "${formData.name}" succesvol aangemaakt!`);
      onClose();
      
      // Reset form
      setFormData({
        name: '', slug: '', description: '', category: '', 
        template: '', domain: '', subdomain: '', plan: 'starter'
      });
      setCurrentStep(1);
    } catch (error: any) {
      toast.error(error.message || 'Er is iets misgegaan bij het aanmaken van de store');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0 && formData.slug.trim().length > 0;
      case 2:
        return formData.template.length > 0;
      case 3:
        return true; // Domain is optional
      case 4:
        return formData.plan.length > 0;
      default:
        return false;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Nieuwe Store Aanmaken
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-between mt-6">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <WizardStep
                  number={step.number}
                  title={step.title}
                  isActive={currentStep === step.number}
                  isCompleted={currentStep > step.number}
                />
                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-muted mx-4 mt-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Store Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Store Informatie</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Geef je store een naam en beschrijving
                </p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Naam *</Label>
                  <Input
                    id="store-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Mijn Geweldige Store"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-slug">URL Slug *</Label>
                  <Input
                    id="store-slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="mijn-geweldige-store"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dit wordt onderdeel van je store URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-description">Beschrijving</Label>
                  <Textarea
                    id="store-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Een korte beschrijving van je store..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Kies een Template</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Selecteer een design template voor je store
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      formData.template === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleInputChange('template', template.id)}
                  >
                    <div className="aspect-video bg-muted rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        {template.is_premium && (
                          <Badge variant="secondary">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Domain Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Domein Instelling</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Kies hoe je store bereikbaar wordt (optioneel)
                </p>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value)}
                      placeholder="mijnstore"
                      className="rounded-r-none"
                    />
                    <div className="bg-muted px-3 py-2 rounded-r-md border border-l-0 text-sm text-muted-foreground">
                      .yourplatform.com
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domein</Label>
                  <Input
                    id="custom-domain"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="www.mijnstore.nl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Je kunt later een eigen domein koppelen
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Plan Selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Kies je Plan</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Selecteer het plan dat het beste bij je past
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {['starter', 'professional', 'enterprise'].map((plan) => (
                  <Card 
                    key={plan}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      formData.plan === plan ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleInputChange('plan', plan)}
                  >
                    <CardContent className="p-6 text-center">
                      <h4 className="font-semibold mb-2 capitalize">{plan}</h4>
                      <div className="text-2xl font-bold mb-2">
                        {plan === 'starter' ? '€29' : 
                         plan === 'professional' ? '€79' : '€199'}
                        <span className="text-sm font-normal">/maand</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>Onbeperkte producten</li>
                        <li>SSL certificaat</li>
                        <li>24/7 support</li>
                        {plan !== 'starter' && <li>Aangepast domein</li>}
                        {plan === 'enterprise' && <li>Priority support</li>}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Vorige
          </Button>

          <Button 
            onClick={handleNext}
            disabled={!isStepValid() || loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : currentStep === 4 ? (
              'Store Aanmaken'
            ) : (
              <>
                Volgende
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}