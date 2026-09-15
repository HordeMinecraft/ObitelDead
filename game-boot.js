// Mobile/VK compatible boot loader
(async function(){
  try{
    await import('./platform-entry.js');
    await import('./game.js');
    window.__obitelGameReady=true;
    const e=document.getElementById('startup-error');
    if(e) e.remove();
  }catch(err){
    console.error('Obitel startup error',err);
    if(window.obitelStartupFailure){
      window.obitelStartupFailure('GAME_START');
    }
  }
})();
