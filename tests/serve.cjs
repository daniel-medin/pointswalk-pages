const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const publicFiles=new Set(['index.html','question.html','scoreboard.html','app.css','qrcode.min.js','pointswalk.js','admin.js','question.js','scoreboard.js','questions.json']);
http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith('/pointswalk-pages/')){res.writeHead(404).end();return;}
  const file=pathname.slice('/pointswalk-pages/'.length)||'index.html';
  if(!publicFiles.has(file)){res.writeHead(404).end();return;}
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json'};
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]});fs.createReadStream(path.join(root,file)).pipe(res);
}).listen(4173,'127.0.0.1');
