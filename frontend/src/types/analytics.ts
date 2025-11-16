export interface CategoryExpenseSummary {
  category: string;
  totalAmount: number;
  count: number;
}

export interface CategoryTrend {
  date: string;
  amount: number;
}

export interface MultiCategoryTrend {
  category: string;
  date: string;
  amount: number;
}

