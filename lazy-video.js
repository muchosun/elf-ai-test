// Match the source player's two stages: metadata near the viewport, play in view.
// Deferred src prevents the HTML parser/autoplay from loading the entire grid.
export function observeLazyVideos(root=document){
 const videos=[...root.querySelectorAll('video[data-src]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const load=video=>{
  if(video.dataset.src){
   video.preload='metadata';
   video.src=video.dataset.src;
   delete video.dataset.src;
   video.load();
  }
 };
 const near=new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries){
   if(!isIntersecting||reduced.matches)continue;
   load(target);near.unobserve(target);
  }
 },{rootMargin:'10%'});
 const visible=new Set();
 const play=video=>{load(video);video.preload='auto';video.play().catch(()=>{});};
 const view=new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries){
   if(isIntersecting){visible.add(target);if(!reduced.matches)play(target);}
   else{visible.delete(target);target.pause();}
  }
 },{threshold:.1});
 const change=()=>videos.forEach(video=>{
  if(reduced.matches)video.pause();
  else if(visible.has(video))play(video);
 });
 videos.forEach(video=>{near.observe(video);view.observe(video);});
 reduced.addEventListener('change',change);
 return()=>{near.disconnect();view.disconnect();reduced.removeEventListener('change',change);videos.forEach(video=>video.pause());};
}
