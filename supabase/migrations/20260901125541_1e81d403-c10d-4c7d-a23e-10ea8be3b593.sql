REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, public.app_permission) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, public.app_permission) FROM public;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, public.app_permission) TO authenticated, service_role;