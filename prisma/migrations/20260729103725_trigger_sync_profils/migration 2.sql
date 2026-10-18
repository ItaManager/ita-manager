-- Trigger Postgres — hors Prisma (M0-SOCLE.md §4) : à l'insertion d'un
-- utilisateur dans auth.users (Supabase Auth), crée la ligne "profils"
-- correspondante avec le même UUID. C'est le SEUL mécanisme autorisé à
-- créer une ligne "profils" — jamais depuis le code applicatif (voir
-- lib/db/prisma.ts).
--
-- Colonnes camelCase entre guillemets doubles : Postgres replierait
-- sinon "creeLe"/"modifieLe" en minuscules et l'insertion échouerait
-- silencieusement sur les mauvaises colonnes.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profils ("id", "email", "creeLe", "modifieLe")
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
