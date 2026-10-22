import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {observeLazyVideos} from '../lazy-video.js';
const observers=[];
globalThis.IntersectionObserver=class{
 constructor(callback,options){this.callback=callback;this.options=options;observers.push(this);}
 observe(){} unobserve(){} disconnect(){this.disconnected=true;}
 emit(target,isIntersecting){this.callback([{target,isIntersecting}]);}
};
let onChange;
const motion={matches:false,addEventListener(_,fn){onChange=fn;},removeEventListener(){onChange=null;}};
globalThis.matchMedia=()=>motion;
const video=()=>({dataset:{src:'clip.mp4'},loads:0,plays:0,pauses:0,load(){this.loads++;},play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;}});
const a=video(),b=video();
const stop=observeLazyVideos({querySelectorAll:()=>[a,b]});
assert.equal(a.loads,0,'offscreen video must not fetch');
observers[0].emit(a,true);
assert.equal(a.loads,1);assert.equal(a.plays,0,'near viewport must not autoplay');
observers[1].emit(a,true);
assert.equal(a.loads,1,'entering view must reuse the request');assert.equal(a.plays,1);
observers[1].emit(a,false);assert.equal(a.pauses,1);
assert.equal(b.loads,0,'unrelated video stays deferred');
motion.matches=true;onChange();observers[1].emit(b,true);assert.equal(b.loads,0);
motion.matches=false;onChange();assert.equal(b.loads,1);assert.equal(b.plays,1);
stop();assert.ok(observers.every(o=>o.disconnected));assert.equal(onChange,null);
// The initial HTML must not trigger requests before the source player mounts.
const tags=readFileSync(new URL('../of-creators.html',import.meta.url),'utf8').match(/<video\b[^>]*>/g);
assert.equal(tags.filter(v=>v.includes('data-native-hero')).length,1);
assert.ok(tags.filter(v=>!v.includes('data-native-hero')).every(v=>v.includes('preload="none"')&&!v.includes('autoplay')));
console.log('PASS: no offscreen fetch, near-viewport load, playback/pause, no duplicate load, reduced motion, cleanup, initial HTML');
