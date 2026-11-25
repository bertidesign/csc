type Point = { day: string; value: number };

function shortDate(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
  });
}

export function ResponseChart({ points }: { points: Point[] }) {
  const width = 820;
  const height = 280;
  const left = 44;
  const right = width - 18;
  const top = 20;
  const bottom = height - 38;
  const max = Math.max(1, ...points.map((point) => point.value));
  const x = (index: number) => left + ((right - left) * index) / Math.max(1, points.length - 1);
  const y = (value: number) => bottom - ((bottom - top) * value) / max;
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(index)} ${y(point.value)}`).join(" ");
  const peakIndex = points.reduce((best, point, index) => point.value > points[best].value ? index : best, 0);
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  if (!points.some((point) => point.value > 0)) {
    return (
      <div className="chart-empty">
        <div className="chart-empty-line" aria-hidden="true" />
        <p>Non ci sono risposte nel periodo selezionato.</p>
        <span>Pubblica una survey per iniziare a leggere l’andamento.</span>
      </div>
    );
  }

  return (
    <div className="response-chart-wrap">
      <svg
        className="response-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Numero di risposte raccolte ogni giorno nel periodo selezionato"
      >
        {[0, Math.round(max / 2), max].map((value, index) => (
          <g key={`${value}-${index}`}>
            <line x1={left} x2={right} y1={y(value)} y2={y(value)} className="chart-gridline" />
            <text x={left - 12} y={y(value) + 4} className="chart-axis-label" textAnchor="end">{value}</text>
          </g>
        ))}
        <path d={`${path} L${x(points.length - 1)} ${bottom} L${x(0)} ${bottom} Z`} className="chart-area" />
        <path d={path} className="chart-line" />
        <line x1={x(peakIndex)} x2={x(peakIndex)} y1={top} y2={bottom} className="chart-peak-line" />
        <circle cx={x(peakIndex)} cy={y(points[peakIndex].value)} r="5" className="chart-peak-dot" />
        <text x={Math.min(right - 4, x(peakIndex) + 9)} y={top + 2} className="chart-peak-label" textAnchor={x(peakIndex) > right - 110 ? "end" : "start"}>
          Picco · {points[peakIndex].value}
        </text>
        {labels.map((index) => (
          <text key={points[index].day} x={x(index)} y={height - 8} className="chart-axis-label" textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>
            {shortDate(points[index].day)}
          </text>
        ))}
      </svg>
    </div>
  );
}
