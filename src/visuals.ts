import {ARENA_HAZARDS} from './arena-hazards';
import {compactGeometry} from './geometry-memory';
import * as THREE from 'three';
import {robotDeckTexture,robotSideTexture,tireSidewallTexture} from './robot-livery';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RULES,rng,HYDRA_TIP,unlimitedFlips,type BotConfig,type Part} from './model';
import {sawbladeOuter,sawbladeHex} from './mechanisms';
