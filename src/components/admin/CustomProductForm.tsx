import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CustomProduct {
  id: string;
  name: string;
  price: number;
  sku?: string;
}

interface CustomProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdd?: (product: CustomProduct) => void;
}

export function CustomProductForm({ open, onOpenChange, onProductAdd }: CustomProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    sku: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      return;
    }

    const customProduct: CustomProduct = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      sku: formData.sku || `CUSTOM-${Date.now()}`
    };

    onProductAdd?.(customProduct);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: '',
      price: '',
      description: '',
      sku: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aangepast artikel toevoegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Productnaam"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="price">Prijs *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Product SKU (optioneel)"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product beschrijving (optioneel)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit">
              Artikel toevoegen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}