export type WeaponBlurProfile={normalized:number,strength:number,opacity:number,exposure:number,toothPitch:number};

const TAU=Math.PI*2;

/**
 * Pure cosmetic shutter model shared by every spinner exposure. It never
 * affects the physical rotor pose: the same RPM produces the same bounded
 * angular span in live play and replay.
 */
export function weaponBlurProfile(rpm:number,targetRPM:number,teeth=1,reduced=false):WeaponBlurProfile{
 const actual=Number.isFinite(rpm)?Math.max(0,Math.abs(rpm)):0,target=Number.isFinite(targetRPM)?Math.max(1,Math.abs(targetRPM)):1,normalized=Math.min(1.2,actual/target),onset=Math.max(0,Math.min(1,(normalized-.045)/.955)),strength=reduced?0:Math.pow(onset,.68),toothPitch=TAU/Math.max(1,Math.round(teeth)||1),shutter=.0012+.0044*strength,exposure=strength>0?Math.min(toothPitch,actual*TAU/60*shutter):0;
 return{normalized,strength,opacity:strength>0?.14+.48*strength:0,exposure,toothPitch};
}
