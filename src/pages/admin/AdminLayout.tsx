import { Button, Layout, Menu } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../components/admin/AuthProvider";

const { Sider, Content, Header } = Layout;

export default function AdminLayout() {
  const loc = useLocation();
  const { logout, user } = useAuth();

  const selectedKey = loc.pathname.startsWith("/admin/processes") ? "processes" : "processes";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light" width={240}>
        <div style={{ padding: 16, fontWeight: 900 }}>Admin</div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[{ key: "processes", label: <Link to="/admin/processes">Processus</Link> }]}
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
            <span style={{ opacity: 0.8, fontSize: 12 }}>{user?.email}</span>
            <Button type="link" onClick={logout} style={{ fontWeight: 700, padding: 0 }}>Déconnexion</Button>
          </div>
        </Header>

        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
