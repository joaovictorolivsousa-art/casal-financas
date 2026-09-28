import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nós Dois & Dinheiro",
    short_name: "Nós & Dinheiro",
    description: "Controle financeiro para casais — autonomia individual, metas conjuntas.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
