'use strict';

let cell=16, half=8, maxDotR=0, ringWidth=0, ringSpeed=0, lutScale=0, offsetX=0, offsetY=0;

const RING_BOOST=1220, RING_FALLOFF=0.75, RING_MIN_STR=4, FADE_MS=1200,
      MAX_RIPPLES=20, LUM_SKIP=2, LUT_N=64, SINC_SCALE=11, NEG_BOOST=3;

const falloffLUT=new Float32Array(2*LUT_N+1);
for(let i=0;i<=2*LUT_N;i++){
  const t=(i-LUT_N)/LUT_N*SINC_SCALE;
  const v=Math.abs(t)<1e-6?1:Math.sin(Math.PI*t)/(Math.PI*t);
  falloffLUT[i]=v<0?v*NEG_BOOST:v;
}

let _rng=1831565813;
function rand(){_rng^=_rng<<13;_rng^=_rng>>17;_rng^=_rng<<5;return(_rng>>>0)*2.3283064365386963e-10;}

const MAX_CELLS=320*220;
const triBuf=new Float32Array(MAX_CELLS*3), cirBuf=new Float32Array(MAX_CELLS*3),
      sqrBuf=new Float32Array(MAX_CELLS*3), boostBuf=new Float32Array(MAX_CELLS),
      visitedBuf=new Uint8Array(MAX_CELLS);
let triN=0, cirN=0, sqrN=0;

const RIPPLE_STRIDE=11;
const rippleBuf=new Float32Array(MAX_RIPPLES*RIPPLE_STRIDE);
let rippleCount=0;

let canvas,ctx,cols=0,rows=0;
let cachedLum=null,cachedShape=null,cachedCX=null,cachedCY=null;
let currentImg=null,fadeStart=-Infinity,lastTs=0;
let baseCanvas=null,baseValid=false,buildingBase=false,dirty=true,postReadyAfterRender=false;
let streaming=false; // true when lum arrives from a math source; disables base canvas

self.onmessage=function(e){
  const d=e.data;
  if(d.type==='init')  { canvas=d.canvas; ctx=canvas.getContext('2d'); applyResize(d); }
  if(d.type==='tick')  { const dt=Math.min((d.ts-lastTs)*0.001,0.15); lastTs=d.ts; render(d.ts,dt); }
  if(d.type==='resize'){ applyResize(d); baseCanvas=null; baseValid=false; buildingBase=false; dirty=true; postReadyAfterRender=true; }
  if(d.type==='ripple'){ addRipple(d.x,d.y); dirty=true; }
  if(d.type==='purge') { rippleCount=0; dirty=true; }
  if(d.type==='image') { streaming=false; currentImg=d.bitmap; cachePixels(); fadeStart=performance.now(); baseCanvas=null; baseValid=false; buildingBase=false; dirty=true; postReadyAfterRender=true; }
  if(d.type==='lum')   {
    if(d.cols!==cols||d.rows!==rows) return; // stale message from before a resize
    if(!cachedLum) postReadyAfterRender=true; // first frame — signal ready after render
    cachedLum=d.data;
    if(!cachedShape||cachedShape.length!==cachedLum.length) cachedShape=new Uint8Array(cachedLum.length);
    for(let i=0;i<cachedLum.length;i++) cachedShape[i]=cachedLum[i]<120?0:cachedLum[i]<170?1:2;
    streaming=true; dirty=true;
  }
};

function applyResize(d){
  cell=d.cell; half=cell*0.5; cols=d.cols; rows=d.rows;
  maxDotR=cell*0.525; ringWidth=55*cell/16; ringSpeed=333*cell/16; lutScale=LUT_N/ringWidth;
  canvas.width=d.width; canvas.height=d.height;
  offsetX=(cols*cell-d.width)/2; offsetY=(rows*cell-d.height)/2;
  buildCellCache();
  if(currentImg) cachePixels();
}

function buildCellCache(){
  cachedCX=new Float32Array(cols*rows); cachedCY=new Float32Array(cols*rows);
  for(let row=0;row<rows;row++){
    const base=row*cols, cy=row*cell+half-offsetY;
    for(let col=0;col<cols;col++){ cachedCX[base+col]=col*cell+half-offsetX; cachedCY[base+col]=cy; }
  }
}

