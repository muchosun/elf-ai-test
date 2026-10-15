import {cp,copyFile,mkdir} from 'node:fs/promises';
import {build} from 'vite';
await build();
await cp('assets','dist/assets',{recursive:true,filter:path=>! /\.(mp4|webm|mov|jpg|jpeg|png|webp|avif|gif)$/i.test(path)});
for(const f of ['catalog.json','assets-extra.json','of-creators.html','preland.css','preland-local.css','preland.js','preland-motion.js'])await copyFile(f,'dist/'+f);
await mkdir('dist/services/mavs-checkout/lib',{recursive:true});
await copyFile('services/mavs-checkout/lib/offers.js','dist/services/mavs-checkout/lib/offers.js');
