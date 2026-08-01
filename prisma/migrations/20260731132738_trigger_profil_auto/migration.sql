-- CreateFunction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profils (id, email, "modifieLe")
  VALUES (new.id, new.email, CURRENT_TIMESTAMP)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- CreateTrigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();