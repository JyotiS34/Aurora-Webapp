import AuroraField  from '../components/AuroraField';
import TokenPreview from '../components/TokenPreview';
import {
  phase1Loss, phase1Acc,
  phase2Loss, phase2Acc,
} from '../lib/sampleData';

const DATASETS = [
  {
    name:  'Twitter Sentiment Corpus',
    desc:  'Short-form opinionated text; entity mentions are natural and noisy. Covers consumer electronics, services, public figures.',
    bar:   0.45,
    color: '#36E2C5',
    size:  '~45K pairs',
  },
  {
    name:  'Amazon Reviews 2023',
    desc:  'Long-form product reviews from McAuley Lab. Entity = product feature extracted from review metadata. High class diversity.',
    bar:   0.38,
    color: '#8B7CFF',
    size:  '~38K pairs',
  },
  {
    name:  'Custom synthetic',
    desc:  'Added synthetic entity-sentiment pairs to oversample the underrepresented Irrelevant class and balance the final label distribution.',
    bar:   0.17,
    color: '#F5B86B',
    size:  '~17K pairs',
  },
];

const RESULTS = [
  { val: '83.35%', label: 'Test accuracy' },
  { val: '0.82',  label: 'Macro F1' },
  { val: '4',     label: 'Classes' },
  { val: '~100K', label: 'Training pairs' },
];

const ITERATIONS = [
  {
    marker: 'v0.1',
    title:  'Financial tweet sentiment (3-class)',
    body:   'Started with standard POS/NEG/NEU on financial tweets. No entity conditioning. Reached 74% accuracy but the task was too narrow — the model had no way to distinguish mixed-signal sentences where the entity mattered.',
  },
  {
    marker: 'v0.2',
    title:  '50K synthetic dataset — abandoned',
    body:   'Generated a large synthetic dataset to bootstrap entity-aware training. Accuracy looked strong in eval (~83%) but the model failed on real-world text, particularly sarcasm and implicit sentiment. Synthetic data lacked distributional noise.',
  },
  {
    marker: 'v0.3',
    title:  'BERT vs RoBERTa comparison (Colab)',
    body:   'Ran identical fine-tuning experiments on both BERT-base and RoBERTa-base. RoBERTa converged slightly faster in Phase 1 but both reached similar final accuracy. Chose BERT-base for simpler tokenizer compatibility with the two-segment input format.',
  },
  {
    marker: 'v1.0',
    title:  'Two-phase transfer learning + DDP pipeline',
    body:   'Blended real Twitter/Amazon data with targeted synthetic examples for Irrelevant class balance. Added two-phase training (frozen → partial unfreeze) and moved training to a 2×T4 DDP setup. Final test accuracy: 83.35%.',
  },
];

