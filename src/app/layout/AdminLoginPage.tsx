import { Button, Card, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  async function onFinish(values: any) {
    try {
      await login(values.email, values.password);
      nav("/admin/cartographie");
    } catch (e: any) {
      message.error(e.message || "Connexion impossible");
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "80vh", padding: 16 }}>
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Connexion admin
        </Typography.Title>
        <Typography.Paragraph style={{ marginTop: -8, opacity: 0.75 }}>
          Accès réservé à l’administrateur.
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input placeholder="admin@local.test" />
          </Form.Item>
          <Form.Item name="password" label="Mot de passe" rules={[{ required: true }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block>
            Se connecter
          </Button>
        </Form>
      </Card>
    </div>
  );
}
