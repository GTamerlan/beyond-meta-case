import {clamp,fitWindow,initialShop,shopChoices,confirmShop,memorySuggestion} from './playground-state.js';

const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
export const playgroundMarkup = `
<section class="playground section" id="playground" aria-labelledby="playground-title">
  <div class="playground-heading"><div><span class="eyebrow">THE IDEA, IN YOUR HANDS</span><h2 id="playground-title">Less watching.<br><em>More “what if?”</em></h2></div><p>Move a screen. Pick an item.<br>Make the interface work for you.</p></div>
  <div class="play-tabs" role="tablist" aria-label="Interactive concepts">
    <button id="play-tab-workspace" role="tab" aria-selected="true" aria-controls="play-workspace" data-play-tab="workspace">${icon('monitor')}<span>Make space</span></button>
    <button id="play-tab-shopper" role="tab" aria-selected="false" aria-controls="play-shopper" data-play-tab="shopper" tabindex="-1">${icon('shopping-bag')}<span>Try a shift</span></button>
    <button id="play-tab-assistant" role="tab" aria-selected="false" aria-controls="play-assistant" data-play-tab="assistant" tabindex="-1">${icon('sparkles')}<span>Make it personal</span></button>
  </div>
  <div class="play-shell">
    <section class="play-panel work-play" id="play-workspace" role="tabpanel" aria-labelledby="play-tab-workspace">
      <div class="work-tools"><div><strong>Your space. Your arrangement.</strong><span id="workspace-help">Drag a title bar. Pull a corner. Or use the controls below.</span></div><button id="reset-workspace" class="quiet-control">Reset layout ↺</button></div>
      <div class="desktop-stage" id="desktop-stage">
        <img class="desktop-environment" src="./workspace.jpg" alt="Illustrative sunlit workspace" width="1672" height="941" loading="lazy"/>
        <div class="desktop-tint"></div>
        <article class="desk-window active" data-desk-window="0">
          <button class="window-grip" aria-label="Move project notes window" aria-describedby="workspace-keyboard">${icon('layers')} Project notes <span>⠿</span></button>
          <div class="window-content"><span class="small-label">THE BIG IDEA</span><h3>What if your desk<br>came with you?</h3><p>Keep the research beside the idea. Give the idea room to grow.</p><button class="sample-brief-toggle" aria-expanded="false">Open sample brief +</button><div class="sample-brief" hidden><strong>Sample project brief</strong><p>Test whether hands-free item guidance reduces interruptions for frequent grocery shoppers. Compare against phone-based work. Measure errors and voluntary reuse—not just excitement.</p></div></div>
          <button class="window-resize" aria-label="Resize project notes window" aria-describedby="workspace-keyboard">↘</button>
        </article>
        <article class="desk-window" data-desk-window="1">
          <button class="window-grip" aria-label="Move reference window" aria-describedby="workspace-keyboard">${icon('eye')} A little perspective <span>⠿</span></button>
          <div class="window-content reference-content"><img src="./life.jpg" alt="Sample visual reference of a family in a park" width="1672" height="941" loading="lazy"/><strong>Keep the world in view.</strong><p>Useful information. Space for everything else.</p></div>
          <button class="window-resize" aria-label="Resize reference window" aria-describedby="workspace-keyboard">↘</button>
        </article>
        <article class="desk-window" data-desk-window="2" hidden>
          <button class="window-grip" aria-label="Move idea window" aria-describedby="workspace-keyboard">${icon('sparkles')} Your next idea <span>⠿</span></button>
          <div class="window-content"><label class="small-label" for="scratch-idea">A LITTLE ROOM TO THINK</label><textarea id="scratch-idea" maxlength="400" placeholder="What would you do with a bigger canvas?"></textarea><small>Sample scratchpad · stays in this tab</small></div>
          <button class="window-resize" aria-label="Resize idea window" aria-describedby="workspace-keyboard">↘</button>
        </article>
        <span class="stage-caption">INTERACTIVE CONCEPT · SAMPLE DOCUMENTS</span>
      </div>
      <div class="workspace-controls"><div class="window-picker" role="group" aria-label="Choose a window"><button data-select-window="0" aria-pressed="true">Notes</button><button data-select-window="1" aria-pressed="false">Reference</button><button data-select-window="2" aria-pressed="false">+ Idea</button></div><div class="window-actions"><button id="window-smaller" aria-label="Make selected window smaller">−</button><button id="window-larger" aria-label="Make selected window larger">+</button><button id="window-focus" aria-pressed="false">Focus</button></div></div>
      <p id="workspace-keyboard" class="play-help">Keyboard: select a title bar and use arrow keys to move; select its corner and use arrow keys to resize.</p>
    </section>
    <section class="play-panel shop-play" id="play-shopper" role="tabpanel" aria-labelledby="play-tab-shopper" hidden>
      <div class="shop-scene"><img src="./grocery.jpg" alt="Sample grocery aisle for the shopping interaction" width="1672" height="941" loading="lazy"/><div class="shop-tint"></div><div class="shop-heading"><span class="scene-eyebrow">SAMPLE GROCERY TRIP</span><h3>Both hands on<br>the job.</h3></div><div class="shop-instruction"><span id="shop-location">SAMPLE STORE · PRODUCE</span><strong id="shop-task">Find Gala apples.</strong><p id="shop-context">Point to a choice, then confirm with the ring or button.</p><div class="trip-progress" aria-label="Demo items completed"><span id="trip-count">0 / 2</span><div><span id="trip-fill"></span></div></div></div><span class="stage-caption">NO ORDER, BARCODE, OR RETAILER CONNECTION</span></div>
      <div class="shop-console"><div class="shop-console-heading"><span class="small-label">LOOK TO CHOOSE. CLICK TO CONFIRM.</span><button id="reset-trip" class="quiet-control">Restart trip ↺</button></div><div id="shop-choices" class="shop-choices" role="group" aria-label="Sample shopping choices"></div><div id="shop-message" class="shop-message" hidden><span class="small-label">MESSAGE PREVIEW · NOT SENT</span><p>“The original oat milk is unavailable. Would you like unsweetened oat milk instead?”</p></div><button id="shop-confirm" class="play-primary">Confirm selection ${icon('check')}</button></div>
    </section>
    <section class="play-panel assistant-play" id="play-assistant" role="tabpanel" aria-labelledby="play-tab-assistant" hidden>
      <div class="memory-copy"><span class="small-label">PERSONAL, ON YOUR TERMS</span><h3>A little context.<br>A more useful day.</h3><p>This is a rule-based preview, not a live AI service. Try sharing a preference, see a sample suggestion, then clear it.</p><label class="memory-switch"><input type="checkbox" id="memory-enabled"/><span>Use preferences in this demo</span></label><div class="memory-fields"><label for="memory-workspace">Where would you like to work?</label><select id="memory-workspace" disabled><option>Quiet lounge</option><option>Window seat</option><option>Shared studio</option></select><label for="memory-reminder">A sample reminder</label><input id="memory-reminder" type="text" maxlength="80" placeholder="Pick up groceries after work" disabled autocomplete="off"/></div><div class="memory-buttons"><button id="memory-save" class="play-primary" disabled>Save demo preferences</button><button id="memory-clear" class="quiet-control">Clear memory</button></div><small>Kept only in this tab. No account, network request, or recording.</small></div>
      <div class="assistant-result"><div class="assistant-light" aria-hidden="true"></div><span class="small-label">SAMPLE ASSISTANT</span><h3>Help that waits<br>for your say-so.</h3><p id="memory-response">Demo memory is off. Nothing is being remembered.</p><div class="assistant-actions" role="group" aria-label="Try a sample suggestion"><button data-memory-action="0">Suggest workspace ↗</button><button data-memory-action="1">Preview reminder ↗</button><button data-memory-action="2">Review memory ↗</button></div><span class="memory-state" id="memory-state">MEMORY OFF</span></div>
    </section>
    <div class="ring-console"><div class="ring-product"><button class="ring-trigger" id="ring-confirm" aria-label="Simulate a ring click to confirm the highlighted action"><canvas id="ring-canvas" aria-hidden="true"></canvas><span class="ring-fallback" aria-hidden="true">${icon('circle-dot')}</span></button><span>Click the ring</span></div><div class="ring-instructions"><span class="small-label">OPTIONAL RING · SIMULATED INPUT</span><strong id="ring-selection">Project notes</strong><p>Thumb-scroll to highlight. Click to confirm.</p><div class="ring-scroll"><button id="ring-previous" aria-label="Previous ring choice">−</button><input id="ring-scroll" type="range" min="0" max="2" step="1" value="0" aria-label="Simulate ring thumb-scroll to select an action"/><button id="ring-next" aria-label="Next ring choice">+</button></div></div><div class="ring-outcome"><span class="small-label">YOUR ACTION</span><p id="play-status" role="status" aria-live="polite">Try moving a window, or click the ring to focus the notes.</p></div></div>
  </div>
  <p class="play-disclaimer">Interactive concepts, not shipping features or measured performance. Pointer input stands in for gaze; no camera, microphone, Bluetooth, or eye tracking is used.</p>
</section>`;

