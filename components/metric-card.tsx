export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <p className="muted">{detail}</p>
    </article>
  );
}
