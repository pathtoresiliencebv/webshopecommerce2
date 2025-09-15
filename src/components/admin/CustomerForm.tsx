import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface CustomerFormProps {
  // Dialog mode props (for CreateOrder)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCustomerCreated?: (customer: any) => void;
  
  // Full page mode props (for AdminCustomers)
  customer?: any;
  onSave?: (customerData: any) => void;
  onCancel?: () => void;
}

export function CustomerForm({ 
  open, 
  onOpenChange, 
  onCustomerCreated,
  customer,
  onSave,
  onCancel
}: CustomerFormProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  // Determine if we're in dialog mode or full page mode
  const isDialogMode = open !== undefined;
  
  const [formData, setFormData] = useState({
    email: customer?.email || '',
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    phone: customer?.phone || '',
    address_line1: customer?.address_line1 || '',
    address_line2: customer?.address_line2 || '',
    city: customer?.city || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || 'Netherlands'
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: typeof formData) => {
      if (!user || !currentOrganization) throw new Error('User not authenticated or no organization');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          organization_id: currentOrganization.id,
          ...customerData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newCustomer) => {
      if (isDialogMode) {
        toast.success('Customer created successfully');
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        onCustomerCreated?.(newCustomer);
        onOpenChange?.(false);
      } else {
        onSave?.(newCustomer);
      }
      
      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: 'Netherlands'
      });
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      toast.error('First name and last name are required');
      return;
    }
    
    if (customer) {
      // Editing existing customer
      onSave?.(formData);
    } else {
      // Creating new customer
      createCustomerMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    if (isDialogMode) {
      onOpenChange?.(false);
    } else {
      onCancel?.();
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">Voornaam *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Achternaam *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="phone">Telefoon</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="address_line1">Adres</Label>
        <Input
          id="address_line1"
          placeholder="Straat en huisnummer"
          value={formData.address_line1}
          onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
        />
      </div>
      
      <div>
        <Input
          placeholder="Adres regel 2 (optioneel)"
          value={formData.address_line2}
          onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Stad</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="postal_code">Postcode</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
        >
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={createCustomerMutation.isPending}
        >
          {createCustomerMutation.isPending 
            ? 'Saving...' 
            : customer 
            ? 'Update Customer' 
            : 'Klant toevoegen'}
        </Button>
      </div>
    </form>
  );

  if (isDialogMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {customer ? 'Klant bewerken' : 'Nieuwe klant toevoegen'}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Full page mode for AdminCustomers
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    </div>
  );
}