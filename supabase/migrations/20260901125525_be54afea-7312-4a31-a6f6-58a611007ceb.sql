-- Permissions enum
CREATE TYPE public.app_permission AS ENUM ('movimentacoes','plano_contas','adiantamentos','eventos','relatorios');

CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission public.app_permission NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert permissions" ON public.user_permissions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete permissions" ON public.user_permissions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission public.app_permission)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND permission = _permission)
$$;

-- Invites
CREATE TYPE public.invite_status AS ENUM ('pending','accepted','cancelled');

CREATE TABLE public.user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  role public.app_role NOT NULL DEFAULT 'viewer',
  permissions public.app_permission[] NOT NULL DEFAULT '{}',
  status public.invite_status NOT NULL DEFAULT 'pending',
  invited_by uuid,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_invites_pending_email_idx
  ON public.user_invites (lower(email)) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invites TO authenticated;
GRANT ALL ON public.user_invites TO service_role;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invites" ON public.user_invites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create invites" ON public.user_invites
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update invites" ON public.user_invites
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete invites" ON public.user_invites
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_invites_updated_at BEFORE UPDATE ON public.user_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New signup: honour a pending invite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _is_first BOOLEAN;
  _invite public.user_invites;
  _perm public.app_permission;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO _is_first;

  SELECT * INTO _invite FROM public.user_invites
   WHERE lower(email) = lower(NEW.email) AND status = 'pending'
   ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, status, approved_at, approved_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', _invite.full_name),
    CASE WHEN _is_first OR _invite.id IS NOT NULL THEN 'active'::public.user_status ELSE 'pending'::public.user_status END,
    CASE WHEN _is_first OR _invite.id IS NOT NULL THEN now() ELSE NULL END,
    CASE WHEN _is_first THEN NEW.id ELSE _invite.invited_by END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_first THEN 'admin'::public.app_role ELSE COALESCE(_invite.role, 'viewer'::public.app_role) END);

  IF _invite.id IS NOT NULL THEN
    FOREACH _perm IN ARRAY COALESCE(_invite.permissions, '{}'::public.app_permission[]) LOOP
      INSERT INTO public.user_permissions (user_id, permission, granted_by)
      VALUES (NEW.id, _perm, _invite.invited_by)
      ON CONFLICT (user_id, permission) DO NOTHING;
    END LOOP;
    UPDATE public.user_invites SET status = 'accepted', accepted_at = now() WHERE id = _invite.id;
  END IF;

  RETURN NEW;
END;
$$;