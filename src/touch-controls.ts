// Mobile touch controls: a floating translucent joystick (left) and round action buttons (right),
// in the style of mainstream mobile action games. One shared overlay serves every mode: each
// Input registers as an owner and the overlay drives whichever owner is currently in a match.
// The output is the same Command the keyboard/gamepad produce, so physics and online play are unchanged.
import type {Command} from './sim';

export type TouchPrefs={mode:'auto'|'on'|'off',size:'s'|'m'|'l',opacity:number,leftHanded:boolean,haptics:boolean};
export const touchDefaults=():TouchPrefs=>({mode:'auto',size:'m',opacity:.35,leftHanded:false,haptics:true});
export function validTouchPrefs(raw:unknown):TouchPrefs{
 const d=touchDefaults();if(!raw||typeof raw!=='object')return d;const r=raw as Record<string,unknown>;
 if(r.mode==='auto'||r.mode==='on'||r.mode==='off')d.mode=r.mode;if(r.size==='s'||r.size==='m'||r.size==='l')d.size=r.size;
 if(typeof r.opacity==='number'&&Number.isFinite(r.opacity))d.opacity=Math.min(.8,Math.max(.15,r.opacity));
 if(typeof r.leftHanded==='boolean')d.leftHanded=r.leftHanded;if(typeof r.haptics==='boolean')d.haptics=r.haptics;return d;
}

const hasWindow=()=>typeof window!=='undefined'&&typeof document!=='undefined'&&typeof window.matchMedia==='function';
/** Device has a touch screen. */
export function touchCapable(){return hasWindow()&&((navigator.maxTouchPoints??0)>0||'ontouchstart' in window);}
/** Touch screen without any mouse/trackpad — phones and tablets. */
export function touchOnly(){return touchCapable()&&!window.matchMedia('(any-pointer:fine)').matches;}

/** Joystick vector (x right, y down, both -1..1) → arcade drive, identical to the gamepad left stick mix. */
export function joystickDrive(x:number,y:number,deadzone:number){
 const mag=Math.hypot(x,y);if(!Number.isFinite(mag)||mag<=deadzone)return {left:0,right:0};
 const scaled=Math.min(1,(mag-deadzone)/(1-deadzone)),nx=x/mag*scaled,ny=y/mag*scaled,forward=-ny,turn=nx*.7;
 const clamp=(v:number)=>Math.max(-1,Math.min(1,v));return {left:clamp(forward+turn),right:clamp(forward-turn)};
}
/** Knob offset for a touch at (dx,dy) from the base centre, limited to the base radius. */
export function knobVector(dx:number,dy:number,radius:number){const d=Math.hypot(dx,dy),k=d>radius?radius/d:1;return {x:dx*k/radius,y:dy*k/radius};}

export type TouchOwner={active():boolean,pause(reason:string):void,camera():void,recover():void,cameraLabel():string};
type WeaponReport={ratio:number,value:string,unit:string,on:boolean,action:string,strike:string,canStrike:boolean};

const ICONS={
 weapon:'<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M24 4l3.2 5.6 6.2-1.8.4 6.4 6.2 1.9-2.6 5.9 4.6 4.4-5.2 3.7 1.3 6.3-6.4.1-2.3 6-5.4-3.5-5.4 3.5-2.3-6-6.4-.1 1.3-6.3-5.2-3.7 4.6-4.4-2.6-5.9 6.2-1.9.4-6.4 6.2 1.8z"/><circle cx="24" cy="24" r="6.5" fill="#0b1015"/><circle cx="24" cy="24" r="2.6" fill="currentColor"/></svg>',
 flip:'<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" d="M10 30a14 14 0 0 1 26-9"/><path fill="currentColor" d="M39 12l1.5 13-12.5-3.6z"/></svg>',
 unstick:'<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" d="M12 26l12-11 12 11M12 37l12-11 12 11"/></svg>',
 view:'<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="4" d="M4 24s7.5-12 20-12 20 12 20 12-7.5 12-20 12S4 24 4 24z"/><circle cx="24" cy="24" r="6" fill="currentColor"/></svg>',
 pause:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="12" width="6.5" height="24" rx="1.5" fill="currentColor"/><rect x="27.5" y="12" width="6.5" height="24" rx="1.5" fill="currentColor"/></svg>',
 rotate:'<svg viewBox="0 0 96 96" aria-hidden="true"><rect x="30" y="14" width="36" height="62" rx="6" fill="none" stroke="currentColor" stroke-width="4"/><path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" d="M18 62a34 34 0 0 0 30 22"/><path fill="currentColor" d="M54 84l-10 6 1-12z"/></svg>',
};

