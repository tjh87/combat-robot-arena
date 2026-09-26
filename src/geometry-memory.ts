import * as THREE from 'three';
// Keep every triangle, normal and UV seam. Index bit-identical vertices.
// Numeric hashes avoid the string allocation cost of a general vertex weld.
export function compactGeometry(geometry:THREE.BufferGeometry){
 if(geometry.index||Object.keys(geometry.morphAttributes).length)return geometry;
 const attributes=Object.entries(geometry.attributes);
 if(!attributes.length||attributes.some(([,a])=>!(a instanceof THREE.BufferAttribute)||!(a.array instanceof Float32Array)))return geometry;
 const source=attributes.map(([name,a])=>({name,attribute:a as THREE.BufferAttribute,bits:new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length)}));
 const count=source[0].attribute.count,indices=new Uint32Array(count),first=new Uint32Array(count),next=new Int32Array(count).fill(-1),heads=new Map<number,number>();let unique=0;
 for(let i=0;i<count;i++){
  let hash=2166136261;
  for(const {attribute,bits}of source)for(let k=0;k<attribute.itemSize;k++)hash=Math.imul(hash^bits[i*attribute.itemSize+k],16777619);
  let found=-1;
  for(let candidate=heads.get(hash)??-1;candidate!==-1;candidate=next[candidate]){
   let same=true;const old=first[candidate];
   for(const {attribute,bits}of source){for(let k=0;k<attribute.itemSize;k++)if(bits[i*attribute.itemSize+k]!==bits[old*attribute.itemSize+k]){same=false;break;}if(!same)break;}
   if(same){found=candidate;break;}
  }
  if(found<0){found=unique++;first[found]=i;next[found]=heads.get(hash)??-1;heads.set(hash,found);}
  indices[i]=found;
 }
 const stride=source.reduce((sum,s)=>sum+s.attribute.itemSize*4,0),indexBytes=unique<=65536?2:4;
 if(unique*stride+count*indexBytes>=count*stride)return geometry;
 const indexed=new THREE.BufferGeometry();indexed.name=geometry.name;indexed.userData={...geometry.userData};
 for(const {name,attribute,bits}of source){const packed=new Float32Array(unique*attribute.itemSize),packedBits=new Uint32Array(packed.buffer);
  for(let i=0;i<unique;i++)for(let k=0;k<attribute.itemSize;k++)packedBits[i*attribute.itemSize+k]=bits[first[i]*attribute.itemSize+k];
  const result=new THREE.BufferAttribute(packed,attribute.itemSize,attribute.normalized);result.setUsage(attribute.usage);result.name=attribute.name;result.gpuType=attribute.gpuType;indexed.setAttribute(name,result);
 }
 indexed.setIndex(new THREE.BufferAttribute(indexBytes===2?new Uint16Array(indices):indices,1));
 for(const g of geometry.groups)indexed.addGroup(g.start,g.count,g.materialIndex);
 indexed.setDrawRange(geometry.drawRange.start,geometry.drawRange.count);
 indexed.boundingBox=geometry.boundingBox?.clone()??null;indexed.boundingSphere=geometry.boundingSphere?.clone()??null;
 geometry.dispose();return indexed;
}
