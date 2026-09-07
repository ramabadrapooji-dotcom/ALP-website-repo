import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import ImportCenter from './pages/ImportCenter';
import ReviewQueue from './pages/ReviewQueue';
import TestConfigurator from './pages/TestConfigurator';
import ExamEngine from './pages/ExamEngine';
import ResultsPage from './pages/ResultsPage';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <Router>
      {/* Global background aesthetic layers */}
      <div className="bg-glow"></div>
      <div className="bg-glow-2"></div>

      <Routes>
        {/* Full-screen pages — no sidebar */}
        <Route path="/exam/:sessionId" element={<ExamEngine />} />
        <Route path="/results/:attemptId" element={<ResultsPage />} />

        {/* Sidebar layout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="import" element={<ImportCenter />} />
          <Route path="import/review" element={<ReviewQueue />} />
          <Route path="test/new" element={<TestConfigurator />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
