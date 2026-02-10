import { Button, Card, Col, ColorPicker, Input, message, Row, Select, Space, Spin, Typography } from "antd";
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
  adminPatchProcess,
} from "../../../shared/api";
import type { CartographyLayoutInput } from "../../../shared/api";
import type { CartographySlot } from "../../../shared/types/process";
import { useProcessOptions } from "../../../shared/hooks/useProcessOptions";
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

export default function AdminCartographyPage() {
  const { options: processOptions, loading: processLoading, byId, reload: reloadProcesses } = useProcessOptions();
  const [slots, setSlots] = useState<SlotState>(EMPTY_STATE);
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
      const res = await adminGetCartography();
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

      await adminSaveCartography(items);
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

  const selectOptions = useMemo(
    () => processOptions.map((o) => ({ value: o.value, label: o.label })),
    [processOptions]
  );

  if (loading || processLoading) {
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {renderListSlot("left_panel")}
        {renderListSlot("right_panel")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {renderListSlot("left_box")}
        {renderListSlot("right_box")}
      </div>
    </div>
  );
}
