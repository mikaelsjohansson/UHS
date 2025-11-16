export interface Expense {
  id?: number;
  description: string;
  amount: number;
  expenseDate: string;
  category: string;
}

export interface ExpenseFormData {
  description: string;
  amount: string;
  expenseDate: string;
  category: string;
}

