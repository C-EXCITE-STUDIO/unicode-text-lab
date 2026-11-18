import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../web/js/engine.js';

test('逐字映射保留未支援的中文與 emoji', () => {
  const engine = createEngine([{id:'test:bold',steps:[{op:'map',table:{A:'𝐀',b:'𝐛'}}]}]);
  assert.equal(engine.transform('test:bold','Ab 探激 👍🏽'),'𝐀𝐛 探激 👍🏽');
});
