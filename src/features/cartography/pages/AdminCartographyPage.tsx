import { Button, Card, Col, ColorPicker, Input, message, Row, Segmented, Select, Space, Spin, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  adminGetCartography,
  adminSaveCartography,
  adminGetPanelStakeholders,
  adminSavePanelStakeholders,
  adminPatchProcess,
} from "../../../shared/api";
import type { CartographyLayoutInput, PanelStakeholderInput, PanelConfig } from "../../../shared/api";
import type { CartographySlot } from "../../../shared/types/process";
import { useProcessOptions } from "../../../shared/hooks/useProcessOptions";
import { useStakeholderOptions } from "../../../shared/hooks/useStakeholderOptions";
import { getErrorMessage } from "../../../shared/utils/error";

type SlotItem = {
  processId: string;
  label: string;
};

type SlotState = {
  manager: SlotItem | null;
  value_chain: SlotItem[];
  left_panel: SlotItem[];
  right_panel: SlotItem[];
  left_box: SlotItem[];
  right_box: SlotItem[];
};

const EMPTY_STATE: SlotState = {
  manager: null,
  value_chain: [],
  left_panel: [],
  right_panel: [],
  left_box: [],
  right_box: [],
};

const SLOT_LABELS: Record<CartographySlot, string> = {
  manager: "Manager",
  value_chain: "Chaîne de valeur",
  left_panel: "Panneau gauche",
  right_panel: "Panneau droit",
  left_box: "Box gauche",
  right_box: "Box droite",
};

type PanelItem = { stakeholderId: string };

