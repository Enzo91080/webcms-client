import {
  Alert,
  Card,
  Col,
  Empty,
  Grid,
  Row,
  Skeleton,
  Tag,
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
import CartographyMicroscopeButton from "../components/CartographyMicroscopeButton";
import "./cartography.css";

function displayName(item: CartographyItem): string {
  return item.label || item.process.name;
}

function isHexColor(v?: string | null) {
  return !!v && /^#[0-9a-fA-F]{6}$/.test(v);
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
        <div className="carto1Hero">
          <div className="carto1HeroIcon">
            <ApartmentOutlined />
          </div>
          <div className="carto1HeroText">
            <h1 className="carto1Title">Cartographie des processus</h1>
            <p className="carto1Subtitle">
              Clique directement sur un chevron pour ouvrir le processus.
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <CartographyMicroscopeButton loading={!carto} />
          </div>
        </div>

        <div className="carto1Main">
          <Row gutter={[12, 12]} align="middle" style={{ width: "100%" }}>
            {!isMobile && (
              <Col xs={24} lg={5}>
                <div className="carto1SidePanel">
                  <div className="carto1SideHero">
                    <div className="carto1SideHeroIcon">
                      <TeamOutlined />
                    </div>
                    <span className="carto1SideHeroTitle">Besoins des Parties Intéressées</span>
                  </div>
                  <Card
                    bordered={false}
                    size="small"
                    className="carto1Card carto1SideCard"
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
                </div>
              </Col>
            )}

            <Col xs={24} lg={14}>
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
                      const borderColor = isHexColor(it.process.color)
                        ? it.process.color!
                        : "#94a3b8";
                      return (
                        <Link
                          key={it.id}
                          to={`/process/${it.process.code}`}
                          className="cartoChevronLink"
                          style={
                            { 
                              zIndex: idx, 
                              "--chevron-color": borderColor
                            } as React.CSSProperties
                          }
                          role="listitem"
                          aria-label={`Ouvrir ${displayName(it)}`}
                        >
                          <div
                            className={`cartoChevron${idx === 0 ? " cartoChevronFirst" : ""}`}
                          >
                            <Tag
                              
                              color={borderColor}
                              className="cartoChevronCode"
                              style={{ margin: 0, color: "black", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em" }}
                            >
                              {(it.process.code || "\u2014").toUpperCase()}
                            </Tag>
                            <span className="cartoChevronName" title={displayName(it)}>
                              {displayName(it)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

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
              <Col xs={24} lg={5}>
                <div className="carto1SidePanel">
                  <div className="carto1SideHero">
                    <div className="carto1SideHeroIcon">
                      <TeamOutlined />
                    </div>
                    <span className="carto1SideHeroTitle">Satisfaction des Parties Intéressées</span>
                  </div>
                  <Card
                    bordered={false}
                    size="small"
                    className="carto1Card carto1SideCard"
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
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>
    </div>
  );
}
