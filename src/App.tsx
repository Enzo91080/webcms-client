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
import AdminCartographyPage from "./features/cartography/pages/AdminCartographyPage";
import antdConfig from "./antConfig";

// Ant Design default font (text): Open Sans


export default function App() {
  return (
    <ConfigProvider theme={antdConfig}>
      <Routes>
        <Route path="/" element={<CartographyPage />} />
        <Route path="/process/:code" element={<ProcessPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="cartographie" element={<AdminCartographyPage />} />
            <Route path="processes" element={<AdminProcessesPage />} />
            <Route path="partie-interressees" element={<AdminStakeholdersPage />} />
            <Route path="pilotes" element={<AdminPilotsPage />} />
            <Route path="sipoc" element={<AdminSipocPage />} />
          </Route>
        </Route>
      </Routes>
    </ConfigProvider>
  );
}
