import {createOnlineServer} from './gateway';
const {server,gateway}=createOnlineServer();server.listen(Number(process.env.ONLINE_PORT??4444),'127.0.0.1',()=>console.log('Online test service is ready.'));process.on('SIGTERM',()=>void gateway.stop().finally(()=>server.close()));
