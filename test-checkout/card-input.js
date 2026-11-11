// Local presentation only; these functions do not verify a bank card or send data.
export const digitsOnly=value=>String(value).replace(/\D/g,'');
export function formatCardNumber(value){return digitsOnly(value).slice(0,19).replace(/(.{4})(?=.)/g,'$1 ')}
export function formatExpiry(value){const digits=digitsOnly(value).slice(0,4);return digits.length>2?digits.slice(0,2)+' / '+digits.slice(2):digits}
export function detectCardBrand(value){
 const digits=digitsOnly(value);if(digits.startsWith('4'))return 'visa';
 const prefix=Number(digits.slice(0,4));
 if(/^5[1-5]/.test(digits)||(digits.length>=4&&prefix>=2221&&prefix<=2720))return 'mastercard';
 return '';
}
export function passesLuhn(value){
 const digits=digitsOnly(value);if(!/^\d{13,19}$/.test(digits)||/^0+$/.test(digits))return false;
 let sum=0;for(let i=digits.length-1,twice=false;i>=0;i--,twice=!twice){let digit=Number(digits[i]);if(twice){digit*=2;if(digit>9)digit-=9}sum+=digit}return sum%10===0;
}
export function expiryIsCurrent(value,year,month){
 const digits=digitsOnly(value);if(digits.length!==4)return false;
 const m=Number(digits.slice(0,2)),y=2000+Number(digits.slice(2));return m>=1&&m<=12&&(y>year||(y===year&&m>=month));
}
export function digitCaret(formatted,count){
 if(count<=0)return 0;let seen=0;for(let i=0;i<formatted.length;i++)if(/\d/.test(formatted[i])&&++seen===count)return i+1;return formatted.length;
}
export function maskInput(input,format){
 const raw=input.value,start=input.selectionStart??raw.length,end=input.selectionEnd??start;
 const left=digitsOnly(raw.slice(0,start)).length,right=digitsOnly(raw.slice(0,end)).length;
 input.value=format(raw);input.setSelectionRange(digitCaret(input.value,left),digitCaret(input.value,right));
}
export function removeAcrossSeparator(input,event){
 const start=input.selectionStart,end=input.selectionEnd,value=input.value;
 if(start===null||start!==end)return;
 if(event.inputType==='deleteContentBackward'&&start>0&&/\D/.test(value[start-1])){
  let left=start-1;while(left>0&&/\D/.test(value[left]))left--;
  event.preventDefault();input.setRangeText('',left,start,'end');input.dispatchEvent(new Event('input',{bubbles:true}));
 }else if(event.inputType==='deleteContentForward'&&start<value.length&&/\D/.test(value[start])){
  let right=start;while(right<value.length&&/\D/.test(value[right]))right++;
  event.preventDefault();input.setRangeText('',start,Math.min(right+1,value.length),'end');input.dispatchEvent(new Event('input',{bubbles:true}));
 }
}
export function insertDigits(input,text,limit){
 const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
 const current=digitsOnly(input.value),left=digitsOnly(input.value.slice(0,start)).length,right=digitsOnly(input.value.slice(0,end)).length;
 const incoming=digitsOnly(text).slice(0,Math.max(0,limit-current.length+right-left));
 input.value=current.slice(0,left)+incoming+current.slice(right);input.setSelectionRange(left+incoming.length,left+incoming.length);input.dispatchEvent(new Event('input',{bubbles:true}));
}
