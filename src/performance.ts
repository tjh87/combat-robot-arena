export type GraphicsQuality='low'|'medium'|'high';

// Presentation limits never change the fixed simulation timestep or input rate.
export class FrameGate{
 private last=Number.NaN;
 private state='';
 due(now:number,state:string,fps:number,dirty=false){
  if(state!==this.state||dirty||!Number.isFinite(this.last)){this.state=state;this.last=now;return true;}
  if(fps<=0)return false;
  const interval=1000/fps,elapsed=now-this.last;
  if(elapsed<interval-.5)return false;
  this.last=now-Math.max(0,elapsed-interval)%interval;return true;
 }
 reset(){this.last=Number.NaN;}
}

export class AdaptiveResolution{
 scale=1;fps=60;
 private elapsed=0;
 private frames=0;
 private fast=0;
 reset(){this.scale=1;this.elapsed=this.frames=this.fast=0;this.fps=60;}
 sample(seconds:number){
  // A pause, context recovery, or one loading hitch is not a sustained GPU load.
  if(seconds<=0||seconds>.25)return false;
  this.elapsed+=seconds;this.frames++;
  if(this.elapsed<2)return false;
  this.fps=this.frames/this.elapsed;const old=this.scale;
  if(this.fps<45){this.scale=Math.max(.65,Math.round((this.scale-.1)*100)/100);this.fast=0;}
  else if(this.fps>57){this.fast+=this.elapsed;if(this.fast>=8){this.scale=Math.min(1,Math.round((this.scale+.05)*100)/100);this.fast=0;}}
  else this.fast=0;
  this.elapsed=this.frames=0;return old!==this.scale;
 }
}

export function graphicsPixelRatio(quality:GraphicsQuality,dpr:number,width:number,height:number,adaptive=true,scale=1){
 const base=Math.min(Math.max(.5,dpr||1),quality==='high'?1.5:1);
 if(!adaptive)return base;
 const budget=quality==='low'?1280*720:quality==='medium'?1600*900:2560*1440;
 return Math.min(base,Math.sqrt(budget/Math.max(1,width*height)))*scale;
}
