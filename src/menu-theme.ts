// Menu-only visual theme. It changes HTML menu chrome; the 3D scene, robots and fight HUD are untouched.
export type MenuTheme='classic'|'revamp';
export const MENU_THEME_KEY='cra.menuTheme';
type ThemeStorage=Pick<Storage,'getItem'|'setItem'>;
type ThemeRoot={dataset:DOMStringMap};

export function loadMenuTheme(storage:ThemeStorage|undefined=globalThis.localStorage):MenuTheme{
 try{return storage?.getItem(MENU_THEME_KEY)==='revamp'?'revamp':'classic';}catch{return 'classic';}
}

export function applyMenuTheme(theme:MenuTheme,root:ThemeRoot|undefined=globalThis.document?.documentElement){
 if(root)root.dataset.menuTheme=theme;
 return theme;
}

export function setMenuTheme(theme:MenuTheme,storage:ThemeStorage|undefined=globalThis.localStorage,root?:ThemeRoot){
 try{storage?.setItem(MENU_THEME_KEY,theme);}catch{/* private mode: still apply for this session */}
 return applyMenuTheme(theme,root);
}

export const menuThemeLabel=(theme:MenuTheme)=>theme==='revamp'?'UI: Revamp':'UI: Classic';

/** Wires the top-bar switch; keeps its label and pressed state in sync with the stored theme. */
export function bindMenuThemeToggle(button:HTMLButtonElement,onChange?:(theme:MenuTheme)=>void){
 const sync=(theme:MenuTheme)=>{button.textContent=menuThemeLabel(theme);button.setAttribute('aria-pressed',String(theme==='revamp'));button.title=theme==='revamp'?'Switch back to the classic menu design':'Try the revamped menu design';};
 sync(applyMenuTheme(loadMenuTheme()));
 button.onclick=()=>{const next:MenuTheme=loadMenuTheme()==='revamp'?'classic':'revamp';sync(setMenuTheme(next));onChange?.(next);};
}
