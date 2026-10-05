import {clamp} from './model';
const STOPS=[[0,116,200,255],[.25,101,238,235],[.5,160,239,133],[.8,255,229,121],[.9,255,177,109],[1,255,112,143]];
export function rpmPresentation(value:number){
 const ratio=clamp(Number.isFinite(value)?value:0,0,1),next=STOPS.findIndex(s=>s[0]>=ratio),i=Math.max(1,next),a=STOPS[i-1],b=STOPS[i],t=(ratio-a[0])/(b[0]-a[0]),rgb=a.slice(1).map((n,j)=>Math.round(n+(b[j+1]-n)*t)),color='#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join(''),intensity=clamp((ratio-.8)/.2,0,1);
 return{ratio,color,glow:'rgba('+rgb.join(',')+',.24)',shade:'rgba('+rgb.join(',')+',.12)',nearMax:ratio>=.8,intensity,motion:.25+2.25*intensity,period:160-105*intensity};
}
const SHAPES:Record<string,string>={
 tombstone:'M19 18H69V47H19Z M12 22H19V43H12Z M69 22H76V43H69Z M9 7H88V15H9Z M46 10H52V22H46Z',
 minotaur:'M20 19H80V48H20Z M12 24H20V46H12Z M80 24H88V46H80Z M23 9H77V20H23Z',
 hydra:'M13 43L25 14H75L87 43L75 52H25Z M44 8H56V48H44Z M13 19H21V32H13Z M79 19H87V32H79Z M13 38H21V49H13Z M79 38H87V49H79Z',
 icewave:'M20 19H79V49H20Z M14 22H21V31H14Z M78 22H86V31H78Z M14 39H21V49H14Z M78 39H86V49H78Z M7 8H92V15H7Z M40 8H60V25H40Z',
 hypershock:'M25 19H75V49H25Z M11 13H25V32H11Z M75 13H89V32H75Z M11 38H25V56H11Z M75 38H89V56H75Z M34 8H43V23H34Z M57 8H66V23H57Z',
 gigabyte:'M50 6A26 26 0 1 1 49.9 6Z M18 27H25V38H18Z M75 27H82V38H75Z M45 1H55V8H45Z',
 whyachi:'M27 22H73L79 50H21Z M46 8H54V33H46Z M50 28L12 43L16 51L52 34Z M50 28L85 43L90 35L54 25Z M39 3H61V12H39Z M7 40H24V51H7Z M78 32H95V43H78Z M14 28H22V40H14Z M78 47H86V58H78Z',
 huge:'M8 7H29V57H8Z M71 7H92V57H71Z M29 24H71V40H29Z M46 9H54V55H46Z',
 sawblaze:'M25 18H75V48H25Z M16 22H25V47H16Z M75 22H84V47H75Z M23 4H29V20H23Z M47 4H53V20H47Z M71 4H77V20H71Z M43 12H57V35H43Z M50 3A10 10 0 1 1 49.9 3Z',
 deep_six:'M20 24H80V48H20Z M12 29H20V48H12Z M80 29H88V48H80Z M46 2L57 8L54 58L43 52Z M35 22H65V30H35Z',
 quantum:'M24 20H76V49H24Z M15 20H24V31H15Z M76 20H85V31H76Z M15 40H24V52H15Z M76 40H85V52H76Z M33 6L67 6L72 21L59 33H41L28 21Z M33 12H40V39H33Z M60 12H67V39H60Z',
};
export function robotSilhouette(profile:string|undefined){return SHAPES[profile??'']??SHAPES.tombstone;}
export const RPM_SILHOUETTE_MARKUP='<svg id="gauge-silhouette" viewBox="0 0 100 64" aria-hidden="true"><defs><clipPath id="gauge-silhouette-clip"><path id="gauge-silhouette-shape"/></clipPath></defs><path id="gauge-silhouette-base"/><rect id="gauge-silhouette-fill" x="0" y="64" width="100" height="0" clip-path="url(#gauge-silhouette-clip)"/><path id="gauge-silhouette-outline"/></svg>';
