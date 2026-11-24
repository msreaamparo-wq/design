import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const host = document.querySelector('#dressform');
if (host) {
  let renderer, observer, frame;
  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0b0d');
    scene.fog = new THREE.Fog('#0b0b0d', 8, 19);
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
    camera.position.set(4.4, 1.15, 8.8);
    camera.lookAt(0, -.05, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.replaceChildren(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional couture mannequin in a silver draped garment. Drag to rotate and scroll to zoom.');
    renderer.domElement.style.touchAction = 'pan-y';

    scene.add(new THREE.HemisphereLight(0xcfd2d8, 0x17171b, 1.45));
    // Studio lighting is built from directional, point and spot lights.
    const keyLight = new THREE.DirectionalLight(0xf4f1ed, 3.3);
    keyLight.position.set(3.5, 6, 5); keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -4; keyLight.shadow.camera.right = 4; keyLight.shadow.camera.top = 5; keyLight.shadow.camera.bottom = -5;
    scene.add(keyLight);
    const rim = new THREE.DirectionalLight(0xb7c0cf, 3.8); rim.position.set(-4, 3, -4); scene.add(rim);
    const soft = new THREE.PointLight(0xffffff, 1.1, 12); soft.position.set(2, 1, 5); scene.add(soft);
    const top = new THREE.SpotLight(0xffffff, 90, 16, Math.PI / 5, .65, 1.4); top.position.set(0, 6, 1); top.castShadow = true; scene.add(top);

    const stage = new THREE.Group(); scene.add(stage);
    const mannequin = new THREE.Group(); stage.add(mannequin);
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x24252a, roughness: .34, metalness: .22, clearcoat: .42, clearcoatRoughness: .24 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x55585f, metalness: .82, roughness: .26 });
    const satin = new THREE.MeshPhysicalMaterial({ color: 0xb9bbc0, roughness: .24, metalness: .22, clearcoat: .72, clearcoatRoughness: .2, sheen: 1, sheenColor: new THREE.Color(0xe4e5e8), side: THREE.DoubleSide });
    const satinShadow = new THREE.MeshPhysicalMaterial({ color: 0x74777f, roughness: .3, metalness: .16, sheen: .8, side: THREE.DoubleSide });

    function ringSurface(profile, material, segments = 112, radialDetail = 1) {
      const pos = [], uv = [], idx = [];
      for (let j = 0; j < profile.length; j++) {
        const [y, rx, rz, zc = 0] = profile[j];
        for (let i = 0; i <= segments; i++) {
          const a = i / segments * Math.PI * 2;
          pos.push(Math.cos(a) * rx, y, Math.sin(a) * rz + zc);
          uv.push(i / segments, j / (profile.length - 1));
        }
      }
      for (let j = 0; j < profile.length - 1; j++) for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i, b = a + 1, c = a + segments + 2, d = a + segments + 1;
        idx.push(a, d, b, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, material); mesh.castShadow = true; mesh.receiveShadow = true;
      return mesh;
    }

    // Continuous dress-form silhouette: hips, waist, bust, shoulders and neck.
    const torsoProfile = [
      [-1.34,.43,.30],[-1.25,.51,.34],[-1.08,.56,.36],[-.88,.54,.35],
      [-.67,.47,.31],[-.43,.40,.275],[-.18,.365,.255],[.06,.37,.26],
      [.27,.405,.285],[.47,.48,.32],[.64,.55,.34],[.77,.51,.32],
      [.87,.39,.265],[.96,.245,.19],[1.08,.16,.15],[1.25,.15,.145]
    ];
    mannequin.add(ringSurface(torsoProfile, bodyMat, 128));
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .32, 48), bodyMat);
    neck.position.y = 1.36; neck.castShadow = true; mannequin.add(neck);
    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(.15,.018,12,64), darkMetal);
    neckRing.rotation.x = Math.PI / 2; neckRing.position.y = 1.51; mannequin.add(neckRing);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.045,48), darkMetal); cap.position.y = 1.56; mannequin.add(cap);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(.075,32,24), darkMetal); finial.position.y = 1.63; mannequin.add(finial);

    // Smooth, tapered shoulder and arm forms rather than primitive stacked pieces.
    for (const side of [-1,1]) {
      const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side*.48,.73,0), new THREE.Vector3(side*.66,.58,.005),
        new THREE.Vector3(side*.75,.30,.015), new THREE.Vector3(side*.78,-.02,.025),
        new THREE.Vector3(side*.76,-.23,.025)
      ]);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 48, .072, 18, false), bodyMat);
      arm.castShadow = true; mannequin.add(arm);
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(.16,32,24), bodyMat);
      shoulder.scale.set(1.25,.8,1); shoulder.position.set(side*.49,.70,0); mannequin.add(shoulder);
    }

    // Silver silk skirt: a continuous draped surface with pleats, gathered waist and soft folds.
    const skirtPos = [], skirtUv = [], skirtIdx = [];
    const rows = 72, cols = 144;
    for (let j=0; j<=rows; j++) {
      const v = j / rows;
      for (let i=0; i<=cols; i++) {
        const u = i / cols, a = u * Math.PI * 2;
        const pleat = Math.cos(a*18 + v*1.7) * (.012 + v*.035);
        const fold = Math.sin(a*9 - v*4.5) * .018 * v;
        const radiusX = .40 + v*.32 + pleat + fold;
        const radiusZ = .285 + v*.25 + pleat*.72 + fold*.6;
        const y = .05 - v*1.56 + Math.sin(a*18 + v*1.7)*.014*v;
        const drape = .035*Math.sin(a*3 + v*3.2)*v;
        skirtPos.push(Math.cos(a)*radiusX, y, Math.sin(a)*radiusZ + drape);
        skirtUv.push(u, v);
      }
    }
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) {
      const a=j*(cols+1)+i,b=a+1,c=a+cols+2,d=a+cols+1;
      skirtIdx.push(a,d,b,b,d,c);
    }
    const skirtGeo = new THREE.BufferGeometry();
    skirtGeo.setAttribute('position',new THREE.Float32BufferAttribute(skirtPos,3));
    skirtGeo.setAttribute('uv',new THREE.Float32BufferAttribute(skirtUv,2));
    skirtGeo.setIndex(skirtIdx); skirtGeo.computeVertexNormals();
    const skirt = new THREE.Mesh(skirtGeo,satin); skirt.castShadow=true; skirt.receiveShadow=true; mannequin.add(skirt);

    // Diagonal silk wrap over the bodice with fine natural folds.
    const wrapPos=[], wrapUv=[], wrapIdx=[];
    const wr=52,wc=88;
    for(let j=0;j<=wr;j++){
      const v=j/wr;
      for(let i=0;i<=wc;i++){
        const u=i/wc, y=.78-v*.94;
        const a=(u-.5)*2.05 + (v-.5)*.24;
        const rx=.50 + v*.045;
        const rz=.326 + v*.025;
        const fold=Math.sin(u*Math.PI*13 + v*2.8)*.012 + Math.sin(u*Math.PI*25-v*3)*.004;
        const diagonal=(u-.5)*.23;
        wrapPos.push(Math.sin(a)*(rx+fold), y+diagonal, Math.cos(a)*(rz+fold));
        wrapUv.push(u,v);
      }
    }
    for(let j=0;j<wr;j++)for(let i=0;i<wc;i++){
      const a=j*(wc+1)+i,b=a+1,c=a+wc+2,d=a+wc+1;
      wrapIdx.push(a,d,b,b,d,c);
    }
    const wrapGeo=new THREE.BufferGeometry();
    wrapGeo.setAttribute('position',new THREE.Float32BufferAttribute(wrapPos,3));
    wrapGeo.setAttribute('uv',new THREE.Float32BufferAttribute(wrapUv,2));
    wrapGeo.setIndex(wrapIdx);wrapGeo.computeVertexNormals();
    const wrap=new THREE.Mesh(wrapGeo,satin);wrap.castShadow=true;wrap.receiveShadow=true;mannequin.add(wrap);

    // Fine tailoring details and polished pedestal.
    const waist = new THREE.Mesh(new THREE.TorusGeometry(.405,.014,10,100),darkMetal);
    waist.rotation.x=Math.PI/2;waist.position.y=.035;mannequin.add(waist);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,1.05,32),darkMetal); pole.position.y=-1.82;mannequin.add(pole);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.12,64),darkMetal);collar.position.y=-1.34;mannequin.add(collar);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.58,.68,.14,80),new THREE.MeshStandardMaterial({color:0x17181c,metalness:.78,roughness:.28}));
    base.position.y=-2.43;base.castShadow=true;mannequin.add(base);
    const rimLine=new THREE.Mesh(new THREE.TorusGeometry(.63,.012,12,96),darkMetal);rimLine.rotation.x=Math.PI/2;rimLine.position.y=-2.35;mannequin.add(rimLine);

    // Dark seamless studio, subtle reflective floor and restrained halo.
    const floor = new THREE.Mesh(new THREE.CircleGeometry(7,96),new THREE.MeshStandardMaterial({color:0x111216,roughness:.34,metalness:.22}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-2.52;floor.receiveShadow=true;scene.add(floor);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(2.25,.006,8,160),new THREE.MeshBasicMaterial({color:0x555a63,transparent:true,opacity:.5}));
    halo.position.set(0,-.2,-1.5);scene.add(halo);

    const resize=()=>{
      const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    };
    observer=new ResizeObserver(resize);observer.observe(host);resize();
    let dragging=false,lastX=0,target=0,zoom=8.8;
    host.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;host.setPointerCapture?.(e.pointerId);});
    host.addEventListener('pointermove',e=>{if(!dragging)return;target+=(e.clientX-lastX)*.009;lastX=e.clientX;});
    const stop=()=>{dragging=false;};host.addEventListener('pointerup',stop);host.addEventListener('pointercancel',stop);host.addEventListener('lostpointercapture',stop);
    host.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.006,6.5,11.5);},{passive:false});
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock=new THREE.Clock();
    const animate=()=>{
      frame=requestAnimationFrame(animate);
      const t=clock.getElapsedTime();
      if(!reduced&&!dragging)target+=.0012;
      stage.rotation.y+=(target-stage.rotation.y)*.055;
      camera.position.z+=(zoom-camera.position.z)*.08;
      if(!reduced){skirt.rotation.y=Math.sin(t*.55)*.008;wrap.rotation.y=Math.sin(t*.42)*.006;}
      renderer.render(scene,camera);
    };
    animate();
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer?.disconnect();renderer?.dispose();},{once:true});
  } catch(error) {
    host.innerHTML='<div class="three-fallback"><span>THREADS / ATELIER</span><b>FORM STUDY 01</b><small>3D studio unavailable in this browser</small></div>';
    console.error('THREADS 3D studio failed:',error);
  }
}