function cachePixels(){
  const ofc=new OffscreenCanvas(cols,rows), ofCtx=ofc.getContext('2d');
  const scale=Math.max(cols/currentImg.width,rows/currentImg.height);
  const dw=currentImg.width*scale, dh=currentImg.height*scale;
  ofCtx.fillStyle='#000'; ofCtx.fillRect(0,0,cols,rows);
  ofCtx.drawImage(currentImg,(cols-dw)*0.5,(rows-dh)*0.5,dw,dh);
  const raw=ofCtx.getImageData(0,0,cols,rows).data, n=cols*rows;
  cachedLum=new Float32Array(n); cachedShape=new Uint8Array(n);
  for(let i=0;i<n;i++){
    const p=i<<2, lum=0.21*raw[p]+0.72*raw[p+1]+0.07*raw[p+2];
    cachedLum[i]=lum; cachedShape[i]=lum<120?0:lum<170?1:2;
  }
}

function addRipple(x,y){
  if(rippleCount>=MAX_RIPPLES){ rippleBuf.copyWithin(0,RIPPLE_STRIDE,rippleCount*RIPPLE_STRIDE); rippleCount--; }
  const b=rippleCount++*RIPPLE_STRIDE;
  rippleBuf[b]=x; rippleBuf[b+1]=y; rippleBuf[b+2]=0; rippleBuf[b+3]=0; rippleBuf[b+4]=RING_BOOST;
}

// Stamp one cell touched by a ripple: clear background if negative boost, else draw boosted dot.
// Reads/writes module-level triN/cirN/sqrN and the ctx beginPath that's already open.
function stamp(idx){
  if(visitedBuf[idx]) return; visitedBuf[idx]=1;
  const boost=boostBuf[idx]; if(!boost) return;
  if(boost<0){ ctx.rect(cachedCX[idx]-half,cachedCY[idx]-half,cell,cell); return; }
  let lum=cachedLum[idx]+boost; if(lum>255) lum=255;
  if(lum<LUM_SKIP) return;
  const dotR=maxDotR*lum*(1/255); if(dotR<0.15) return;
  const s=(rand()<boost*0.025)?(rand()*3)|0:cachedShape[idx];
  const cx=cachedCX[idx],cy=cachedCY[idx];
  if(s===0){triBuf[triN++]=cx;triBuf[triN++]=cy;triBuf[triN++]=dotR;}
  else if(s===1){cirBuf[cirN++]=cx;cirBuf[cirN++]=cy;cirBuf[cirN++]=dotR;}
  else{sqrBuf[sqrN++]=cx;sqrBuf[sqrN++]=cy;sqrBuf[sqrN++]=dotR;}
}

function drawPasses(c){
  c.beginPath();
  for(let i=0;i<triN;i+=3){ const cx=triBuf[i],cy=triBuf[i+1],r=triBuf[i+2]; c.moveTo(cx,cy-r); c.lineTo(cx+r*0.866,cy+r*0.5); c.lineTo(cx-r*0.866,cy+r*0.5); c.closePath(); }
  c.fill();
  c.beginPath();
  for(let i=0;i<cirN;i+=3){ const cx=cirBuf[i],cy=cirBuf[i+1],r=cirBuf[i+2],rh=r*0.5,r87=r*0.866; c.moveTo(cx+r,cy); c.lineTo(cx+rh,cy+r87); c.lineTo(cx-rh,cy+r87); c.lineTo(cx-r,cy); c.lineTo(cx-rh,cy-r87); c.lineTo(cx+rh,cy-r87); c.closePath(); }
  c.fill();
  c.beginPath();
  for(let i=0;i<sqrN;i+=3){ const cx=sqrBuf[i],cy=sqrBuf[i+1],s=sqrBuf[i+2]*0.88; c.rect(cx-s,cy-s,s+s,s+s); }
  c.fill();
}

