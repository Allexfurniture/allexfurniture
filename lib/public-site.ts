export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.allexfurniturebd.com").replace(/\/+$/, "");

export const COMPANY = {
  name: "ALLEX Furniture",
  tagline: "We provide comfort, rather product.",
  address: "NI Tower, Level 7, Plot 01, Road 10, Block E, Banani, Dhaka-1213, Bangladesh",
  factoryAddress: "Abdul Hamid Road, Daroga Bari More, Satarkul, Uttar Badda, Dhaka, Bangladesh",
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
    description: "Part of the ALLEX group of concerns. Contact the group office for further information.",
    website: null,
    current: false,
  },
  {
    name: "The Allex Design",
    description: "Part of the ALLEX group of concerns. Contact the group office for further information.",
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

/**
 * Resolve a category's complete active ancestor path.
 * Missing parents, inactive ancestors, and cycles make the path invalid.
 * There is intentionally no fixed depth limit: category depth is data-driven.
 */
export function getCategoryPath(categoryId: string, categories: readonly CategoryPathNode[]): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const segments: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(categoryId);

  while (current) {
    if (visited.has(current.id)) return [];
    if (current.status && current.status !== "active") return [];
    if (!current.slug.trim()) return [];

    visited.add(current.id);
    segments.unshift(current.slug);

    if (!current.parent_id) return segments;
    current = byId.get(current.parent_id);
    if (!current) return [];
  }

  return [];
}

/**
 * A category is routable only when its complete slug path and every ancestor
 * prefix are unambiguous among the active categories.
 */
export function getUniqueCategoryIds(categories: readonly CategoryPathNode[]): Set<string> {
  const paths = new Map<string, string[]>();
  const pathCounts = new Map<string, number>();

  for (const category of categories) {
    const path = getCategoryPath(category.id, categories);
    if (!path.length) continue;
    paths.set(category.id, path);
    const fullPath = path.join("/");
    pathCounts.set(fullPath, (pathCounts.get(fullPath) ?? 0) + 1);
  }

  const uniqueIds = new Set<string>();
  for (const [categoryId, path] of paths) {
    const hasUniquePrefixes = path.every((_, index) => pathCounts.get(path.slice(0, index + 1).join("/")) === 1);
    if (hasUniquePrefixes) uniqueIds.add(categoryId);
  }
  return uniqueIds;
}

export function getDescendantCategoryIds(categoryId: string, categories: readonly CategoryPathNode[]): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (category.status && category.status !== "active") continue;
    if (!category.parent_id) continue;
    const siblings = children.get(category.parent_id) ?? [];
    siblings.push(category.id);
    children.set(category.parent_id, siblings);
  }

  const result: string[] = [];
  const visited = new Set<string>();
  const queue = [categoryId];
  let cursor = 0;
  while (cursor < queue.length) {
    const currentId = queue[cursor++];
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    const current = byId.get(currentId);
    if (!current || (current.status && current.status !== "active")) continue;
    result.push(currentId);
    queue.push(...(children.get(currentId) ?? []));
  }
  return result;
}

export function productPath(categoryPath: readonly string[], model: string): string {
  if (!categoryPath.length || categoryPath.some((segment) => !segment.trim())) return "/furniture";
  return `/furniture/${[...categoryPath, model].map((segment) => encodeURIComponent(segment)).join("/")}`;
}

export function isSafeModelSegment(model: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(model);
}
