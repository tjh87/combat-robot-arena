// Presentation-only dead band: camera smoothing must not toggle a whole wall each frame.
export function cameraWallVisible(wasVisible:boolean,cameraZ:number,threshold:number,match:boolean,preMatch:boolean){
 if(!match||preMatch)return false;
 return cameraZ<(wasVisible?threshold+.08:threshold-.08);
}
