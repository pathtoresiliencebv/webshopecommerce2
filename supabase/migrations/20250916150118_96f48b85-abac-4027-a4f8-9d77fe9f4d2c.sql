-- Link current user to existing Aurelio Living organization
-- This will restore access to all 12 products and 2 collections

INSERT INTO public.organization_users (
    user_id, 
    organization_id, 
    role, 
    is_active, 
    joined_at
) VALUES (
    '41583e3c-82f7-4195-8292-f14b11f58214'::uuid,
    '36bd6b19-0bec-433c-bd28-11ec45175c90'::uuid,
    'owner',
    true,
    now()
) ON CONFLICT (user_id, organization_id) DO UPDATE SET
    is_active = true,
    role = 'owner',
    joined_at = now();