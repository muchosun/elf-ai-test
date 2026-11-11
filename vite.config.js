import {defineConfig} from 'vite';
const campaignRoute=(req,res,next)=>{if(req.url?.split('?')[0]==='/f/campaign/creators-101')req.url='/creators.html'+(req.url.includes('?')?'?'+req.url.split('?').slice(1).join('?'):'');next()};
export default defineConfig({base:'./',plugins:[{name:'creators-route',configureServer(s){s.middlewares.use(campaignRoute)},configurePreviewServer(s){s.middlewares.use(campaignRoute)}}],build:{target:'es2022',rollupOptions:{input:{main:'index.html',creators:'creators.html'}}}});
