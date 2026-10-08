// The revamp menu theme is the only menu design. It styles HTML menu chrome only;
// the 3D scene, robots and fight HUD are untouched.
export const MENU_THEME='revamp';
/** Legacy preference key from when a Classic/Revamp switch existed; cleared on load. */
export const LEGACY_MENU_THEME_KEY='cra.menuTheme';
type ThemeRoot={dataset:DOMStringMap};

export function applyMenuTheme(root:ThemeRoot|undefined=globalThis.document?.documentElement,storage:Pick<Storage,'removeItem'>|undefined=globalThis.localStorage){
 if(root)root.dataset.menuTheme=MENU_THEME;
 try{storage?.removeItem(LEGACY_MENU_THEME_KEY);}catch{/* storage blocked: nothing to clear */}
 return MENU_THEME;
}
