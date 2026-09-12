import * as THREE from 'three';

// UI textures illustrate content as perceived by a wearer, not a free-space projector.
export function createHolograms(scene, invalidate){
 const panels=[];
 const specs=[{title:'YOUR NEXT MOVE',line:'The right item.',sub:'One instruction. Right in view.',image:'grocery.jpg',target:[-3.4,1.25,1.25],angle:.27},{title:'YOUR WORKSPACE',line:'Room to think.',sub:'Connected to your computer.',image:'workspace.jpg',target:[0,2.05,.35],angle:0},{title:'YOUR PEOPLE',line:'Closer, naturally.',sub:'A little help. Right on time.',image:'life.jpg',target:[3.4,1.15,1.2],angle:-.27}];
 specs.forEach((s,n)=>{
  const c=document.createElement('canvas');c.width=768;c.height=512;const ctx=c.getContext('2d');
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  function draw(img){ctx.clearRect(0,0,768,512);ctx.save();ctx.beginPath();ctx.roundRect(6,6,756,500,28);ctx.clip();const grad=ctx.createLinearGradient(0,0,768,512);grad.addColorStop(0,'rgba(225,242,255,.96)');grad.addColorStop(1,'rgba(150,191,227,.89)');ctx.fillStyle=grad;ctx.fillRect(0,0,768,512);ctx.fillStyle='#284565';ctx.font='500 20px sans-serif';ctx.fillText(s.title,32,51);ctx.fillStyle='#7e9bbb';[686,708,730].forEach(x=>{ctx.beginPath();ctx.arc(x,42,4,0,Math.PI*2);ctx.fill();});
  if(img){const y=80,h=253;ctx.save();ctx.beginPath();ctx.rect(22,y,724,h);ctx.clip();const scale=Math.max(724/img.width,h/img.height);ctx.drawImage(img,22+(724-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);const overlay=ctx.createLinearGradient(0,y,0,y+h);overlay.addColorStop(0,'#05162c05');overlay.addColorStop(1,'#09244088');ctx.fillStyle=overlay;ctx.fillRect(22,y,724,h);ctx.restore();}
  else{ctx.fillStyle='#749ebc';ctx.fillRect(22,80,724,253);}
  ctx.fillStyle='#193b61';ctx.font='500 49px sans-serif';ctx.fillText(s.line,32,409);ctx.font='24px sans-serif';ctx.fillStyle='#496582';ctx.fillText(s.sub,32,460);ctx.restore();ctx.beginPath();ctx.roundRect(6,6,756,500,28);ctx.lineWidth=3;ctx.strokeStyle='#e7f6ffcc';ctx.stroke();texture.needsUpdate=true;invalidate();}
  draw();const img=new Image();img.onload=()=>draw(img);img.src=`./${s.image}`;
  const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});const plane=new THREE.Mesh(new THREE.PlaneGeometry(3.2,2.133),mat);plane.renderOrder=8+n;scene.add(plane);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3));const beam=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0x9ccfff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));beam.renderOrder=2;scene.add(beam);
  panels.push({plane,beam,spec:s,index:n});
 });
 return function update(progress,time,reduced){panels.forEach(({plane,beam,spec,index})=>{const p=THREE.MathUtils.smoothstep(progress,index*.07,.82+index*.08);plane.visible=p>.005;beam.visible=plane.visible;plane.material.opacity=p*.92;plane.scale.setScalar(.08+p*.92);plane.position.set(THREE.MathUtils.lerp((index-1)*1.3,spec.target[0],p),THREE.MathUtils.lerp(-.3,spec.target[1],p)+(reduced?0:Math.sin(time*.00065+index)*.05*p),THREE.MathUtils.lerp(-.1,spec.target[2],p));plane.rotation.set(-.08*p,spec.angle*p,(index-1)*-.04*p);beam.material.opacity=p*.13;const x=plane.position.x,y=plane.position.y,z=plane.position.z,w=1.57*p;const points=beam.geometry.attributes.position.array;points.set([index===0?-1.6:1.6,-1.2,.2,x-w,y-1.02*p,z,index===0?-1.6:1.6,-1.2,.2,x+w,y-1.02*p,z,index===0?-1.6:1.6,-1.2,.2,x,y,z]);beam.geometry.attributes.position.needsUpdate=true;beam.geometry.computeBoundingSphere();});};
}
