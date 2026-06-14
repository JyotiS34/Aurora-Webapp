import { Link } from 'react-router-dom';
import AuroraField from '../components/AuroraField';
import { heroLoss, heroAcc } from '../lib/sampleData';

const HERO_SERIES = [
  { data: heroLoss, color: '#36E2C5', label: 'Loss' },
  { data: heroAcc,  color: '#8B7CFF', label: 'Accuracy' },
];

const SPECS = [
  { label: 'Base model',      value: 'BERT-base-uncased' },
  { label: 'Classes',         value: 'Positive · Negative · Neutral · Irrelevant' },
  { label: 'Input format',    value: '[CLS] entity [SEP] text [SEP]' },
  { label: 'Parameters',      value: '~110M (base) + classifier head' },
  { label: 'Training phases', value: '2 (frozen encoder → partial unfreeze)' },
  { label: 'Test accuracy',   value: '83.35%' },
  { label: 'GPUs (DDP)',      value: '2 × NVIDIA T4 16GB' },
  { label: 'Framework',       value: 'PyTorch · HuggingFace Transformers' },
];

export default function Home() {
  return (
    <div className="page">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero shell">
        <div className="hero-eyebrow-row">
          <span className="eyebrow" style={{ marginBottom: 0 }}>
            Entity-aware sentiment · live BERT classifier
          </span>
          <span className="tag tag-teal">4-class</span>
        </div>

        <h1>
          One model, two stories:<br />
          what it predicts and how it learned.
        </h1>

        <p className="lede hero-lede">
          An entity-aware BERT classifier fine-tuned in two phases — plus the
          distributed training pipeline built to scale it across GPUs. Explore
          the live demo, the training run, and the systems underneath.
        </p>

        <div className="hero-actions">
          <Link to="/demo" className="btn btn-primary">Try the live demo →</Link>
          <Link to="/training" className="btn btn-ghost">See the training run</Link>
        </div>

        <div className="hero-aurora-card">
          <div className="hero-aurora-head">
            <span className="hero-aurora-title">Training run · 60 epochs · both phases</span>
          </div>
          <AuroraField series={HERO_SERIES} height={140} animated showAxes />
          <div className="aurora-legend" style={{ marginTop: 12 }}>
            <div className="aurora-legend-item">
              <span className="aurora-swatch" style={{ background: '#36E2C5' }} />
              Cross-entropy loss
            </div>
            <div className="aurora-legend-item">
              <span className="aurora-swatch" style={{ background: '#8B7CFF' }} />
              Validation accuracy
            </div>
          </div>
        </div>
      </section>

      {/* ── Three path cards ──────────────────────────────── */}
      <section className="section shell">
        <div className="section-head">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--text-faint)', marginBottom: 6 }}>
            Three sections
          </p>
          <h2>Pick your entry point</h2>
        </div>

        <div className="grid-3">
          <Link to="/demo" className="path-card">
            <div className="path-card-stat">
              <span className="tag tag-teal">Live · /predict</span>
            </div>
            <h3>Run the model</h3>
            <p>
              Send any sentence and a target entity to the deployed BERT
              classifier. See confidence scores across all four classes in real time.
            </p>
            <span className="path-card-cta">Open Demo →</span>
            <div className="path-card-aurora">
              <AuroraField
                series={[{ data: heroAcc.slice(40), color: '#36E2C5' }]}
                height={56}
                animated
                padding={0}
              />
            </div>
          </Link>

          <Link to="/training" className="path-card">
            <div className="path-card-stat">
              <div className="stat-num">83.35%</div>
              <div className="stat-label">test accuracy</div>
            </div>
            <h3>Two-phase fine-tuning</h3>
            <p>
              How a frozen-encoder Phase 1 and a selective-unfreeze Phase 2
              took BERT-base from 55.07% to 83.35% on 4-class entity sentiment.
            </p>
            <span className="path-card-cta">See Training →</span>
            <div className="path-card-aurora">
              <AuroraField
                series={[
                  { data: heroLoss.slice(40), color: '#FF6F9C' },
                  { data: heroAcc.slice(40),  color: '#8B7CFF' },
                ]}
                height={56}
                animated
                padding={0}
              />
            </div>
          </Link>

          <Link to="/pipeline" className="path-card">
            <div className="path-card-stat">
              <div className="stat-num">2× T4</div>
              <div className="stat-label">PyTorch DDP</div>
            </div>
            <h3>Distributed pipeline</h3>
            <p>
              Custom TransformerClassifier, DistributedSampler, AMP autocast,
              torch.profiler — and three failure modes debugged in production.
            </p>
            <span className="path-card-cta">See Pipeline →</span>
            <div className="path-card-aurora">
              <AuroraField
                series={[{ data: heroLoss.slice(20, 50), color: '#F5B86B' }]}
                height={56}
                animated
                padding={0}
              />
            </div>
          </Link>
        </div>
      </section>

      {/* ── Model spec ────────────────────────────────────── */}
      <section className="section shell">
        <div className="section-head">
          <h2>Model at a glance</h2>
          <p>Key architecture and training parameters.</p>
        </div>
        <div className="spec-grid">
          {SPECS.map(s => (
            <div className="spec-item" key={s.label}>
              <div className="spec-label">{s.label}</div>
              <div className="spec-value">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="footer shell">
        <div className="footer-row">
          <span className="footer-copy">
            Jyotirmoy · ML Portfolio
          </span>
          <div className="footer-links">
            <a
              href="https://github.com/JyotiS34"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
            <a
              href="https://www.kaggle.com/jyotirmoy32"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Kaggle
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
