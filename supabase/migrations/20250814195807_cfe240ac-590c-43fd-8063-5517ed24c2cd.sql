-- Add foreign key constraints between collections and product_collections tables
ALTER TABLE product_collections 
ADD CONSTRAINT fk_product_collections_collection_id 
FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

ALTER TABLE product_collections 
ADD CONSTRAINT fk_product_collections_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;