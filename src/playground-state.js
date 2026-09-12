export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function fitWindow(rect, bounds) {
  const width = clamp(rect.width, Math.min(220, bounds.width), bounds.width);
  const height = clamp(rect.height, Math.min(175, bounds.height), bounds.height);
  return { width, height, x: clamp(rect.x, 0, bounds.width-width), y: clamp(rect.y, 0, bounds.height-height) };
}

export const initialShop = () => ({step:0, selected:0, completed:0, result:''});
export const shopChoices = [
  ['Gala apples', 'Granny Smith apples', 'Fuji apples'],
  ['Unsweetened oat milk', 'Whole dairy milk', 'Skip this item'],
  ['Simulate customer approval', 'Choose a different replacement', 'Skip this item']
];

export function confirmShop(state) {
  const next={...state};
  if(state.step===0) {
    if(state.selected!==0) return {...next,result:'Check the variety: the sample order asks for Gala apples.'};
    return {step:1,selected:0,completed:1,result:'Gala apples confirmed. Next up: an out-of-stock item.'};
  }
  if(state.step===1) {
    if(state.selected===1) return {...next,result:'That is dairy milk, not the requested oat milk. Review the match.'};
    if(state.selected===2) return {step:3,selected:0,completed:2,result:'Trip complete. The unavailable item was skipped; no substitute was added.'};
    return {step:2,selected:0,completed:1,result:'Replacement suggested. Preview the message and wait for customer approval.'};
  }
  if(state.step===2) {
    if(state.selected===1) return {step:1,selected:0,completed:1,result:'Choose another replacement or skip the unavailable item.'};
    return {step:3,selected:0,completed:2,result:state.selected===0?'Customer approval simulated. Replacement confirmed in this demo only.':'Trip complete. The unavailable item was skipped.'};
  }
  return next;
}

export function memorySuggestion(memory, action=0) {
  if(!memory.enabled) return 'Demo memory is off. Turn it on and save preferences to try a personalized suggestion.';
  if(!memory.workspace&&!memory.reminder) return 'Save your demo preferences first, then try a suggestion.';
  if(action===2) return 'You shared: '+(memory.workspace||'no workspace preference')+'; '+(memory.reminder||'no reminder')+'. These values stay in this tab. Clear memory whenever you like.';
  if(action===1) return memory.reminder ? 'Reminder preview: “'+memory.reminder+'”. This has not been scheduled or sent.' : 'No reminder saved. Add one, then save your preferences.';
  return 'Sample suggestion: use the '+(memory.workspace||'quiet lounge').toLowerCase()+' for your next work session. Would you like to open a sample workspace?';
}
