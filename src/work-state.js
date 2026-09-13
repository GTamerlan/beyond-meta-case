export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(Number(v)) ? Number(v) : min));

export function stageAt(progress, steps) {
  const p = clamp(progress);
  return steps.reduce((active, step, index) => p >= step.progress ? index : active, 0);
}

export function nextProgress(progress, elapsedSeconds, duration = 48) {
  return clamp(clamp(progress) + Math.max(0, elapsedSeconds) / Math.max(1, duration));
}

export function newOrder() {
  return { milk: 'pending', apples: 'pending', replacement: 'none', message: 'Choose a product to try the scan.' };
}

export function scanItem(state, item) {
  if (item === 'oat') return { ...state, milk: 'confirmed', replacement: 'none', message: 'Oat milk matched. Added to this demo order.' };
  if (item === 'dairy') return { ...state, message: 'Different product. Dairy milk is not the requested oat milk. Nothing added.' };
  if (item === 'apples') return { ...state, apples: 'confirmed', message: 'Apples matched. Added to this demo order.' };
  return { ...state };
}

export function requestReplacement(state) {
  if (state.milk !== 'pending') return { ...state, message: 'Milk is already confirmed. Reset the demo to try a replacement.' };
  return { ...state, replacement: 'awaiting', message: 'Proposed replacement: alternate-brand oat milk. Waiting for simulated customer approval; nothing has been changed.' };
}

export function approveReplacement(state) {
  if (state.replacement !== 'awaiting') return { ...state };
  return { ...state, replacement: 'approved', message: 'Simulated customer approval received for alternate-brand oat milk. The worker must still confirm it.' };
}

export function confirmReplacement(state) {
  if (state.replacement !== 'approved') return { ...state };
  return { ...state, replacement: 'confirmed', milk: 'replaced', message: 'Worker confirmed the alternate-brand oat milk. Added to this demo order.' };
}

export function orderCount(state) {
  return Number(state.milk !== 'pending') + Number(state.apples !== 'pending');
}
