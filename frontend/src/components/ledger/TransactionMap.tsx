import type { Employee } from "@/lib/mockData";

// Mini node graph: shows employee row connected to others sharing the same account.
export function TransactionMap({ employee, peers }: { employee: Employee; peers: Employee[] }) {
  const nodes = [employee, ...peers];
  const radius = 70;
  const cx = 140;
  const cy = 90;
  return (
    <svg viewBox="0 0 280 180" className="h-44 w-full">
      <defs>
        <radialGradient id="hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--squad-locked)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--squad-locked)" stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="22" fill="url(#hub)" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
        ACCT
      </text>
      <text x={cx} y={cy + 38} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
        {employee.account}
      </text>
      {nodes.map((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const isMe = n.id === employee.id;
        return (
          <g key={n.id}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <circle
              cx={x}
              cy={y}
              r="10"
              fill={isMe ? "var(--primary)" : "var(--surface-elevated)"}
              stroke={isMe ? "var(--primary)" : "var(--border)"}
            />
            <text
              x={x}
              y={y - 14}
              textAnchor="middle"
              fontSize="8"
              fill="var(--foreground)"
            >
              {n.name.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
