function mountDressforms(root = document) {
  const hosts = [];
  if (root instanceof Element && root.matches("#dressform, #loginDressform, #workspaceDressform, #designDressform, [data-dressform-preview]")) hosts.push(root);
  if (root.querySelectorAll) hosts.push(...root.querySelectorAll("#dressform, #loginDressform, #workspaceDressform, #designDressform, [data-dressform-preview]"));
  hosts.forEach(host => { if (!host.dataset.dressformReady) bootDressform(host); });
}
mountDressforms();
const mountObserver = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
  if (node.nodeType === 1) mountDressforms(node);
})));
mountObserver.observe(document.documentElement, { childList: true, subtree: true });

async function bootDressform(host) {
  host.dataset.dressformReady = "true";
  const fallback = () => {
    host.innerHTML = '<div class="three-fallback" role="status"><span>THREADS / ATELIER</span><b>FORM STUDY 01</b><small>Interactive 3D is unavailable here. Your styling workspace remains available.</small></div>';
  };

  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js");
    if (!("WebGLRenderingContext" in window)) throw new Error("WebGL is unavailable");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#512a34");
    scene.fog = new THREE.Fog("#512a34", 8, 18);

    const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
    const targetPoint = new THREE.Vector3(0, -.35, 0);
    let zoom = 8.8, pitch = 0, yaw = 0, targetYaw = 0, targetPitch = 0;
    camera.position.set(0, .8, zoom);
    camera.lookAt(targetPoint);

    const mobile = matchMedia("(max-width: 650px)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.15 : 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.replaceChildren(renderer.domElement);

    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Interactive 3D couture mannequin. Drag to rotate, pinch or Control plus wheel to zoom. Use arrow keys, plus, minus and zero.");
    canvas.style.touchAction = "pan-y";

    scene.add(new THREE.HemisphereLight(0xffe9e4, 0x3b2028, 1.65));
    const key = new THREE.DirectionalLight(0xfff0e8, 3.25);
    key.position.set(3.5, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    key.shadow.camera.left = -4; key.shadow.camera.right = 4;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe6aeb8, 3.1);
    rim.position.set(-4, 3, -4); scene.add(rim);
    const fill = new THREE.PointLight(0xffd8d1, 1.25, 12);
    fill.position.set(2, 1, 5); scene.add(fill);
    const top = new THREE.SpotLight(0xffeee8, 72, 16, Math.PI / 5, .65, 1.4);
    top.position.set(0, 6, 1); top.castShadow = !mobile; scene.add(top);

    const stage = new THREE.Group();
    scene.add(stage);
    const mannequin = new THREE.Group();
    stage.add(mannequin);
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xd9c8bd, roughness: .48, metalness: .04, clearcoat: .22 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x9a6b64, metalness: .72, roughness: .3 });
    const garment = new THREE.MeshPhysicalMaterial({
      color: 0x873f50, roughness: .3, metalness: .08, clearcoat: .72,
      clearcoatRoughness: .22, sheen: 1, sheenColor: new THREE.Color(0xe9b9bd),
      side: THREE.DoubleSide
    });
    const garmentMeshes = [];

    function surface(profile, material, segments = 120) {
      const positions = [], indices = [];
      profile.forEach(([y, rx, rz], j) => {
        for (let i = 0; i <= segments; i++) {
          const a = i / segments * Math.PI * 2;
          positions.push(Math.cos(a) * rx, y, Math.sin(a) * rz);
        }
      });
      for (let j = 0; j < profile.length - 1; j++) for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i, b = a + 1, c = a + segments + 2, d = a + segments + 1;
        indices.push(a, d, b, b, d, c);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true; mesh.receiveShadow = true;
      return mesh;
    }

    mannequin.add(surface([
      [-1.34,.43,.30],[-1.25,.51,.34],[-1.08,.56,.36],[-.88,.54,.35],
      [-.67,.47,.31],[-.43,.40,.275],[-.18,.365,.255],[.06,.37,.26],
      [.27,.405,.285],[.47,.48,.32],[.64,.55,.34],[.77,.51,.32],
      [.87,.39,.265],[.96,.245,.19],[1.08,.16,.15],[1.25,.15,.145]
    ], bodyMat, 128));

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.32,48), bodyMat);
    neck.position.y = 1.36; mannequin.add(neck);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(.075,32,24), metal);
    finial.position.y = 1.63; mannequin.add(finial);

    for (const side of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side*.48,.73,0), new THREE.Vector3(side*.66,.58,.005),
        new THREE.Vector3(side*.75,.30,.015), new THREE.Vector3(side*.78,-.02,.025),
        new THREE.Vector3(side*.76,-.23,.025)
      ]);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(curve,48,.072,18,false),bodyMat);
      arm.castShadow = true; mannequin.add(arm);
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(.16,32,24),bodyMat);
      shoulder.scale.set(1.25,.8,1); shoulder.position.set(side*.49,.70,0); mannequin.add(shoulder);
    }

    const rows = 76, cols = 144, skirtPositions = [], skirtIndices = [];
    for (let j = 0; j <= rows; j++) {
      const v = j / rows;
      for (let i = 0; i <= cols; i++) {
        const u = i / cols, a = u * Math.PI * 2;
        const pleat = Math.cos(a*18 + v*1.7) * (.012 + v*.035);
        const fold = Math.sin(a*9 - v*4.5) * .018 * v;
        const rx = .40 + v*.32 + pleat + fold;
        const rz = .285 + v*.25 + pleat*.72 + fold*.6;
        skirtPositions.push(Math.cos(a)*rx, .05-v*1.56 + Math.sin(a*18+v*1.7)*.014*v, Math.sin(a)*rz + .035*Math.sin(a*3+v*3.2)*v);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = j*(cols+1)+i, b=a+1, c=a+cols+2, d=a+cols+1;
      skirtIndices.push(a,d,b,b,d,c);
    }
    const skirtGeometry = new THREE.BufferGeometry();
    skirtGeometry.setAttribute("position",new THREE.Float32BufferAttribute(skirtPositions,3));
    skirtGeometry.setIndex(skirtIndices); skirtGeometry.computeVertexNormals();
    const skirt = new THREE.Mesh(skirtGeometry,garment);
    skirt.castShadow = true; skirt.receiveShadow = true; mannequin.add(skirt);
    garmentMeshes.push(skirt);

    const wrapPositions = [], wrapIndices = [], wr = 52, wc = 88;
    for (let j = 0; j <= wr; j++) {
      const v = j / wr;
      for (let i = 0; i <= wc; i++) {
        const u = i / wc, a = (u-.5)*2.05+(v-.5)*.24;
        const fold = Math.sin(u*Math.PI*13+v*2.8)*.012 + Math.sin(u*Math.PI*25-v*3)*.004;
        wrapPositions.push(Math.sin(a)*(.50+v*.045+fold), .78-v*.94+(u-.5)*.23, Math.cos(a)*(.326+v*.025+fold));
      }
    }
    for (let j=0;j<wr;j++) for(let i=0;i<wc;i++) {
      const a=j*(wc+1)+i,b=a+1,c=a+wc+2,d=a+wc+1;
      wrapIndices.push(a,d,b,b,d,c);
    }
    const wrapGeometry = new THREE.BufferGeometry();
    wrapGeometry.setAttribute("position",new THREE.Float32BufferAttribute(wrapPositions,3));
    wrapGeometry.setIndex(wrapIndices); wrapGeometry.computeVertexNormals();
    const wrap = new THREE.Mesh(wrapGeometry,garment);
    wrap.castShadow = true; wrap.receiveShadow = true; mannequin.add(wrap);
    garmentMeshes.push(wrap);

    const waist = new THREE.Mesh(new THREE.TorusGeometry(.405,.014,10,100),metal);
    waist.rotation.x=Math.PI/2; waist.position.y=.035; mannequin.add(waist);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,1.05,32),metal);
    pole.position.y=-1.82; mannequin.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.58,.68,.14,80),
      new THREE.MeshStandardMaterial({color:0x492630,metalness:.68,roughness:.3}));
    base.position.y=-2.43; base.castShadow=true; mannequin.add(base);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(7,96),
      new THREE.MeshStandardMaterial({color:0x603b42,roughness:.38,metalness:.16}));
    floor.rotation.x=-Math.PI/2; floor.position.y=-2.52; floor.receiveShadow=true; scene.add(floor);

    const frameMaterial = new THREE.MeshStandardMaterial({color:0xb1847e,metalness:.7,roughness:.28});
    const frame = new THREE.Group();
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.035,5.3,.035),frameMaterial);
    rail.position.set(-2.05,.1,-.9); frame.add(rail);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(4.15,.035,.035),frameMaterial);
    topRail.position.set(0,2.75,-.9); frame.add(topRail);
    scene.add(frame);

    const controls = document.createElement("div");
    controls.className = "dressform-controls";
    controls.innerHTML = '<div class="finish-switch" role="group" aria-label="Garment finish"><span>FABRIC</span><button type="button" data-finish="oxblood" aria-pressed="true">Oxblood</button><button type="button" data-finish="ivory" aria-pressed="false">Ivory</button><button type="button" data-finish="rose" aria-pressed="false">Dusty rose</button></div><div class="view-switch" role="group" aria-label="Mannequin view controls"><button type="button" data-view="left" aria-label="Rotate left">←</button><button type="button" data-view="right" aria-label="Rotate right">→</button><button type="button" data-view="in" aria-label="Zoom in">+</button><button type="button" data-view="out" aria-label="Zoom out">−</button><button type="button" data-view="reset" aria-label="Reset view">0</button></div>';
    host.parentElement?.append(controls);

    const finishes = {
      oxblood: { color: 0x873f50, sheen: 0xe9b9bd, metalness: .08 },
      ivory: { color: 0xe9ded3, sheen: 0xfff5e9, metalness: .04 },
      rose: { color: 0xc18e98, sheen: 0xf2d5d5, metalness: .03 }
    };
    controls.querySelectorAll("[data-finish]").forEach(button => button.addEventListener("click", () => {
      const finish = finishes[button.dataset.finish];
      garment.color.setHex(finish.color);
      garment.sheenColor.setHex(finish.sheen);
      garment.metalness = finish.metalness;
      garment.needsUpdate = true;
      controls.querySelectorAll("[data-finish]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    }));
    controls.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.view;
      if (action === "left") targetYaw -= .35;
      if (action === "right") targetYaw += .35;
      if (action === "in") zoom = Math.max(6.2, zoom - .6);
      if (action === "out") zoom = Math.min(11.5, zoom + .6);
      if (action === "reset") reset();
    }));

    const reset = () => { targetYaw = 0; targetPitch = 0; zoom = 8.8; };
    let pointers = new Map(), dragOrigin = null, pinchDistance = 0;
    canvas.addEventListener("pointerdown", event => {
      canvas.focus();
      pointers.set(event.pointerId, {x:event.clientX,y:event.clientY});
      if (pointers.size === 1) dragOrigin = {x:event.clientX,y:event.clientY};
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchDistance = Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      }
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener("pointermove", event => {
      if (!pointers.has(event.pointerId)) return;
      const previous = pointers.get(event.pointerId);
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if (pointers.size === 1) {
        targetYaw += (event.clientX-previous.x)*.009;
        targetPitch = THREE.MathUtils.clamp(targetPitch+(event.clientY-previous.y)*.006,-.48,.48);
      } else if (pointers.size === 2) {
        const pts=[...pointers.values()];
        const distance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        if (pinchDistance) zoom=THREE.MathUtils.clamp(zoom+(pinchDistance-distance)*.012,6.2,11.5);
        pinchDistance=distance;
      }
    });
    const release = event => { pointers.delete(event.pointerId); if (!pointers.size) dragOrigin=null; pinchDistance=0; };
    canvas.addEventListener("pointerup",release);
    canvas.addEventListener("pointercancel",release);
    canvas.addEventListener("lostpointercapture",release);
    canvas.addEventListener("dblclick",reset);
    canvas.addEventListener("wheel",event => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      zoom=THREE.MathUtils.clamp(zoom+event.deltaY*.006,6.2,11.5);
    },{passive:false});
    canvas.addEventListener("keydown",event => {
      if (event.key==="ArrowLeft") targetYaw-=.16;
      else if (event.key==="ArrowRight") targetYaw+=.16;
      else if (event.key==="ArrowUp") targetPitch=THREE.MathUtils.clamp(targetPitch-.12,-.48,.48);
      else if (event.key==="ArrowDown") targetPitch=THREE.MathUtils.clamp(targetPitch+.12,-.48,.48);
      else if (event.key==="+" || event.key==="=") zoom=Math.max(6.2,zoom-.5);
      else if (event.key==="-") zoom=Math.min(11.5,zoom+.5);
      else if (event.key==="0") reset();
      else return;
      event.preventDefault();
    });

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let raf = 0, visible = true, contextLost = false;
    const render = () => {
      raf = 0;
      if (!visible || document.hidden || contextLost) return;
      const t=clock.getElapsedTime();
      yaw += (targetYaw-yaw)*.075;
      pitch += (targetPitch-pitch)*.075;
      stage.rotation.set(pitch,yaw,0);
      camera.position.z += (zoom-camera.position.z)*.09;
      camera.lookAt(targetPoint);
      if (!reduced) {
        skirt.rotation.y=Math.sin(t*.55)*.006;
        wrap.rotation.y=Math.sin(t*.42)*.004;
      }
      renderer.render(scene,camera);
      raf=requestAnimationFrame(render);
    };
    const start = () => { if (!raf && visible && !document.hidden && !contextLost) raf=requestAnimationFrame(render); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf=0; };
    const resize = () => {
      const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1);
      renderer.setSize(width,height,false);
      camera.aspect=width/height; camera.updateProjectionMatrix();
      start();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host); resize();
    const intersection = new IntersectionObserver(entries => {
      visible=entries[0].isIntersecting;
      if (visible) start(); else stop();
    });
    intersection.observe(host);
    const onVisibility = () => document.hidden ? stop() : start();
    document.addEventListener("visibilitychange",onVisibility);
    canvas.addEventListener("webglcontextlost",event => {
      event.preventDefault(); contextLost=true; stop(); fallback();
    });
    canvas.addEventListener("webglcontextrestored",() => { contextLost=false; start(); });
    window.addEventListener("pagehide",() => {
      stop(); resizeObserver.disconnect(); intersection.disconnect();
      document.removeEventListener("visibilitychange",onVisibility);
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) (Array.isArray(object.material)?object.material:[object.material]).forEach(material=>material.dispose());
      });
      renderer.dispose(); controls.remove();
    },{once:true});
  } catch (error) {
    console.warn("THREADS 3D studio unavailable:",error);
    fallback();
  }
}