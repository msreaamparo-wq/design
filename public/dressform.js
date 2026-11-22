import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const host=document.querySelector('#dressform');
if(host){
  try{
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(32,1,.1,100);
    camera.position.set(4.2,2.35,7.6);
    camera.lookAt(0,.55,0);
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.18;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    host.replaceChildren(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Slowly rotating three-dimensional couture dress form');

    scene.add(new THREE.HemisphereLight(0xfff5eb,0x46313e,2.15));
    const key=new THREE.DirectionalLight(0xffe7d2,3.4);key.position.set(3,6,5);key.castShadow=true;scene.add(key);
    const rim=new THREE.DirectionalLight(0xd99bad,2.6);rim.position.set(-4,3,-4);scene.add(rim);
    const fill=new THREE.PointLight(0xf5c8ae,1.1,10);fill.position.set(2,0,4);scene.add(fill);

    const form=new THREE.Group();scene.add(form);
    const fabric=new THREE.MeshPhysicalMaterial({color:0xd9c4b4,roughness:.42,metalness:.02,clearcoat:.22,clearcoatRoughness:.5});
    const shadowMat=new THREE.MeshStandardMaterial({color:0x493342,roughness:.48,metalness:.3});
    const brass=new THREE.MeshStandardMaterial({color:0xc59a66,metalness:.72,roughness:.24});
    const bodyProfile=[
      [0,-1.15],[.42,-1.15],[.56,-1.10],[.61,-.94],[.59,-.72],
      [.54,-.48],[.50,-.22],[.48,.02],[.45,.22],[.39,.42],
      [.32,.62],[.29,.82],[.31,1.00],[.38,1.18],[.47,1.36],
      [.53,1.53],[.49,1.66],[.37,1.76],[.24,1.81],[.17,1.84],
      [.15,1.96],[.14,2.05],[0,2.05]
    ].map(([r,y])=>new THREE.Vector2(r,y));
    const body=new THREE.Mesh(new THREE.LatheGeometry(bodyProfile,96),fabric);
    body.castShadow=true;body.receiveShadow=true;form.add(body);

    const shoulderCap=new THREE.Mesh(new THREE.SphereGeometry(.13,32,24),brass);
    shoulderCap.scale.set(.72,.42,.72);shoulderCap.position.y=2.08;form.add(shoulderCap);
    const armMaterial=fabric;
    for(const side of [-1,1]){
      const socket=new THREE.Mesh(new THREE.SphereGeometry(.19,32,24),armMaterial);
      socket.scale.set(.76,1.18,.8);socket.position.set(side*.48,1.48,0);socket.rotation.z=side*.25;form.add(socket);
      const pin=new THREE.Mesh(new THREE.SphereGeometry(.035,16,12),brass);
      pin.position.set(side*.51,1.5,.13);form.add(pin);
    }

    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.028,.035,1.18,24),brass);
    pole.position.y=-1.73;form.add(pole);
    const collar=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.12,48),shadowMat);
    collar.position.y=-1.22;form.add(collar);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.62,.72,.13,64),shadowMat);
    base.position.y=-2.34;base.castShadow=true;form.add(base);
    const baseLine=new THREE.Mesh(new THREE.TorusGeometry(.67,.014,10,96),brass);
    baseLine.rotation.x=Math.PI/2;baseLine.position.y=-2.265;form.add(baseLine);

    const floor=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.MeshBasicMaterial({color:0x9a6d79,transparent:true,opacity:.09}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-2.42;scene.add(floor);

    const resize=()=>{const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    let pointer=0,aim=0;
    host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();aim=((e.clientX-r.left)/r.width-.5)*.28;});
    host.addEventListener('pointerleave',()=>aim=0);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame=0;
    const animate=()=>{frame=requestAnimationFrame(animate);if(!reduced){pointer+=(aim-pointer)*.035;form.rotation.y+=.0022;form.rotation.y+=pointer*.012;form.position.y=Math.sin(performance.now()*.00055)*.018;}renderer.render(scene,camera);};
    animate();
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();},{once:true});
  }catch(error){
    host.innerHTML='<div class="three-fallback">THREADS / ATELIER<br><span>FORM STUDY 01</span></div>';
  }
}