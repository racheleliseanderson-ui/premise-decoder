/** Canonical share metadata for spa.vanityvice.blog. No network at runtime. */

export const SITE_ORIGIN = "https://spa.vanityvice.blog";
export const PUBLICATION = "https://vanityvice.blog/";
export const EDITORIAL = "https://vanityvice.blog/editorial-standards/";
export const MAKEUP_DESK = "https://makeup.vanityvice.blog/";
export const SKINCARE_DESK = "https://skincare.vanityvice.blog/";

export type SharePage = {
  path: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const SHARE: Record<string, SharePage> = {
  "/": {
    path: "/",
    title: "Spa Intelligence · Setting Evaluation Desk",
    description:
      "The menu named a promise. The room did not. Score who, what, license and after-hours before you book — nothing inferred on an empty desk.",
    image: "/og/home.png",
    imageAlt: "Spa Intelligence — score the setting before you book. Vanity or Vice.",
  },
};

export function shareHead(path: keyof typeof SHARE | string = "/") {
  const page = SHARE[path] ?? SHARE["/"]!;
  const url = `${SITE_ORIGIN}${page.path === "/" ? "/" : page.path}`;
  const image = `${SITE_ORIGIN}${page.image}`;
  return {
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Vanity or Vice" },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: page.imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: page.title },
      { name: "twitter:description", content: page.description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