export default function AdminCartographyPage() {
  const { options: processOptions, loading: processLoading, byId, reload: reloadProcesses } = useProcessOptions();
  const { options: stkOptions, loading: stkLoading } = useStakeholderOptions();
  const [slots, setSlots] = useState<SlotState>(EMPTY_STATE);
  const [panelConfig, setPanelConfig] = useState<PanelConfig>({ left_panel: "all", right_panel: "all" });
  const [leftPanel, setLeftPanel] = useState<PanelItem[]>([]);
  const [rightPanel, setRightPanel] = useState<PanelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Local color overrides (processId -> hex) to reflect changes before reload
  const [colorOverrides, setColorOverrides] = useState<Record<string, string | null>>({});

  const getColor = (processId: string): string | null => {
    if (processId in colorOverrides) return colorOverrides[processId];
    return byId.get(processId)?.color ?? null;
  };

  const handleColorChange = async (processId: string, hex: string | null) => {
    setColorOverrides((prev) => ({ ...prev, [processId]: hex }));
    try {
      await adminPatchProcess(processId, { color: hex } as any);
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [res, panelsRes] = await Promise.all([
        adminGetCartography(),
        adminGetPanelStakeholders(),
      ]);
      const items = res.data || [];

      const state: SlotState = { ...EMPTY_STATE, value_chain: [], left_panel: [], right_panel: [], left_box: [], right_box: [] };

      for (const item of items) {
        const slotItem: SlotItem = {
          processId: item.process?.id ?? "",
          label: item.label ?? "",
        };

        const key = item.slotKey as CartographySlot;
        if (key === "manager") {
          state.manager = slotItem;
        } else if (key in state) {
          (state[key] as SlotItem[]).push(slotItem);
        }
      }

      setSlots(state);
      setColorOverrides({});

      // Panel config + stakeholders
      setPanelConfig(panelsRes.config ?? { left_panel: "all", right_panel: "all" });
      const panelItems = panelsRes.data || [];
      setLeftPanel(
        panelItems
          .filter((p) => p.panelKey === "left_panel")
          .map((p) => ({ stakeholderId: p.stakeholder.id }))
      );
      setRightPanel(
        panelItems
          .filter((p) => p.panelKey === "right_panel")
          .map((p) => ({ stakeholderId: p.stakeholder.id }))
      );
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const items: CartographyLayoutInput[] = [];

      if (slots.manager?.processId) {
        items.push({
          slotKey: "manager",
          slotOrder: 0,
          processId: slots.manager.processId,
          label: slots.manager.label || null,
        });
      }

      const arraySlots: CartographySlot[] = ["value_chain", "left_panel", "right_panel", "left_box", "right_box"];
      for (const slotKey of arraySlots) {
        const list = slots[slotKey] as SlotItem[];
        list.forEach((item, idx) => {
          if (item.processId) {
            items.push({
              slotKey,
              slotOrder: idx,
              processId: item.processId,
              label: item.label || null,
            });
          }
        });
      }

      // Panel stakeholders
      const panelItems: PanelStakeholderInput[] = [];
      leftPanel.forEach((p, idx) => {
        if (p.stakeholderId) {
          panelItems.push({ panelKey: "left_panel", stakeholderId: p.stakeholderId, panelOrder: idx });
        }
      });
      rightPanel.forEach((p, idx) => {
        if (p.stakeholderId) {
          panelItems.push({ panelKey: "right_panel", stakeholderId: p.stakeholderId, panelOrder: idx });
        }
      });

      await Promise.all([
        adminSaveCartography(items),
        adminSavePanelStakeholders(panelItems, panelConfig),
      ]);
      message.success("Cartographie enregistrée");
      reloadProcesses();
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addItem = (slot: CartographySlot) => {
    setSlots((prev) => ({
      ...prev,
      [slot]: [...(prev[slot] as SlotItem[]), { processId: "", label: "" }],
    }));
  };

  const removeItem = (slot: CartographySlot, idx: number) => {
    setSlots((prev) => ({
      ...prev,
      [slot]: (prev[slot] as SlotItem[]).filter((_, i) => i !== idx),
    }));
  };

  const moveItem = (slot: CartographySlot, idx: number, dir: -1 | 1) => {
    setSlots((prev) => {
      const list = [...(prev[slot] as SlotItem[])];
      const target = idx + dir;
      if (target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...prev, [slot]: list };
    });
  };

  const updateItem = (slot: CartographySlot, idx: number, patch: Partial<SlotItem>) => {
    setSlots((prev) => {
      const list = [...(prev[slot] as SlotItem[])];
      list[idx] = { ...list[idx], ...patch };
      return { ...prev, [slot]: list };
    });
  };

  const stkSelectOptions = useMemo(
    () => stkOptions.map((o) => ({ value: o.value, label: o.label })),
    [stkOptions]
  );

  const handlePanelSelect = (side: "left" | "right", ids: string[]) => {
    const setter = side === "left" ? setLeftPanel : setRightPanel;
    const current = side === "left" ? leftPanel : rightPanel;

    // Keep existing items in their order, add new ones at the end
    const existing = current.filter((p) => ids.includes(p.stakeholderId));
    const existingIds = new Set(existing.map((p) => p.stakeholderId));
    const added = ids.filter((id) => !existingIds.has(id)).map((id) => ({ stakeholderId: id }));
    setter([...existing, ...added]);
  };

  const movePanelItem = (side: "left" | "right", idx: number, dir: -1 | 1) => {
    const setter = side === "left" ? setLeftPanel : setRightPanel;
    setter((prev) => {
      const list = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]];
      return list;
    });
  };

  const removePanelItem = (side: "left" | "right", idx: number) => {
    const setter = side === "left" ? setLeftPanel : setRightPanel;
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const selectOptions = useMemo(
    () => processOptions.map((o) => ({ value: o.value, label: o.label })),
    [processOptions]
  );

  const stkNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of stkOptions) map.set(o.value, o.label);
    return map;
  }, [stkOptions]);

  if (loading || processLoading || stkLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" tip="Chargement..." />
      </div>
    );
  }

  const renderProcessSelect = (
    value: string,
    onChange: (v: string) => void,
    style?: React.CSSProperties
  ) => (
    <Select
      showSearch
      allowClear
      placeholder="Sélectionner un processus"
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      options={selectOptions}
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
      }
      style={{ minWidth: 260, ...style }}
    />
  );

  const renderColorPicker = (processId: string) => {
    if (!processId) return null;
    const color = getColor(processId);
    return (
      <ColorPicker
        size="small"
        value={color || undefined}
        format="hex"
        allowClear
        onChange={(val) => handleColorChange(processId, val?.toHexString?.() || null)}
        onClear={() => handleColorChange(processId, null)}
      />
    );
  };

  const renderPanelCard = (side: "left" | "right", title: string) => {
    const panelKey = side === "left" ? "left_panel" : "right_panel";
    const mode = panelConfig[panelKey as keyof PanelConfig];
    const list = side === "left" ? leftPanel : rightPanel;
    const selectedIds = list.map((p) => p.stakeholderId).filter(Boolean);

    return (
      <Card title={title} size="small" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Segmented
            value={mode}
            onChange={(v) =>
              setPanelConfig((prev) => ({ ...prev, [panelKey]: v as "all" | "custom" }))
            }
            options={[
              { value: "all", label: "Afficher toutes" },
              { value: "custom", label: "Sélectionner" },
            ]}
          />
        </div>

        {mode === "custom" && (
          <>
            <Select
              mode="multiple"
              showSearch
              placeholder="Sélectionner des parties intéressées"
              value={selectedIds}
              onChange={(ids) => handlePanelSelect(side, ids)}
              options={stkSelectOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
              }
              style={{ width: "100%", marginBottom: 12 }}
            />

            {list.length > 0 && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Ordre d'affichage :
                </Typography.Text>
                {list.map((item, idx) => (
                  <div
                    key={item.stakeholderId}
                    style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}
                  >
                    <span style={{ minWidth: 20, textAlign: "center", fontWeight: 600, color: "#888", fontSize: 12 }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13 }}>
                      {stkNameById.get(item.stakeholderId) || item.stakeholderId}
                    </span>
                    <Button
                      size="small"
                      type="text"
                      icon={<ArrowUpOutlined />}
                      disabled={idx === 0}
                      onClick={() => movePanelItem(side, idx, -1)}
                    />
                    <Button
                      size="small"
                      type="text"
                      icon={<ArrowDownOutlined />}
                      disabled={idx === list.length - 1}
                      onClick={() => movePanelItem(side, idx, 1)}
                    />
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removePanelItem(side, idx)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mode === "all" && (
          <div style={{ color: "#999", fontStyle: "italic", fontSize: 13 }}>
            Toutes les parties intéressées actives seront affichées.
          </div>
        )}
      </Card>
    );
  };

  const renderListSlot = (slotKey: CartographySlot) => {
    const list = slots[slotKey] as SlotItem[];
    return (
      <Card
        title={SLOT_LABELS[slotKey]}
        size="small"
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={() => addItem(slotKey)}>
            Ajouter
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        {list.length === 0 && (
          <div style={{ color: "#999", fontStyle: "italic" }}>Aucun processus assigné</div>
        )}
        {list.map((item, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, color: "#888" }}>
              {idx + 1}
            </span>
            {renderProcessSelect(item.processId, (v) => updateItem(slotKey, idx, { processId: v }))}
            {renderColorPicker(item.processId)}
            <Input
              placeholder="Label (optionnel)"
              value={item.label}
              onChange={(e) => updateItem(slotKey, idx, { label: e.target.value })}
              style={{ width: 200 }}
            />
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={idx === 0}
              onClick={() => moveItem(slotKey, idx, -1)}
            />
            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={idx === list.length - 1}
              onClick={() => moveItem(slotKey, idx, 1)}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeItem(slotKey, idx)}
            />
          </div>
        ))}
      </Card>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Cartographie des processus
          </Typography.Title>
        </Col>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          Enregistrer
        </Button>
      </Row>

      <Card title={SLOT_LABELS.manager} size="small" style={{ marginBottom: 16 }}>
        <Space>
          {renderProcessSelect(
            slots.manager?.processId ?? "",
            (v) => setSlots((prev) => ({ ...prev, manager: v ? { processId: v, label: prev.manager?.label ?? "" } : null }))
          )}
          {renderColorPicker(slots.manager?.processId ?? "")}
          <Input
            placeholder="Label (optionnel)"
            value={slots.manager?.label ?? ""}
            onChange={(e) =>
              setSlots((prev) => ({
                ...prev,
                manager: prev.manager
                  ? { ...prev.manager, label: e.target.value }
                  : { processId: "", label: e.target.value },
              }))
            }
            style={{ width: 200 }}
          />
        </Space>
      </Card>

      {renderListSlot("value_chain")}

      <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
        Parties intéressées — Panneaux
      </Typography.Title>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {renderPanelCard("left", "Panneau gauche (Support)")}
        {renderPanelCard("right", "Panneau droit (Pilotage)")}
      </div>
    </div>
  );
}
