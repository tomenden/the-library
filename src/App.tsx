import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Login from "./pages/Login";
import MainLibrary from "./pages/MainLibrary";
import SearchDiscovery from "./pages/SearchDiscovery";
import ContentPreview from "./pages/ContentPreview";
import HistoryArchive from "./pages/HistoryArchive";
import ApiKeys from "./pages/ApiKeys";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGate>
              <Routes>
                <Route path="/" element={<MainLibrary />} />
                <Route path="/explore" element={<SearchDiscovery />} />
                <Route path="/preview/:id" element={<ContentPreview />} />
                <Route path="/archive" element={<HistoryArchive />} />
                <Route path="/settings/api-keys" element={<ApiKeys />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
