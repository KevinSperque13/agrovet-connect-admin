
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseConfigError = "";

if (!supabaseUrl || !supabaseKey) {
  supabaseConfigError =
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.";
} else {
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      supabaseConfigError =
        "VITE_SUPABASE_URL deve começar com http:// ou https://.";
    }
  } catch {
    supabaseConfigError =
      "VITE_SUPABASE_URL inválida. Use a URL do projeto Supabase, começando com https://.";
  }
}

console.log("Diagnóstico Supabase:", {
  urlConfigurada: Boolean(supabaseUrl),
  chaveConfigurada: Boolean(supabaseKey),
  erroConfiguracao: supabaseConfigError || "Nenhum"
});

export { supabaseConfigError };
export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseKey);
