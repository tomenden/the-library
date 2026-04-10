import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Login from "./pages/Login";
import MainLibrary from "./pages/MainLibrary";
import SearchDiscovery from "./pages/SearchDiscovery";
import ContentPreview from "./pages/ContentPreview";
import ApiKeys from "./pages/ApiKeys";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import UnreadItems from "./pages/UnreadItems";
import FilteredItems from "./pages/FilteredItems";

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
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/unread" element={<UnreadItems />} />
                <Route path="/articles" element={
                  <FilteredItems title="Articles" subtitle="Format" filter={{ contentType: "article" }} />
                } />
                <Route path="/videos" element={
                  <FilteredItems title="Videos" subtitle="Format" filter={{ contentType: "video" }} />
                } />
                <Route path="/audio" element={
                  <FilteredItems title="Audio" subtitle="Format" filter={{ contentType: "podcast" }} />
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
