import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "डिजिटल वर्गणी",
    short_name: "वर्गणी",
    description: "गणपती मंडळ डिजिटल वर्गणी आणि पावती",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FFFDF8",
    theme_color: "#9F1239",
    lang: "mr",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
