/**
 * ArchDiagram — inline SVG of the DDP training architecture.
 * Uses CSS custom properties so it adapts to the design tokens automatically.
 */
export default function ArchDiagram() {
  return (
    <div className="arch-diagram">
      <svg
        viewBox="0 0 780 320"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', fontFamily: 'var(--font-mono)' }}
        aria-label="Distributed Data Parallel training architecture diagram"
        role="img"
      >
        {/* ── Defs ── */}
        <defs>
          <marker id="arr-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#36E2C5" />
          </marker>
          <marker id="arr-violet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#8B7CFF" />
          </marker>
          <marker id="arr-dim" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#4A5568" />
          </marker>
          <filter id="glow-teal">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Background boxes ── */}
        {/* Dataset */}
        <rect x="310" y="16" width="160" height="44" rx="8"
          fill="#0F1626" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <text x="390" y="34" textAnchor="middle" fill="#8B97AC" fontSize="9" letterSpacing="1">DATA SOURCE</text>
        <text x="390" y="50" textAnchor="middle" fill="#E7ECF3" fontSize="12" fontWeight="600" fontFamily="var(--font-display)">Training Dataset</text>

        {/* DistributedSampler */}
        <rect x="280" y="96" width="220" height="44" rx="8"
          fill="#0F1626" stroke="rgba(54,226,197,0.25)" strokeWidth="1"/>
        <text x="390" y="114" textAnchor="middle" fill="#36E2C5" fontSize="9" letterSpacing="1">SAMPLER</text>
        <text x="390" y="130" textAnchor="middle" fill="#E7ECF3" fontSize="12" fontWeight="600" fontFamily="var(--font-display)">DistributedSampler</text>

        {/* Arrow: dataset → sampler */}
        <line x1="390" y1="60" x2="390" y2="92"
          stroke="#4A5568" strokeWidth="1.5" markerEnd="url(#arr-dim)" />

        {/* ── Rank 0 box ── */}
        <rect x="40" y="188" width="300" height="104" rx="10"
          fill="#0F1626" stroke="rgba(54,226,197,0.3)" strokeWidth="1.5"/>
        <text x="60" y="208" fill="#36E2C5" fontSize="9" letterSpacing="1">RANK 0 · GPU 0 · T4 16GB</text>
        {/* Inner: TransformerClassifier */}
        <rect x="56" y="216" width="130" height="36" rx="6"
          fill="#1A2436" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <text x="121" y="231" textAnchor="middle" fill="#8B97AC" fontSize="8" letterSpacing="0.5">ENCODER</text>
        <text x="121" y="244" textAnchor="middle" fill="#E7ECF3" fontSize="10" fontWeight="500">TransformerClassifier</text>
        {/* AMP badge */}
        <rect x="200" y="216" width="122" height="36" rx="6"
          fill="#1A2436" stroke="rgba(139,124,255,0.2)" strokeWidth="1"/>
        <text x="261" y="231" textAnchor="middle" fill="#8B7CFF" fontSize="8" letterSpacing="0.5">MIXED PRECISION</text>
        <text x="261" y="244" textAnchor="middle" fill="#E7ECF3" fontSize="10" fontWeight="500">AMP autocast</text>
        {/* Local gradients */}
        <text x="190" y="280" textAnchor="middle" fill="#4A5568" fontSize="9">local gradients ↓</text>

        {/* ── Rank 1 box ── */}
        <rect x="440" y="188" width="300" height="104" rx="10"
          fill="#0F1626" stroke="rgba(54,226,197,0.3)" strokeWidth="1.5"/>
        <text x="460" y="208" fill="#36E2C5" fontSize="9" letterSpacing="1">RANK 1 · GPU 1 · T4 16GB</text>
        <rect x="456" y="216" width="130" height="36" rx="6"
          fill="#1A2436" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <text x="521" y="231" textAnchor="middle" fill="#8B97AC" fontSize="8" letterSpacing="0.5">ENCODER</text>
        <text x="521" y="244" textAnchor="middle" fill="#E7ECF3" fontSize="10" fontWeight="500">TransformerClassifier</text>
        <rect x="600" y="216" width="122" height="36" rx="6"
          fill="#1A2436" stroke="rgba(139,124,255,0.2)" strokeWidth="1"/>
        <text x="661" y="231" textAnchor="middle" fill="#8B7CFF" fontSize="8" letterSpacing="0.5">MIXED PRECISION</text>
        <text x="661" y="244" textAnchor="middle" fill="#E7ECF3" fontSize="10" fontWeight="500">AMP autocast</text>
        <text x="590" y="280" textAnchor="middle" fill="#4A5568" fontSize="9">local gradients ↓</text>

        {/* ── Arrows: sampler → rank boxes ── */}
        <path d="M310 140 L190 184"
          stroke="#36E2C5" strokeWidth="1.5" fill="none" strokeDasharray="4 3"
          markerEnd="url(#arr-teal)" opacity="0.7"/>
        <path d="M470 140 L590 184"
          stroke="#36E2C5" strokeWidth="1.5" fill="none" strokeDasharray="4 3"
          markerEnd="url(#arr-teal)" opacity="0.7"/>
        <text x="270" y="166" fill="#36E2C5" fontSize="8" opacity="0.7">shard A</text>
        <text x="480" y="166" fill="#36E2C5" fontSize="8" opacity="0.7">shard B</text>

        {/* ── all_reduce bridge ── */}
        <path d="M342 300 Q390 312 438 300"
          stroke="#8B7CFF" strokeWidth="2" fill="none"
          markerEnd="url(#arr-violet)" markerStart="url(#arr-violet)"
          filter="url(#glow-teal)"/>
        <text x="390" y="316" textAnchor="middle" fill="#8B7CFF" fontSize="9" letterSpacing="0.5">NCCL · all_reduce · gradient sync</text>
      </svg>
    </div>
  );
}
