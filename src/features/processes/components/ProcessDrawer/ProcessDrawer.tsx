import {
  Button,
  Col,
  ColorPicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
} from "antd";
import type { FormInstance } from "antd";

import { LogigrammeEditor } from "../../../logigramme/components";
import SipocEditor from "../../../sipoc/components/SipocEditor";
import {
  ProcessPreview,
  ObjectivesBlocksEditor,
  StakeholderLinksEditor,
  ReferenceDocumentsEditor,
  type StakeholderLinkData,
} from "../../components";
import { PROCESS_TYPE_OPTIONS } from "../../constants";

import { adminGetProcess } from "../../../../shared/api";
import type { ProcessFull, StakeholderLinkFields } from "../../../../shared/types";

interface SelectOption {
  value: string;
  label: string;
}

interface ProcessDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: ProcessFull | null;
  setEditing: React.Dispatch<React.SetStateAction<ProcessFull | null>>;
  activeTab: string;
  onTabChange: (key: string) => void;
  form: FormInstance;
  parentOptions: SelectOption[];
  pilotOptions: SelectOption[];
  stakeholderOptions: SelectOption[];
  stakeholderLinks: StakeholderLinkData[];
  onStakeholderSelection: (ids: string[]) => void;
  onUpdateLinkField: (stakeholderId: string, field: keyof StakeholderLinkFields, value: string | null) => void;
  showAdvancedStakeholders: boolean;
  onShowAdvancedStakeholdersChange: (v: boolean) => void;
  onSave: () => void;
  items: ProcessFull[];
}

export function ProcessDrawer({
  open,
  onClose,
  editing,
  setEditing,
  activeTab,
  onTabChange,
  form,
  parentOptions,
  pilotOptions,
  stakeholderOptions,
  stakeholderLinks,
  onStakeholderSelection,
  onUpdateLinkField,
  showAdvancedStakeholders,
  onShowAdvancedStakeholdersChange,
  onSave,
  items,
}: ProcessDrawerProps) {
  async function refreshEditing() {
    if (!editing?.id) return;
    try {
      const full = await adminGetProcess(editing.id);
      setEditing(full.data as ProcessFull);
    } catch {
      // silent
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Admin — ${editing.code} ${editing.name}` : "Admin — Nouveau processus"}
      width={1400}
      destroyOnClose
      footer={
        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>Annuler</Button>
            <Button type="primary" onClick={onSave}>
              Enregistrer
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          items={[
            {
              key: "general",
              label: "Général",
              children: (
                <>
                  <Row gutter={[16, 12]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="code"
                        label="Code"
                        rules={[{ required: true, message: "Code requis" }]}
                      >
                        <Input placeholder="P02 / SP0201 ..." />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="name"
                        label="Nom"
                        rules={[{ required: true, message: "Nom requis" }]}
                      >
                        <Input placeholder="Vendre / Prospecter ..." />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="parentProcessId" label="Parent">
                        <Select
                          options={parentOptions}
                          placeholder="Sélectionner un parent"
                          allowClear
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={6}>
                      <Form.Item name="orderInParent" label="Ordre">
                        <InputNumber min={1} style={{ width: "100%" }} placeholder="1" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={6}>
                      <Form.Item name="isActive" label="Actif" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={6}>
                      <Form.Item name="processType" label="Type de processus">
                        <Select
                          options={PROCESS_TYPE_OPTIONS}
                          placeholder="Sélectionner un type"
                          allowClear
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={6}>
                      <Form.Item
                        name="color"
                        label="Couleur"
                        getValueFromEvent={(color) => color?.toHexString?.() || null}
                      >
                        <ColorPicker format="hex" allowClear />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="title" label="Objet du processus">
                    <Input.TextArea rows={3} placeholder="Décrire l'objet du processus..." />
                  </Form.Item>
                </>
              ),
            },
            {
              key: "objectives",
              label: "Objectifs",
              children: (
                <Form.Item name="objectivesBlocks" label="Objectifs du processus">
                  <ObjectivesBlocksEditor />
                </Form.Item>
              ),
            },
            {
              key: "stakeholders",
              label: "Pilotes & Parties intéressées",
              children: (
                <>
                  <Row gutter={[16, 12]}>
                    <Col xs={24} md={12}>
                      <Form.Item name="pilotIds" label="Pilote(s)">
                        <Select
                          mode="multiple"
                          options={pilotOptions}
                          placeholder="Sélectionner le(s) pilote(s)..."
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            String(option?.label || "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="selectedStakeholderIds" label="Parties intéressées">
                        <Select
                          mode="multiple"
                          options={stakeholderOptions}
                          placeholder="Sélectionner les parties intéressées..."
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            String(option?.label || "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          onChange={onStakeholderSelection}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <StakeholderLinksEditor
                    links={stakeholderLinks}
                    onUpdateField={onUpdateLinkField}
                    showAdvanced={showAdvancedStakeholders}
                    onShowAdvancedChange={onShowAdvancedStakeholdersChange}
                  />
                </>
              ),
            },
            {
              key: "documents",
              label: "Documents",
              children: <ReferenceDocumentsEditor />,
            },
            {
              key: "sipoc",
              label: "SIPOC",
              children: editing?.id ? (
                <SipocEditor
                  processId={editing.id}
                  processName={`${editing.code} - ${editing.name}`}
                  onSaved={refreshEditing}
                />
              ) : (
                <Typography.Text type="secondary">
                  Crée d'abord le processus puis édite le SIPOC.
                </Typography.Text>
              ),
            },
            {
              key: "logigramme",
              label: "Logigramme",
              children: editing?.id ? (
                <LogigrammeEditor
                  processId={editing.id}
                  sipocRows={editing?.sipoc?.rows || []}
                  initial={editing?.logigramme}
                  onSaved={async (logi) => {
                    try {
                      const full = await adminGetProcess(editing.id);
                      setEditing(full.data as ProcessFull);
                    } catch {
                      setEditing((prev: any) => ({ ...(prev || {}), logigramme: logi }));
                    }
                  }}
                />
              ) : (
                <Typography.Text type="secondary">
                  Crée d'abord le processus puis édite le logigramme.
                </Typography.Text>
              ),
            },
            {
              key: "preview",
              label: "Aperçu",
              children: editing?.id ? (
                <ProcessPreview data={editing as any} processList={items} />
              ) : (
                <Typography.Text type="secondary">
                  Crée d'abord le processus pour voir l'aperçu.
                </Typography.Text>
              ),
            },
          ]}
        />
      </Form>
    </Drawer>
  );
}
