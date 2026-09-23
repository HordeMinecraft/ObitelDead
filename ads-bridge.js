export async function playRewardedAd(bridge){
 const available=await bridge.send('VKWebAppCheckNativeAds',{ad_format:'reward'});
 if(available?.result!==true)throw new Error('Сейчас нет доступной рекламы. Попробуй позже.');
 const shown=await bridge.send('VKWebAppShowNativeAds',{ad_format:'reward'});
 if(shown?.result!==true)throw new Error('Просмотр не завершён. Награда не выдана.');
 return true;
}
