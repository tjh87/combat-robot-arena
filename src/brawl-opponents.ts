export function sampleBrawlOpponents<T>(candidates:readonly T[],count:number,random:()=>number=Math.random):T[]{
 if(!Number.isInteger(count)||count<0||count>candidates.length)throw new RangeError('Brawl opponent count exceeds the distinct candidate roster.');
 const pool=candidates.slice();
 for(let i=0;i<count;i++){
  const value=random(),unit=Number.isFinite(value)?Math.max(0,Math.min(1-Number.EPSILON,value)):0;
  const j=i+Math.floor(unit*(pool.length-i));[pool[i],pool[j]]=[pool[j],pool[i]];
 }
 return pool.slice(0,count);
}