function scheduleBaseCanvas(){
  if(buildingBase||baseValid) return;
  buildingBase=true;
  setTimeout(function(){
    if(!cachedLum){ buildingBase=false; return; }
    baseCanvas=new OffscreenCanvas(canvas.width,canvas.height);
    const bCtx=baseCanvas.getContext('2d');
    bCtx.fillStyle='#000'; bCtx.fillRect(0,0,canvas.width,canvas.height);
    bCtx.fillStyle='#fff'; triN=cirN=sqrN=0;
    for(let row=0;row<rows;row++){
      const rowBase=row*cols;
      for(let col=0;col<cols;col++){
        const idx=rowBase+col, lum=cachedLum[idx];
        if(lum<LUM_SKIP) continue;
        const dotR=maxDotR*lum*(1/255); if(dotR<0.15) continue;
        const s=cachedShape[idx], cx=cachedCX[idx], cy=cachedCY[idx];
        if(s===0){triBuf[triN++]=cx;triBuf[triN++]=cy;triBuf[triN++]=dotR;}
        else if(s===1){cirBuf[cirN++]=cx;cirBuf[cirN++]=cy;cirBuf[cirN++]=dotR;}
        else{sqrBuf[sqrN++]=cx;sqrBuf[sqrN++]=cy;sqrBuf[sqrN++]=dotR;}
      }
    }
    drawPasses(bCtx);
    baseValid=true; buildingBase=false; dirty=true;
  },0);
}

function computeBoosts(){
  boostBuf.fill(0);
  for(let ri=0;ri<rippleCount;ri++){
    const rb=ri*RIPPLE_STRIDE;
    const rx=rippleBuf[rb],ry=rippleBuf[rb+1],rr=rippleBuf[rb+2],str=rippleBuf[rb+4];
    const inner2=rippleBuf[rb+5],outer2=rippleBuf[rb+6];
    const mnC=rippleBuf[rb+7]|0,mxC=rippleBuf[rb+8]|0,mnR=rippleBuf[rb+9]|0,mxR=rippleBuf[rb+10]|0;
    for(let row=mnR;row<=mxR;row++){
      const rowBase=row*cols, dy=cachedCY[rowBase]-ry, dy2=dy*dy;
      if(dy2>=outer2) continue;
      const outerDx=Math.sqrt(outer2-dy2);
      const cL=Math.max(mnC,Math.floor((rx-outerDx-half+offsetX)/cell));
      const cR=Math.min(mxC,Math.ceil( (rx+outerDx-half+offsetX)/cell));
      if(dy2>=inner2){
        for(let col=cL;col<=cR;col++){
          const idx=rowBase+col, dx=cachedCX[idx]-rx, d2=dx*dx+dy2;
          if(d2<inner2||d2>outer2) continue;
          const li=((Math.sqrt(d2)-rr)*lutScale+LUT_N)|0;
          if(li>=0&&li<=2*LUT_N) boostBuf[idx]+=str*falloffLUT[li];
        }
      } else {
        const innerDx=Math.sqrt(inner2-dy2);
        const iL=Math.floor((rx-innerDx-half+offsetX)/cell);
        const iR=Math.ceil( (rx+innerDx-half+offsetX)/cell);
        for(let col=cL,e=Math.min(iL,cR);col<=e;col++){
          const idx=rowBase+col, dx=cachedCX[idx]-rx, d2=dx*dx+dy2;
          if(d2>outer2) continue;
          const li=((Math.sqrt(d2)-rr)*lutScale+LUT_N)|0;
          if(li>=0&&li<=2*LUT_N) boostBuf[idx]+=str*falloffLUT[li];
        }
        for(let col=Math.max(iR,cL);col<=cR;col++){
          const idx=rowBase+col, dx=cachedCX[idx]-rx, d2=dx*dx+dy2;
          if(d2>outer2) continue;
          const li=((Math.sqrt(d2)-rr)*lutScale+LUT_N)|0;
          if(li>=0&&li<=2*LUT_N) boostBuf[idx]+=str*falloffLUT[li];
        }
      }
    }
  }
}

