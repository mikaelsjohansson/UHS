import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import ExpensesPage from './pages/ExpensesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Welcome />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

