// Same 42-degree tactical lens as normal matches, with padding only for the opening shot.
export function brawlOverviewDistance(floor:number,aspect:number,fov=42){
 const half=floor/2+1.2,tanV=Math.tan(fov*Math.PI/360),tanH=tanV*Math.max(.5,aspect),elevation=.9,norm=Math.hypot(1,elevation),vertical=elevation/norm,depth=1/norm;
 let distance=0;
 for(const x of [-half,half])for(const z of [-half,half]){
  distance=Math.max(distance,(Math.abs(x)/(tanH*.88)+z*depth)/norm,(Math.abs(z*vertical)/(tanV*.84)+z*depth)/norm);
 }
 return distance;
}
export const BRAWL_COMBAT_ZOOM_LIMIT=10.5;

export const BRAWL_COMBAT_DISTANCE=8;
