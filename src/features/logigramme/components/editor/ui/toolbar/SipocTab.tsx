import { Button, Space, Switch } from "antd";

const L = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{children}</span>
);

type SipocTabProps = {
  autoSync: boolean;
  guidesEnabled: boolean;
  onAutoSyncChange: (v: boolean) => void;
  onGuidesChange: (v: boolean) => void;
  onSyncFromSipoc: () => void;
  onRebuildFlow: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
};

export default function SipocTab({
  autoSync, guidesEnabled,
  onAutoSyncChange, onGuidesChange,
  onSyncFromSipoc, onRebuildFlow, onAutoLayout, onFitView,
}: SipocTabProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Button onClick={onSyncFromSipoc} size="small">Sync SIPOC</Button>
      <Button onClick={onRebuildFlow} size="small">Flux par défaut</Button>
      <Button onClick={onAutoLayout} size="small">Auto-Layout</Button>
      <Button onClick={onFitView} size="small">Fit View</Button>

      <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 4px" }} />

      <Space size={4}>
        <Switch size="small" checked={autoSync} onChange={onAutoSyncChange} />
        <L>Auto-Sync</L>
      </Space>
      <Space size={4}>
        <Switch size="small" checked={guidesEnabled} onChange={onGuidesChange} />
        <L>Guides</L>
      </Space>
    </div>
  );
}
