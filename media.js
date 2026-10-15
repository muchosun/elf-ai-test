export const MEDIA_ORIGIN='https://raw.githubusercontent.com/muchosun/elf-ai-test/6c96f5b2a2f02a08ea83472fc7541be31b85a422/';
export function mediaURL(path){const asset=path.replace(/^\.\//,'');return /^assets\/.*\.(?:mp4|webm|mov|jpg|jpeg|png|webp|avif|gif)(?:[?#].*)?$/i.test(asset)?MEDIA_ORIGIN+asset:'./'+asset;}
