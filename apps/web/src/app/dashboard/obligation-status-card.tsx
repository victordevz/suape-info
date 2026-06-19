"use client";

import { useMemo, useState } from 'react';

export type ComplianceSegment = {
  id: string;
  label: string;
  percent: number;
  count: number;
  color: string;
  items: Array<{
    code: string;
    name: string;
    due: string;
  }>;
};

type OverviewComplianceCardProps = {
  segments: ComplianceSegment[];
  total: number;
};

export function OverviewComplianceCard({
  segments,
  total,
}: OverviewComplianceCardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeSegment = activeId
    ? segments.find((segment) => segment.id === activeId) ?? null
    : null;

  return (
    <section className="overview-compliance-card" aria-label="Status das obrigações ambientais">
      <header className="overview-compliance-header">
        <div>
          <h2>Status das Obrigações Ambientais</h2>
          <p>Distribuição por situação de conformidade - junho de 2026</p>
        </div>
      </header>

      <div className="overview-compliance-body">
        <div className="overview-donut-zone">
          <ComplianceDonut
            activeId={activeId}
            onSelect={setActiveId}
            segments={segments}
            total={total}
          />
        </div>

        <div className="overview-segment-detail">
          {activeSegment ? (
            <SegmentDetail
              segment={activeSegment}
              onClear={() => setActiveId(null)}
            />
          ) : (
            <div className="overview-segment-empty">
              <span className="overview-chart-icon" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <strong>Selecione um segmento</strong>
              <p>
                Clique em uma fatia do gráfico ou em um item da legenda para ver
                as obrigações detalhadas.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ComplianceDonut({
  activeId,
  onSelect,
  segments,
  total,
}: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
  segments: ComplianceSegment[];
  total: number;
}) {
  const arcs = useMemo(() => getArcs(segments), [segments]);
  const activeSegment = activeId
    ? segments.find((segment) => segment.id === activeId) ?? null
    : null;

  return (
    <div className="overview-donut-layout">
      <div className="overview-donut-figure">
        <svg aria-hidden="true" height="156" viewBox="0 0 160 160" width="156">
          {arcs.map((arc) => {
            const isActive = activeId === arc.id;
            const isMuted = Boolean(activeId && !isActive);

            return (
              <path
                d={buildArcPath(80, 80, 52, arc.startDeg, arc.endDeg)}
                fill="none"
                key={arc.id}
                onClick={() => onSelect(isActive ? null : arc.id)}
                opacity={isMuted ? 0.28 : 1}
                stroke={arc.color}
                strokeLinecap="butt"
                strokeWidth={isActive ? 26 : 22}
              />
            );
          })}
        </svg>
        <div className="overview-donut-center">
          {activeSegment ? (
            <>
              <strong style={{ color: activeSegment.color }}>
                {activeSegment.percent}%
              </strong>
              <span>{activeSegment.label}</span>
            </>
          ) : (
            <>
              <strong>{total}</strong>
              <span>obrigações</span>
            </>
          )}
        </div>
      </div>

      <div className="overview-donut-legend">
        {segments.map((segment) => {
          const isActive = activeId === segment.id;
          const isMuted = Boolean(activeId && !isActive);

          return (
            <button
              className={isActive ? 'active' : ''}
              key={segment.id}
              onClick={() => onSelect(isActive ? null : segment.id)}
              style={{ opacity: isMuted ? 0.45 : 1 }}
              type="button"
            >
              <span
                className="overview-legend-dot"
                style={{ background: segment.color }}
              />
              <span>
                <strong>{segment.label}</strong>
                <small>{segment.percent}% das obrigações</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SegmentDetail({
  onClear,
  segment,
}: {
  onClear: () => void;
  segment: ComplianceSegment;
}) {
  return (
    <div className="overview-segment-panel">
      <div className="overview-segment-title">
        <div>
          <span style={{ background: segment.color }} />
          <strong>{segment.label}</strong>
          <small>
            {segment.count} obrigações - {segment.percent}% do total
          </small>
        </div>
        <button onClick={onClear} type="button">
          Fechar
        </button>
      </div>

      <div className="overview-segment-progress">
        <span
          style={{
            background: segment.color,
            width: `${segment.percent}%`,
          }}
        />
      </div>

      <div className="overview-segment-items">
        <span>Principais obrigações</span>
        {segment.items.map((item) => (
          <article
            key={item.code}
            style={{
              borderColor: `${segment.color}33`,
              background: `${segment.color}0f`,
            }}
          >
            <div>
              <strong>{item.name}</strong>
              <small>{item.code}</small>
            </div>
            <mark style={{ color: segment.color }}>{item.due}</mark>
          </article>
        ))}
      </div>
    </div>
  );
}

function getArcs(segments: ComplianceSegment[]) {
  const total = segments.reduce((sum, segment) => sum + segment.percent, 0);
  const gap = 2.5;
  let cursor = 0;

  return segments.map((segment) => {
    const startDeg = total > 0 ? (cursor / total) * 360 : 0;
    const endDeg = total > 0 ? ((cursor + segment.percent) / total) * 360 - gap : 0;
    cursor += segment.percent;

    return {
      ...segment,
      startDeg,
      endDeg,
    };
  });
}

function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const format = (value: number) => Number(value.toFixed(4));
  const toRad = (degree: number) => ((degree - 90) * Math.PI) / 180;
  const x1 = format(cx + radius * Math.cos(toRad(startAngle)));
  const y1 = format(cy + radius * Math.sin(toRad(startAngle)));
  const x2 = format(cx + radius * Math.cos(toRad(endAngle)));
  const y2 = format(cy + radius * Math.sin(toRad(endAngle)));
  const large = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
}
