import {cp,copyFile} from 'node:fs/promises';
import {build} from 'vite';
await build();
await cp('assets','dist/assets',{recursive:true});
for(const f of ['catalog.json','assets-extra.json'])await copyFile(f,'dist/'+f);
