import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Login from "./pages/Login";
import MainLibrary from "./pages/MainLibrary";
import SearchDiscovery from "./pages/SearchDiscovery";
import ContentPreview from "./pages/ContentPreview";
import ApiKeys from "./pages/ApiKeys";
import Settings from "./pages/Settings";

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
                <Route path="/settings/api-keys" element={<ApiKeys />} />
                <Route path="/settings" element={<Settings />} />
                {/* Redirect old routes */}
                <Route path="/favorites" element={<Navigate to="/" replace />} />
                <Route path="/unread" element={<Navigate to="/" replace />} />
                <Route path="/articles" element={<Navigate to="/" replace />} />
                <Route path="/videos" element={<Navigate to="/" replace />} />
                <Route path="/audio" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
