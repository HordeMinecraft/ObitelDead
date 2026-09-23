// Permanent chassis bonuses; workshop upgrades remain shared across the collection.
export const VEHICLES=[
 ['nomad','Кочевник','Внедорожник',1,0,0,0,0,'Первая мобильная база. Надёжный кузов и всё необходимое для вылазки.'],
 ['spark','Искра','Хэтчбек',2,300,2,0,3,'Лёгкая машина для коротких рейсов за припасами.'],
 ['hauler','Добытчик','Пикап',4,650,0,3,6,'Открытый кузов и крепления для дополнительного груза.'],
 ['medic','Санитар','Медицинский фургон',6,1100,0,8,2,'Усиленная защита для опасных спасательных маршрутов.'],
 ['dune','Бархан','Багги',10,1800,7,0,4,'Лёгкая рама и мощная оружейная электростанция.'],
 ['trail','Следопыт','Универсал',15,2600,3,4,8,'Экспедиционный багажник для долгих сборов ресурсов.'],
 ['interceptor','Перехватчик','Патрульный автомобиль',25,4000,9,4,0,'Боевой выезд: высокий урон при небольшом грузовом отсеке.'],
 ['tow','Тягач','Эвакуатор',40,5800,2,7,10,'Лебёдка и грузовая платформа для тяжёлых трофеев.'],
 ['ranger','Егерь','Экспедиционный джип',60,8200,7,7,7,'Сбалансированная база для любого района города.'],
 ['vault','Сейф','Бронефургон',90,11500,3,13,5,'Бронеплиты для выживания под давлением орды.'],
 ['engineer','Монтажник','Сервисный грузовик',130,15500,5,7,13,'Мастерская на колёсах. Максимум полезной добычи.'],
 ['bastion','Бастион','Бронетранспортёр',200,21000,10,14,3,'Шесть колёс и тяжёлая защита для передовой.'],
 ['command','Комендант','Командный автобус',300,28000,12,10,10,'Подвижный штаб для командира убежища.'],
 ['ark','Ковчег','Экспедиционный грузовик',450,38000,10,15,15,'Дальние маршруты и большой запас прочности.']
].map(([id,name,type,level,cost,damage,hp,loot,description],art)=>({id,name,type,level,cost,damage,hp,loot,description,art}));
for(const [id,name,type,base,votes] of [
 ['silver','Серебряный след','Коллекционный купе',6,25],
 ['crimson','Багровый закат','Коллекционный маслкар',4,20],
 ['phantom','Фантом','Коллекционный ралли-кар',8,35],
 ['arctic','Полярник','Арктический грузовик',10,45],
 ['sovereign','Суверен','Бронированный лимузин',11,55],
 ['horizon','Горизонт','Мобильная лаборатория',13,65]
]){const v=VEHICLES[base];VEHICLES.push({...v,id,name,type,cost:0,votes,base,art:VEHICLES.length,description:'Особый кузов. Бонусы как у «'+v.name+'», без преимущества за оплату.'});}
export const vehicleFor=s=>VEHICLES.find(v=>v.id===s.vehicle)||VEHICLES[0];
export function migrateVehicles(s){s.ownedVehicles=Array.isArray(s.ownedVehicles)?[...new Set(['nomad',...s.ownedVehicles.filter(id=>VEHICLES.some(v=>v.id===id))])]:['nomad'];if(!s.ownedVehicles.includes(s.vehicle))s.vehicle='nomad';return s;}
export function purchaseVehicle(s,id,level){
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
 const v=VEHICLES.find(x=>x.id===id);if(!v)fail('Автомобиль не найден');
 if(level<v.level)fail('Нужен уровень '+v.level);
 migrateVehicles(s);
 if(!s.ownedVehicles.includes(id)){
  if(v.votes)fail('Покупки за голоса ещё не подключены. Списания не будет.',503);
  if(s.scrap<v.cost)fail('Не хватает деталей');
  s.scrap-=v.cost;s.ownedVehicles.push(id);
 }
 s.vehicle=id;return {vehicle:id};
}
