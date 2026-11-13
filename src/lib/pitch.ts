/**
 * Monophonic pitch detection (YIN-style difference function with
 * parabolic interpolation). Good for a flute, which has a strong,
 * clean fundamental.
 */
export function detectPitch(buf: Float32Array, sampleRate: number, minHz = 80, maxHz = 2200): number | null {
  // Bail out on silence
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.008) return null;

  const maxLag = Math.min(Math.floor(sampleRate / minHz), Math.floor(buf.length / 2));
  const minLag = Math.floor(sampleRate / maxHz);
  const n = buf.length - maxLag;
  const d = new Float32Array(maxLag + 1);

  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const diff = buf[i] - buf[i + lag];
      sum += diff * diff;
    }
    d[lag] = sum;
  }
  // cumulative mean normalised difference
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    running += d[lag];
    cmnd[lag] = (d[lag] * lag) / (running || 1);
  }

  const threshold = 0.12;
  let tau = -1;
  for (let lag = Math.max(2, minLag); lag < maxLag; lag++) {
    if (cmnd[lag] < threshold) {
      while (lag + 1 < maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
      tau = lag;
      break;
    }
  }
  if (tau === -1) return null;

  // parabolic interpolation for sub-sample accuracy
  const x0 = tau > 1 ? cmnd[tau - 1] : cmnd[tau];
  const x2 = tau + 1 <= maxLag ? cmnd[tau + 1] : cmnd[tau];
  const denom = 2 * (2 * cmnd[tau] - x2 - x0);
  const better = denom !== 0 ? tau + (x2 - x0) / denom : tau;
  return sampleRate / better;
}

/** Convert a frequency to semitones (float) above Sa. */
export function semisFromSa(hz: number, saHz: number): number {
  return 12 * Math.log2(hz / saHz);
}
