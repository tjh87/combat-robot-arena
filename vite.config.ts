import {defineConfig} from 'vite';
export default defineConfig({server:{host:'127.0.0.1',port:4173,strictPort:true},build:{emptyOutDir:true,target:'es2022',chunkSizeWarningLimit:3000,rollupOptions:{output:{manualChunks(id){
 // Keep the large pinned engines cached when only game code changes.
 if(id.includes('/node_modules/@dimforge/rapier3d-compat/'))return 'physics';
 if(id.includes('/node_modules/three/'))return 'graphics';
}}}}});
