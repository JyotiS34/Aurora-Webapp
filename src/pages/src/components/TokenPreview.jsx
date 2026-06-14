/**
 * TokenPreview
 *
 * Renders the two-segment BERT input format:
 *   [CLS]  entity_tokens (token_type_id=0)  [SEP]  text_tokens (token_type_id=1)  [SEP]
 *
 * Props:
 *   entity: string
 *   text:   string
 *   maxTextTokens: cap text tokens shown before ellipsis (default 10)
 */
export default function TokenPreview({ entity = '', text = '', maxTextTokens = 10 }) {
  const entityTokens = entity.trim().split(/\s+/).filter(Boolean);
  const textWords    = text.trim().split(/\s+/).filter(Boolean);
  const truncated    = textWords.length > maxTextTokens;
  const textTokens   = truncated ? textWords.slice(0, maxTextTokens) : textWords;

  return (
    <div className="token-preview">
      <div className="token-preview-label">Input format · two-segment BERT encoding</div>

      <div className="token-row" role="list">
        {/* [CLS] */}
        <span className="token token-special" role="listitem" title="token_type_id = 0">[CLS]</span>

        {/* Segment A — entity (token_type_id = 0) */}
        {entityTokens.length > 0 ? (
          entityTokens.map((tok, i) => (
            <span key={i} className="token token-a" role="listitem" title="Segment A · token_type_id = 0">
              {tok}
            </span>
          ))
        ) : (
          <span className="token token-a" style={{ opacity: 0.4 }}>entity</span>
        )}

        {/* [SEP] between segments */}
        <span className="token token-special" role="listitem" title="Segment separator · token_type_id = 0">[SEP]</span>

        {/* Segment B — text (token_type_id = 1) */}
        {textTokens.length > 0 ? (
          textTokens.map((tok, i) => (
            <span key={i} className="token token-b" role="listitem" title="Segment B · token_type_id = 1">
              {tok}
            </span>
          ))
        ) : (
          <span className="token token-b" style={{ opacity: 0.4 }}>text tokens</span>
        )}

        {truncated && (
          <span className="token-gap" title={`+${textWords.length - maxTextTokens} more tokens`}>
            +{textWords.length - maxTextTokens}…
          </span>
        )}

        {/* Trailing [SEP] */}
        <span className="token token-special" role="listitem" title="Trailing separator · token_type_id = 1">[SEP]</span>
      </div>

      <div className="token-legend">
        <div className="token-legend-item">
          <span className="token-swatch token-swatch-a" />
          Segment A — entity (token_type_id = 0)
        </div>
        <div className="token-legend-item">
          <span className="token-swatch token-swatch-b" />
          Segment B — text (token_type_id = 1)
        </div>
      </div>
    </div>
  );
}
