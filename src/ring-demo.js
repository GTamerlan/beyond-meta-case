import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createRing} from './ring-asset.js';

export function initRingDemo(){
  const canvas=document.querySelector('#ring-canvas'), host=canvas.parentElement;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(34,1,.1,30);
  camera.position.set(0,0,4.7);
  const ring=createRing(THREE);ring.rotation.set(.48,-.36,-.2);scene.add(ring);
  const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
  scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0x515c65,3));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,5,5);scene.add(key);
  let visible=false,frame=0;
  const draw=()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);renderer.render(scene,camera);};
  new ResizeObserver(()=>{if(visible)draw();}).observe(host);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){draw();host.classList.add('ring-ready');}},{rootMargin:'80px'}).observe(host);
  host.addEventListener('pointermove',event=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const rect=host.getBoundingClientRect();ring.rotation.y=-.36+((event.clientX-rect.left)/rect.width-.5)*.5;if(!frame)frame=requestAnimationFrame(()=>{if(visible)draw();frame=0;});});
  host.addEventListener('pointerleave',()=>{ring.rotation.y=-.36;if(visible)draw();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();visible=false;host.classList.remove('ring-ready');});
}
