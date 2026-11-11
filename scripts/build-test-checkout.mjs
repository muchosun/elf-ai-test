import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {orderSummaries} from '../test-checkout/order-summary.js';
const plans=orderSummaries;
const helpers=(await readFile('test-checkout/card-input.js','utf8')).replace(/^export /gm,'');
const script=helpers+'\n'+(await readFile('test-checkout/form.js','utf8')).replace('__PLANS__',JSON.stringify(plans));
const hash='sha256-'+createHash('sha256').update(script).digest('base64');
await writeFile('test-checkout/frame.html',(await readFile('test-checkout/template.html','utf8')).replace('__HASH__',hash).replace('__SCRIPT__',()=>script));
