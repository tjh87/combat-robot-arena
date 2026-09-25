import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
import {spawn} from 'node:child_process';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const portArg=process.argv.find(x=>x.startsWith('--port='));
const port=portArg?Number(portArg.slice(7)):4173;
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Use a port from 1024 to 65535.');
try{await stat(resolve(root,'index.html'));}catch{console.error('The built app is missing. Run BUILD-WINDOWS.cmd or node scripts/build.mjs.');process.exit(1);}
const base=await realpath(root);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.json':'application/json','.txt':'text/plain; charset=utf-8','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname.includes('\0')||pathname.replaceAll('\\','/').split('/').some(x=>x.startsWith('.'))){res.writeHead(403);res.end();return;}
  const file=resolve(base,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(base+sep)){res.writeHead(403);res.end();return;}
  const target=await realpath(file);
  if(!target.startsWith(base+sep)||(await stat(target)).isDirectory()){res.writeHead(403);res.end();return;}
  const data=await readFile(target);
  res.writeHead(200,{'Content-Type':mime[extname(target)]??'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch(e){res.writeHead(e instanceof URIError?400:e.code==='ENOENT'?404:500);res.end('File unavailable');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is in use. Close the other arena window or use --port=4174.`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${port}/`;console.log(`Combat Robot Arena: ${url}\nKeep this window open. Press Ctrl+C to stop.`);
 if(process.argv.includes('--open')){
  const args=process.platform==='win32'?['cmd.exe',['/d','/s','/c',`start "" "${url}"`]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
  const child=spawn(...args,{stdio:'ignore'});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();
 }
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
