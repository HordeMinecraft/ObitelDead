import './platform-entry.js';

// A classic bundled script also runs in WebViews without ES module/TLA support.
import('./game.js').then(()=>{
 window.__obitelGameReady=true;
 document.getElementById('startup-error')?.remove();
}).catch(()=>window.obitelStartupFailure?.('GAME_INIT'));
