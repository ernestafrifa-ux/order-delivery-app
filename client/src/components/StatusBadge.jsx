const STYLES = {
  Ordered: { bg: "#eef1f6", fg: "#4b5563" },
  Purchased: { bg: "#fef3c7", fg: "#92400e" },
  Shipped: { bg: "#dbeafe", fg: "#1e40af" },
  Delivered: { bg: "#dcfce7", fg: "#166534" },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.Ordered;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: style.bg,
        color: style.fg,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
