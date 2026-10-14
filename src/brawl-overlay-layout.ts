export type BrawlRect={left:number;top:number;right:number;bottom:number};
export type BrawlCalloutSide='left'|'right'|'top'|'bottom';
export type BrawlCalloutPlacement=BrawlRect&{side:BrawlCalloutSide};

const overlap=(a:BrawlRect,b:BrawlRect)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const area=(a:BrawlRect,b:BrawlRect)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));

/** Keep a screen-space text callout beside its robot; prefer free, in-viewport positions. */
export function placeBrawlCallout(anchor:{x:number;y:number},viewport:{width:number;height:number},size:{width:number;height:number},robotBounds:readonly BrawlRect[],occupied:readonly BrawlRect[]=[]):BrawlCalloutPlacement{
 const margin=8,gap=10,first=anchor.x<viewport.width/2?'left':'right',second=first==='left'?'right':'left',vertical=[0,-(size.height+gap),size.height+gap,-2*(size.height+gap),2*(size.height+gap)],horizontal=[0,-(size.width+gap),size.width+gap],candidates:{left:number;top:number;side:BrawlCalloutSide}[]=[];
 const add=(left:number,top:number,side:BrawlCalloutSide)=>candidates.push({left,top,side});
 for(const side of [first,second] as const){const left=side==='left'?anchor.x-gap-size.width:anchor.x+gap;for(const dy of vertical)add(left,anchor.y-size.height/2+dy,side);}
 for(const side of ['top','bottom'] as const){const top=side==='top'?anchor.y-gap-size.height:anchor.y+gap;for(const dx of horizontal)add(anchor.x-size.width/2+dx,top,side);}
 const grid:{left:number;top:number;side:BrawlCalloutSide}[]=[];for(let top=margin;top<=viewport.height-size.height-margin;top+=size.height+gap)for(let left=margin;left<=viewport.width-size.width-margin;left+=size.width+gap){const dx=Math.abs(left+size.width/2-anchor.x),dy=Math.abs(top+size.height/2-anchor.y),side=dx>=dy?(left+size.width/2<anchor.x?'left':'right'):(top+size.height/2<anchor.y?'top':'bottom');grid.push({left,top,side});}grid.sort((a,b)=>(Math.abs(a.left+size.width/2-anchor.x)+Math.abs(a.top+size.height/2-anchor.y))-(Math.abs(b.left+size.width/2-anchor.x)+Math.abs(b.top+size.height/2-anchor.y)));candidates.push(...grid);
 let fallback:BrawlCalloutPlacement|undefined,best=Infinity;
 for(const candidate of candidates){
  const left=Math.max(margin,Math.min(viewport.width-margin-size.width,candidate.left)),top=Math.max(margin,Math.min(viewport.height-margin-size.height,candidate.top)),rect={left,top,right:left+size.width,bottom:top+size.height},inside=candidate.left>=margin&&candidate.top>=margin&&candidate.left+size.width<=viewport.width-margin&&candidate.top+size.height<=viewport.height-margin;
  const robotOverlap=robotBounds.reduce((sum,box)=>sum+area(rect,box),0),labelOverlap=occupied.reduce((sum,box)=>sum+area(rect,box),0),movement=Math.abs((left+size.width/2)-anchor.x)+Math.abs((top+size.height/2)-anchor.y),score=robotOverlap*100+labelOverlap*100+(inside?0:1e9)+movement+(candidate.side===first?0:1);
  if(score<best){best=score;fallback={...rect,side:candidate.side};}
  if(inside&&!robotBounds.some(box=>overlap(rect,box))&&!occupied.some(box=>overlap(rect,box)))return{...rect,side:candidate.side};
 }
 if(!fallback)throw new Error('Unable to position Brawl callout.');
 return fallback;
}
