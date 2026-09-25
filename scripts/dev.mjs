import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {createServer} from 'vite';
const root=fileURLToPath(new URL('../',import.meta.url));
// Keep local-only defaults, while honoring explicit development-server options.
const {values}=parseArgs({options:{host:{type:'string',default:'127.0.0.1'},port:{type:'string',default:'4173'},strictPort:{type:'boolean',default:true},open:{type:'boolean',default:false}}});
const port=Number(values.port);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Use a port from 1024 to 65535.');
const server=await createServer({root,server:{host:values.host,port,strictPort:values.strictPort,open:values.open,allowedHosts:values.host==='0.0.0.0'?['terminal.local']:undefined}});
await server.listen();server.printUrls();
