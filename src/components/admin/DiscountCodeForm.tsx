import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const discountCodeSchema = z.object({
  code: z.string().min(2, "Code moet minstens 2 karakters bevatten").toUpperCase(),
  type: z.enum(["percentage", "fixed", "free_shipping"], {
    required_error: "Selecteer een type korting"
  }),
  value: z.number().min(0, "Waarde moet positief zijn"),
  minimum_order_amount: z.number().min(0).optional(),
  usage_limit: z.number().min(1).optional(),
  expires_at: z.date().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
});

type DiscountCodeFormData = z.infer<typeof discountCodeSchema>;

interface DiscountCodeFormProps {
  discount?: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DiscountCodeFormData) => Promise<void>;
}

export function DiscountCodeForm({ discount, isOpen, onClose, onSubmit }: DiscountCodeFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<DiscountCodeFormData>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: 0,
      minimum_order_amount: 0,
      usage_limit: undefined,
      expires_at: undefined,
      description: "",
      is_active: true
    }
  });

  useEffect(() => {
    if (discount) {
      form.reset({
        code: discount.code || "",
        type: discount.type || "percentage",
        value: discount.value || 0,
        minimum_order_amount: discount.minimum_order_amount || 0,
        usage_limit: discount.usage_limit || undefined,
        expires_at: discount.expires_at ? new Date(discount.expires_at) : undefined,
        description: discount.description || "",
        is_active: discount.is_active ?? true
      });
    } else {
      form.reset({
        code: "",
        type: "percentage",
        value: 0,
        minimum_order_amount: 0,
        usage_limit: undefined,
        expires_at: undefined,
        description: "",
        is_active: true
      });
    }
  }, [discount, form]);

  const handleSubmit = async (data: DiscountCodeFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error saving discount code:", error);
    } finally {
      setLoading(false);
    }
  };

  const watchedType = form.watch("type");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {discount ? "Kortingscode Bewerken" : "Nieuwe Kortingscode"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kortingscode *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="WELCOME20"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type Korting *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Vast Bedrag</SelectItem>
                        <SelectItem value="free_shipping">Gratis Verzending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedType === "percentage" && "Kortingspercentage *"}
                    {watchedType === "fixed" && "Kortingsbedrag (€) *"}
                    {watchedType === "free_shipping" && "Waarde (niet van toepassing voor gratis verzending)"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      {watchedType === "fixed" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      )}
                      {watchedType === "percentage" && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      )}
                      <Input
                        type="number"
                        step={watchedType === "fixed" ? "0.01" : "1"}
                        min="0"
                        max={watchedType === "percentage" ? "100" : undefined}
                        className={cn(
                          watchedType === "fixed" && "pl-8",
                          watchedType === "percentage" && "pr-8"
                        )}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={watchedType === "free_shipping"}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschrijving</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Beschrijf deze kortingscode..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="minimum_order_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimale Bestelling (€)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-8"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usage_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gebruikslimiet</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Onbeperkt"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vervaldatum</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Geen vervaldatum</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                      {field.value && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => field.onChange(undefined)}
                          >
                            Vervaldatum Wissen
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Actieve Code</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Zet deze kortingscode actief zodat klanten deze kunnen gebruiken
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Opslaan..." : discount ? "Bijwerken" : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}