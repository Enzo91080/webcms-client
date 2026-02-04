import { ConfigProvider } from "antd";
import { Route, Routes } from "react-router-dom";
import AdminProcessesPage from "./features/processes/pages/AdminListProcessPage";
import RequireAdmin from "./app/providers/RequireAdmin";
import AdminLayout from "./app/layout/AdminLayout";
import AdminLoginPage from "./app/layout/AdminLoginPage";
import CartographyPage from "./features/processes/pages/CartographyPage";
import ProcessPage from "./features/processes/pages/ProcessPage";
import AdminStakeholdersPage from "./features/stakeholders/pages/AdminListStakeholderPage";
import AdminPilotsPage from "./features/pilots/pages/AdminListPilotPage";
import AdminSipocPage from "./features/sipoc/pages/AdminSipocPage";

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
