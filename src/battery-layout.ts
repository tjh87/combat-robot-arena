import type {BotConfig,Vec,Profile} from './model';

export const BATTERY_CRUSH_RESISTANCE=18; // Game indentation energy, J per HP.

type Layout={zone:string,note:string,sources:{label:string,url:string}[],centres:[number,number][],size:[number,number],bottomClearance?:number};
const source=(label:string,url:string)=>({label,url});
const whyachi=source('Team Whyachi','https://whyachi.com/');
// x/z are chassis width/length fractions. These are fitted game damage zones,
// not measured CAD or an assertion of exact real pack count. No published
// dimensioned battery coordinates were found for these season-varying robots.
// Reviewed 2026-09-25: see docs/battery-location-research.md. Confirmed areas
// and unconfirmed placement are distinguished in each note. All dimensions
// remain game estimates; a team power-system specification is not a location.
export const BATTERY_LAYOUTS:Partial<Record<Profile,Layout>>={
 tombstone:{zone:'Rear battery bay',note:'Rear bay retained as a game estimate. The team AMA does not establish measured battery positions.',sources:[source('Ray Billings team AMA','https://www.reddit.com/r/battlebots/comments/lyptp2/tombstone_ama_ask_me_anything/'),source('Hardcore Robotics','https://hardcorerobotics.com/team.html')],centres:[[0,.29]],size:[.52,.23]},
 minotaur:{zone:'Low rear battery bays, including both rear corners',note:'SawBlaze reports a battery hit at a rear underside corner. RioBotz confirms separate drive and weapon supplies. Both corner positions and the centre drive zone are game estimates; the exact drive-pack position remains unconfirmed.',sources:[source('SawBlaze fight report, reproduced on Reddit','https://www.reddit.com/r/battlebots/comments/141gblg/sawblaze_v_minotaur_aftermath/'),source('RioBotz team AMA','https://www.reddit.com/r/battlebots/comments/13u7k9r/ama_with_minotaurs_team_riobotz_at_7pm_et/')],centres:[[-.23,.28],[.23,.28],[0,.283334]],size:[.22,.20],bottomClearance:.006},
 hydra:{zone:'Rear side bays beside the hydraulic assembly',note:'Unconfirmed placement. Team material describes the hydraulic system, but does not locate the battery packs. Rear side bays remain game estimates.',sources:[whyachi,source('Team hydraulic layout','https://www.facebook.com/Whyachi/posts/2588424261170373/')],centres:[[-.25,.24],[.25,.24]],size:[.22,.22]},
 icewave:{zone:'Low rear drive battery bay',note:'Unconfirmed placement. The electric drive supply belongs in the lower chassis; the rear location remains a game estimate. The upper engine is not a battery target.',sources:[source('BattleBots ICEwave profile','https://battlebots.com/robot/icewave-2021/')],centres:[[0,.28]],size:[.46,.23]},
 hypershock:{zone:'Central battery box between drive pods',note:'The team power-system log and interior photo support a central shared battery box between drive pods. The box hangs clear of the base plate. Coordinates and clearance are game estimates.',sources:[source('Team power-system build log','https://hypershock.tv/blogs/inside-the-bot/putting-the-shock-in-hypershock')],centres:[[0,-.02]],size:[.44,.42],bottomClearance:.025},
 gigabyte:{zone:'Low side bays under the spinning shell',note:'The team confirms a battery puncture through the bottom plate. Low mounting is supported; the two side-bay positions and dimensions remain game estimates.',sources:[source('Public post-fight report','https://www.reddit.com/r/battlebots/comments/17c0od2/gigabyte_sin_city_slugfest_post_fight/')],centres:[[-.25,.16],[.25,.16]],size:[.23,.30],bottomClearance:.006},
 whyachi:{zone:'Low rear chassis bay under the rotor',note:'Unconfirmed placement. The team site does not locate the packs in the modern wheeled robot. The rear bay remains a game estimate.',sources:[whyachi],centres:[[0,.25]],size:[.46,.25]},
 huge:{zone:'Left and right chassis pods',note:'Team CAD shows mirrored chassis halves. The later Fusion report identifies battery access through the wheel area. Both chassis-pod zones are retained; exact positions remain game estimates.',sources:[source('Team HUGE build log and CAD','https://hugebattlebots.com/team-huge-battlebots-blog/huge-build-log-2018'),source('Team HUGE: Fusion fight report','https://hugebattlebots.com/team-huge-battlebots-blog/huge-vs-fusion')],centres:[[-.29,0],[.29,0]],size:[.24,.50]},
 sawblaze:{zone:'Rear chassis battery bay',note:'Unconfirmed placement. The builder specifies a 12s4p supply but does not locate its packs. The rear bay remains a game estimate.',sources:[source('Jamison Go: SawBlaze','https://jamisongo.com/projects/sawblaze/')],centres:[[0,.25]],size:[.46,.25]},
 deep_six:{zone:'Left and right lower chassis pods',note:'Unconfirmed placement. The team AMA does not establish battery positions. The two lower chassis zones remain game estimates.',sources:[source('Team Deep Six AMA','https://www.reddit.com/r/battlebots/comments/coottd/ama_with_deep_six/')],centres:[[-.29,0],[.29,0]],size:[.24,.38]},
 quantum:{zone:'Rear chassis bays beside the hydraulic unit',note:'Unconfirmed placement. The team AMA discusses opponent batteries, not the position of Quantum packs. The rear side bays remain game estimates.',sources:[source('RoboChallenge team AMA','https://www.reddit.com/r/battlebots/comments/13hmmck/quantum_ama_with_james_grant_cooper/')],centres:[[-.23,.25],[.23,.25]],size:[.24,.23]},
};
export function batteryLayout(c:BotConfig):Layout{return BATTERY_LAYOUTS[c.chassis.profile??'standard']??{zone:'Central rear bay',note:'Custom game layout.',sources:[],centres:[[0,.14]],size:[.35,.30]};}
export function batteryZones(c:BotConfig){
 const layout=batteryLayout(c),ch=c.chassis,sy=Math.min(.08,ch.height*.55),y=layout.bottomClearance===undefined?Math.max(-ch.height/2+sy/2+.009,-.022):Math.min(ch.height/2-sy/2-.004,-ch.height/2+sy/2+layout.bottomClearance);
 return layout.centres.map(([x,z],i)=>({id:i?'battery_'+i:'battery',position:{x:x*ch.width,y,z:z*ch.length},size:{x:layout.size[0]*ch.width,y:sy,z:layout.size[1]*ch.length},fraction:1/layout.centres.length}));
}
export function batteryAlongRay(c:BotConfig,point:Vec,direction:Vec,reach=.45){
 const n=Math.hypot(direction.x,direction.y,direction.z);if(n<1e-9)return undefined;
 let nearest:number|undefined,distance=Infinity;
 for(const [index,zone]of batteryZones(c).entries()){
  let lo=0,hi=reach;
  for(const axis of['x','y','z'] as const){const d=direction[axis]/n,p=point[axis]-zone.position[axis],half=zone.size[axis]/2+.008;
   if(Math.abs(d)<1e-8){if(Math.abs(p)>half){hi=-1;break;}}else{let a=(-half-p)/d,b=(half-p)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);}
  }if(hi>=lo&&lo<distance){distance=lo;nearest=index;}
 }return nearest;
}
export function batteryReferenceHTML(c:BotConfig){const r=batteryLayout(c);return `<details class="battery-reference"><summary>Battery target: ${r.zone}</summary><p>Red dotted outlines show this game's battery damage zones. Their dimensions are estimates.</p><p>${r.note}</p><p>A well-placed robot strike or crush can puncture the covering panel and reach this internal target. All zones share the robot's battery health.</p>${r.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`).join('<br>')}</details>`;}
