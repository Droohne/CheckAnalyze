export interface Stats {
  totalChecks: number;
  totalUniqueProducts: number;
  totalProductEntries: number;
}

export interface Product {
  id: number;
  name: string;
  usage_count: number;
}

export interface Check {
  id: number;
  check_id: string;
  created_at: string;
  item_count: number;
}

export interface CategoryStat {
  id: number;
  name: string;
  product_count: number;
  check_count: number;
  avg_price: number;
}

export interface PriceHistory {
  created_at: string;
  price_per_unit: number;
  amount_or_weight: number;
  check_id: string;
}