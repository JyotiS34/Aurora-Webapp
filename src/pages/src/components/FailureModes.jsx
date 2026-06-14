import { useState } from 'react';

const MODES = [
  {
    id:      'gradient',
    label:   'Gradient explosion',
    tag:     'tag-amber',
    symptom: 'Loss spikes to NaN or inf after the first few steps of Phase 2 when the encoder layers are unfrozen. The model never recovers — subsequent batches all produce NaN.',
    cause:   'No gradient clipping was applied while using a learning rate tuned for the frozen-encoder phase. Unfreezing the top-4 encoder layers raises the effective parameter count significantly; without clipping, a single bad batch can produce arbitrarily large gradients that overflow float16 under AMP.',
    fix: `# After loss.backward(), clip before optimizer step
torch.nn.utils.clip_grad_norm_(
    model.parameters(), max_norm=1.0
)
optimizer.step()`,
    note:    'Also reduce the Phase 2 learning rate by ~5× relative to Phase 1. A typical setup: Phase 1 lr=2e-4, Phase 2 lr=3e-5 with warm-up.',
  },
  {
    id:      'oom',
    label:   'OOM on rank 1',
    tag:     'tag-rose',
    symptom: 'CUDA out of memory on rank 1 partway through training — not at step 0. Rank 0 may continue briefly before the all_reduce hangs.',
    cause:   'AMP\'s gradient scaler keeps a loss-scale buffer that can grow over iterations. Combined with an aggressive per-GPU batch size (32) on a T4 with 16 GB, the cumulative activation cache on rank 1 exceeded available memory around step ~80.',
    fix: `# Halve per-GPU batch, compensate with grad accumulation
BATCH_SIZE = 16          # was 32
ACCUM_STEPS = 2          # effective batch = 32

# Inside the training loop:
if (step + 1) % ACCUM_STEPS == 0:
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad()`,
    note:    'torch.cuda.empty_cache() can free fragmented memory between phases, though it does not help if the batch itself is simply too large.',
  },
  {
    id:      'sampler',
    label:   'Stuck shuffle',
    tag:     'tag-violet',
    symptom: 'Validation accuracy plateaus from epoch 2 onwards despite training loss continuing to fall — a classic overfitting signature. But the model was not actually overfitting: each GPU was seeing the same data ordering every epoch because the sampler was never re-seeded.',
    cause:   'DistributedSampler shuffles data based on epoch + seed. If sampler.set_epoch(epoch) is not called, the seed stays fixed at 0 and every epoch produces identical shard assignments. The model appears to train but is memorizing one fixed ordering rather than generalising.',
    fix: `# At the START of each epoch loop — not after:
for epoch in range(num_epochs):
    train_sampler.set_epoch(epoch)   # ← critical
    for batch in train_loader:
        ...`,
    note:    'This is easy to miss because PyTorch does not warn about it. The symptom looks like overfitting but the training set loss does not saturate — the giveaway.',
  },
];

export default function FailureModes() {
  const [active, setActive] = useState('gradient');
  const mode = MODES.find(m => m.id === active);

  return (
    <div>
      {/* Tabs */}
      <div className="failure-tabs" role="tablist">
        {MODES.map(m => (
          <button
            key={m.id}
            role="tab"
            aria-selected={active === m.id}
            className={`failure-tab ${active === m.id ? 'active' : ''}`}
            onClick={() => setActive(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div role="tabpanel" className="failure-content">
        <div className="failure-section">
          <div className="failure-section-label">Symptom</div>
          <span className={`tag ${mode.tag}`} style={{ marginBottom: 12, display: 'inline-flex' }}>
            {mode.label}
          </span>
          <p>{mode.symptom}</p>
        </div>

        <div className="failure-section">
          <div className="failure-section-label">Root cause</div>
          <p>{mode.cause}</p>
        </div>

        <div className="failure-section">
          <div className="failure-section-label">Fix</div>
          <pre className="code-block">{mode.fix}</pre>
          {mode.note && (
            <p style={{ marginTop: 10, fontSize: '0.82rem' }}>{mode.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