function render(ts,dt){
  if(!cachedLum||(!dirty&&baseValid)){
    if(postReadyAfterRender){ postReadyAfterRender=false; self.postMessage({type:'ready'}); }
    return;
  }

  let write=0;
  for(let i=0;i<rippleCount;i++){
    const rb=i*RIPPLE_STRIDE, age=rippleBuf[rb+3]+dt, str=RING_BOOST*Math.exp(-age/RING_FALLOFF);
    if(str<RING_MIN_STR) continue;
    const r=rippleBuf[rb+2]+ringSpeed*dt, x=rippleBuf[rb], y=rippleBuf[rb+1];
    const out=r+ringWidth, inn=r-ringWidth, wb=write*RIPPLE_STRIDE;
    const gx=x+offsetX, gy=y+offsetY;
    rippleBuf[wb]=x; rippleBuf[wb+1]=y; rippleBuf[wb+2]=r; rippleBuf[wb+3]=age; rippleBuf[wb+4]=str;
    rippleBuf[wb+5]=inn>0?inn*inn:0; rippleBuf[wb+6]=out*out;
    rippleBuf[wb+7]=Math.max(0,Math.floor((gx-out)/cell));
    rippleBuf[wb+8]=Math.min(cols-1,Math.ceil((gx+out)/cell));
    rippleBuf[wb+9]=Math.max(0,Math.floor((gy-out)/cell));
    rippleBuf[wb+10]=Math.min(rows-1,Math.ceil((gy+out)/cell));
    write++;
  }
  rippleCount=write;

  const fade=Math.min(1,(ts-fadeStart)/FADE_MS);
  if(!streaming&&fade>=1&&!baseValid&&!buildingBase) scheduleBaseCanvas();
  dirty=streaming||rippleCount>0||fade<1;

  if(baseValid){
    ctx.drawImage(baseCanvas,0,0);
    if(rippleCount>0){
      computeBoosts();
      visitedBuf.fill(0); triN=cirN=sqrN=0;
      ctx.fillStyle='#000'; ctx.beginPath();
      for(let ri=0;ri<rippleCount;ri++){
        const rb=ri*RIPPLE_STRIDE;
        const rx=rippleBuf[rb],ry=rippleBuf[rb+1];
        const inner2=rippleBuf[rb+5],outer2=rippleBuf[rb+6];
        const mnC=rippleBuf[rb+7]|0,mxC=rippleBuf[rb+8]|0,mnR=rippleBuf[rb+9]|0,mxR=rippleBuf[rb+10]|0;
        for(let row=mnR;row<=mxR;row++){
          const rowBase=row*cols, dy=cachedCY[rowBase]-ry, dy2=dy*dy;
          if(dy2>=outer2) continue;
          const outerDx=Math.sqrt(outer2-dy2);
          const cL=Math.max(mnC,Math.floor((rx-outerDx-half+offsetX)/cell));
          const cR=Math.min(mxC,Math.ceil( (rx+outerDx-half+offsetX)/cell));
          if(dy2>=inner2){
            for(let col=cL;col<=cR;col++) stamp(rowBase+col);
          } else {
            const innerDx=Math.sqrt(inner2-dy2);
            const iL=Math.floor((rx-innerDx-half+offsetX)/cell);
            const iR=Math.ceil( (rx+innerDx-half+offsetX)/cell);
            for(let col=cL,e=Math.min(iL,cR);col<=e;col++) stamp(rowBase+col);
            for(let col=Math.max(iR,cL);col<=cR;col++) stamp(rowBase+col);
          }
        }
      }
      ctx.fill(); ctx.fillStyle='#fff'; drawPasses(ctx);
    }
  } else {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff'; triN=cirN=sqrN=0;
    if(rippleCount>0) computeBoosts();
    for(let row=0;row<rows;row++){
      const rowBase=row*cols;
      for(let col=0;col<cols;col++){
        const idx=rowBase+col;
        const boost=rippleCount>0?boostBuf[idx]:0;
        let lum=cachedLum[idx]*fade+boost;
        if(lum<LUM_SKIP) continue; if(lum>255) lum=255;
        const dotR=maxDotR*lum*(1/255); if(dotR<0.15) continue;
        const s=(boost>0&&rand()<boost*0.025)?(rand()*3)|0:cachedShape[idx];
        const cx=cachedCX[idx],cy=cachedCY[idx];
        if(s===0){triBuf[triN++]=cx;triBuf[triN++]=cy;triBuf[triN++]=dotR;}
        else if(s===1){cirBuf[cirN++]=cx;cirBuf[cirN++]=cy;cirBuf[cirN++]=dotR;}
        else{sqrBuf[sqrN++]=cx;sqrBuf[sqrN++]=cy;sqrBuf[sqrN++]=dotR;}
      }
    }
    drawPasses(ctx);
  }

  if(postReadyAfterRender){ postReadyAfterRender=false; self.postMessage({type:'ready'}); }
}
