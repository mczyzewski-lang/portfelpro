import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portfel.pro — Portfel Profesjonalisty",
    short_name: "Portfel.pro",
    start_url: "/app",
    display: "standalone",
    background_color: "#F8F5EF",
    theme_color: "#713B20",
    icons: [
      { src: "/brand/logo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
