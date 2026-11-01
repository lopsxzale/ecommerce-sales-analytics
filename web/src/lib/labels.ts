import type { CategoryRevenue } from "./data";

export function categoryLabel(c: CategoryRevenue, lang: "pt" | "en") {
  const raw = lang === "pt" ? c.category_pt : c.category_en;
  const fixes: Record<string, string> = {
    beleza_saude: "Beleza & saúde",
    relogios_presentes: "Relógios & presentes",
    cama_mesa_banho: "Cama, mesa & banho",
    esporte_lazer: "Esporte & lazer",
    informatica_acessorios: "Informática & acessórios",
    moveis_decoracao: "Móveis & decoração",
    utilidades_domesticas: "Utilidades domésticas",
    ferramentas_jardim: "Ferramentas & jardim",
    bebes: "Bebês",
    eletronicos: "Eletrônicos",
    telefonia: "Telefonia",
    health_beauty: "Health & beauty",
    watches_gifts: "Watches & gifts",
    bed_bath_table: "Bed, bath & table",
    sports_leisure: "Sports & leisure",
    computers_accessories: "Computers & accessories",
    furniture_decor: "Furniture & decor",
    housewares: "Housewares",
    garden_tools: "Garden tools",
  };
  if (fixes[raw]) return fixes[raw];
  const text = raw.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
