import {
  Alert,
  Card,
  Col,
  Empty,
  Grid,
  Row,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CrownOutlined,
  ApartmentOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { getCartography } from "../../../shared/api";
import type { CartographyDTO, CartographyItem } from "../../../shared/types/process";
import "./cartography.css";

const { Title, Text } = Typography;

function displayName(item: CartographyItem): string {
  return item.label || item.process.name;
}

function isHexColor(v?: string | null) {
  return !!v && /^#[0-9a-fA-F]{6}$/.test(v);
}

function getContrastText(hex: string | null): string {
  if (!hex || !isHexColor(hex)) return "#0b1220";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0b1220" : "#ffffff";
}

function densityClass(count: number) {
  if (count >= 12) return "carto1DensityMicro";
  if (count >= 8) return "carto1DensityDense";
  return "carto1DensityNormal";
}

export default function CartographyPage() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  const [carto, setCarto] = useState<CartographyDTO | null>(null);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    getCartography()
      .then((res) => {
        if (!alive) return;
        setCarto(res.data);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e?.message || e));
      });

    return () => {
      alive = false;
    };
  }, []);

  const valueChain = carto?.valueChain ?? [];
  const manager = carto?.manager ?? null;
  const leftStakeholders = carto?.leftStakeholders ?? [];
  const rightStakeholders = carto?.rightStakeholders ?? [];

  const filteredValueChain = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return valueChain;
    return valueChain.filter((it) => {
      const name = displayName(it).toLowerCase();
      const code = (it.process.code || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [query, valueChain]);

  const dens = densityClass(1 + filteredValueChain.length);

  if (error) {
    return (
      <div className="carto1Center">
        <Alert type="error" showIcon message="Erreur" description={error} />
      </div>
    );
  }

  if (!carto) {
    return (
      <div className="carto1Page">
        <div className="carto1Shell">
          <Card className="carto1Hero" bordered={false}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="carto1Page">
      <div className="carto1Shell">
        <Card className="carto1Hero" bordered={false}>
          <div className="carto1Header">
            <div className="carto1HeaderLeft">
              <Title level={2} className="carto1Title">
                Cartographie des processus
              </Title>
              <Text type="secondary" className="carto1Subtitle">
                Clique directement sur un chevron pour ouvrir le processus.
              </Text>
            </div>
          </div>
        </Card>

        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          {!isMobile && (
            <Col xs={24} lg={3}>
              <Card
                bordered={false}
                size="small"
                className="carto1Card carto1SideCard"
                title={
                  <Space size={8}>
                    <TeamOutlined />
                    <span>Besoins des parties interressées</span>
                  </Space>
                }
              >
                {leftStakeholders.length ? (
                  <div className="carto1StakeList">
                    {leftStakeholders.map((s) => (
                      <div key={s.id} className="carto1StakeItem">
                        <span className="carto1Dot carto1DotBlue" />
                        <span className="carto1StakeName">{s.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun" />
                )}
              </Card>
            </Col>
          )}

          <Col xs={24} lg={18}>
            <Card
              bordered={false}
              className="carto1Card"
              title={
                <Space size={8}>
                  <ApartmentOutlined />
                  <span>Chaîne de valeur</span>
                </Space>
              }
              extra={<Text type="secondary">{filteredValueChain.length} élément(s)</Text>}
            >
              <div className={`cartoStageX ${dens}`}>
                {/* Manager pill au dessus */}
                {manager ? (
                  <Link
                    to={`/process/${manager.process.code}`}
                    className="cartoStageXManager"
                    style={
                      manager.process.color && isHexColor(manager.process.color)
                        ? { ["--mngt" as any]: manager.process.color }
                        : undefined
                    }
                    aria-label={`Ouvrir ${displayName(manager)}`}
                  >
                    <span className="cartoStageXManagerIcon">
                      <CrownOutlined />
                    </span>
                    <span className="cartoStageXManagerText">
                      {displayName(manager).toUpperCase()}
                    </span>
                  </Link>
                ) : (
                  <div className="cartoStageXManager cartoStageXManagerDisabled" aria-disabled="true">
                    <span className="cartoStageXManagerIcon">
                      <CrownOutlined />
                    </span>
                    <span className="cartoStageXManagerText">MANAGER NON DÉFINI</span>
                  </div>
                )}

                {/* Bandeau titre */}
                <div className="cartoStageXTitle">PROCESSUS DE LA CHAÎNE DE VALEUR</div>

                {/* Chevrons imbriqués */}
                {filteredValueChain.length === 0 ? (
                  <div className="cartoStageXChain">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={query ? "Aucun résultat" : "Aucun processus"}
                    />
                  </div>
                ) : (
                  <div className="cartoChevronChain" role="list" aria-label="Chaîne de valeur">
                    {filteredValueChain.map((it, idx) => {
                      const bg = isHexColor(it.process.color) ? it.process.color! : "#94a3b8";
                      const fg = getContrastText(bg);
                      return (
                          <Link
                            to={`/process/${it.process.code}`}
                            className="cartoChevronLink"
                            style={{ zIndex: idx }}
                            role="listitem"
                            aria-label={`Ouvrir ${displayName(it)}`}
                          >
                            <div
                              className={`cartoChevron${idx === 0 ? " cartoChevronFirst" : ""}`}
                              style={{ background: bg, color: fg }}
                            >
                              <span className="cartoChevronCode">
                                {(it.process.code || "").toUpperCase()}
                              </span>
                              <span className="cartoChevronName">{displayName(it)}</span>
                            </div>
                          </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {isMobile && (
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                <Col xs={24} md={12}>
                  <Card bordered={false} size="small" className="carto1Card carto1SideCard" title="Besoins">
                    {leftStakeholders.length ? (
                      <div className="carto1StakeList">
                        {leftStakeholders.map((s) => (
                          <div key={s.id} className="carto1StakeItem">
                            <span className="carto1Dot carto1DotBlue" />
                            <span className="carto1StakeName">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun" />
                    )}
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card bordered={false} size="small" className="carto1Card carto1SideCard" title="Satisfaction">
                    {rightStakeholders.length ? (
                      <div className="carto1StakeList">
                        {rightStakeholders.map((s) => (
                          <div key={s.id} className="carto1StakeItem">
                            <span className="carto1Dot carto1DotGreen" />
                            <span className="carto1StakeName">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun" />
                    )}
                  </Card>
                </Col>
              </Row>
            )}
          </Col>

          {!isMobile && (
            <Col xs={24} lg={3}>
              <Card
                bordered={false}
                size="small"
                className="carto1Card carto1SideCard "
                title={
                  <Space size={8}>
                    <TeamOutlined />
                    <span>Satisfaction des PI</span>
                  </Space>
                }
              >
                {rightStakeholders.length ? (
                  <div className="carto1StakeList">
                    {rightStakeholders.map((s) => (
                      <div key={s.id} className="carto1StakeItem">
                        <span className="carto1Dot carto1DotGreen" />
                        <span className="carto1StakeName">{s.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun" />
                )}
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
}
