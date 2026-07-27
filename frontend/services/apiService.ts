import type { Product, BusinessSettings } from "@/types";
import mockData from "@/data/mockData.json";

const products = mockData.products as Product[];
const settings = mockData.settings as BusinessSettings;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProducts(): Promise<Product[]> {
  await delay(600);
  return products;
}

export async function getProductBySku(
  sku: string
): Promise<Product | undefined> {
  await delay(400);
  return products.find((p) => p.sku === sku);
}

export async function getSettings(): Promise<BusinessSettings> {
  await delay(300);
  return settings;
}

export async function updateSettings(
  newSettings: BusinessSettings
): Promise<BusinessSettings> {
  await delay(500);
  return newSettings;
}
