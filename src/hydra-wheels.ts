import type {BotConfig} from './model';
// Counted steel cores preserve wheel inertia per meter of travel.
// The core dimensions and material choice are game estimates.
export function hydraSleekWheels(c:BotConfig){return c.chassis.profile==='hydra'&&c.drive.traction!=='tracks'&&c.drive.radius<.09&&c.drive.width<=.06;}
export function hydraCoreRadius(c:BotConfig){return c.drive.radius*55/60;}
export function hydraCoreWidth(c:BotConfig){return c.drive.width*.95;}

// The bearing model preserves resistance per meter of travel.
export function hydraBearingDrag(c:BotConfig){return .012*(c.drive.radius/.10)**2;}
