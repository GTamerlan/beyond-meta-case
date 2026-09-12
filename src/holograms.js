import * as THREE from 'three';

// Spatial UI is a visualization of the wearer's view, not a free-space projector.
export function createHolograms(scene, invalidate){
 const panels=[];
 const specs=[
  {title:'ON THE JOB',line:'The right item.',image:'grocery.jpg',target:[-3.9,1.1,.55],angle:.24,width:3.3},
  {title:'YOUR WORKSPACE',line:'Room to think.',image:'workspace.jpg',target:[-.15,2.15,.3],angle:-.025,width:3.9},
  {title:'YOUR PEOPLE',line:'Closer, naturally.',image:'life.jpg',target:[3.7,1.45,.65],angle:-.27,width:3.2}
 ];
 const glowCanvas=document.createElement('canvas');glowCanvas.width=512;glowCanvas.height=384;
 const gc=glowCanvas.getContext('2d');gc.shadowColor='#5eacff';gc.shadowBlur=28;gc.fillStyle='#559ce040';gc.beginPath();gc.roundRect(35,35,442,314,30);gc.fill();
 const glowTexture=new THREE.CanvasTexture(glowCanvas);glowTexture.colorSpace=THREE.SRGBColorSpace;
 specs.forEach((s,n)=>{
  const c=document.createElement('canvas');c.width=768;c.height=512;const ctx=c.getContext('2d');
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  function draw(img){
   ctx.clearRect(0,0,768,512);ctx.save();ctx.beginPath();ctx.roundRect(6,6,756,500,30);ctx.clip();
   const bg=ctx.createLinearGradient(0,0,768,512);bg.addColorStop(0,'rgba(54,87,121,.91)');bg.addColorStop(1,'rgba(17,35,58,.84)');ctx.fillStyle=bg;ctx.fillRect(0,0,768,512);
   ctx.fillStyle='#c4dcf6';ctx.font='500 23px sans-serif';ctx.fillText(s.title,30,49);
   ctx.fillStyle='#abcdec';[686,708,730].forEach(x=>{ctx.beginPath();ctx.arc(x,40,4,0,Math.PI*2);ctx.fill();});
   if(img){const y=76,h=340;ctx.save();ctx.beginPath();ctx.roundRect(18,y,732,h,12);ctx.clip();const scale=Math.max(732/img.width,h/img.height);ctx.drawImage(img,18+(732-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);const shade=ctx.createLinearGradient(0,y,0,y+h);shade.addColorStop(0,'#06172b00');shade.addColorStop(1,'#071b3499');ctx.fillStyle=shade;ctx.fillRect(18,y,732,h);ctx.restore();}
   ctx.fillStyle='#ecf6ff';ctx.font='500 45px sans-serif';ctx.fillText(s.line,30,476);
   ctx.strokeStyle='#cce8ff99';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(688,471);ctx.lineTo(719,440);ctx.moveTo(694,440);ctx.lineTo(719,440);ctx.lineTo(719,465);ctx.stroke();
   ctx.restore();ctx.beginPath();ctx.roundRect(6,6,756,500,30);ctx.lineWidth=2;ctx.strokeStyle='#d6efffa0';ctx.stroke();texture.needsUpdate=true;invalidate();
  }
  draw();const img=new Image();img.onload=()=>draw(img);img.src=`./${s.image}`;
  const group=new THREE.Group();scene.add(group);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(s.width,s.width*2/3),material);plane.renderOrder=8+n;group.add(plane);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(s.width*1.22,s.width*.9),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));glow.position.z=-.025;glow.renderOrder=5;group.add(glow);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));
  const beam=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xa9d9ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(beam);
  panels.push({group,plane,glow,beam,spec:s,index:n});
 });
 return function update(progress,time,reduced){
  panels.forEach(({group,plane,glow,beam,spec,index})=>{
   // Center screen leads; the two companion screens unfold a beat later.
   const order=[1,0,2][index],p=THREE.MathUtils.smootherstep(progress,.04+order*.1,.72+order*.13);
   group.visible=p>.003;beam.visible=group.visible;
   plane.material.opacity=p*.97;glow.material.opacity=p*(reduced?.5:.5+Math.sin(time*.001+index)*.06);
   group.scale.setScalar(.12+p*.88);
   group.position.set(THREE.MathUtils.lerp(-.55+(index-1)*.9,spec.target[0],p),THREE.MathUtils.lerp(-.6,spec.target[1],p)+(reduced?0:Math.sin(time*.0005+index)*.045*p),THREE.MathUtils.lerp(-.8,spec.target[2],p));
   group.rotation.set((1-p)*-.28-.035*p,spec.angle*p+(index-1)*(1-p)*.5,(index-1)*-.025*p);
   beam.material.opacity=p*(1-p)*.22+p*.024;
   const x=group.position.x,y=group.position.y,z=group.position.z,w=spec.width*.48*p,h=spec.width/3*p;
   beam.geometry.attributes.position.array.set([-.55+(index===0?-1.5:1.5),-1.2,.1,x-w,y-h,z,-.55+(index===0?-1.5:1.5),-1.2,.1,x+w,y-h,z]);
   beam.geometry.attributes.position.needsUpdate=true;beam.geometry.computeBoundingSphere();
  });
 };
}
