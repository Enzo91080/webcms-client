import { ConfigProvider } from "antd";
import { Route, Routes } from "react-router-dom";
import AdminProcessesPage from "./components/admin/Process/AdminListProcessPage";
import RequireAdmin from "./components/admin/RequireAdmin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import CartographyPage from "./pages/Cartography/CartographyPage";
import ProcessPage from "./pages/Process/ProcessPage";
import AdminStakeholdersPage from "./components/admin/Stakeholder/AdminListStakeholderPage";
import AdminPilotsPage from "./components/admin/Pilot/AdminListPilotPage";
import AdminSipocPage from "./components/admin/Sipoc/AdminSipocPage";

// Ant Design default font (text): Open Sans
const antdFontFamily =
  '"Open Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';

export default function App() {
  return (
    <ConfigProvider theme={{ token: { fontFamily: antdFontFamily } }}>
      <Routes>
        <Route path="/" element={<CartographyPage />} />
        <Route path="/process/:code" element={<ProcessPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="processes" element={<AdminProcessesPage />} />
            <Route path="partie-interressees" element={<AdminStakeholdersPage />} />
            <Route path="pilotes" element={<AdminPilotsPage />} />
            <Route path="sipoc" element={<AdminSipocPage />} />
            <Route path="raci" element={<div>RACI Page (à implémenter)</div>} />
          </Route>
        </Route>
      </Routes>
    </ConfigProvider>
  );
}
