import {createSender,PostbackError} from '../services/trackwill/postback.js';
const send=createSender();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'method_not_allowed'})}
 if(req.headers.origin!=='https://elf.pink'&&req.headers.origin!=='https://www.elf.pink')return res.status(403).json({error:'origin_not_allowed'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
 try{
  if(JSON.stringify(req.body).length>2048)throw new PostbackError(400,'request_too_large');
  const input=typeof req.body==='string'?JSON.parse(req.body):req.body;
  const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('elf_tw_receipt='))?.slice('elf_tw_receipt='.length);
  const {receipt,...result}=await send(input,process.env,cookie);
  res.setHeader('Set-Cookie','elf_tw_receipt='+receipt+'; HttpOnly; Secure; SameSite=Strict; Path=/api/trackwill; Max-Age=86400');
  return res.status(200).json({...result,dashboardVerified:false});
 }catch(e){return res.status(e instanceof PostbackError?e.status:400).json({error:e instanceof PostbackError?e.code:'invalid_request'})}
}
