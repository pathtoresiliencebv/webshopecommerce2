import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductOrganizationProps {
  formData: any;
  setFormData: (data: any) => void;
  availableCollections: any[];
  availableTags: any[];
}

export function ProductOrganization({ 
  formData, 
  setFormData, 
  availableCollections,
  availableTags 
}: ProductOrganizationProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);

  // Hardcoded product types for demo (in real app, fetch from DB)
  const productTypes = [
    "Heren",
    "Dames", 
    "Kinderen",
    "Accessoires",
    "Schoenen",
    "Tassen"
  ];

  const handleCollectionToggle = (collectionName: string) => {
    const currentCollections = formData.collections || [];
    const isSelected = currentCollections.includes(collectionName);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        collections: currentCollections.filter((c: string) => c !== collectionName)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        collections: [...currentCollections, collectionName]
      }));
    }
  };

  const handleTagToggle = (tagName: string) => {
    const currentTags = formData.tags || [];
    const isSelected = currentTags.includes(tagName);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        tags: currentTags.filter((t: string) => t !== tagName)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        tags: [...currentTags, tagName]
      }));
    }
  };

  const handleAddNewCollection = () => {
    if (newCollectionName.trim()) {
      handleCollectionToggle(newCollectionName.trim());
      setNewCollectionName("");
      setShowNewCollection(false);
    }
  };

  const removeCollection = (collectionName: string) => {
    setFormData(prev => ({
      ...prev,
      collections: (prev.collections || []).filter((c: string) => c !== collectionName)
    }));
  };

  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((t: string) => t !== tagName)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Productorganisatie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Product Type */}
        <div className="space-y-2">
          <Label>Producttype</Label>
          <Select 
            value={formData.product_type || ""} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, product_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer type" />
            </SelectTrigger>
            <SelectContent>
              {productTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vendor */}
        <div className="space-y-2">
          <Label htmlFor="vendor">Verkoper</Label>
          <Input
            id="vendor"
            value={formData.vendor || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
            placeholder="Bijv. Carolina Herrera"
          />
        </div>

        {/* Collections */}
        <div className="space-y-2">
          <Label>Collecties</Label>
          
          {/* Selected Collections */}
          {formData.collections && formData.collections.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.collections.map((collection: string) => (
                <Badge key={collection} variant="secondary" className="flex items-center gap-1">
                  {collection}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeCollection(collection)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Collections Dropdown */}
          <Popover open={collectionsOpen} onOpenChange={setCollectionsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={collectionsOpen}
                className="w-full justify-between"
              >
                Selecteer collecties...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Zoek collecties..." />
                <CommandList>
                  <CommandEmpty>Geen collecties gevonden.</CommandEmpty>
                  <CommandGroup>
                    {availableCollections.map((collection) => (
                      <CommandItem
                        key={collection.id}
                        value={collection.name}
                        onSelect={() => handleCollectionToggle(collection.name)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.collections?.includes(collection.name) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {collection.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Add New Collection */}
          {showNewCollection ? (
            <div className="flex gap-2">
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Nieuwe collectie naam"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewCollection();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddNewCollection}>
                Toevoegen
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowNewCollection(false);
                  setNewCollectionName("");
                }}
              >
                Annuleren
              </Button>
            </div>
          ) : (
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-primary"
              onClick={() => setShowNewCollection(true)}
            >
              + Nieuwe collectie toevoegen
            </Button>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          
          {/* Selected Tags */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Tags Dropdown */}
          <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tagsOpen}
                className="w-full justify-between"
              >
                Selecteer tags...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Zoek tags..." />
                <CommandList>
                  <CommandEmpty>Geen tags gevonden.</CommandEmpty>
                  <CommandGroup>
                    {availableTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => handleTagToggle(tag.name)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.tags?.includes(tag.name) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

      </CardContent>
    </Card>
  );
}