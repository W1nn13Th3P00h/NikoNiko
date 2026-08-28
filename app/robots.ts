import type { MetadataRoute } from "next";

// Private app, no public content — keep it out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
