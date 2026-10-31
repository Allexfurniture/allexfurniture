export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.allexfurniturebd.com").replace(/\/+$/, "");

export const COMPANY = {
  name: "ALLEX Furniture",
  tagline: "We provide comfort, rather product.",
  address: "NI Tower, Level 7, Plot 01, Road 10, Block E, Banani, Dhaka-1213, Bangladesh",
  email: "info@allexfurniturebd.com",
  website: "https://www.allexfurniturebd.com/",
  groupWebsite: "https://www.allexdesign.com/",
} as const;

export const GROUP_CONCERNS = [
  {
    name: "ALLEX Furniture",
    description: "Furniture manufacturing, office furniture, and custom-made furniture solutions.",
    website: COMPANY.website,
    current: true,
  },
  {
    name: "ALLEX Design & Development Ltd.",
    description: "Interior design and development solutions. Visit the official Allex Design website for its published service information.",
    website: COMPANY.groupWebsite,
    current: false,
  },
  {
    name: "AD Steel & Construction",
    description: "A group concern. Service details and an official public website have not been independently confirmed for this page.",
    website: null,
    current: false,
  },
  {
    name: "The Allex Design",
    description: "A group concern. Service details and an official public website have not been independently confirmed for this page.",
    website: null,
    current: false,
  },
] as const;

export type CategoryPathNode = {
  id: string;
  slug: string;
  parent_id: string | null;
  status?: string;
};

export function getCategoryPath(categoryId: string, categories: readonly CategoryPathNode[]): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const segments: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(categoryId);

  while (current) {
    if (visited.has(current.id) || segments.length >= 3) return [];
    if (current.status && current.status !== "active") return [];
    visited.add(current.id);
    segments.unshift(current.slug);

    if (!current.parent_id) return segments;
    current = byId.get(current.parent_id);
    if (!current) return [];
  }

  return [];
}

export function getDescendantCategoryIds(categoryId: string, categories: readonly CategoryPathNode[]): string[] {
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = children.get(category.parent_id) ?? [];
    siblings.push(category.id);
    children.set(category.parent_id, siblings);
  }

  const result: string[] = [];
  const visited = new Set<string>();
  const queue = [categoryId];

  while (queue.length > 0 && visited.size <= categories.length) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    if (categories.some((category) => category.id === currentId)) result.push(currentId);
    queue.push(...(children.get(currentId) ?? []));
  }

  return result;
}

export function productPath(categoryPath: readonly string[], model: string): string {
  if (!categoryPath.length) return "/furniture";
  return `/furniture/${[...categoryPath, model].map((segment) => encodeURIComponent(segment)).join("/")}`;
}

export function isSafeModelSegment(model: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(model);
}
