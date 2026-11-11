// Shared GTM bootstrap. Never load this inside the isolated payment input frame.
(function(w,d){
 const id='GTM-W492TPB5';
 if(w.ElfTagManager)return;
 w.ElfTagManager=Object.freeze({id});
 w.dataLayer=w.dataLayer||[];
 w.gtag=w.gtag||function(){w.dataLayer.push(arguments)};
 // Preserve the no-personal-data analytics contract, including automatic detection.
 w.gtag('consent','default',{ad_user_data:'denied',ad_personalization:'denied'});
 w.gtag('set','user_data',null);
 w.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
 const tag=d.createElement('script');tag.async=true;
 tag.src='https://www.googletagmanager.com/gtm.js?id='+id;
 d.head.appendChild(tag);
})(window,document);
