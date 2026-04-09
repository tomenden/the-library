import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLibrary from './pages/MainLibrary';
import SearchDiscovery from './pages/SearchDiscovery';
import ContentPreview from './pages/ContentPreview';
import HistoryArchive from './pages/HistoryArchive';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLibrary />} />
        <Route path="/explore" element={<SearchDiscovery />} />
        <Route path="/preview" element={<ContentPreview />} />
        <Route path="/archive" element={<HistoryArchive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
