import { Avatar, Button, Layout, Menu, Tooltip } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { BRAND } from "../../antConfig";

const { Sider, Content, Header } = Layout;

const NAV = [
  { key: "cartographie", label: "Cartographie", to: "/admin/cartographie" },
  { key: "processes", label: "Processus", to: "/admin/processes" },
  { key: "stakeholders", label: "Parties intéressées", to: "/admin/partie-interressees" },
  { key: "pilots", label: "Pilotes", to: "/admin/pilotes" },
  { key: "sipoc", label: "SIPOC", to: "/admin/sipoc" },
] as const;

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();

  // Match le lien le plus "spécifique" (important si un jour tu as /admin/processes/...).
  const selectedKey =
    [...NAV]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => pathname.startsWith(item.to))?.key ?? "cartographie";

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light" width={200}>
        <div style={{ padding: 16, fontWeight: 900 }}>Admin</div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV.map((i) => ({
            key: i.key,
            label: <Link to={i.to}>{i.label}</Link>,
          }))}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "white",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700 }}>Gestion</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Tooltip placement="left" title={user?.name}>
              <Avatar style={{ backgroundColor: BRAND.primary, verticalAlign: 'middle' }} size="large">
                {userInitial}
              </Avatar>
            </Tooltip>
            <Button type="link" onClick={logout} style={{ fontWeight: 700, padding: 0 }}>
              Déconnexion
            </Button>
          </div>
        </Header>

        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
