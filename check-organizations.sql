-- Check organizations and their products
SELECT 
  o.id,
  o.name,
  o.subdomain,
  o.slug,
  COUNT(p.id) as product_count
FROM organizations o
LEFT JOIN products p ON p.organization_id = o.id
GROUP BY o.id, o.name, o.subdomain, o.slug
ORDER BY o.name;
