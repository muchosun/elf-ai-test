import {cp,copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {build} from 'vite';
const localMedia=process.argv.includes('--local-media');
await build(localMedia?{define:{'import.meta.env.VITE_ELF_MEDIA_ORIGIN':JSON.stringify('./')}}:{});
await cp('assets','dist/assets',{recursive:true,filter:path=>localMedia || ! /\.(mp4|webm|mov|jpg|jpeg|png|webp|avif|gif)$/i.test(path)});
for(const f of ['catalog.json','assets-extra.json','of-creators.html','privacy.html','tracking-config.js','tracking.js','preland.css','preland-local.css','preland.js','preland-motion.js','meta-pixel.js','preland-pixel.js'])await copyFile(f,'dist/'+f);
await mkdir('dist/services/mavs-checkout/lib',{recursive:true});
await copyFile('services/mavs-checkout/lib/offers.js','dist/services/mavs-checkout/lib/offers.js');

if(localMedia){
 const path='dist/of-creators.html';
 await writeFile(path,(await readFile(path,'utf8')).replaceAll('https://muchosun.github.io/elf-ai-test/assets/','./assets/'));
}

await cp('campaign','dist/campaign',{recursive:true});
