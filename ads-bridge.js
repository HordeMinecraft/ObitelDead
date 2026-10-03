export async function playRewardedAd(bridge){
 globalThis.document?.dispatchEvent(new CustomEvent('obitel-media-hold',{detail:true}));
 try{
 const available=await bridge.send('VKWebAppCheckNativeAds',{ad_format:'reward'});
 if(available?.result!==true)throw new Error('Сейчас нет доступной рекламы. Попробуй позже.');
 const shown=await bridge.send('VKWebAppShowNativeAds',{ad_format:'reward'});
 if(shown?.result!==true)throw new Error('Просмотр не завершён. Награда не выдана.');
 return true;
 }finally{globalThis.document?.dispatchEvent(new CustomEvent('obitel-media-hold',{detail:false}))}
}
