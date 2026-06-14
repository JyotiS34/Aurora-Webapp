import { useState } from 'react';
import { predictSentiment, API_BASE_URL } from '../lib/api';
import ConfidenceBars from '../components/ConfidenceBars';
import TokenPreview   from '../components/TokenPreview';

const EXAMPLES = [
  {
    label:  'Battery life',
    entity: 'the battery life',
    text:   'The battery life on this phone is incredible — it easily lasts two full days on a single charge.',
  },
  {
    label:  'Customer service',
    entity: 'customer service',
    text:   'Camera quality is great but their customer service took three weeks to respond to a basic return request.',
  },
  {
    label:  'New update',
    entity: 'the new update',
    text:   'Honestly the new update broke half the features I rely on daily and made the app noticeably slower.',
  },
  {
    label:  'Delivery speed',
    entity: 'delivery speed',
    text:   'Delivery speed was surprisingly fast but the packaging was torn open and one item was missing.',
  },
];

const LABEL_TAG = {
  Positive: 'tag-teal',
  Negative: 'tag-rose',
  Neutral:  'tag-violet',
  Irrelevant:'tag-amber',
};

export default function Demo() {
  const [entity, setEntity]       = useState('');
  const [text,   setText]         = useState('');
  const [status, setStatus]       = useState('idle'); // idle | loading | done | error
  const [result, setResult]       = useState(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const [latency, setLatency]     = useState(null);

  function fillExample(ex) {
    setEntity(ex.entity);
    setText(ex.text);
    setStatus('idle');
    setResult(null);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    const t0 = performance.now();
    try {
      const res = await predictSentiment({ text, entity });
      const ms  = Math.round(res.latency ?? (performance.now() - t0));
      setResult(res);
      setLatency(ms);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message || 'Prediction failed. Check the API endpoint and CORS settings.');
      setStatus('error');
    }
  }

  const canSubmit = text.trim().length > 0 && status !== 'loading';

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────── */}
      <section className="shell">
        <div className="eyebrow">Live inference · /predict</div>
        <h1>Run the model</h1>
        <p className="lede demo-lede">
          Type any sentence and a target entity — or pick an example below.
          The deployed BERT classifier returns confidence scores across four
          sentiment classes: Positive, Negative, Neutral, and Irrelevant.
        </p>
      </section>

      {/* ── Form + Result ────────────────────────────────────── */}
      <section className="shell demo-grid">

        {/* Form */}
        <div className="card demo-form">
          <div className="field-group">
            <label htmlFor="entity-input" className="field-label">
              Target entity
            </label>
            <input
              id="entity-input"
              className="field-input"
              type="text"
              placeholder='e.g. "battery life", "customer service"'
              value={entity}
              onChange={e => setEntity(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field-group">
            <label htmlFor="text-input" className="field-label">
              Text
            </label>
            <textarea
              id="text-input"
              className="field-textarea"
              placeholder="Enter a sentence that mentions or relates to the entity above…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {status === 'loading' ? 'Analysing…' : 'Analyse sentiment'}
          </button>

          {/* Examples */}
          <div>
            <div className="examples-label">Try an example</div>
            <div className="examples-chips">
              {EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  className="example-chip"
                  onClick={() => fillExample(ex)}
                  title={ex.text}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div className="card demo-result">
          {status === 'idle' && (
            <div className="result-empty">
              <div className="result-empty-icon">◎</div>
              <span>Awaiting input</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                Enter text above or pick an example
              </span>
            </div>
          )}

          {status === 'loading' && (
            <div className="result-loading">
              <div className="loading-pulse">
                <span /><span /><span />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="result-error">
              <span>⚠ Prediction failed</span>
              <p>{errorMsg}</p>
            </div>
          )}

          {status === 'done' && result && (
            <div className="result-content">
              <div className="result-head">
                <div>
                  <div className="result-meta" style={{ marginBottom: 4 }}>Predicted class</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`tag ${LABEL_TAG[result.label] ?? 'tag-teal'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                      {result.label}
                    </span>
                  </div>
                </div>
                {latency !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <div className="result-meta">Latency</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--text)' }}>
                      {latency} ms
                    </div>
                  </div>
                )}
              </div>

              <div className="result-divider" />

              <div>
                <div className="result-section-label">Class confidence</div>
                <ConfidenceBars scores={result.scores} activeLabel={result.label} />
              </div>

              <div>
                <div className="result-section-label">Input encoding</div>
                <TokenPreview entity={entity} text={text} />
              </div>
            </div>
          )}
        </div>

      </section>

      {/* ── API config info ──────────────────────────────────── */}
      <section className="shell">
        <div className="card api-config-card card-sm">
          <div className="api-config-row">
            <span className="api-method">POST</span>
            <span className="api-url">{API_BASE_URL}/predict</span>
            <span className="tag tag-teal" style={{ marginLeft: 'auto' }}>JSON</span>
          </div>
          <p className="api-note">
            Set <code style={{ color: 'var(--teal)' }}>VITE_SENTIMENT_API_URL</code> in your
            {' '}<code style={{ color: 'var(--teal)' }}>.env</code> file (or Vercel env vars) to point
            to your deployed API. The adapter in <code style={{ color: 'var(--text-dim)' }}>src/lib/api.js</code> documents
            the expected request / response shape and how to adjust it for your endpoint.
          </p>
        </div>
      </section>

    </div>
  );
}
