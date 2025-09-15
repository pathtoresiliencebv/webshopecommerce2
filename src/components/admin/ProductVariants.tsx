import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X, Edit, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProductVariantsProps {
  variants: any[];
  options: any[];
  onVariantsChange: (variants: any[]) => void;
  onOptionsChange: (options: any[]) => void;
}

export function ProductVariants({ 
  variants, 
  options, 
  onVariantsChange, 
  onOptionsChange 
}: ProductVariantsProps) {
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState("");

  const handleAddOption = () => {
    if (!newOptionName.trim()) return;

    const values = newOptionValues.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) return;

    const newOption = {
      id: `temp-${Date.now()}`,
      name: newOptionName,
      values: values,
      position: options.length + 1
    };

    onOptionsChange([...options, newOption]);
    generateVariants([...options, newOption]);
    
    setNewOptionName("");
    setNewOptionValues("");
    setIsAddingOption(false);
  };

  const generateVariants = (currentOptions: any[]) => {
    if (currentOptions.length === 0) {
      onVariantsChange([]);
      return;
    }

    // Generate all combinations of option values
    const combinations = currentOptions.reduce((acc: any[], option) => {
      if (acc.length === 0) {
        return option.values.map((value: string) => ({ [option.name]: value }));
      }
      
      const newCombinations: any[] = [];
      acc.forEach(combination => {
        option.values.forEach((value: string) => {
          newCombinations.push({ ...combination, [option.name]: value });
        });
      });
      return newCombinations;
    }, []);

    const newVariants = combinations.map((combination, index) => ({
      id: `temp-variant-${Date.now()}-${index}`,
      option_values: combination,
      sku: "",
      price: "",
      compare_at_price: "",
      inventory_quantity: 0,
      position: index + 1,
      is_active: true
    }));

    onVariantsChange(newVariants);
  };

  const removeOption = (optionIndex: number) => {
    const updatedOptions = options.filter((_, index) => index !== optionIndex);
    onOptionsChange(updatedOptions);
    generateVariants(updatedOptions);
  };

  const updateVariant = (variantIndex: number, field: string, value: any) => {
    const updatedVariants = variants.map((variant, index) => 
      index === variantIndex ? { ...variant, [field]: value } : variant
    );
    onVariantsChange(updatedVariants);
  };

  const getVariantTitle = (variant: any) => {
    return Object.entries(variant.option_values)
      .map(([key, value]) => `${value}`)
      .join(' / ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Varianten</CardTitle>
          {options.length === 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAddingOption(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Variant toevoegen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Options */}
        {options.length > 0 && (
          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={option.id || index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{option.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {option.values.length} waarde{option.values.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value: string, valueIndex: number) => (
                    <Badge key={valueIndex} variant="outline">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAddingOption(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nog een optie toevoegen
            </Button>
          </div>
        )}

        {/* Add Option Form */}
        {isAddingOption && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="option-name">Optienaam</Label>
              <Input
                id="option-name"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Bijv. Size, Color, Material"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="option-values">Optiewaarden</Label>
              <Input
                id="option-values"
                value={newOptionValues}
                onChange={(e) => setNewOptionValues(e.target.value)}
                placeholder="Bijv. Small, Medium, Large (gescheiden door komma's)"
              />
              <p className="text-xs text-muted-foreground">
                Scheid meerdere waarden met komma's
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddOption}>Gereed</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingOption(false);
                  setNewOptionName("");
                  setNewOptionValues("");
                }}
              >
                Annuleren
              </Button>
            </div>
          </div>
        )}

        {/* Variants Table */}
        {variants.length > 0 && (
          <div className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Prijs</TableHead>
                    <TableHead>Hoeveelheid</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant, index) => (
                    <TableRow key={variant.id || index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {getVariantTitle(variant)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">€</span>
                          <Input
                            type="number"
                            value={variant.price || ""}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            placeholder="0,00"
                            className="w-20"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.inventory_quantity || ""}
                          onChange={(e) => updateVariant(index, 'inventory_quantity', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.sku || ""}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Bewerken</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Verwijderen</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}