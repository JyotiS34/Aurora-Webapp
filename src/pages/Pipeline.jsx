import AuroraField   from '../components/AuroraField';
import ArchDiagram   from '../components/ArchDiagram';
import FailureModes  from '../components/FailureModes';
import { rank0Util, rank1Util } from '../lib/sampleData';

const STACK = [
  { label: 'Model',        value: 'Custom TransformerClassifier' },
  { label: 'DDP',          value: 'torch.nn.parallel.DistributedDataParallel' },
  { label: 'Precision',    value: 'AMP (torch.cuda.amp) — float16 forward, float32 master weights' },
  { label: 'Sampler',      value: 'DistributedSampler with set_epoch() per epoch' },
  { label: 'Profiler',     value: 'torch.profiler with Chrome trace export' },
  { label: 'Launch',       value: 'torch.multiprocessing.spawn — 2 worker processes' },
  { label: 'Collective',   value: 'NCCL backend (all_reduce for gradient sync)' },
  { label: 'GPUs',         value: '2 × NVIDIA T4 16GB (Google Colab Pro+)' },
];

export default function Pipeline() {
  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────── */}
      <section className="shell">
        <div className="eyebrow">PyTorch DDP · 2 × T4 · AMP · torch.profiler</div>
        <h1>Distributed training pipeline</h1>
        <p className="lede">
          A hand-written distributed training loop — no Trainer API — built
          to understand what happens under the hood when two GPUs share the
          work of fine-tuning a 110M-parameter transformer.
        </p>
      </section>

      {/* ── System stack ────────────────────────────────────── */}
      <section className="section shell">
        <div className="section-head">
          <h2>System stack</h2>
        </div>
        <div className="spec-grid">
          {STACK.map(s => (
            <div className="spec-item" key={s.label}>
              <div className="spec-label">{s.label}</div>
              <div className="spec-value" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture diagram ─────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>How the two ranks interact</h2>
          <p>
            Each rank gets a non-overlapping shard of the training data via
            DistributedSampler. After each backward pass, NCCL all_reduce
            averages the gradients across both GPUs before the optimizer step.
          </p>
        </div>
        <ArchDiagram />
      </section>

      {/* ── GPU utilisation ──────────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>GPU utilisation · compute vs sync cycle</h2>
          <p>
            The periodic dips are the all_reduce synchronisation windows —
            both ranks stall at the collective op until gradients are averaged.
            Profiling with torch.profiler confirmed the dips take ~12% of
            total step time on a 2-GPU T4 setup.
          </p>
        </div>
        <div className="gpu-util-grid">
          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--teal)', letterSpacing: '0.08em', marginBottom: 8 }}>
              RANK 0 · GPU 0
            </div>
            <AuroraField
              series={[{ data: rank0Util, color: '#36E2C5' }]}
              height={90}
              animated
              showAxes
            />
          </div>
          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#8B7CFF', letterSpacing: '0.08em', marginBottom: 8 }}>
              RANK 1 · GPU 1
            </div>
            <AuroraField
              series={[{ data: rank1Util, color: '#8B7CFF' }]}
              height={90}
              animated
              showAxes
            />
          </div>
        </div>
        <div className="aurora-legend" style={{ marginTop: 12 }}>
          <div className="aurora-legend-item">
            <span className="aurora-swatch" style={{ background: '#36E2C5' }} />
            Compute (forward + backward)
          </div>
          <div className="aurora-legend-item">
            <span className="aurora-swatch" style={{ background: '#4A5568', opacity: 0.8 }} />
            NCCL all_reduce sync (valleys)
          </div>
        </div>
      </section>

      {/* ── Failure modes ────────────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>Failure modes</h2>
          <p>
            Three bugs encountered during the training run — each with a
            distinctive symptom, a non-obvious root cause, and a concrete fix.
          </p>
        </div>
        <div className="card">
          <FailureModes />
        </div>
      </section>

      {/* ── NCCL hang story ──────────────────────────────────── */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>Debugging the NCCL hang</h2>
          <p>The hardest bug — and the most instructive.</p>
        </div>

        <div className="hang-story">
          <p>
            Partway through a training run, the process would simply freeze — both ranks
            stalled indefinitely with no error message. Standard keyboard interrupt couldn't
            kill it cleanly. The symptom: one rank had encountered an exception (a shape
            mismatch from a corrupt batch) while the other rank was blocked inside
            <code style={{ color: 'var(--violet)', margin: '0 4px' }}>dist.all_reduce()</code>
            waiting for a gradient tensor that would never arrive. NCCL hangs silently in
            this situation by design — there is no built-in timeout.
          </p>

          <p>
            The fix was a cooperative stop signal: broadcast a boolean tensor across ranks
            at the start of each step. If any rank sets it to 1 (signalling an error), all
            ranks exit the training loop together before entering the collective op.
          </p>

          <pre className="code-block">{`# Broadcast a stop signal before the forward pass
stop = torch.zeros(1, device=device)
if error_encountered:
    stop.fill_(1)
dist.all_reduce(stop, op=dist.ReduceOp.MAX)
if stop.item() > 0:
    break  # all ranks exit cleanly`}</pre>

          <div className="hang-story-fixes">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Other bugs fixed in the same session
            </p>
            {[
              {
                issue: 'NameError on rank >0',
                detail: 'The training function referenced a variable defined only in the __main__ guard. mp.spawn passes each worker a rank integer, not the full parent namespace. Fix: pass all required arguments explicitly through the args tuple.',
              },
              {
                issue: 'mp.spawn without __main__ guard',
                detail: 'On Windows and some Linux configs, mp.spawn forks the entire module. Without if __name__ == "__main__":, spawned workers re-execute the spawn call recursively. Fix: wrap the entry point.',
              },
              {
                issue: 'dist.barrier() placement',
                detail: 'Calling dist.barrier() inside the eval loop (rather than after it) caused rank 1 to occasionally skip the checkpoint save because rank 0 had already passed the barrier. Fix: move barrier to after the entire eval block.',
              },
            ].map(f => (
              <div className="fix-item" key={f.issue}>
                <span className="fix-bullet" />
                <div>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text)' }}>
                    {f.issue}
                  </strong>
                  <p>{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