export default function Training() {
  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────── */}
      <section className="shell">
        <div className="eyebrow">BERT fine-tuning · two-phase transfer learning</div>
        <h1>How the model learned</h1>
        <p className="lede">
          A 4-class entity-aware sentiment classifier built on BERT-base-uncased,
          trained in two deliberate phases on a blended dataset of ~100K pairs.
          Here is the full training story — including what didn't work.
        </p>
      </section>

      {/* ── Input format ────────────────────────────────────── */}
      <section className="section shell">
        <div className="section-head">
          <h2>Input format</h2>
          <p>
            The model conditions sentiment on a specific entity by encoding
            entity and text as two separate BERT segments.
          </p>
        </div>
        <TokenPreview
          entity="battery life"
          text="The battery life on this phone is incredible, it easily lasts two full days."
        />
        <div className="card card-sm" style={{ marginTop: 16, borderColor: 'var(--teal-border)', background: 'var(--teal-glow)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
            <strong style={{ color: 'var(--text)' }}>Why two segments?</strong> Standard BERT
            sentiment treats the full sentence as a single sequence. By placing the entity in Segment A
            and the sentence in Segment B, the cross-attention layers can learn segment-conditioned
            representations — meaning the same sentence yields different predictions for different
            target entities. This maps directly to the two-segment input format BERT was pre-trained on
            (NSP task), so the positional and segment embeddings are already warm-started.
          </p>
        </div>
      </section>

      {/* ── Training data ───────────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>Training data</h2>
          <p>Three sources blended to cover real-world entity-sentiment diversity.</p>
        </div>
        <div className="dataset-cards">
          {DATASETS.map(d => (
            <div className="dataset-card" key={d.name}>
              <div>
                <div className="dataset-name">{d.name}</div>
                <div className="dataset-desc">{d.desc}</div>
              </div>
              <div className="dataset-bar-wrap">
                <div
                  className="dataset-bar"
                  style={{ width: `${d.bar * 100}%`, background: d.color }}
                />
              </div>
              <div className="dataset-size">{d.size}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two phases ──────────────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>Two-phase training</h2>
          <p>
            Transfer learning in two deliberate stages — faster convergence in Phase 1,
            careful fine-tuning in Phase 2.
          </p>
        </div>
        <div className="phase-grid">

          {/* Phase 1 */}
          <div className="card phase-card">
            <div className="phase-num">Phase 01</div>
            <h3>Frozen encoder · train the head</h3>
            <p>
              All BERT encoder weights are frozen. Only the classification head
              (a two-layer MLP on the [CLS] token) is trained. This lets the
              head learn to read BERT's representations before any encoder
              weights change — avoiding catastrophic interference with the
              pre-trained features.
            </p>
            <div className="phase-config">
              <div className="phase-config-row"><span>Trainable params</span><span>Classifier head only</span></div>
              <div className="phase-config-row"><span>Learning rate</span><span>2e-5</span></div>
              <div className="phase-config-row"><span>Epochs</span><span>5</span></div>
              <div className="phase-config-row"><span>Scheduler</span><span>Linear warm-up</span></div>
            </div>
            <AuroraField
              series={[
                { data: phase1Loss, color: '#FF6F9C', label: 'Loss' },
                { data: phase1Acc,  color: '#36E2C5', label: 'Accuracy' },
              ]}
              height={100}
              animated
              showAxes
            />
            <div className="aurora-legend">
              <div className="aurora-legend-item"><span className="aurora-swatch" style={{ background: '#FF6F9C' }} />Loss</div>
              <div className="aurora-legend-item"><span className="aurora-swatch" style={{ background: '#36E2C5' }} />Accuracy</div>
            </div>
            <div className="phase-result">
              End of Phase 1: <strong>~71% validation accuracy</strong>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="card phase-card">
            <div className="phase-num">Phase 02</div>
            <h3>Unfreeze top 4 layers · fine-tune</h3>
            <p>
              The top 4 encoder transformer blocks are unfrozen while the
              bottom 8 layers stay frozen. A much lower learning rate prevents
              destroying the general linguistic features in the lower layers
              while allowing the upper layers to specialise for the entity
              sentiment task.
            </p>
            <div className="phase-config">
              <div className="phase-config-row"><span>Trainable params</span><span>Top 4 encoder layers + head</span></div>
              <div className="phase-config-row"><span>Learning rate</span><span>1e-5</span></div>
              <div className="phase-config-row"><span>Epochs</span><span>7</span></div>
              <div className="phase-config-row"><span>Grad clip</span><span>max_norm = 1.0</span></div>
            </div>
            <AuroraField
              series={[
                { data: phase2Loss, color: '#FF6F9C', label: 'Loss' },
                { data: phase2Acc,  color: '#8B7CFF', label: 'Accuracy' },
              ]}
              height={100}
              animated
              showAxes
            />
            <div className="aurora-legend">
              <div className="aurora-legend-item"><span className="aurora-swatch" style={{ background: '#FF6F9C' }} />Loss</div>
              <div className="aurora-legend-item"><span className="aurora-swatch" style={{ background: '#8B7CFF' }} />Accuracy</div>
            </div>
            <div className="phase-result">
              End of Phase 2: <strong>83.35% test accuracy</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ─────────────────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>Final results</h2>
        </div>
        <div className="results-grid">
          {RESULTS.map(r => (
            <div className="result-metric" key={r.label}>
              <div className="result-metric-val">{r.val}</div>
              <div className="result-metric-label">{r.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Iterations ──────────────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>How we got here</h2>
          <p>Earlier experiments, dead ends, and the lessons they taught.</p>
        </div>
        <div className="timeline">
          {ITERATIONS.map(it => (
            <div className="timeline-item" key={it.marker}>
              <div className="timeline-marker">{it.marker}</div>
              <div className="timeline-content">
                <h4>{it.title}</h4>
                <p>{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
