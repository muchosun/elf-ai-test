export const MEDIA_ORIGIN='https://muchosun.github.io/elf-ai-test/';
export function mediaURL(path){const asset=path.replace(/^\.\//,'');return /^assets\/.*\.(?:mp4|webm|mov|jpg|jpeg|png|webp|avif|gif)(?:[?#].*)?$/i.test(asset)?MEDIA_ORIGIN+asset:'./'+asset;}
