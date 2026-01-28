import { Route, Routes } from "react-router-dom";
import AdminProcessesPage from "./components/admin/AdminProcessesPage";
import RequireAdmin from "./components/admin/RequireAdmin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import CartographyPage from "./pages/CartographyPage";
import ProcessPage from "./pages/ProcessPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CartographyPage />} />
      <Route path="/process/:code" element={<ProcessPage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="processes" element={<AdminProcessesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
