import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createGlasses } from './glasses-asset.js';
import { createRing } from './ring-asset.js';
import { createHolograms } from './holograms.js';

export function initGlasses() {
  const canvas = document.querySelector('#glasses-canvas');
  const host = canvas.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'low-power'}); }
  catch { host.classList.add('no-webgl'); document.querySelector('.model-loader').textContent = 'Beyond the limits of a screen.'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  scene.environment = pmrem.fromScene(environment, .04).texture;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xddefff, 0x293762, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(-3, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x75aaff, 4); rim.position.set(5, 2, -3); scene.add(rim);
  const glasses = createGlasses(THREE);
  scene.add(glasses);
  const ring = createRing(THREE);
  ring.position.set(3.65, -1.32, 1.25);
  ring.rotation.set(.35, -.4, -.2);
  ring.scale.setScalar(1.05);
  scene.add(ring);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);
  let yaw = -.22, pitch = .25, targetYaw = yaw, targetPitch = pitch, visible = true, dragging = false, lastX = 0, lastY = 0, raf = 0, expansion = 0;
  const hero = document.querySelector('.hero');
  const updateHolograms = createHolograms(scene, () => start());
  function resize() {
    const w=host.clientWidth, h=host.clientHeight;
    renderer.setSize(w,h,false); camera.aspect=w/h;
    camera.position.set(0,1.1,w < 650 ? 16 : 14.2); camera.lookAt(0,.4,-.4); camera.updateProjectionMatrix(); render();
  }
  function render(t = 0) {
    yaw += (targetYaw-yaw)*.09; pitch += (targetPitch-pitch)*.09;
    const targetExpansion = Number(hero.dataset.expansion || 0);
    expansion = reduced.matches ? targetExpansion : THREE.MathUtils.lerp(expansion,targetExpansion,.055);
    glasses.rotation.set(pitch - expansion*.16, yaw + (reduced.matches || dragging ? 0 : Math.sin(t*.0003)*.055) + expansion*.22, -.04 + expansion*.04);
    glasses.position.y = -expansion*1.42 + (reduced.matches ? 0 : Math.sin(t*.00065)*.055);
    glasses.scale.setScalar(1.18-expansion*.3);
    updateHolograms(expansion,t,reduced.matches);
    ring.rotation.y = -.4 + (reduced.matches ? 0 : Math.sin(t*.00045)*.16);
    ring.position.y = -1.32 - expansion*.33 + (reduced.matches ? 0 : Math.sin(t*.00065+1.5)*.065);
    renderer.render(scene,camera);
  }
  function frame(t) { render(t); if(visible && !document.hidden && !reduced.matches) raf=requestAnimationFrame(frame); else raf=0; }
  function start(){if(!raf && visible && !document.hidden) raf=requestAnimationFrame(frame);}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting; if(visible) start();},{rootMargin:'100px'}).observe(host);
  document.addEventListener('visibilitychange', start);
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;targetYaw+=(e.clientX-lastX)*.006;targetPitch=THREE.MathUtils.clamp(targetPitch+(e.clientY-lastY)*.005,-.5,.9);lastX=e.clientX;lastY=e.clientY;if(reduced.matches){yaw=targetYaw;pitch=targetPitch;render();}});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','r','R'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')targetYaw-=.2;if(e.key==='ArrowRight')targetYaw+=.2;if(e.key==='ArrowUp')targetPitch-=.15;if(e.key==='ArrowDown')targetPitch+=.15;if(e.key.toLowerCase()==='r'){targetYaw=-.22;targetPitch=.25;}if(reduced.matches){yaw=targetYaw;pitch=targetPitch;render();}else start();});
  reduced.addEventListener('change',()=>{render();start();});
  document.querySelector('#unfold-world').addEventListener('click',start);
  addEventListener('scroll',()=>{if(reduced.matches && visible)render();},{passive:true});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.add('no-webgl');});
  document.querySelector('.model-loader').classList.add('loaded');
  host.classList.add('model-ready');resize();start();
}
