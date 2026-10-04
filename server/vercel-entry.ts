import {createOnlineServer} from './gateway';
const {server,gateway}=createOnlineServer();
process.on('SIGTERM',()=>void gateway.stop());
export default server;
