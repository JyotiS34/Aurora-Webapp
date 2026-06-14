/**
 * ConfidenceBars
 *
 * Props:
 *   scores:       { Positive, Negative, Neutral, Mixed }  (values 0-1)
 *   activeLabel:  string — the predicted class (gets highlighted)
 */

const CLASS_COLORS = {
  Positive: '#36E2C5',  // teal
  Negative: '#FF6F9C',  // rose
  Neutral:  '#8B97AC',  // dim
  Irrelevant:    '#F5B86B',  // amber
};

// Canonical display order
const ORDER = ['Positive', 'Negative', 'Neutral', 'Irrelevant'];

export default function ConfidenceBars({ scores = {}, activeLabel = '' }) {
  return (
    <div className="confidence-bars" role="list" aria-label="Confidence scores">
      {ORDER.map(cls => {
        const raw   = scores[cls] ?? 0;
        const pct   = (raw * 100).toFixed(1);
        const width = `${(raw * 100).toFixed(1)}%`;
        const color = CLASS_COLORS[cls];
        const active = cls === activeLabel;

        return (
          <div
            key={cls}
            className="confidence-row"
            role="listitem"
            aria-label={`${cls}: ${pct}%`}
          >
            <span className={`confidence-label${active ? ' active' : ''}`}>
              {cls}
            </span>
            <div className="confidence-track">
              <div
                className={`confidence-fill${active ? ' active' : ''}`}
                style={{ width, background: color, color }}
              />
            </div>
            <span className={`confidence-value${active ? ' active' : ''}`}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
