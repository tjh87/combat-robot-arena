export const ARENA_GROUP=1;
export const HAZARD_GROUP=16;

// Preserve P1/P2 masks (2 and 4) and the existing hazard group (16).
// Higher Brawl entrants skip the reserved hazard bit.
export function robotGroup(id:number){return 1<<(id<3?id+1:id+2);}
export function robotGroupMask(count:number){let mask=0;for(let id=0;id<count;id++)mask|=robotGroup(id);return mask;}
export function robotFilter(id:number,count:number){return ARENA_GROUP|HAZARD_GROUP|(robotGroupMask(count)&~robotGroup(id));}
export function arenaFilter(count:number){return 31|(robotGroupMask(count)&~31);}