/** Short camera names that fit inside the small VIEW button. */
export function shortView(label:string){const l=(label||'').toLowerCase();return l.includes('third')||l.includes('chase')?'3RD PERSON':l.includes('pov')||l.includes('robot')?'ROBOT POV':l.includes('tactical')?'TACTICAL':(label||'VIEW').toUpperCase().slice(0,10);}

class TouchControls{
 owners=new Set<TouchOwner>();prefs:TouchPrefs=touchDefaults();root?:HTMLElement;rotate?:HTMLElement;
 stick={id:-1,x:0,y:0,cx:0,cy:0};pending={weapon:false,selfRight:false};touchSeen=touchOnly();shown=false;owner?:TouchOwner;fullscreenTried=false;
 constructor(){
  if(!hasWindow()||!document.body)return;
  this.root=document.createElement('div');this.root.id='touch-controls';this.root.className='touch-controls hidden';
  this.root.innerHTML=`<div class="tc-stick-zone" data-zone="stick"><div class="tc-stick"><div class="tc-base"><i class="tc-chev up"></i><i class="tc-chev right"></i><i class="tc-chev down"></i><i class="tc-chev left"></i></div><div class="tc-knob"></div></div><div class="tc-rpm" id="tc-rpm"><strong>0</strong> RPM</div></div>
<div class="tc-buttons"><button type="button" class="tc-btn tc-weapon" data-act="weapon" aria-label="Start or stop weapon"><svg class="tc-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="tc-ring-track" cx="50" cy="50" r="46"/><circle class="tc-ring-fill" cx="50" cy="50" r="46" pathLength="100"/></svg>${ICONS.weapon}<b>WEAPON</b></button>
<button type="button" class="tc-btn tc-flip" data-act="selfRight" aria-label="Self-right">${ICONS.flip}<b>FLIP</b></button>
<button type="button" class="tc-btn tc-unstick" data-act="unstick" aria-label="Unstick robots">${ICONS.unstick}<b>UNSTICK</b></button>
<button type="button" class="tc-btn tc-view" data-act="camera" aria-label="Change camera view">${ICONS.view}<b>VIEW</b></button></div>
<button type="button" class="tc-btn tc-pause" data-act="pause" aria-label="Pause">${ICONS.pause}</button>`;
  document.body.appendChild(this.root);
  this.rotate=document.createElement('div');this.rotate.id='rotate-device';this.rotate.className='rotate-device';this.rotate.setAttribute('role','alertdialog');
  this.rotate.innerHTML=`<div>${ICONS.rotate}<h2>Rotate your phone</h2><p>Combat Robot Arena plays in landscape. Turn your phone sideways to continue.</p></div>`;
  document.body.appendChild(this.rotate);
  document.documentElement.classList.toggle('touch-device',touchOnly());
  const zone=this.root.querySelector<HTMLElement>('.tc-stick-zone')!;
  zone.addEventListener('pointerdown',this.stickDown);zone.addEventListener('pointermove',this.stickMove);
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(ev,this.stickUp as EventListener);
  this.root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach(btn=>{
   btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.classList.add('pressed');this.press(btn.dataset.act!);});
   for(const ev of ['pointerup','pointercancel','pointerleave'])btn.addEventListener(ev,()=>btn.classList.remove('pressed'));
   btn.addEventListener('click',e=>e.preventDefault());btn.addEventListener('contextmenu',e=>e.preventDefault());
  });
  this.root.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!this.touchSeen){this.touchSeen=true;this.refresh();}},{capture:true,passive:true});
  window.addEventListener('keydown',e=>{const t=e.target;if(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)return;if(this.touchSeen&&this.prefs.mode==='auto'&&!touchOnly()){this.touchSeen=false;this.refresh();}},{capture:true});
  window.addEventListener('resize',this.layout);window.addEventListener('orientationchange',this.layout);
  const timer=setInterval(()=>this.refresh(),200) as unknown as {unref?:()=>void};timer.unref?.();
  this.layout();
 }
 register(owner:TouchOwner){this.owners.add(owner);}
 unregister(owner:TouchOwner){this.owners.delete(owner);if(this.owner===owner)this.owner=undefined;}
 apply(prefs:TouchPrefs){this.prefs=validTouchPrefs(prefs);this.layout();this.refresh();}
 enabled(){return this.prefs.mode==='on'||(this.prefs.mode==='auto'&&this.touchSeen);}
 portrait(){return hasWindow()&&touchOnly()&&window.innerHeight>window.innerWidth;}
 layout=()=>{
  if(!this.root)return;const short=Math.min(window.innerWidth,window.innerHeight),size={s:.85,m:1,l:1.2}[this.prefs.size];
  const scale=Math.max(.72,Math.min(1.2,short/400))*size,html=document.documentElement;
  html.style.setProperty('--tc-scale',scale.toFixed(3));html.style.setProperty('--tc-alpha',String(this.prefs.opacity));
  html.style.setProperty('--ui-scale',Math.max(.6,Math.min(1,short/560)).toFixed(3));
  this.root.classList.toggle('left-handed',this.prefs.leftHanded);this.refresh();
 };
 refresh(){
  if(!this.root)return;const owner=[...this.owners].find(o=>{try{return o.active();}catch{return false;}});
  if(owner&&this.portrait()){owner.pause('Rotate your phone to landscape.');}
  const show=!!owner&&this.enabled(),html=document.documentElement;
  if(show!==this.shown){this.shown=show;this.root.classList.toggle('hidden',!show);if(!show)this.reset();}
  html.classList.toggle('touch-ui',this.enabled());html.classList.toggle('touch-playing',show);
  if(!owner)this.fullscreenTried=false;this.owner=owner;
  if(owner){const view=this.root.querySelector<HTMLElement>('.tc-view b');const label=shortView(owner.cameraLabel());if(view&&view.textContent!==label)view.textContent=label;}
 }
 reset(){this.stick={id:-1,x:0,y:0,cx:0,cy:0};this.pending={weapon:false,selfRight:false};const s=this.root?.querySelector<HTMLElement>('.tc-stick');if(s){s.classList.remove('engaged');s.style.removeProperty('left');s.style.removeProperty('top');s.style.setProperty('--kx','0px');s.style.setProperty('--ky','0px');}}
 haptic(ms=10){if(this.prefs.haptics)try{navigator.vibrate?.(ms);}catch{/* unsupported (iOS Safari) */}}
 goFullscreen(){
  if(this.fullscreenTried||!touchOnly())return;this.fullscreenTried=true;const el=document.documentElement as HTMLElement&{requestFullscreen?:(o?:FullscreenOptions)=>Promise<void>};
  if(document.fullscreenElement||window.matchMedia('(display-mode: standalone),(display-mode: fullscreen)').matches||!el.requestFullscreen)return;
  el.requestFullscreen({navigationUI:'hide'}).then(()=>(screen.orientation as ScreenOrientation&{lock?:(o:string)=>Promise<void>})?.lock?.('landscape')).catch(()=>{/* browser declined */});
 }
 press(act:string){
  const owner=this.owner;if(!owner)return;this.haptic(act==='weapon'?18:10);this.goFullscreen();
  if(act==='weapon')this.pending.weapon=true;else if(act==='selfRight')this.pending.selfRight=true;
  else if(act==='unstick')owner.recover();else if(act==='camera'){owner.camera();this.refresh();}else if(act==='pause')owner.pause('Paused');
 }
 radius(){return 56*Number(getComputedStyle(document.documentElement).getPropertyValue('--tc-scale')||1);}
 stickDown=(e:PointerEvent)=>{
  if(this.stick.id!==-1||!this.root)return;e.preventDefault();const zone=e.currentTarget as HTMLElement,box=zone.getBoundingClientRect(),r=this.radius();
  const cx=Math.min(box.right-r-6,Math.max(box.left+r+6,e.clientX)),cy=Math.min(box.bottom-r-6,Math.max(box.top+r+6,e.clientY));
  this.stick={id:e.pointerId,x:0,y:0,cx,cy};try{zone.setPointerCapture(e.pointerId);}catch{/* synthetic pointer */}
  const s=this.root.querySelector<HTMLElement>('.tc-stick')!;s.classList.add('engaged');s.style.left=(cx-box.left)+'px';s.style.top=(cy-box.top)+'px';this.stickMove(e);this.goFullscreen();
 };
 stickMove=(e:PointerEvent)=>{
  if(e.pointerId!==this.stick.id||!this.root)return;e.preventDefault();const r=this.radius(),k=knobVector(e.clientX-this.stick.cx,e.clientY-this.stick.cy,r);
  this.stick.x=k.x;this.stick.y=k.y;const s=this.root.querySelector<HTMLElement>('.tc-stick')!;s.style.setProperty('--kx',(k.x*r).toFixed(1)+'px');s.style.setProperty('--ky',(k.y*r).toFixed(1)+'px');
  s.style.setProperty('--dir',(Math.atan2(k.y,k.x)*180/Math.PI+90).toFixed(0)+'deg');s.style.setProperty('--push',Math.hypot(k.x,k.y).toFixed(2));
 };
 stickUp=(e:PointerEvent)=>{if(e.pointerId!==this.stick.id)return;const keep=this.pending;this.reset();this.pending=keep;};
 /** Merge touch input into a keyboard/gamepad command for player 1. */
 merge(cmd:Command,deadzone:number):Command{
  if(!this.shown)return cmd;const out={...cmd};
  if(this.stick.id!==-1){const d=joystickDrive(this.stick.x,this.stick.y,Math.max(.08,Math.min(.3,deadzone)));if(Math.abs(d.left)+Math.abs(d.right)>Math.abs(cmd.left)+Math.abs(cmd.right)){out.left=d.left;out.right=d.right;}}
  if(this.pending.weapon){out.weapon=true;this.pending.weapon=false;}if(this.pending.selfRight){out.selfRight=true;this.pending.selfRight=false;}
  return out;
 }
 weapon(r:WeaponReport){
  if(!this.root||!this.shown)return;const btn=this.root.querySelector<HTMLElement>('.tc-weapon')!,fill=btn.querySelector<SVGCircleElement>('.tc-ring-fill')!;
  fill.style.strokeDashoffset=String(100-Math.round(Math.max(0,Math.min(1,r.ratio))*100));btn.classList.toggle('on',r.on);btn.classList.toggle('full',r.on&&r.ratio>=.92);
  const label=(r.action||'Weapon').replace(/^(Start|Stop) weapon$/,'WEAPON').toUpperCase(),b=btn.querySelector('b')!;if(b.textContent!==label)b.textContent=label;
  const rpm=this.root.querySelector<HTMLElement>('#tc-rpm')!,html=`<strong>${r.value}</strong> ${r.unit}`;if(rpm.innerHTML!==html)rpm.innerHTML=html;
  const flip=this.root.querySelector<HTMLElement>('.tc-flip')!,flipLabel=r.strike==='Swing saw'?'SWING':'FLIP';flip.classList.toggle('unavailable',!r.canStrike);const fb=flip.querySelector('b')!;if(fb.textContent!==flipLabel)fb.textContent=flipLabel;
 }
}

let instance:TouchControls|undefined;
export function touchControls():TouchControls{if(!instance){try{instance=new TouchControls();}catch{instance=Object.create(TouchControls.prototype) as TouchControls;Object.assign(instance,{owners:new Set(),prefs:touchDefaults(),stick:{id:-1,x:0,y:0,cx:0,cy:0},pending:{weapon:false,selfRight:false},touchSeen:false,shown:false,fullscreenTried:false});}}return instance;}
/** Called by the weapon gauge each HUD update so the WEAPON button ring and RPM chip track the real weapon. */
export function reportTouchWeapon(r:WeaponReport){instance?.weapon(r);}
