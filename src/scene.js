import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createGlasses } from './glasses-asset.js';
import { createRing } from './ring-asset.js';

export function initGlasses() {
  const canvas = document.querySelector('#glasses-canvas');
  const host = canvas.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer, contextLost = false;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'low-power'}); }
  catch { host.classList.add('no-webgl'); host.innerHTML='<img src="./black-frames.jpg" alt="Black smart-glasses concept; interactive 3D is unavailable on this device." />'; dispatchEvent(new Event('beyond:scene-ready')); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  scene.environment = pmrem.fromScene(environment, .04).texture;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 2));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(-3, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(5, 2, -3); scene.add(rim);
  const glasses = createGlasses(THREE);
  scene.add(glasses);
  const ring = createRing(THREE);
  ring.position.set(4.9, -.8, .45);
  ring.rotation.set(.35, -.4, -.2);
  ring.scale.setScalar(.62);
  scene.add(ring);
  const born = performance.now();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);
  let yaw = -.24, pitch = .2, targetYaw = yaw, targetPitch = pitch, visible = true, dragging = false, lastX = 0, lastY = 0, raf = 0, expansion = 0, previousTime = 0;
  const hero = document.querySelector('.hero');
  function resize() {
    const w=host.clientWidth, h=host.clientHeight;
    renderer.setSize(w,h,false); camera.aspect=w/h;
    camera.position.set(0,.65,Math.max(9.8,11.8/(2*Math.tan(Math.PI/12)*camera.aspect))); camera.lookAt(0,0,-.4); camera.updateProjectionMatrix(); render();
  }
  function render(t = performance.now()) {
    if (contextLost) return;
    const dt = previousTime ? Math.min((t-previousTime)/1000,.05) : 1/60;
    previousTime = t;
    const damping = 1-Math.exp(-9*dt);
    yaw += (targetYaw-yaw)*damping; pitch += (targetPitch-pitch)*damping;
    const targetExpansion = Number(hero.dataset.expansion || 0);
    expansion = reduced.matches ? targetExpansion : THREE.MathUtils.lerp(expansion,targetExpansion,1-Math.exp(-7*dt));
    const arrival = reduced.matches ? 1 : THREE.MathUtils.smoothstep(t-born,0,1400);
    glasses.rotation.set(pitch+(1-arrival)*.14, yaw-(1-arrival)*.24, -.025);
    glasses.position.set(-.65,-(1-arrival)*.25,0);
    glasses.scale.setScalar(1.15);
    ring.rotation.y = -.4;
    renderer.render(scene,camera);
  }
  function frame(t) { render(t); const unsettled=t-born<1800 || dragging || Math.abs(yaw-targetYaw)+Math.abs(pitch-targetPitch)>.0001; if(visible && !document.hidden && !reduced.matches && unsettled) raf=requestAnimationFrame(frame); else raf=0; }
  function start(){if(!raf && visible && !document.hidden) raf=requestAnimationFrame(frame);}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting; if(visible) start();},{rootMargin:'100px'}).observe(host);
  document.addEventListener('visibilitychange', start);
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);start();});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;targetYaw+=(e.clientX-lastX)*.006;targetPitch=THREE.MathUtils.clamp(targetPitch+(e.clientY-lastY)*.005,-.5,.9);lastX=e.clientX;lastY=e.clientY;if(reduced.matches){yaw=targetYaw;pitch=targetPitch;render();}});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','r','R'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')targetYaw-=.2;if(e.key==='ArrowRight')targetYaw+=.2;if(e.key==='ArrowUp')targetPitch-=.15;if(e.key==='ArrowDown')targetPitch+=.15;if(e.key.toLowerCase()==='r'){targetYaw=-.22;targetPitch=.25;}if(reduced.matches){yaw=targetYaw;pitch=targetPitch;render();}else start();});
  reduced.addEventListener('change',()=>{render();start();});
  document.querySelector('#unfold-world').addEventListener('click',start);
  addEventListener('scroll',()=>{if(reduced.matches && visible)render();},{passive:true});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;visible=false;cancelAnimationFrame(raf);raf=0;canvas.hidden=true;canvas.style.display='none';host.classList.add('no-webgl');host.insertAdjacentHTML('beforeend','<img src="./black-frames.jpg" alt="Black smart-glasses concept. Interactive rendering is unavailable." />');});
  document.querySelector('.model-loader').classList.add('loaded');
  host.classList.add('model-ready');resize();start();
  dispatchEvent(new Event('beyond:scene-ready'));
}
