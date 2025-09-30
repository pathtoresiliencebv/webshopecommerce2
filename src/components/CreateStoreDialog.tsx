import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CreateStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateStoreDialog: React.FC<CreateStoreDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { createOrganization } = useOrganization();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug from name
      ...(field === 'name' && {
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Store naam is verplicht');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Store slug is verplicht');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error('Slug mag alleen kleine letters, cijfers en streepjes bevatten');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await createOrganization({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Deze slug is al in gebruik. Kies een andere.');
        } else {
          toast.error('Fout bij aanmaken store: ' + error.message);
        }
        return;
      }

      // Reset form and close dialog
      setFormData({ name: '', slug: '', description: '' });
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast.error('Er ging iets mis bij het aanmaken van de store');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', slug: '', description: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nieuwe Store Maken</DialogTitle>
          <DialogDescription>
            Maak een nieuwe store aan. Je krijgt een 14-dagen gratis trial om alle functies uit te proberen.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Store Naam *</Label>
            <Input
              id="name"
              placeholder="Bijv. Mijn Webshop"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">Store URL (slug) *</Label>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-1">
                https://
              </span>
              <Input
                id="slug"
                placeholder="mijn-webshop"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                disabled={loading}
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                title="Alleen kleine letters, cijfers en streepjes"
              />
              <span className="text-sm text-muted-foreground ml-1">
                .myaurelio.com
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dit wordt je subdomain URL. Alleen kleine letters, cijfers en streepjes.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving (optioneel)</Label>
            <Textarea
              id="description"
              placeholder="Korte beschrijving van je store..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Store Maken
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoreDialog;