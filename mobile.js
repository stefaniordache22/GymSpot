function updateViewport(){
  const viewport=window.visualViewport;
  const height=viewport?.height||window.innerHeight;
  document.documentElement.style.setProperty('--visible-height',`${height}px`);
  const editing=document.activeElement?.matches('input,textarea,select');
  document.documentElement.classList.toggle('keyboard-open',!!editing&&height<window.innerHeight-120);
}
window.visualViewport?.addEventListener('resize',updateViewport);
window.addEventListener('resize',updateViewport);
document.addEventListener('focusin',updateViewport);
document.addEventListener('focusout',()=>requestAnimationFrame(updateViewport));
updateViewport();
if('serviceWorker' in navigator && window.isSecureContext){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(error=>console.warn('Offline support unavailable:',error)));
}
