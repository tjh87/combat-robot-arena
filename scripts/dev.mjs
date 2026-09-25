import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=await createServer({root,server:{host:'127.0.0.1',port:4173,strictPort:true,open:process.argv.includes('--open')}});
await server.listen();server.printUrls();
