import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Rota raiz: redireciona para o dashboard (se logado) ou para o login. */
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  redirect(data.user ? "/dashboard" : "/login");
}
