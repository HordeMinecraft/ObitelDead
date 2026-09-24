const query='(orientation: landscape) and (max-height: 550px)';
export function initLandscape(){
 const header=document.querySelector('header'),aside=document.querySelector('aside'),main=document.querySelector('main'),resources=document.querySelector('.resources');
 const marker=document.createComment('resource-position');resources.before(marker);
 const toggle=document.createElement('button');toggle.id='landscape-menu';toggle.className='secondary';toggle.textContent='☰';toggle.setAttribute('aria-label','Открыть меню');toggle.setAttribute('aria-expanded','false');aside.id='game-navigation';toggle.setAttribute('aria-controls',aside.id);
 const title=document.createElement('span');title.className='landscape-current';
 const shade=document.createElement('button');shade.className='landscape-shade';shade.setAttribute('aria-label','Закрыть меню');shade.tabIndex=-1;
 header.prepend(toggle,title);document.body.append(shade);
 const media=matchMedia(query);let open=false;
 const change=value=>{open=value&&media.matches;document.body.classList.toggle('landscape-menu-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');toggle.textContent=open?'×':'☰';aside.inert=media.matches&&!open;main.inert=open;if(open)aside.querySelector('nav button.active')?.focus();};
 toggle.onclick=()=>change(!open);shade.onclick=()=>{change(false);toggle.focus()};
 aside.addEventListener('click',e=>{if(e.target.closest('nav button')&&media.matches){change(false);main.scrollTop=0;toggle.focus();}});
 document.addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape'){e.preventDefault();change(false);toggle.focus();}if(e.key==='Tab'){const items=[toggle,...aside.querySelectorAll('nav button:not(:disabled)')],i=items.indexOf(document.activeElement),next=e.shiftKey?(i<=0?items.length-1:i-1):(i+1)%items.length;e.preventDefault();items[next].focus();}});
 const syncTitle=()=>{title.textContent=(aside.querySelector('nav button.active')?.innerText||'Убежище').replace(/\s*\d+\s*$/,'').trim();};
 new MutationObserver(syncTitle).observe(document.querySelector('#page-title'),{childList:true,subtree:true,characterData:true});
 const resize=()=>{change(false);if(media.matches)header.append(resources);else marker.after(resources);syncTitle();};
 media.addEventListener('change',resize);resize();
}
