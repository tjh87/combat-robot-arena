import {ShapeUtils,Vector2} from 'three';
import type {Part} from './model';

// Contours from the approved VTracer SVG. Samples use three points per curve.
// Closed RDP tolerances are 1 pixel outside and 0.8 pixel inside.
// Coordinates retain the image orientation from the positive X blade face.
export const SAWBLADE_PIXELS:number[][][]=[
 [[574,67],[579.76963,99.34519],[579.9737,107.68815],[578,116],[559.44778,123.27519],[430.70148,161.13407],[422.17852,165.06259],[411.05407,173.24926],[389.21,210.05],[378.89926,222.76704],[366.32407,230.97296],[293.23222,251.83889],[226.89,268.61],[211.01852,270.49556],[195.35815,267.61444],[180.44,261.62],[171.62815,255.81481],[159,240],[153.36296,243.72741],[130.58407,271.03444],[100,316],[77.52,358.00481],[63.59222,392.44148],[48.47259,440.05185],[42.37185,468.35556],[35.32037,530.51889],[35.92667,583.65704],[39,596],[47.65519,595.87741],[95.08926,574.1063],[117.44,567.25],[131.05111,565.37963],[144.88222,566.6937],[158,570.69],[202.44,595.88],[209,597],[209,599],[301.51,643.93],[308,645],[308,647],[427.27481,702.69333],[587.85815,780.95963],[602.39185,791.39704],[651.05037,832.29074],[658.30963,836.89259],[672.5,841.36],[688.22,836.98222],[831,772],[831,770],[836.91926,768.79111],[848,763],[846.64,758.53],[829.78,743.43481],[827,743],[827,741],[809.96296,725.89037],[805.81074,716.75037],[806.14296,706.05926],[808,700],[816,697],[891.03667,697.81481],[904.65,692.6],[907.43,689.35],[956.84963,596.07852],[987,534],[949.77,531.8],[935.4137,528.74519],[929,525],[926.16037,520.4237],[924.45,510.34],[928.73593,504.22667],[968.17407,477.87407],[988,460],[987.87148,443.5],[958,299],[919.88815,317.5363],[913.10852,319.2137],[906,318],[899.48,313.3363],[897,310],[895.80556,300.70185],[897.55111,291.70815],[910.05,256.97],[911.23111,250.60296],[909,238],[895,220],[893,220],[873.27037,198.37259],[801,130],[796.83,132.72],[790.3637,145.79926],[789,152],[787,152],[777.30778,166.01963],[768.72259,168.4663],[758.41,167.09],[752.81778,159.69815],[749.23889,150.70852],[736.31,111],[731.52111,105.76074],[693.07926,92.76074],[651.12704,81.36],[598.66889,69.67852]],
 [[515.78467,296.87646],[614.58467,297.99646],[627.89689,298.49165],[639.75578,301.23128],[650.91467,308.36646],[654.01467,312.10424],[713.59467,403.12646],[716.92541,410.62165],[717.82726,418.74795],[717.00467,426.99646],[715.38985,430.63054],[659.19467,521.02646],[653.31874,528.36387],[646.50059,533.83906],[638.00467,537.99646],[629.18319,538.75202],[515.86467,538.56646],[505.45763,537.77128],[495.49504,534.99832],[486.87467,529.27646],[482.71837,523.61128],[429.63467,435.68646],[424.44615,426.18461],[421.75319,416.70498],[422.50467,405.81646],[427.98393,395.87128],[430.00467,392.99646],[432.00467,392.99646],[437.23319,383.06572],[490.25948,307.65276],[501.22319,299.63684]],
 [[560.625,149.9375],[566.005,149.9975],[564.17315,155.21972],[536.055,197.6275],[530.65463,202.23935],[524.7187,204.56898],[462.35537,215.98565],[454.44796,216.81269],[448.005,215.9975],[445.005,212.9975],[445.38759,209.80009],[448.735,204.7275],[468.95389,181.4975],[476.36944,175.3675],[486.005,170.9975],[507.015,164.3875],[554.8613,150.47306]]
];
const centre=[569.7902235243056,417.8142426215278];
const pixelRadius=Math.max(...SAWBLADE_PIXELS[0].map(([x,y])=>Math.hypot(x-centre[0],y-centre[1])));
export function sawbladeContours(radius:number){return SAWBLADE_PIXELS.map(list=>list.map(([x,y])=>new Vector2((centre[1]-y)*radius/pixelRadius,(x-centre[0])*radius/pixelRadius)));}
export function isSawbladePart(p:Part){return p.body==='rotor'&&/^(disc(?:_\d+)?|tooth_\d+)$/.test(p.id);}
// Merge only adjacent cells whose union remains convex. The union preserves
// every boundary point and never spans an opening or a concave notch.
function convexCells(triangles:number[][],points:Vector2[]){
 const cells=triangles.map(face=>[...face]),tips=[88,74,64,27];let changed=true;
 while(changed){changed=false;
  search:for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){
   const a=cells[i],b=cells[j];if(a.length+b.length-2>16)continue;
   for(let ai=0;ai<a.length;ai++)for(let bj=0;bj<b.length;bj++){
    if(a[ai]!==b[(bj+1)%b.length]||a[(ai+1)%a.length]!==b[bj])continue;
    const merged=Array.from({length:a.length},(_,k)=>a[(ai+1+k)%a.length]);
    for(let k=2;k<b.length;k++)merged.push(b[(bj+k)%b.length]);
    if(tips.filter(t=>merged.includes(t)).length>1)continue;
    const turns=merged.map((index,k)=>{const p=points[index],q=points[merged[(k+1)%merged.length]],r=points[merged[(k+2)%merged.length]];return(q.x-p.x)*(r.y-q.y)-(q.y-p.y)*(r.x-q.x);});
    if(!turns.every(t=>t>=-1e-14)&&!turns.every(t=>t<=1e-14))continue;
    cells[i]=merged;cells.splice(j,1);changed=true;break search;
   }
  }
 }
 return cells;
}
export function sawbladeCells(radius:number){
 const contours=sawbladeContours(radius),points=contours.flat(),faces=convexCells(ShapeUtils.triangulateShape(contours[0],contours.slice(1)),points);
 // The four authored protrusions carry the existing contact tooth identities.
 // No extra cutters, solid hub, or spokes cover either SVG opening.
 const teeth=new Map<number,number>();
 for(const [tooth,tip]of[88,74,64,27].entries()){
  const candidates=faces.map((face,index)=>({face,index})).filter(({face})=>face.includes(tip)&&!teeth.has(faces.indexOf(face)));
  candidates.sort((a,b)=>b.face.reduce((s,i)=>s+points[i].lengthSq(),0)-a.face.reduce((s,i)=>s+points[i].lengthSq(),0));
  if(!candidates.length)throw Error('SVG tooth has no physical face: '+tooth);
  teeth.set(candidates[0].index,tooth);
 }
 return faces.map((face,index)=>({section:face.map(i=>[points[i].x,points[i].y]),tooth:teeth.get(index)}));
}
export function sawbladeBoundary(p:Part,radius:number){
 if(p.shape.kind!=='hull')return[];
 const vertices=p.shape.vertices,n=vertices.length/6,contours=sawbladeContours(radius),edges:[Vector2,Vector2][]=[];
 for(let i=0;i<n;i++){
  const j=(i+1)%n,a=new Vector2(vertices[i*3+1],vertices[i*3+2]),b=new Vector2(vertices[j*3+1],vertices[j*3+2]);
  if(contours.some(list=>list.some((q,k)=>{const r=list[(k+1)%list.length];const aa=a.clone().add(new Vector2(p.position.y,p.position.z)),bb=b.clone().add(new Vector2(p.position.y,p.position.z));return aa.distanceTo(q)<1e-9&&bb.distanceTo(r)<1e-9||aa.distanceTo(r)<1e-9&&bb.distanceTo(q)<1e-9;})))edges.push([a,b]);
 }
 return edges;
}
