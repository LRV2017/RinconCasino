const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
let threeModulePromise=null;
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cardFace=(value,hidden=false)=>{
  const canvas=document.createElement("canvas");canvas.width=256;canvas.height=360;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle=hidden?"#26392b":"#f4f0e5";ctx.fillRect(0,0,256,360);
  if(hidden){
    ctx.strokeStyle="#9aaa79";ctx.lineWidth=12;ctx.strokeRect(18,18,220,324);
    for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(20,i*46+10);ctx.lineTo(236,i*46+56);ctx.stroke();}
    ctx.fillStyle="#d8c88f";ctx.font="bold 42px Georgia";ctx.textAlign="center";ctx.fillText("R",128,200);
  }else{
    ctx.fillStyle=/[♥♦]/.test(value)?"#b64246":"#20251e";
    ctx.font="bold 66px Georgia";ctx.textAlign="left";ctx.fillText(value,22,82);
    ctx.font="140px Georgia";ctx.textAlign="center";ctx.fillText(value.slice(-1),128,242);
    ctx.strokeStyle="#b9b6a7";ctx.lineWidth=5;ctx.strokeRect(10,10,236,340);
  }
  return canvas;
};
function getThree(){if(!threeModulePromise)threeModulePromise=import(THREE_URL);return threeModulePromise;}
function formatDiceValue(v){return Math.max(1,Math.min(6,Number(v)||1));}
export function mountArena3D(root,initialConfig={}){
  let config=initialConfig,stage=null,renderer=null,scene=null,camera=null,world=null,frame=0,observer=null,disposed=false,dragging=false,lastX=0,lastY=0,yaw=0,pitch=.42,distance=16,THREE=null,failed=false;
  const disposeObject=object=>{
    object.traverse?.(node=>{
      node.geometry?.dispose?.();
      const materials=Array.isArray(node.material)?node.material:[node.material];
      materials.forEach(material=>{
        if(material?.map)material.map.dispose?.();
        material?.dispose?.();
      });
    });
  };
  const attach=()=>{
    const next=root.querySelector(".arena3d-stage");
    if(!next)return null;
    stage=next;
    if(renderer&&renderer.domElement.parentNode!==stage)stage.appendChild(renderer.domElement);
    return stage;
  };
  const fallback=()=>{
    const host=attach();if(!host||renderer)return;
    failed=true;host.classList.add("arena3d-fallback");
    const players=config.players||[];
    host.innerHTML='<div class="arena3d-fallback-glow"></div><div class="arena3d-fallback-table"><span class="arena3d-fallback-pot">POT · '+esc(config.pot||0)+'</span><div class="arena3d-fallback-center">'+esc(config.title||"RINCON TABLE")+'</div></div><div class="arena3d-fallback-seats">'+players.map((p,i)=>'<div class="arena3d-fallback-seat seat-'+i+'"><span class="arena3d-fallback-avatar">'+(p.human?"YOU":"●")+'</span><b>'+esc(p.name)+'</b><small>'+esc(p.status||"IN GAME")+'</small></div>').join("")+'</div><div class="arena3d-fallback-hint">3D preview needs WebGL and access to the 3D renderer</div>';
  };
  const createLabel=(text,width=2.5,height=.62)=>{
    const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#10160fe8";ctx.strokeStyle="#c7b77d";ctx.lineWidth=5;
    ctx.beginPath();ctx.roundRect(5,5,502,118,22);ctx.fill();ctx.stroke();
    ctx.fillStyle="#f2efd9";ctx.font="bold 43px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(text).slice(0,22),256,64);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
    sprite.scale.set(width,height,1);return sprite;
  };
  const createCard=(label,hidden,x,z,rotation=0)=>{
    const texture=new THREE.CanvasTexture(cardFace(label,hidden));texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:.68,metalness:.02});
    const card=new THREE.Mesh(new THREE.BoxGeometry(.78,.055,1.12),material);
    card.position.set(x,1.11,z);card.rotation.y=rotation;card.castShadow=true;card.receiveShadow=true;
    return card;
  };
  const createDie=(value,x,z,scale=.48)=>{
    const n=formatDiceValue(value);
    const face=()=>{const c=document.createElement("canvas");c.width=128;c.height=128;const ctx=c.getContext("2d");ctx.fillStyle="#f5f1e7";ctx.fillRect(0,0,128,128);ctx.fillStyle="#252a22";const positions={1:[[64,64]],2:[[34,34],[94,94]],3:[[32,32],[64,64],[96,96]],4:[[34,34],[94,34],[34,94],[94,94]],5:[[34,34],[94,34],[64,64],[34,94],[94,94]],6:[[34,28],[94,28],[34,64],[94,64],[34,100],[94,100]]};for(const [px,py] of positions[n]){ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fill();}return new THREE.CanvasTexture(c);};
    const materials=[3,4,1,6,2,5].map(v=>{const texture=face();texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:texture,roughness:.45});});
    const die=new THREE.Mesh(new THREE.BoxGeometry(scale,scale,scale),materials);
    die.position.set(x,1.25,z);die.rotation.set(.25*n,.35*n,.14*n);die.castShadow=true;
    return die;
  };
  const addAvatar=(player,index,count)=>{
    const angle=Math.PI/2+index*Math.PI*2/count;
    const rx=7.0,rz=5.0,x=Math.cos(angle)*rx,z=Math.sin(angle)*rz;
    const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=-angle+Math.PI/2;
    const chair=new THREE.Mesh(new THREE.CylinderGeometry(.72,.8,.28,20),new THREE.MeshStandardMaterial({color:player.human?0xb69a61:0x303b31,roughness:.85}));
    chair.position.y=.55;chair.castShadow=true;group.add(chair);
    const back=new THREE.Mesh(new THREE.BoxGeometry(1.18,1.32,.2),new THREE.MeshStandardMaterial({color:player.human?0x9e7945:0x263b31,roughness:.8}));
    back.position.set(0,1.05,-.62);back.castShadow=true;group.add(back);
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,1.25,16),new THREE.MeshStandardMaterial({color:player.human?0x627f9a:[0x7c5849,0x536a85,0x7a744b,0x725b83,0x446f64][index%5],roughness:.9}));
    torso.position.set(0,1.45,.05);torso.castShadow=true;group.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.34,20,16),new THREE.MeshStandardMaterial({color:player.human?0xd4ad8a:[0xd7ad8c,0xb9866f,0xe0bd99,0xb58a75,0xd3ac89][index%5],roughness:.9}));
    head.position.set(0,2.28,.08);head.castShadow=true;group.add(head);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.35,16,10,0,Math.PI*2,0,Math.PI*.45),new THREE.MeshStandardMaterial({color:player.human?0x30261e:[0x33271e,0x201d1c,0x4a3829,0x29232c,0x3c3028][index%5]}));
    hair.position.set(0,2.38,.08);group.add(hair);
    const label=createLabel((player.human?"YOU · ":"")+player.name,2.35,.55);label.position.set(0,3.12,.1);group.add(label);
    if(player.score!==undefined){const score=createLabel("SCORE · "+player.score,2.0,.42);score.position.set(0,3.62,.1);group.add(score);}
    if(player.stack!==undefined){const stack=createLabel(player.stack+" CHIPS",1.9,.4);stack.position.set(0,.15,.1);group.add(stack);}
    world.add(group);
    const dice=player.dice||[];
    if(player.holeCards?.length){
      player.holeCards.slice(0,5).forEach((label,i)=>world.add(createCard(label,!!player.hideCards,x+(i-(player.holeCards.length-1)/2)*.62,z+(z>0?-1.55:1.5),0)));
    }
    dice.slice(0,5).forEach((v,i)=>world.add(createDie(v,x+(i-2)*.62,z+(z>0?-1.45:1.35),.42)));
    for(let i=dice.length;i<(player.hiddenDice||0);i++)world.add(createDie(1,x+((i%5)-2)*.6,z+(z>0?-1.4:1.4),.4));
  };
  const addBoardObjects=()=>{
    const data=config.boardData;
    if(data?.grid?.length){
      const rows=data.grid.length,cols=Math.max(...data.grid.map(row=>row.length));
      const cell=Math.min(5.7/Math.max(rows,cols),.82),offsetX=-(cols-1)*cell/2,offsetZ=-(rows-1)*cell/2;
      for(let r=0;r<rows;r++)for(let col=0;col<(data.grid[r]||[]).length;col++){
        const value=data.grid[r][col],x=offsetX+col*cell,z=offsetZ+r*cell;
        const chessLike=["chess","checkers"].includes(data.mode),alternating=(r+col)%2===0;
        const tileColor=chessLike?(alternating?0xd6c7a4:0x56674a):(alternating?0x355644:0x294333);
        const tile=new THREE.Mesh(new THREE.BoxGeometry(cell*.97,.085,cell*.97),new THREE.MeshStandardMaterial({color:tileColor,roughness:.85}));
        tile.position.set(x,1.13,z);tile.receiveShadow=true;world.add(tile);
        if(!value)continue;
        const label=String(value),isLight=/^(X|r|R|[KQBNRP])$/.test(label);
        const color=data.mode==="connect4"?(label==="X"?0xe0b94c:0xb84a43):data.mode==="reversi"?(label==="X"?0xe1dfcf:0x202321):data.mode==="gomoku"?(label==="X"?0x252a27:0xe3e0cf):data.mode==="checkers"?(label.toLowerCase()==="r"?0xb44a40:0x252a29):data.mode==="chess"?(isLight?0xe9e2cc:0x252b2d):(label==="X"?0xe3c36c:0x86a9a7);
        const piece=new THREE.Mesh(new THREE.CylinderGeometry(cell*.33,cell*.38,.19,24),new THREE.MeshStandardMaterial({color,metalness:.14,roughness:.42}));
        piece.position.set(x,1.28,z);piece.castShadow=true;world.add(piece);
        if(data.mode==="chess"){
          const cap=new THREE.Mesh(new THREE.SphereGeometry(cell*.24,16,12),new THREE.MeshStandardMaterial({color,metalness:.1,roughness:.45}));
          cap.position.set(x,1.48,z);world.add(cap);
        }else if(data.mode==="checkers"&&label===label.toUpperCase()){
          const crown=new THREE.Mesh(new THREE.TorusGeometry(cell*.2,.045,6,20),new THREE.MeshStandardMaterial({color:0xe3c46e,metalness:.65}));
          crown.rotation.x=Math.PI/2;crown.position.set(x,1.41,z);world.add(crown);
        }
      }
    }
    if(config.numberGrid?.length){
      const rows=config.numberGrid,cell=.72;
      rows.forEach((row,r)=>row.forEach((value,col)=>{
        const x=(col-2)*cell,z=(r-2)*cell,marked=!!(config.numberMarked&&config.numberMarked[r]?.[col]);
        const tile=new THREE.Mesh(new THREE.BoxGeometry(.66,.11,.66),new THREE.MeshStandardMaterial({color:marked?0x9c8450:0x3b4a37,roughness:.75}));
        tile.position.set(x,1.16,z);tile.castShadow=true;world.add(tile);
        const label=createLabel(value===0?"FREE":String(value),.57,.35);label.position.set(x,1.55,z);world.add(label);
      }));
    }
    if(config.pits?.length===14){
      const pits=config.pits;
      for(let side=0;side<2;side++)for(let col=0;col<6;col++){
        const index=side===0?12-col:col,x=(col-2.5)*.83,z=side===0?-1.18:1.18;
        const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.34,.25,.22,24),new THREE.MeshStandardMaterial({color:0x47392b,roughness:.85}));
        bowl.position.set(x,1.23,z);world.add(bowl);
        const count=pits[index]||0;
        for(let stone=0;stone<Math.min(count,12);stone++){
          const angle=stone*2.4,rad=.06+Math.floor(stone/6)*.1;
          const marble=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),new THREE.MeshStandardMaterial({color:stone%2?0xe0c783:0xb6a36b,roughness:.42,metalness:.08}));
          marble.position.set(x+Math.cos(angle)*rad,1.42+(stone%3)*.045,z+Math.sin(angle)*rad);world.add(marble);
        }
        const label=createLabel(String(count),.7,.34);label.position.set(x,1.82,z);world.add(label);
      }
      [6,13].forEach((index,i)=>{
        const x=i===0?-3.3:3.3,z=0;
        const store=new THREE.Mesh(new THREE.CylinderGeometry(.56,.58,.34,24),new THREE.MeshStandardMaterial({color:0x8a7045,roughness:.55}));
        store.position.set(x,1.25,z);world.add(store);
        const label=createLabel("STORE "+pits[index],1.5,.42);label.position.set(x,1.85,z);world.add(label);
      });
    }
    if(config.piles?.length){
      config.piles.forEach((count,index)=>{
        const x=(index-(config.piles.length-1)/2)*1.55;
        for(let n=0;n<count;n++){
          const token=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.16,20),new THREE.MeshStandardMaterial({color:0xcab16a,metalness:.22,roughness:.4}));
          token.position.set(x,1.2+n*.16,0);token.castShadow=true;world.add(token);
        }
        const label=createLabel("PILE "+(index+1)+" · "+count,1.7,.42);label.position.set(x,2.3+Math.min(count,6)*.11,0);world.add(label);
      });
    }
  };
  const buildScene=()=>{
    if(!THREE||!scene||!world)return;
    while(world.children.length){const child=world.children[0];world.remove(child);disposeObject(child);}
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x111913,roughness:1}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.15;floor.receiveShadow=true;world.add(floor);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(6.1,6.1,.62,72),new THREE.MeshStandardMaterial({color:0x3e2d1e,roughness:.65,metalness:.12}));
    base.scale.z=.72;base.position.y=.56;base.castShadow=true;base.receiveShadow=true;world.add(base);
    const felt=new THREE.Mesh(new THREE.CylinderGeometry(5.92,5.92,.16,72),new THREE.MeshStandardMaterial({color:config.kind==="dice"?0x283f57:0x164b37,roughness:.92}));
    felt.scale.z=.72;felt.position.y=.93;felt.receiveShadow=true;world.add(felt);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(5.95,.11,12,80),new THREE.MeshStandardMaterial({color:0xb08d54,metalness:.55,roughness:.35}));
    rim.rotation.x=Math.PI/2;rim.scale.set(1,.72,1);rim.position.y=1.02;world.add(rim);
    for(const [x,z] of [[-3.6,-2.9],[3.6,-2.9],[-3.6,2.9],[3.6,2.9]]){
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,1.2,12),new THREE.MeshStandardMaterial({color:0x4b3827,metalness:.25,roughness:.6}));
      leg.position.set(x,-.05,z);leg.castShadow=true;world.add(leg);
    }
    const players=(config.players&&config.players.length?config.players:([{name:"You",human:true},...["Rico","Maya","Ace","Nova"].map(name=>({name}))]));
    players.forEach((player,index)=>addAvatar(player,index,players.length));
    addBoardObjects();
    if(config.kind==="poker"){
      const board=config.board||[];
      board.forEach((c,i)=>world.add(createCard(c,false,(i-2)*.9,-.25,0)));
      const playerCards=config.playerCards||[];
      playerCards.forEach((c,i)=>world.add(createCard(c,false,(i-(playerCards.length-1)/2)*.9,2.1,0)));
      if(!board.length){
        for(let i=0;i<5;i++)world.add(createCard("RINCON",true,(i-2)*.9,-.25,0));
      }
      const pot=new THREE.Mesh(new THREE.CylinderGeometry(.52,.58,.18,24),new THREE.MeshStandardMaterial({color:0xb38b3f,metalness:.68,roughness:.28}));
      pot.position.set(0,1.12,-1.65);pot.castShadow=true;world.add(pot);
      const chipColors=[0xc9b36e,0x20252d,0x8f3c38];
      for(let stack=0;stack<3;stack++)for(let i=0;i<4;i++){
        const chip=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.09,24),new THREE.MeshStandardMaterial({color:chipColors[stack],metalness:.22,roughness:.42}));
        chip.position.set(-.65+stack*.65,1.1+i*.095,-1.65);chip.castShadow=true;world.add(chip);
      }
    }else{
      (config.centerDice||[]).slice(0,12).forEach((v,i)=>world.add(createDie(v,((i%6)-2.5)*.75,Math.floor(i/6)*.9-.35,.58)));
      if(config.centerText){
        const label=createLabel(config.centerText,3.2,.72);label.position.set(0,2.5,-.4);world.add(label);
      }
      if(config.pieces){
        config.pieces.slice(0,36).forEach((piece,i)=>{
          const token=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.12,20),new THREE.MeshStandardMaterial({color:piece.color||0xe3c56f,metalness:.16,roughness:.5}));
          token.position.set(((i%9)-4)*.55,1.12,Math.floor(i/9)*.48-.8);token.castShadow=true;world.add(token);
        });
      }
    }
  };
  const resize=()=>{
    const host=attach();if(!host||!renderer||!camera)return;
    const width=Math.max(320,host.clientWidth||800),height=Math.max(250,host.clientHeight||410);
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
  };
  const updateCamera=()=>{
    if(!camera)return;
    const radius=Math.max(10,Math.min(23,distance));
    camera.position.set(Math.sin(yaw)*radius,4.2+pitch*6,Math.cos(yaw)*radius);
    camera.lookAt(0,1.1,0);
  };
  const render=()=>{
    if(disposed||!renderer)return;
    frame=requestAnimationFrame(render);
    updateCamera();renderer.render(scene,camera);
  };
  const initialize=async()=>{
    try{
      THREE=await getThree();
      if(disposed)return;
      const host=attach();if(!host)return;
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.domElement.className="arena3d-canvas";renderer.domElement.setAttribute("aria-label","Interactive 3D multiplayer table. Drag to orbit.");
      scene=new THREE.Scene();scene.background=new THREE.Color(0x111812);scene.fog=new THREE.Fog(0x111812,18,34);
      camera=new THREE.PerspectiveCamera(42,1,.1,100);
      world=new THREE.Group();scene.add(world);
      scene.add(new THREE.HemisphereLight(0xdde8dc,0x20281e,2.0));
      const key=new THREE.DirectionalLight(0xffe1b0,3.1);key.position.set(-5,12,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
      const fill=new THREE.PointLight(0x82b8e2,34,22);fill.position.set(7,7,-6);scene.add(fill);
      buildScene();resize();
      observer=new ResizeObserver(resize);observer.observe(host);
      host.appendChild(renderer.domElement);
      const onDown=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);};
      const onMove=e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.006;pitch=Math.max(.12,Math.min(.95,pitch+dy*.003));};
      const onUp=()=>{dragging=false;};
      const onWheel=e=>{e.preventDefault();distance=Math.max(10,Math.min(23,distance+e.deltaY*.012));};
      renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointermove",onMove);renderer.domElement.addEventListener("pointerup",onUp);renderer.domElement.addEventListener("pointercancel",onUp);renderer.domElement.addEventListener("wheel",onWheel,{passive:false});
      renderer.domElement._arenaCleanup=()=>{renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointermove",onMove);renderer.domElement.removeEventListener("pointerup",onUp);renderer.domElement.removeEventListener("pointercancel",onUp);renderer.domElement.removeEventListener("wheel",onWheel);};
      buildScene();render();
    }catch(error){fallback();}
  };
  const update=next=>{
    config=next||config;
    const host=attach();
    if(renderer&&host){buildScene();resize();}
    else if(failed)fallback();
  };
  const destroy=()=>{
    disposed=true;if(frame)cancelAnimationFrame(frame);observer?.disconnect();
    renderer?.domElement?._arenaCleanup?.();renderer?.dispose?.();
    if(world)disposeObject(world);
  };
  initialize();
  return {update,destroy};
}
