/**
 * Tiny DOM helpers shared by the tool scripts. Tools are plain Astro
 * components + vanilla TypeScript (no UI framework), so every instance on a
 * page is found by `data-tool` and wired up independently.
 */

export function mountAll(tool: string, init: (root: HTMLElement) => void) {
  const run = () =>
    document.querySelectorAll<HTMLElement>(`[data-tool="${tool}"]:not([data-mounted])`).forEach((el) => {
      el.dataset.mounted = 'true';
      init(el);
    });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}

export function ref<T extends HTMLElement = HTMLElement>(root: ParentNode, name: string): T {
  const el = root.querySelector<T>(`[data-ref="${name}"]`);
  if (!el) throw new Error(`Missing [data-ref="${name}"]`);
  return el;
}

export function maybeRef<T extends HTMLElement = HTMLElement>(root: ParentNode, name: string): T | null {
  return root.querySelector<T>(`[data-ref="${name}"]`);
}

/** Wire a RangeField: keeps the filled track + read-out in sync. */
export function bindRange(
  root: ParentNode,
  name: string,
  onChange: (v: number) => void,
  format: (v: number) => string = String,
) {
  const input = ref<HTMLInputElement>(root, name);
  const out = root.querySelector<HTMLElement>(`[data-ref-value="${name}"]`);
  const paint = () => {
    const min = Number(input.min);
    const max = Number(input.max);
    const v = Number(input.value);
    input.style.setProperty('--pct', `${((v - min) / (max - min)) * 100}%`);
    if (out) out.textContent = format(v);
  };
  input.addEventListener('input', () => {
    paint();
    onChange(Number(input.value));
  });
  paint();
  return {
    input,
    set(v: number, emit = false) {
      input.value = String(v);
      paint();
      if (emit) onChange(v);
    },
    get: () => Number(input.value),
  };
}

/** Wire a Segmented control. */
export function bindSegmented(root: ParentNode, name: string, onChange: (v: string) => void) {
  const group = ref(root, name);
  const buttons = () => Array.from(group.querySelectorAll<HTMLButtonElement>('button[data-value]'));
  const select = (v: string) => buttons().forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
  group.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-value]');
    if (!b) return;
    select(b.dataset.value!);
    onChange(b.dataset.value!);
  });
  return { select, get: () => buttons().find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.value };
}

export function setPressed(btn: HTMLElement, on: boolean) {
  btn.setAttribute('aria-pressed', String(on));
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Read a CSS custom property (token) — used by canvas drawing code. */
export function token(name: string, el: Element = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

