import { Button, Form, Input, Space } from "antd";

/**
 * Éditeur de la liste des documents de référence (Form.List).
 * Utilisé dans le formulaire général d'un processus.
 */
export function ReferenceDocumentsEditor() {
  return (
    <Form.List name="referenceDocuments">
      {(fields, { add, remove }) => (
        <div>
          <Space style={{ marginBottom: 12 }}>
            <Button onClick={() => add({ code: "", title: "", type: "PDF", url: "" })}>
              + Ajouter un document
            </Button>
          </Space>

          {fields.map((f) => (
            <div
              key={f.key}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 120px 1fr 90px",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Form.Item name={[f.name, "code"]} style={{ marginBottom: 0 }}>
                <Input placeholder="DOC-XXX-001" />
              </Form.Item>
              <Form.Item name={[f.name, "title"]} style={{ marginBottom: 0 }}>
                <Input placeholder="Titre document" />
              </Form.Item>
              <Form.Item name={[f.name, "type"]} style={{ marginBottom: 0 }}>
                <Input placeholder="PDF" />
              </Form.Item>
              <Form.Item name={[f.name, "url"]} style={{ marginBottom: 0 }}>
                <Input placeholder="https://... ou /process/..." />
              </Form.Item>
              <Button danger onClick={() => remove(f.name)}>
                Suppr.
              </Button>
            </div>
          ))}
        </div>
      )}
    </Form.List>
  );
}
