export function Stat({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <div className="stat">
      <small>{label}</small>
      <div>
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
      <p>{note}</p>
    </div>
  );
}
