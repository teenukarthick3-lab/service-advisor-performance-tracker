import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { AdvisorDetailPage } from "./pages/AdvisorDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { NpsVocPage } from "./pages/NpsVocPage";
import { UploadPage } from "./pages/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="advisors" element={<AdvisorDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="nps-voc" element={<NpsVocPage />} />
        <Route path="upload" element={<UploadPage />} />
      </Route>
    </Routes>
  );
}
