import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
function stop(message){console.error(message);process.exit(1);}
const serverPath=join(root,'server.mjs'),indexPath=join(root,'index.html');
if(!existsSync(serverPath)||!existsSync(indexPath))stop('Copy these add-on files into the folder containing your server.mjs and index.html, then run this installer again.');
for(const name of ['connect-api.mjs','connect.html','connect.css','connect.js'])if(!existsSync(join(root,name)))stop(`Missing ${name}. Copy all add-on files first.`);
const original=readFileSync(serverPath,'utf8');let server=original;
if(!server.includes("from './connect-api.mjs'")&&!server.includes('from "./connect-api.mjs"')){
 const pattern=/http\.createServer\(\s*(async\s+)?\(\s*([\w$]+)\s*,\s*([\w$]+)\s*\)\s*=>\s*\{/;
 if(!pattern.test(server))stop('Your server uses an unfamiliar request handler. No files changed. Share server.mjs so the Connect hook can be added safely.');
 server=server.replace(pattern,(_,asyncKeyword,request,response)=>`http.createServer(async (${request}, ${response}) => {\n  if (await handleConnect(${request}, ${response})) return;`);
 const statement="import { handleConnect } from './connect-api.mjs';\n";
 if(server.startsWith('#!')){const end=server.indexOf('\n')+1;server=server.slice(0,end)+statement+server.slice(end);}else server=statement+server;
}
const checked=spawnSync(process.execPath,['--check','--input-type=module'],{input:server,encoding:'utf8'});
if(checked.status!==0)stop('Server syntax validation failed. No files changed.\n'+checked.stderr);
const oldIndex=readFileSync(indexPath,'utf8');let index=oldIndex;
if(!/href\s*=\s*['"][^'"]*connect\.html/.test(index)){
 if(!/<\/header\s*>/i.test(index))stop('Could not find the main header. No files changed. Share index.html to place the Connect link.');
 index=index.replace(/<\/header\s*>/i,'  <a class="header-link" href="./connect.html" style="color:inherit;text-decoration:none;padding:10px 14px;border:1px solid currentColor;border-radius:999px;font-size:14px;white-space:nowrap">Connect ✦</a>\n  </header>');
}
for(const [path,before,after] of [[serverPath,original,server],[indexPath,oldIndex,index]]){
 if(before===after)continue;
 if(!existsSync(path+'.before-connect'))copyFileSync(path,path+'.before-connect');
 writeFileSync(path,after);
}
const ignorePath=join(root,'.gitignore');let ignore=existsSync(ignorePath)?readFileSync(ignorePath,'utf8'):'';
for(const line of ['.sidequest-connect/','*.before-connect'])if(!ignore.split(/\r?\n/).includes(line))ignore+=(ignore.endsWith('\n')||!ignore?'':'\n')+line+'\n';
writeFileSync(ignorePath,ignore);
console.log('Connect installed. Your feed and planner files were preserved.\nStart again with: node server.mjs\nOpen your usual website and click Connect ✦.');
