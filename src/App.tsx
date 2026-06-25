import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ScriptListPage } from './pages/ScriptListPage';
import { ScriptDetailPage } from './pages/ScriptDetailPage';
import { GeneratePage } from './pages/GeneratePage';
import { CustomGeneratePage } from './pages/CustomGeneratePage';
import { Toaster } from './components/ui/toaster';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scripts" element={<ScriptListPage />} />
          <Route path="/scripts/:id" element={<ScriptDetailPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/generate/custom" element={<CustomGeneratePage />} />
        </Routes>
      </Layout>
      <Toaster />
    </BrowserRouter>
  );
}
