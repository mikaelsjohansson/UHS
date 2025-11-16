import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CategoryTrend } from '../types/analytics';
import { expenseService } from '../services/expenseService';
import './CategoryTrendChart.css';

interface CategoryTrendChartProps {
  category: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

function CategoryTrendChart({ category, startYear, startMonth, endYear, endMonth }: CategoryTrendChartProps) {
  const [trendData, setTrendData] = useState<CategoryTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrendData();
  }, [category, startYear, startMonth, endYear, endMonth]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate start and end dates for the date range
      const startDate = new Date(startYear, startMonth - 1, 1, 0, 0, 0);
      const endDate = new Date(endYear, endMonth, 0, 23, 59, 59);
      
      // Format as ISO DATE_TIME without timezone (format: YYYY-MM-DDTHH:mm:ss)
      const formatDateTime = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      const startDateStr = formatDateTime(startDate);
      const endDateStr = formatDateTime(endDate);
      
      const data = await expenseService.getCategoryTrend(category, startDateStr, endDateStr);
      setTrendData(data);
    } catch (err) {
      setError('Failed to load trend data. Please try again.');
      console.error('Error loading trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // For longer date ranges, show year as well
    const daysDiff = Math.abs((new Date(endYear, endMonth, 0).getTime() - new Date(startYear, startMonth - 1, 1).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } else if (daysDiff > 90) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="trend-tooltip">
          <p className="tooltip-date">{formatDate(payload[0].payload.date)}</p>
          <p className="tooltip-amount">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="loading">Loading trend data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (trendData.length === 0) {
    return <div className="no-data">No spending data available for this category in the selected period.</div>;
  }

  const chartData = trendData.map(item => ({
    date: item.date,
    amount: item.amount,
    formattedDate: formatDate(item.date),
  }));

  const totalAmount = trendData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="trend-chart-container">
      <div className="trend-header">
        <h4>{category} - Spending Trend</h4>
        <p className="trend-total">Total: {formatCurrency(totalAmount)}</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#0088FE"
            strokeWidth={2}
            dot={{ fill: '#0088FE', r: 4 }}
            activeDot={{ r: 6 }}
            name="Amount"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryTrendChart;

