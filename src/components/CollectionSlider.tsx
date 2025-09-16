import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { getStoreAwarePath } from "@/lib/url-utils";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  is_sale?: boolean;
  is_new?: boolean;
  slug: string;
  image_url?: string;
}

interface CollectionSliderProps {
  collectionId: string;
  collectionName: string;
  collectionSlug: string;
}

export function CollectionSlider({ collectionId, collectionName, collectionSlug }: CollectionSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { store, loading: storeLoading } = useStore();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['collection-products', collectionId],
    queryFn: async () => {
      // First get the product IDs from the collection
      const { data: productCollections, error: pcError } = await supabase
        .from('product_collections')
        .select('product_id')
        .eq('collection_id', collectionId);

      if (pcError || !productCollections?.length) {
        return [];
      }

      const productIds = productCollections.map(pc => pc.product_id);

      // Then get the products with those IDs
      let query = supabase
        .from('products')
        .select(`
          id, name, price, original_price, is_sale, is_new, slug,
          product_images!left (
            image_url, is_primary
          )
        `)
        .in('id', productIds)
        .eq('is_active', true)
        .limit(8);

      // Filter by organization if we have a store context
      if (store?.id) {
        query = query.eq('organization_id', store.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching collection products:', error);
        return [];
      }

      return data?.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        is_sale: product.is_sale,
        is_new: product.is_new,
        slug: product.slug,
        image: product.product_images?.find(img => img.is_primary)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg',
        category: 'Kantoormeubel'
        })) || [];
    },
    enabled: !storeLoading && !!store?.id
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < totalPages - 1;

  const nextSlide = () => {
    if (canGoRight) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (canGoLeft) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (storeLoading || isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">{collectionName}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted animate-pulse h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't render empty collections
  }

  const currentProducts = products.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">{collectionName}</h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={!canGoLeft}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={!canGoRight}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link to={getStoreAwarePath(`/collections/${collectionSlug}`, store?.slug)}>
            <Button variant="outline" size="sm">
              Bekijk alle
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {currentProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
}