export type MarketplaceItemType = "tiktok" | "model";
export type MarketplaceStatus = "available" | "sold";

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  name: string;
  description: string;
  price: number;
  details: string[];
  status: MarketplaceStatus;
  createdAt: string;
}

const MARKETPLACE_KEY = "md_marketplace";

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const defaultItems: MarketplaceItem[] = [
  {
    id: "tiktok_trendbyte",
    type: "tiktok",
    name: "@trendbyte",
    description: "Moda & Lifestyle",
    price: 2800,
    details: ["125k seguidores", "Engajamento 8.4%", "Conta aquecida"],
    status: "available",
    createdAt: "2025-01-10T10:00:00.000Z",
  },
  {
    id: "tiktok_techpulse",
    type: "tiktok",
    name: "@techpulse",
    description: "Tecnologia",
    price: 4200,
    details: ["210k seguidores", "Engajamento 6.2%", "Histórico limpo"],
    status: "available",
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "tiktok_foodstreet",
    type: "tiktok",
    name: "@foodstreet",
    description: "Gastronomia",
    price: 1900,
    details: ["88k seguidores", "Engajamento 9.1%", "Conteúdo evergreen"],
    status: "available",
    createdAt: "2025-01-20T10:00:00.000Z",
  },
  {
    id: "model_pro_kit",
    type: "model",
    name: "Modelo Pro Kit",
    description: "Pacote completo de scripts e copies",
    price: 390,
    details: ["20 copies prontas", "Checklist de campanha", "Templates de CTAs"],
    status: "available",
    createdAt: "2025-01-22T10:00:00.000Z",
  },
];

const readItems = () => {
  const stored = localStorage.getItem(MARKETPLACE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as MarketplaceItem[];
  } catch {
    return null;
  }
};

export const seedMarketplace = () => {
  if (typeof window === "undefined") {
    return;
  }
  const stored = readItems();
  if (!stored) {
    localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(defaultItems));
  }
};

export const getMarketplaceItems = (): MarketplaceItem[] => {
  if (typeof window === "undefined") {
    return defaultItems;
  }
  const stored = readItems();
  return stored ?? defaultItems;
};

export const saveMarketplaceItems = (items: MarketplaceItem[]) => {
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(items));
};

export const getMarketplaceItemsByType = (type: MarketplaceItemType) =>
  getMarketplaceItems().filter((item) => item.type === type && item.status === "available");

export const addMarketplaceItem = (item: Omit<MarketplaceItem, "id" | "createdAt" | "status">) => {
  const items = getMarketplaceItems();
  const newItem: MarketplaceItem = {
    ...item,
    id: createId(item.type),
    status: "available",
    createdAt: new Date().toISOString(),
  };
  const nextItems = [newItem, ...items];
  saveMarketplaceItems(nextItems);
  return newItem;
};

export const markMarketplaceItemSold = (itemId: string) => {
  const items = getMarketplaceItems();
  const updated = items.map((item) =>
    item.id === itemId ? { ...item, status: "sold" } : item
  );
  saveMarketplaceItems(updated);
  return updated.find((item) => item.id === itemId) ?? null;
};
