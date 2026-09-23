const KEY='obitel-onboarding-v1';
const steps=[
 ['Добро пожаловать в убежище','Твоя цель — вернуть город выжившим. Начни с Тихого квартала, собирай материалы и открывай новые районы. Позже вступи в клан и восстанови подземный реактор.','map','ОСМОТРЕТЬ УПРАВЛЕНИЕ'],
 ['Двигайся. Огонь — автоматический.','Телефон: джойстик слева, кнопка бега справа. Компьютер: WASD или стрелки, Shift — бег. Держи дистанцию, подбирай аптечки и следи за выносливостью. Пауза — кнопка Ⅱ.','map','КАК ОТКРЫТЬ БОССА'],
 ['Три зачистки до босса','Одна вылазка стоит 8 энергии и состоит из трёх волн. После трёх успешных зачисток и достижения нужного уровня откроется босс. Победи его, чтобы перейти в следующий район. Энергия восстанавливается сама.','map','КАК СТАТЬ СИЛЬНЕЕ'],
 ['Подготовься и возвращайся','В «Снаряжении» покупай и экипируй оружие и броню, в «Гараже» улучшай машину. Друзья атакуют рейдового босса в своё время, здоровье общее. Контракты дают ежедневную цель. Реклама за энергию — только по желанию.','gear','К ПЕРВОЙ ВЫЛАЗКЕ']
];
export function onboarding(navigate,force=false){
 if(document.querySelector('#onboarding'))return;
 let saved=0;try{const value=JSON.parse(localStorage.getItem(KEY)||'0');if(value==='done'&&!force)return;if(!force&&Number.isInteger(value))saved=Math.max(0,Math.min(3,value));}catch{}
 let step=force?0:saved;const previous=document.activeElement;const modal=document.createElement('dialog');modal.id='onboarding';modal.setAttribute('aria-labelledby','tutorial-title');document.body.append(modal);
 const remember=value=>{try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}};
 const close=()=>{remember('done');modal.close();modal.remove();navigate('map');previous?.focus?.();};
 function draw(){const [title,text,page,button]=steps[step];navigate(page);remember(step);modal.innerHTML=`<span class="eyebrow orange">ПЕРВЫЙ ВЫХОД · ${step+1} / ${steps.length}</span><h2 id="tutorial-title">${title}</h2><p>${text}</p><div class="tutorial-dots" aria-hidden="true">${steps.map((_,i)=>'<i class="'+(i===step?'active':'')+'"></i>').join('')}</div><div class="tutorial-actions"><button class="secondary" id="tutorial-skip">ПОЗЖЕ</button>${step?'<button class="secondary" id="tutorial-back">НАЗАД</button>':''}<button class="primary" id="tutorial-next">${button}</button></div><small>Повторить обучение можно в настройках. Энергия сейчас не тратится.</small>`;modal.querySelector('#tutorial-skip').onclick=close;const back=modal.querySelector('#tutorial-back');if(back)back.onclick=()=>{step--;draw()};modal.querySelector('#tutorial-next').onclick=()=>{if(step===steps.length-1)close();else{step++;draw()}};modal.querySelector('#tutorial-next').focus();}
 modal.addEventListener('cancel',e=>{e.preventDefault();close()});draw();modal.showModal();modal.querySelector('#tutorial-next').focus();
}
