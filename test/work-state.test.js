import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, stageAt, nextProgress, newOrder, scanItem, requestReplacement, approveReplacement, confirmReplacement, orderCount } from '../src/work-state.js';

test('progress is bounded and stages follow verified thresholds', () => {
  const steps = [{ progress: 0 }, { progress: .18 }, { progress: .42 }, { progress: 1 }];
  assert.equal(clamp(Infinity), 0);
  assert.equal(clamp(9), 1);
  assert.equal(stageAt(.41, steps), 1);
  assert.equal(stageAt(.42, steps), 2);
  assert.equal(nextProgress(.99, 3), 1);
});
test('wrong variety cannot mark the requested product complete', () => {
  const state = scanItem(newOrder(), 'dairy');
  assert.equal(state.milk, 'pending');
  assert.equal(orderCount(state), 0);
});
test('a substitute requires separate explicit simulated approval', () => {
  let state = approveReplacement(newOrder());
  assert.equal(state.milk, 'pending');
  state = requestReplacement(state);
  assert.equal(state.milk, 'pending');
  assert.equal(state.replacement, 'awaiting');
  state = approveReplacement(state);
  assert.equal(state.milk, 'pending');
  assert.equal(orderCount(state), 0);
  state = confirmReplacement(state);
  assert.equal(state.milk, 'replaced');
  assert.equal(orderCount(state), 1);
});
test('replacement cannot bypass approval or replace an already confirmed item', () => {
  assert.equal(confirmReplacement(newOrder()).milk, 'pending');
  const state = scanItem(newOrder(), 'oat');
  assert.equal(requestReplacement(state).replacement, 'none');
  assert.equal(requestReplacement(state).milk, 'confirmed');
});
test('demo completion is two actual local confirmations, never playback', () => {
  let state = scanItem(newOrder(), 'oat');
  state = scanItem(state, 'apples');
  assert.equal(orderCount(state), 2);
  assert.equal(orderCount(newOrder()), 0);
});
