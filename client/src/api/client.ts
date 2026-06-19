import type { Stats, Product, Check, CategoryStat, PriceHistory } from '../types/types';

const API_BASE = 'http://localhost:8080/api';

// Mock data
const MOCK_STATS: Stats = {
  totalChecks: 42,
  totalUniqueProducts: 156,
  totalProductEntries: 843,
};

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Хлеб белый', usage_count: 89 },
  { id: 2, name: 'Молоко 3.2%', usage_count: 67 },
  { id: 3, name: 'Яйца куриные', usage_count: 54 },
  { id: 4, name: 'Сахар песок', usage_count: 48 },
  { id: 5, name: 'Масло подсолнечное', usage_count: 41 },
  { id: 6, name: 'Соль поваренная', usage_count: 38 },
  { id: 7, name: 'Чай черный', usage_count: 35 },
  { id: 8, name: 'Рис круглозерный', usage_count: 32 },
  { id: 9, name: 'Гречка ядрица', usage_count: 29 },
  { id: 10, name: 'Мука пшеничная', usage_count: 26 },
];

const MOCK_CHECKS: Check[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  check_id: `check_${Date.now() - i * 86400000}`,
  created_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  item_count: Math.floor(Math.random() * 15) + 3,
}));

const MOCK_CATEGORIES: CategoryStat[] = [
  { id: 1, name: 'Бакалея', product_count: 45, check_count: 120, avg_price: 156.5 },
  { id: 2, name: 'Молочные продукты', product_count: 32, check_count: 98, avg_price: 89.2 },
  { id: 3, name: 'Мясо и птица', product_count: 28, check_count: 76, avg_price: 342.8 },
  { id: 4, name: 'Овощи и фрукты', product_count: 35, check_count: 85, avg_price: 124.3 },
  { id: 5, name: 'Хлебобулочные', product_count: 16, check_count: 52, avg_price: 67.9 },
];

const MOCK_PRICE_HISTORY: PriceHistory[] = [
  { created_at: new Date(Date.now() - 86400000 * 30).toISOString(), price_per_unit: 89.99, amount_or_weight: 1.0, check_id: 'check_1' },
  { created_at: new Date(Date.now() - 86400000 * 25).toISOString(), price_per_unit: 94.99, amount_or_weight: 1.0, check_id: 'check_2' },
  { created_at: new Date(Date.now() - 86400000 * 20).toISOString(), price_per_unit: 99.99, amount_or_weight: 1.0, check_id: 'check_3' },
  { created_at: new Date(Date.now() - 86400000 * 15).toISOString(), price_per_unit: 109.99, amount_or_weight: 1.0, check_id: 'check_4' },
  { created_at: new Date(Date.now() - 86400000 * 10).toISOString(), price_per_unit: 119.99, amount_or_weight: 1.0, check_id: 'check_5' },
];

// Use mock data (no API calls)
export const getStats = () => Promise.resolve({ data: MOCK_STATS });
export const getProducts = () => Promise.resolve({ data: MOCK_PRODUCTS });
export const getChecks = () => Promise.resolve({ data: MOCK_CHECKS });
export const getCategories = () => Promise.resolve({ data: MOCK_CATEGORIES });
export const getPriceHistory = (productId: number) => 
  Promise.resolve({ data: MOCK_PRICE_HISTORY });

// Real API (commented out)
// export const getStats = () => axios.get<Stats>('/stats');
// export const getProducts = () => axios.get<Product[]>('/products');
// export const getChecks = () => axios.get<Check[]>('/checks');
// export const getCategories = () => axios.get<CategoryStat[]>('/categories/stats');
// export const getPriceHistory = (productId: number) => 
//   axios.get<PriceHistory[]>(`/products/${productId}/price-history`);