import { redirect } from "next/navigation";

/** Rota raiz: sem login, vai direto para o dashboard. */
export default function Home() {
  redirect("/dashboard");
}
