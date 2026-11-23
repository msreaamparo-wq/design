import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const host=document.querySelector('#dressform');
if(host){
  let renderer,observer,frame;
  try{
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(31,1,.1,100);
    camera.position.set(4.8,2.1,8.5);
    camera.lookAt(0,.35,0);
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    host.replaceChildren(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Interactive three-dimensional couture mannequin. Drag to rotate.');
    renderer.domElement.style.touchAction='pan-y';
    scene.add(new THREE.HemisphereLight(0xfff5ed,0x483541,2.05));
    const key=new THREE.DirectionalLight(0xffe7d9,3.2);key.position.set(3,6,5);key.castShadow=true;scene.add(key);
    const rim=new THREE.DirectionalLight(0xd79aaa,2.8);rim.position.set(-4,3,-4);scene.add(rim);
    const fill=new THREE.PointLight(0xf3cdb7,1.15,11);fill.position.set(2,0,4);scene.add(fill);

    const turntable=new THREE.Group();scene.add(turntable);
    const mannequin=new THREE.Group();turntable.add(mannequin);
    const linen=new THREE.MeshPhysicalMaterial({color:0xd8c3b2,roughness:.52,metalness:.01,clearcoat:.16});
    const seamMat=new THREE.MeshStandardMaterial({color:0xb59b8d,roughness:.8});
    const brass=new THREE.MeshStandardMaterial({color:0xc39a69,metalness:.72,roughness:.25});
    const dark=new THREE.MeshStandardMaterial({color:0x493641,roughness:.5,metalness:.24});

    // Tailored torso profile: shoulders, bust, waist and hips are shaped as a continuous form.
    const rings=[
      [-1.28,.43,.29,0],[-1.20,.53,.34,0],[-1.02,.59,.37,0],
      [-.78,.55,.34,0],[-.54,.46,.29,0],[-.28,.39,.255,0],
      [-.02,.37,.25,0],[.20,.405,.275,0],[.40,.48,.31,0],
      [.58,.54,.33,0],[.73,.49,.30,0],[.86,.37,.24,0],
      [.96,.23,.19,0],[1.04,.15,.15,0],[1.22,.14,.14,0],
      [1.30,.17,.16,0]
    ];
    const vertices=[],indices=[],segments=96;
    for(const [y,rx,rz,cz] of rings){
      for(let i=0;i<segments;i++){
        const a=i/segments*Math.PI*2;
        vertices.push(Math.cos(a)*rx,y,Math.sin(a)*rz+cz);
      }
    }
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
      const a=j*segments+i,b=j*segments+(i+1)%segments,c=(j+1)*segments+(i+1)%segments,d=(j+1)*segments+i;
      indices.push(a,b,d,b,c,d);
    }
    const torsoGeo=new THREE.BufferGeometry();
    torsoGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    torsoGeo.setIndex(indices);torsoGeo.computeVertexNormals();
    const torso=new THREE.Mesh(torsoGeo,linen);torso.castShadow=true;torso.receiveShadow=true;mannequin.add(torso);

    // Bust shaping gives the dress form a recognisable couture silhouette.
    for(const side of [-1,1]){
      const bust=new THREE.Mesh(new THREE.SphereGeometry(1,40,32),linen);
      bust.scale.set(.225,.235,.16);bust.position.set(side*.235,.35,.235);bust.castShadow=true;mannequin.add(bust);
    }
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.115,.145,.28,48),linen);
    neck.position.y=1.40;mannequin.add(neck);
    const neckCap=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.035,48),brass);
    neckCap.position.y=1.555;mannequin.add(neckCap);
    const finial=new THREE.Mesh(new THREE.SphereGeometry(.085,32,24),brass);
    finial.position.y=1.64;mannequin.add(finial);

    // Slim shoulder arms with rounded caps, angled slightly away from the body.
    for(const side of [-1,1]){
      const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.62,8,20),linen);
      arm.position.set(side*.64,.47,0);arm.rotation.z=side*-.16;arm.castShadow=true;mannequin.add(arm);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.09,24,16),linen);
      cap.position.set(side*.69,.07,0);mannequin.add(cap);
      const shoulder=new THREE.Mesh(new THREE.SphereGeometry(.12,24,16),linen);
      shoulder.scale.set(1,.72,.9);shoulder.position.set(side*.52,.77,0);mannequin.add(shoulder);
    }

    // Subtle vertical tailoring seams.
    for(const side of [-1,1]){
      const seam=new THREE.Mesh(new THREE.CatmullRomCurve3([
        new THREE.Vector3(side*.02,-1.15,.34),new THREE.Vector3(side*.17,-.55,.29),
        new THREE.Vector3(side*.14,-.05,.255),new THREE.Vector3(side*.23,.37,.34),
        new THREE.Vector3(side*.35,.63,.30)
      ]).getPoints(48).length>0?new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(side*.02,-1.15,.34),new THREE.Vector3(side*.17,-.55,.29),
        new THREE.Vector3(side*.14,-.05,.255),new THREE.Vector3(side*.23,.37,.34),
        new THREE.Vector3(side*.35,.63,.30)
      ]),48,.006,8,false):new THREE.BufferGeometry(),seamMat);
      mannequin.add(seam);
    }

    // A soft couture drape panel adds visible fabric movement and depth.
    const drape=new THREE.Group();mannequin.add(drape);
    const clothMat=new THREE.MeshPhysicalMaterial({color:0x855c6b,roughness:.7,side:THREE.DoubleSide,metalness:.01});
    const clothPos=[],clothIdx=[],cols=48,rows=32;
    for(let y=0;y<=rows;y++){
      const v=y/rows;
      for(let x=0;x<=cols;x++){
        const u=x/cols,angle=(u-.5)*Math.PI*1.2;
        const radius=.43+v*.27+.025*Math.sin(u*Math.PI*8+v*5);
        clothPos.push(Math.sin(angle)*radius,-.12-v*1.28,Math.cos(angle)*radius*.72+.035*Math.sin(u*18+v*5));
      }
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x,b=a+1,c=a+cols+2,d=a+cols+1;
      clothIdx.push(a,d,b,b,d,c);
    }
    const clothGeo=new THREE.BufferGeometry();
    clothGeo.setAttribute('position',new THREE.Float32BufferAttribute(clothPos,3));
    clothGeo.setIndex(clothIdx);clothGeo.computeVertexNormals();
    const skirt=new THREE.Mesh(clothGeo,clothMat);skirt.castShadow=true;skirt.receiveShadow=true;drape.add(skirt);
    const waistBand=new THREE.Mesh(new THREE.TorusGeometry(.405,.018,12,96),brass);
    waistBand.position.y=-.12;waistBand.rotation.x=Math.PI/2;drape.add(waistBand);

    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.032,1.0,24),brass);
    pole.position.y=-1.78;mannequin.add(pole);
    const collar=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,.11,48),dark);
    collar.position.y=-1.30;mannequin.add(collar);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.58,.68,.12,64),dark);
    base.position.y=-2.31;base.castShadow=true;mannequin.add(base);
    const baseLine=new THREE.Mesh(new THREE.TorusGeometry(.63,.012,10,96),brass);
    baseLine.rotation.x=Math.PI/2;baseLine.position.y=-2.245;mannequin.add(baseLine);

    const floor=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.MeshBasicMaterial({color:0x9a6d79,transparent:true,opacity:.075}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-2.39;scene.add(floor);

    const resize=()=>{const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    observer=new ResizeObserver(resize);observer.observe(host);resize();
    let dragging=false,lastX=0,velocity=0,target=0;
    host.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;host.setPointerCapture?.(e.pointerId);});
    host.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;target+=dx*.009;velocity=dx*.0008;lastX=e.clientX;});
    const stop=()=>{dragging=false;};
    host.addEventListener('pointerup',stop);host.addEventListener('pointercancel',stop);host.addEventListener('lostpointercapture',stop);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock=new THREE.Clock();
    const animate=()=>{frame=requestAnimationFrame(animate);const t=clock.getElapsedTime();if(!reduced){if(!dragging){target+=.002;target+=velocity;velocity*=.94;}turntable.rotation.y+=(target-turntable.rotation.y)*.075;drape.rotation.y=Math.sin(t*.65)*.018;skirt.position.z=Math.sin(t*.8)*.012;}renderer.render(scene,camera);};
    animate();
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer?.disconnect();renderer?.dispose();}, {once:true});
  }catch(error){
    host.innerHTML='<div class="three-fallback">THREADS / ATELIER<br><span>FORM STUDY 01</span></div>';
  }
}