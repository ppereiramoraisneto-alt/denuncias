"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginResultado = { erro: string } | undefined;

export async function login(email: string, senha: string): Promise<LoginResultado> {
  if (!email.trim() || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  });

  if (error) {
    return { erro: "E-mail ou senha incorretos." };
  }

  redirect("/admin");
}
