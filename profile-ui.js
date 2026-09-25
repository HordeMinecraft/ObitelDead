import {icon} from './ui-icons.js';
export const AVATARS=['medical','diamond','clans','energy','skull','star'].map(icon);
export function profileEditor(root,profile,api,toast,onSave){
 const panel=document.createElement('section');panel.className='settings-card profile-editor';
 panel.innerHTML='<span class="eyebrow">ЛИЧНОЕ ДЕЛО</span><h2>Твой позывной.</h2><form><label for="player-name">Ник игрока</label><input id="player-name" name="name" minlength="2" maxlength="32" required autocomplete="nickname"><fieldset><legend>Аватар</legend><div class="avatar-picker">'+AVATARS.map((symbol,i)=>'<button type="button" class="avatar-option avatar-'+i+'" data-avatar="'+i+'" aria-label="Аватар '+(i+1)+'" aria-pressed="'+(i===(profile.avatar||0))+'">'+symbol+'</button>').join('')+'</div></fieldset><button class="primary" type="submit">СОХРАНИТЬ ПРОФИЛЬ</button><p role="status" class="profile-status"></p></form>';
 panel.querySelector('input').value=profile.name||'';let avatar=profile.avatar||0;
 panel.querySelectorAll('[data-avatar]').forEach(button=>button.onclick=()=>{avatar=Number(button.dataset.avatar);panel.querySelectorAll('[data-avatar]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))});
 panel.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=panel.querySelector('[type=submit]');button.disabled=true;try{const data=await api('profile',{name:panel.querySelector('input').value,avatar});onSave(data);panel.querySelector('.profile-status').textContent='Профиль сохранён';toast('Позывной и аватар обновлены')}catch(error){panel.querySelector('.profile-status').textContent=error.message}finally{button.disabled=false}};
 root.prepend(panel);
}
