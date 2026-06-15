import { useEffect, useRef, useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

const CORES = 16 // GPU "workers" that run at once — one row each
const BATCHES = [4, 8, 16, 32, 64, 128, 256]

export function Level10GpuRace({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [batchIdx, setBatchIdx] = useState(4) // -> 64 jobs by default
  const n = BATCHES[batchIdx]

  // A single tick clock drives both: each tick the CPU finishes 1 job, and every
  // GPU worker finishes 1 of its own jobs (so a whole column lights at once).
  const [tick, setTick] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [won, setWon] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const gpuTicks = Math.ceil(n / CORES)
  const speedup = Math.round(n / gpuTicks)
  // How many jobs each worker row holds (round-robin); some sit idle for small batches.
  const counts = Array.from({ length: CORES }, (_, w) => Math.max(0, Math.ceil((n - w) / CORES)))
  const cpuDone = Math.min(tick, n)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const race = () => {
    if (timer.current) clearInterval(timer.current)
    setTick(0)
    setFinished(false)
    setRunning(true)
    let t = 0
    const interval = Math.max(10, Math.min(90, Math.round(2400 / n))) // CPU finishes in ~2.4s
    timer.current = setInterval(() => {
      t += 1
      setTick(t)
      if (t >= n) {
        if (timer.current) clearInterval(timer.current)
        setRunning(false)
        setFinished(true)
        if (n >= CORES && !won) {
          setWon(true)
          onComplete()
        }
      }
    }, interval)
  }

  const changeBatch = (i: number) => {
    if (running) return
    setBatchIdx(i)
    setTick(0)
    setFinished(false)
  }

  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="thinking">
          So I have to do <em>mountains</em> of multiply-adds. The trick to doing them fast isn't a
          cleverer chip — it's a chip with a <strong>huge crowd of simple workers</strong> that all
          work at the same time. That's a <strong>GPU</strong>. 🖥️
        </SparkySays>

        <div className="explain-card">
          <h4>👷 CPU vs GPU: few-fast vs many-simple</h4>
          <p>
            A <strong>CPU</strong> is a few brilliant workers — perfect for one complicated, step-by-step
            job. A <strong>GPU</strong> is thousands of plain workers who can only do simple sums, but
            all at once. My math is the <em>same</em> simple multiply-add repeated billions of times with
            no waiting in line — so a giant crowd crushes it.
          </p>
        </div>

        <div className="explain-card">
          <h4>🏁 Your job</h4>
          <p>
            Give both a batch of identical jobs and hit race. The CPU is one worker doing them
            one-by-one; the GPU is {CORES} workers (one row each) all stepping together. Crank the
            batch up and watch the gap explode.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Start the race! →
        </button>
      </div>
    )
  }

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : running ? 'thinking' : 'happy'} size={72}>
        {won
          ? `🎉 The GPU finished ${speedup}× faster! It's not smarter — each worker is actually simpler. It just runs ${CORES} jobs side-by-side (one per row) while the CPU plods through one at a time.`
          : `Each side has ${n} multiply-add jobs. Hit “Race!” — the CPU does 1 per tick; the GPU's ${CORES} workers each do 1 per tick, so a whole column lights at once.`}
      </SparkySays>

      <div className="mem-controls">
        <label>📦 Batch of jobs: <strong>{n}</strong></label>
        <input
          type="range"
          min={0}
          max={BATCHES.length - 1}
          step={1}
          value={batchIdx}
          onChange={(e) => changeBatch(Number(e.target.value))}
          disabled={running}
        />
        <span className="hint">more jobs → bigger GPU win</span>
      </div>

      <div className="race-row">
        <div className="race-side">
          <div className="race-title">🐢 CPU · 1 worker</div>
          <div className="race-grid">
            {Array.from({ length: n }).map((_, i) => (
              <span key={i} className={'race-cell' + (i < cpuDone ? ' race-cell--done race-cell--cpu' : '')} />
            ))}
          </div>
          <div className="race-stat">{cpuDone} / {n} done · {cpuDone} ticks</div>
        </div>

        <div className="race-side">
          <div className="race-title">⚡ GPU · {CORES} workers (one row each)</div>
          <div className="race-workers">
            {counts.map((c, w) => (
              <div key={w} className="race-worker">
                {c === 0 ? (
                  <span className="race-idle">idle</span>
                ) : (
                  Array.from({ length: c }).map((_, j) => (
                    <span key={j} className={'race-cell' + (j < Math.min(tick, c) ? ' race-cell--done race-cell--gpu' : '')} />
                  ))
                )}
              </div>
            ))}
          </div>
          <div className="race-stat">
            {Math.min(tick * CORES, n)} / {n} done · {Math.min(tick, gpuTicks)} ticks
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={race} disabled={running}>
        {running ? 'Racing…' : '🏁 Race!'}
      </button>

      {finished && (
        <div className={'verdict ' + (won ? 'verdict--win' : '')}>
          <strong>CPU: {n} ticks · GPU: {gpuTicks} ticks → {speedup}× faster.</strong>{' '}
          {n < CORES
            ? `Only ${n} jobs, so just ${n} of the ${CORES} workers had anything to do — try a bigger batch to use them all!`
            : `All ${CORES} workers fired every tick. The GPU's lead maxes out at ${CORES}× here — that's its number of workers. Real GPUs have thousands.`}
        </div>
      )}
    </div>
  )
}
