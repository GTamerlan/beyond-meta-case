import test from 'node:test';
import assert from 'node:assert/strict';
import {clamp,fitWindow,initialShop,confirmShop,memorySuggestion} from '../src/playground-state.js';

test('window movement and resizing stay inside desktop and phone stages',()=>{
  for(const width of [280,360,700,1060]){
    for(const rect of [
      {x:-40,y:-20,width:400,height:300},
      {x:500,y:600,width:1300,height:1200},
      {x:10,y:20,width:12,height:30},
      {x:20,y:30,width:300,height:230}
    ]){
      const fitted=fitWindow(rect,{width,height:590});
      assert.ok(fitted.x>=0&&fitted.y>=0);
      assert.ok(fitted.x+fitted.width<=width);
      assert.ok(fitted.y+fitted.height<=590);
      assert.ok(fitted.width>=Math.min(220,width)&&fitted.height>=175);
    }
  }
});
test('wrong apple variety does not complete an item',()=>{
  const start={...initialShop(),selected:2},next=confirmShop(start);
  assert.equal(next.step,0);assert.equal(next.completed,0);
  assert.match(next.result,/Gala/);assert.equal(start.result,'');
});
test('replacement requires a separate simulated approval',()=>{
  let state=confirmShop(initialShop());
  assert.equal(state.step,1);assert.equal(state.completed,1);
  state=confirmShop(state);assert.equal(state.step,2);assert.equal(state.completed,1);
  state=confirmShop(state);assert.equal(state.step,3);assert.equal(state.completed,2);
  assert.match(state.result,/simulated/);
});
test('dairy milk is not silently accepted as oat milk',()=>{
  const state=confirmShop({...confirmShop(initialShop()),selected:1});
  assert.equal(state.step,1);assert.equal(state.completed,1);
});
test('customer can reject a replacement or skip the item',()=>{
  const review=confirmShop(confirmShop(initialShop()));
  const reject=confirmShop({...review,selected:1});
  assert.equal(reject.step,1);assert.equal(reject.completed,1);
  const skip=confirmShop({...review,selected:2});
  assert.equal(skip.step,3);assert.equal(skip.completed,2);assert.match(skip.result,/skipped/);
});
test('completed trip cannot create more completed items',()=>{
  const completed={step:3,selected:0,completed:2,result:'done'};
  assert.deepEqual(confirmShop(completed),completed);
});
test('disabled memory never uses the stored preference',()=>{
  const memory={enabled:false,workspace:'Secret preference',reminder:'Private reminder'};
  for(const action of [0,1,2])assert.doesNotMatch(memorySuggestion(memory,action),/Secret|Private/);
});
test('memory is used explicitly and reminder is only a preview',()=>{
  const memory={enabled:true,workspace:'Window seat',reminder:'Pick up groceries'};
  assert.match(memorySuggestion(memory,0),/window seat/);
  assert.match(memorySuggestion(memory,1),/not been scheduled or sent/);
  assert.match(memorySuggestion(memory,2),/Pick up groceries/);
  assert.match(memorySuggestion({enabled:false,workspace:'',reminder:''}),/off/);
});
test('control indices are bounded',()=>{assert.equal(clamp(-1,0,2),0);assert.equal(clamp(4,0,2),2);});
