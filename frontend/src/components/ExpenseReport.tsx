import { CategoryExpenseSummary } from '../types/analytics';
import './ExpenseReport.css';

interface ExpenseReportProps {
  data: CategoryExpenseSummary[];
}

function ExpenseReport({ data }: ExpenseReportProps) {
  const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const sortedData = [...data].sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="expense-report">
      <div className="report-summary">
        <div className="summary-item">
          <span className="summary-label">Total Expenses:</span>
          <span className="summary-value">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Transactions:</span>
          <span className="summary-value">{totalCount}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Categories:</span>
          <span className="summary-value">{data.length}</span>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => {
            const percentage = (item.totalAmount / totalAmount) * 100;
            return (
              <tr key={item.category || 'uncategorized'}>
                <td className="category-cell">
                  <span className="category-badge" style={{ backgroundColor: getCategoryColor(index) }}>
                    {item.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="amount-cell">{formatCurrency(item.totalAmount)}</td>
                <td className="count-cell">{item.count}</td>
                <td className="percentage-cell">
                  <div className="percentage-bar-container">
                    <div
                      className="percentage-bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getCategoryColor(index),
                      }}
                    />
                    <span className="percentage-text">{percentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

function getCategoryColor(index: number): string {
  return COLORS[index % COLORS.length];
}

export default ExpenseReport;