export function initPlayground() {
  const $=(selector)=>document.querySelector(selector);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const stage=$('#desktop-stage'), windows=[...document.querySelectorAll('[data-desk-window]')];
  let mode='workspace', selectedWindow=0, focus=false, shop=initialShop(), ringIndex=0;
  let memory={enabled:false,workspace:'',reminder:''}, stack=3;
  $('#memory-response').insertAdjacentHTML('afterend','<button id="assistant-open-workspace" class="play-primary" hidden>Open sample workspace ↗</button>');
  const status=(message)=>{$('#play-status').textContent=message;};
  function acknowledge() {
    if(!reduced.matches) $('#ring-confirm').animate([{scale:1},{scale:.92},{scale:1}],{duration:380,easing:'ease-out'});
  }
  function bounds(){return {width:stage.clientWidth,height:stage.clientHeight};}
  function rectOf(el){return {x:el.offsetLeft,y:el.offsetTop,width:el.offsetWidth,height:el.offsetHeight};}
  function place(el,rect){const r=fitWindow(rect,bounds());Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});}
  function resetWorkspace(){
    const b=bounds(), narrow=b.width<560;
    windows.forEach((el,n)=>{
      el.hidden=n===2;
      const widths=narrow?[b.width*.87,b.width*.74,b.width*.84]:[b.width*.45,b.width*.32,b.width*.38];
      const xs=narrow?[b.width*.055,b.width*.19,b.width*.08]:[b.width*.075,b.width*.6,b.width*.29];
      const ys=narrow?[45,295,120]:[90,150,115];
      place(el,{x:xs[n],y:ys[n],width:widths[n],height:n===0?290:n===1?250:260});
      el.style.zIndex=String(n+2);
    });
    focus=false; $('#window-focus').setAttribute('aria-pressed','false'); $('#window-focus').textContent='Focus';selectWindow(0,false);
  }
  function selectWindow(index,announce=true) {
    selectedWindow=index;ringIndex=index;
    windows[index].hidden=false;place(windows[index],rectOf(windows[index]));windows[index].style.zIndex=String(++stack);
    windows.forEach((el,n)=>{el.classList.toggle('active',n===index); if(focus)el.hidden=n!==index;});
    document.querySelectorAll('[data-select-window]').forEach((button,n)=>button.setAttribute('aria-pressed',String(n===index)));
    syncRing();if(announce)status(['Project notes selected. Drag or resize it.','Reference selected. Keep the real world in view.','Idea window opened. Add a thought to the scratchpad.'][index]);
  }
  function toggleFocus(){
    focus=!focus;windows.forEach((el,n)=>{el.hidden=focus?n!==selectedWindow:n===2&&n!==selectedWindow;if(!el.hidden)place(el,rectOf(el));});
    $('#window-focus').setAttribute('aria-pressed',String(focus));$('#window-focus').textContent=focus?'Show all':'Focus';
    status(focus?'One window in view. Everything else can wait.':'Your workspace is open again.');
  }
  function labels(){return mode==='workspace'?['Project notes','Reference','Your next idea']:mode==='shopper'?(shopChoices[shop.step]||['Trip complete','Trip complete','Trip complete']):['Suggest workspace','Preview reminder','Review memory'];}
  function syncRing(){const choices=labels();$('#ring-scroll').value=String(ringIndex);$('#ring-scroll').setAttribute('aria-valuetext',choices[ringIndex]);$('#ring-selection').textContent=choices[ringIndex];$('#ring-confirm').disabled=mode==='shopper'&&shop.step===3;$('#ring-scroll').disabled=mode==='shopper'&&shop.step===3;$('#ring-previous').disabled=mode==='shopper'&&shop.step===3;$('#ring-next').disabled=mode==='shopper'&&shop.step===3;if(mode==='assistant')document.querySelectorAll('[data-memory-action]').forEach((b,n)=>b.classList.toggle('highlighted',n===ringIndex));}
  function ringSelect(index) {
    ringIndex=clamp(Number(index),0,2);
    if(mode==='workspace')selectWindow(ringIndex,false);
    if(mode==='shopper'){shop={...shop,selected:ringIndex};highlightShopChoice();}
    if(mode==='assistant')document.querySelectorAll('[data-memory-action]').forEach((b,n)=>b.classList.toggle('highlighted',n===ringIndex));
    syncRing();
  }
  function switchMode(next) {
    mode=next;const names=['workspace','shopper','assistant'];
    document.querySelectorAll('[data-play-tab]').forEach(button=>{const active=button.dataset.playTab===next;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    names.forEach(name=>{$('#play-'+name).hidden=name!==next;});
    ringIndex=next==='workspace'?selectedWindow:next==='shopper'?shop.selected:0;syncRing();
    status(next==='workspace'?'Move, resize, or focus a window. Your layout stays while you explore.':next==='shopper'?'A sample trip. Choose the requested item, then confirm.':'Demo memory is opt-in. Nothing is saved outside this tab.');
    if(next==='workspace')windows.filter(el=>!el.hidden).forEach(el=>place(el,rectOf(el)));
  }
  document.querySelectorAll('[data-play-tab]').forEach(button=>{
    button.addEventListener('click',()=>switchMode(button.dataset.playTab));
    button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const names=['workspace','shopper','assistant'],n=names.indexOf(mode);const next=event.key==='Home'?0:event.key==='End'?2:(n+(event.key==='ArrowRight'?1:2))%3;switchMode(names[next]);$('#play-tab-'+names[next]).focus();});
  });
  const contacts=new Map();let pinch=null;
  const distance=()=>{const [a,b]=[...contacts.values()];return Math.hypot(a.x-b.x,a.y-b.y);};
  stage.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch')return;contacts.set(event.pointerId,{x:event.clientX,y:event.clientY});if(contacts.size===2){pinch={distance:distance(),rect:rectOf(windows[selectedWindow]),index:selectedWindow};stage.setPointerCapture(event.pointerId);}});
  stage.addEventListener('pointermove',event=>{if(!contacts.has(event.pointerId))return;contacts.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pinch&&contacts.size===2){const factor=distance()/Math.max(1,pinch.distance),r=pinch.rect;place(windows[pinch.index],{x:r.x+r.width*(1-factor)/2,y:r.y+r.height*(1-factor)/2,width:r.width*factor,height:r.height*factor});}});
  const finishContact=event=>{contacts.delete(event.pointerId);if(contacts.size<2)pinch=null;};stage.addEventListener('pointerup',finishContact);stage.addEventListener('pointercancel',finishContact);
  windows.forEach((el,index)=>{
    el.addEventListener('pointerdown',()=>selectWindow(index,false));
    for(const [selector,resizing] of [['.window-grip',false],['.window-resize',true]]){
      const handle=el.querySelector(selector);let drag=null;
      handle.addEventListener('pointerdown',event=>{if(event.button!==0)return;selectWindow(index,false);drag={x:event.clientX,y:event.clientY,rect:rectOf(el)};handle.setPointerCapture(event.pointerId);});
      handle.addEventListener('pointermove',event=>{if(!drag||pinch)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y,r=drag.rect;place(el,resizing?{...r,width:r.width+dx,height:r.height+dy}:{...r,x:r.x+dx,y:r.y+dy});});
      const end=()=>{drag=null;};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
      handle.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();selectWindow(index,false);const step=event.shiftKey?24:10,r=rectOf(el),dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;place(el,resizing?{...r,width:r.width+dx,height:r.height+dy}:{...r,x:r.x+dx,y:r.y+dy});});
    }
  });
  document.querySelectorAll('[data-select-window]').forEach(button=>button.addEventListener('click',()=>selectWindow(Number(button.dataset.selectWindow))));
  $('#reset-workspace').addEventListener('click',()=>{resetWorkspace();status('Layout reset. Your scratchpad text is unchanged.');});
  $('#window-focus').addEventListener('click',toggleFocus);
  const resizeSelected=(factor)=>{const el=windows[selectedWindow],r=rectOf(el);place(el,{...r,width:r.width*factor,height:r.height*factor});status(factor>1?'A little more room for the selected window.':'A little more space around the selected window.');};
  $('#window-smaller').addEventListener('click',()=>resizeSelected(.9));$('#window-larger').addEventListener('click',()=>resizeSelected(1.1));
  $('.sample-brief-toggle').addEventListener('click',event=>{const body=$('.sample-brief'),expanded=body.hidden;body.hidden=!expanded;event.currentTarget.setAttribute('aria-expanded',String(expanded));event.currentTarget.textContent=expanded?'Close sample brief −':'Open sample brief +';});
  let lastWidth=stage.clientWidth;
  new ResizeObserver(()=>{const b=bounds();if(b.width>0&&Math.abs(b.width-lastWidth)>1){lastWidth=b.width;windows.filter(el=>!el.hidden).forEach(el=>place(el,rectOf(el)));}}).observe(stage);
  function highlightShopChoice(){document.querySelectorAll('[data-shop-choice]').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===shop.selected)));}
  function paintShopChoices(){
    const choices=shopChoices[shop.step]||[];
    $('#shop-choices').replaceChildren(...choices.map((label,index)=>{const button=document.createElement('button');button.type='button';button.dataset.shopChoice=String(index);button.textContent=label;button.setAttribute('aria-pressed',String(index===shop.selected));button.addEventListener('click',()=>{shop={...shop,selected:index};ringIndex=index;highlightShopChoice();syncRing();});return button;}));
  }
  function paintShop(){
    const content=[
      ['SAMPLE STORE · PRODUCE','Find Gala apples.','Point to a choice, then confirm with the ring or button.'],
      ['SAMPLE STORE · DAIRY ALTERNATIVES','Oat milk is out of stock.','Suggest a like-for-like replacement. The customer still decides.'],
      ['WAITING FOR THE CUSTOMER','Suggest, don’t assume.','Preview the message below. No message will actually be sent.'],
      ['DEMO COMPLETE','That’s a wrap.','Two sample items resolved. No real order or purchase was changed.']
    ][shop.step];
    ['shop-location','shop-task','shop-context'].forEach((id,n)=>$('#'+id).textContent=content[n]);
    $('#trip-count').textContent=shop.completed+' / 2';$('#trip-fill').style.width=(shop.completed/2*100)+'%';
    $('#shop-message').hidden=shop.step!==2;$('#shop-confirm').hidden=shop.step===3;
    $('#shop-confirm').textContent=shop.step===2?'Confirm simulated action':'Confirm selection';
    paintShopChoices();ringIndex=shop.selected;syncRing();
  }
  function runShop(){shop=confirmShop(shop);paintShop();status(shop.result);acknowledge();if(shop.step===3)$('#reset-trip').focus({preventScroll:true});}
  $('#shop-confirm').addEventListener('click',runShop);
  $('#reset-trip').addEventListener('click',()=>{shop=initialShop();paintShop();status('New sample trip. Start by finding Gala apples.');});
  function runAssistant(action){$('#memory-response').textContent=memorySuggestion(memory,action);$('#assistant-open-workspace').hidden=!(memory.enabled&&memory.workspace&&action===0);status(memory.enabled?'Sample suggestion updated. Nothing has been scheduled or sent.':'Memory is off. Turn it on and save preferences to try this.');}
  $('#assistant-open-workspace').addEventListener('click',()=>{switchMode('workspace');selectWindow(0,false);status('Sample workspace opened. No computer or external account was connected.');});
  $('#memory-enabled').addEventListener('change',event=>{
    const enabled=event.currentTarget.checked;memory={...memory,enabled};
    ['#memory-workspace','#memory-reminder','#memory-save'].forEach(id=>$(id).disabled=!enabled);
    $('#memory-state').textContent=enabled?'MEMORY ON · SAVE YOUR PREFERENCES':'MEMORY OFF';
    $('#assistant-open-workspace').hidden=true;
    $('#memory-response').textContent=enabled?'Choose a preference, save it, and try a suggestion.':'Demo memory is off. Saved preferences are not being used.';
  });
  $('#memory-save').addEventListener('click',()=>{if(!$('#memory-enabled').checked)return;memory={enabled:true,workspace:$('#memory-workspace').value,reminder:$('#memory-reminder').value.trim()};$('#memory-state').textContent='SAVED FOR THIS DEMO';runAssistant(0);});
  $('#memory-clear').addEventListener('click',()=>{memory={enabled:false,workspace:'',reminder:''};$('#memory-enabled').checked=false;$('#memory-workspace').selectedIndex=0;$('#memory-reminder').value='';['#memory-workspace','#memory-reminder','#memory-save'].forEach(id=>$(id).disabled=true);$('#assistant-open-workspace').hidden=true;$('#memory-state').textContent='MEMORY CLEARED';$('#memory-response').textContent='All demo preferences cleared. Nothing is being remembered.';status('Demo memory cleared. Your choices are no longer used.');});
  document.querySelectorAll('[data-memory-action]').forEach(button=>button.addEventListener('click',()=>{ringSelect(Number(button.dataset.memoryAction));runAssistant(ringIndex);}));
  $('#ring-scroll').addEventListener('input',event=>ringSelect(event.currentTarget.value));
  $('#ring-previous').addEventListener('click',()=>ringSelect((ringIndex+2)%3));$('#ring-next').addEventListener('click',()=>ringSelect((ringIndex+1)%3));
  $('#ring-confirm').addEventListener('click',()=>{acknowledge();if(mode==='shopper')runShop();else if(mode==='assistant')runAssistant(ringIndex);else{selectWindow(ringIndex,false);if(!focus)toggleFocus();else status(labels()[ringIndex]+' is in focus. Use “Show all” to reopen your workspace.');}});
  resetWorkspace();paintShop();syncRing();
  import('./ring-demo.js').then(module=>module.initRingDemo()).catch(()=>{});
}
