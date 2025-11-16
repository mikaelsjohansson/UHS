import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MultiCategoryTrend } from '../types/analytics';
import { expenseService } from '../services/expenseService';
import { formatCurrency } from '../utils/currency';
import './CategoryTrendChart.css';

interface CategoryTrendChartProps {
  categories: string[] | null;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

// Color palette for different categories
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', 
  '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'
];

function CategoryTrendChart({ categories, startYear, startMonth, endYear, endMonth }: CategoryTrendChartProps) {
  const [trendData, setTrendData] = useState<MultiCategoryTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrendData();
  }, [categories, startYear, startMonth, endYear, endMonth]);

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
      
      const data = await expenseService.getMultiCategoryTrend(categories, startDateStr, endDateStr);
      setTrendData(data);
    } catch (err) {
      setError('Failed to load trend data. Please try again.');
      console.error('Error loading trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform data to group by date with amounts per category
  const chartData = useMemo(() => {
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

    // Filter trendData to only include selected categories if specified
    const filteredData = categories !== null && categories.length > 0
      ? trendData.filter(item => categories.includes(item.category))
      : trendData;

    const dateMap = new Map<string, Record<string, string | number>>();
    
    filteredData.forEach(item => {
      const dateKey = item.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, formattedDate: formatDate(item.date) });
      }
      dateMap.get(dateKey)![item.category] = item.amount;
    });
    
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [trendData, categories, startYear, startMonth, endYear, endMonth]);

  // Get unique categories from filtered data
  const uniqueCategories = useMemo(() => {
    // Filter trendData to only include selected categories if specified
    const filteredData = categories !== null && categories.length > 0
      ? trendData.filter(item => categories.includes(item.category))
      : trendData;
    
    const cats = new Set<string>();
    filteredData.forEach(item => cats.add(item.category));
    return Array.from(cats).sort();
  }, [trendData, categories]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="trend-tooltip">
          <p className="tooltip-date">{data.formattedDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-amount" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
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
    const categoryText = categories === null ? 'categories' : categories.length === 1 ? categories[0] : 'selected categories';
    return <div className="no-data">No spending data available for {categoryText} in the selected period.</div>;
  }

  const totalAmount = trendData.reduce((sum, item) => sum + item.amount, 0);
  const displayTitle = categories === null 
    ? 'All Categories - Spending Trend'
    : categories.length === 1
    ? `${categories[0]} - Spending Trend`
    : `${categories.length} Categories - Spending Trend`;

  return (
    <div className="trend-chart-container">
      <div className="trend-header">
        <h4>{displayTitle}</h4>
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
          {uniqueCategories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
              activeDot={{ r: 6 }}
              name={category}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryTrendChart;

