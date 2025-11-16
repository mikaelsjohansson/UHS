import { useState, useEffect } from 'react';
import { CategoryExpenseSummary } from '../types/analytics';
import { expenseService } from '../services/expenseService';
import CategoryPieChart from '../components/CategoryPieChart';
import ExpenseReport from '../components/ExpenseReport';
import CategoryTrendChart from '../components/CategoryTrendChart';
import './AnalyticsPage.css';

type ViewMode = 'chart' | 'report' | 'trend';

function AnalyticsPage() {
  const currentDate = new Date();
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [categorySummaries, setCategorySummaries] = useState<CategoryExpenseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Date range for trend view
  const [startYear, setStartYear] = useState<number>(currentDate.getFullYear() - 1);
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endYear, setEndYear] = useState<number>(currentDate.getFullYear());
  const [endMonth, setEndMonth] = useState<number>(currentDate.getMonth() + 1);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  useEffect(() => {
    if (viewMode === 'chart' || viewMode === 'report') {
      loadAnalytics();
    } else if (viewMode === 'trend') {
      loadAllCategories();
    }
  }, [year, month, viewMode]);

  useEffect(() => {
    if (viewMode === 'trend' && allCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(allCategories[0]);
    }
  }, [viewMode, allCategories]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseService.getExpensesByYearMonth(year, month);
      setCategorySummaries(data);
      // Update selected category if current selection doesn't exist in new data
      if (data.length > 0) {
        const categoryExists = data.some(item => item.category === selectedCategory);
        if (!categoryExists || !selectedCategory) {
          setSelectedCategory(data[0].category);
        }
      } else {
        setSelectedCategory('');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load analytics. Please try again.';
      setError(errorMessage);
      console.error('Error loading analytics:', err);
      if (err?.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAllCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const expenses = await expenseService.getAllExpenses();
      const uniqueCategories = Array.from(
        new Set(expenses.map(exp => exp.category || 'Uncategorized').filter(Boolean))
      );
      setAllCategories(uniqueCategories);
      if (uniqueCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(uniqueCategories[0]);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load categories. Please try again.';
      setError(errorMessage);
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(e.target.value));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(parseInt(e.target.value));
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleStartYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStartYear(parseInt(e.target.value));
  };

  const handleStartMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStartMonth(parseInt(e.target.value));
  };

  const handleEndYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEndYear(parseInt(e.target.value));
  };

  const handleEndMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEndMonth(parseInt(e.target.value));
  };

  const getMonthName = (monthNum: number, yearNum?: number): string => {
    const date = new Date(yearNum || year, monthNum - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const generateYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className="analytics-page">
      <div className="page-content">
        <div className="analytics-header">
          <h2>Expense Analytics</h2>
          {(viewMode === 'chart' || viewMode === 'report') && (
            <div className="date-selectors">
              <div className="selector-group">
                <label htmlFor="year-select">Year:</label>
                <select
                  id="year-select"
                  value={year}
                  onChange={handleYearChange}
                  className="select-input"
                >
                  {generateYearOptions().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="selector-group">
                <label htmlFor="month-select">Month:</label>
                <select
                  id="month-select"
                  value={month}
                  onChange={handleMonthChange}
                  className="select-input"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('chart')}
          >
            Pie Chart
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'report' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('report')}
          >
            Report
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'trend' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('trend')}
          >
            Category Trend
          </button>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading analytics...</div>
        ) : (
          <>
            {viewMode === 'chart' && (
              <div className="chart-container">
                <h3>Expenses by Category - {getMonthName(month)} {year}</h3>
                {categorySummaries.length > 0 ? (
                  <CategoryPieChart data={categorySummaries} />
                ) : (
                  <div className="no-data">No expenses found for this period.</div>
                )}
              </div>
            )}

            {viewMode === 'report' && (
              <div className="report-container">
                <h3>Expense Report - {getMonthName(month)} {year}</h3>
                {categorySummaries.length > 0 ? (
                  <ExpenseReport data={categorySummaries} />
                ) : (
                  <div className="no-data">No expenses found for this period.</div>
                )}
              </div>
            )}

            {viewMode === 'trend' && (
              <div className="trend-container">
                <h3>Category Spending Over Time</h3>
                <div className="trend-controls">
                  <div className="category-selector">
                    <label htmlFor="category-select">Select Category:</label>
                    <select
                      id="category-select"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="select-input"
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="date-range-selectors">
                    <div className="date-range-group">
                      <label>Start Date:</label>
                      <div className="date-range-inputs">
                        <select
                          value={startYear}
                          onChange={handleStartYearChange}
                          className="select-input"
                        >
                          {generateYearOptions().map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <select
                          value={startMonth}
                          onChange={handleStartMonthChange}
                          className="select-input"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{getMonthName(m)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="date-range-group">
                      <label>End Date:</label>
                      <div className="date-range-inputs">
                        <select
                          value={endYear}
                          onChange={handleEndYearChange}
                          className="select-input"
                        >
                          {generateYearOptions().map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <select
                          value={endMonth}
                          onChange={handleEndMonthChange}
                          className="select-input"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{getMonthName(m)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedCategory && (
                  <CategoryTrendChart
                    category={selectedCategory}
                    startYear={startYear}
                    startMonth={startMonth}
                    endYear={endYear}
                    endMonth={endMonth}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;

