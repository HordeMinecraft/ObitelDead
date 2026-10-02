// Original Obitel glyphs: 32-unit grid, chamfered shells and two material layers.
// No gradient IDs: repeated icons stay independent in the same document.
const shell=d=>'<path class="icon-base" d="'+d+'"/>';
const line=d=>'<path class="icon-detail" d="'+d+'"/>';
const accent=d=>'<path class="icon-accent" d="'+d+'"/>';
const cut=d=>'<path class="icon-cut" d="'+d+'"/>';
const symbols={
 map:shell('M3 7l8-3 10 3 8-3v22l-8 3-10-3-8 3z')+line('M11 4v22m10-19v22M6 20l4-6 6 3 5-7 5 3')+accent('M20 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-3 3-2 3h4z'),
 gear:shell('M3 12h6l4-5h16v6H18l-3 6h-4l-2 9H4l3-13H3z')+line('M13 9h12m-14 6h4m5-11h4v3M6 23h3')+accent('M21 17h5v11h-5z')+cut('M22 21h3v2h-3z'),
 garage:shell('M5 13l4-7h14l4 7v11H5zM7 24h5v4H7zm13 0h5v4h-5z')+cut('M10 9h12l2 5H8z')+line('M4 15h24M13 19h6M13 22h6')+accent('M7 18h4v3H7zm14 0h4v3h-4z'),
 daily:shell('M7 5h18v23H7zM12 3h8v5h-8z')+line('M11 13h10m-10 5h6m-6 5h4')+accent('M20 20l3 3 5-6 2 2-7 8-5-5z'),
 raids:shell('M16 3l12 5v12L16 30 4 20V8z')+cut('M10 11l6-3 6 3v8l-4 2v4h-4v-4l-4-2z')+accent('M11 13l4 1v3h-4zm6 1 4-1v4h-4zM15 20h2v2h-2z')+line('M14 25h4'),
 guide:shell('M4 5h9l3 3 3-3h9v23h-9l-3 2-3-2H4z')+line('M16 8v22M8 11h4m-4 5h4m-4 5h4')+accent('M21 6h4v14l-2-2-2 2z'),
 leaderboard:shell('M9 4h14v9l-3 8h-8l-3-8zM13 21h6v5h6v3H7v-3h6z')+line('M9 7H4v6l6 5m13-11h5v6l-6 5')+accent('M16 7l2 4 4 1-3 3v4l-3-2-3 2v-4l-3-3 4-1z'),
 friends:shell('M5 5l4-2 4 2v6l-4 3-4-3zm14 0 4-2 4 2v6l-4 3-4-3zM3 19l6-3 6 3v10H3zm14 0 6-3 6 3v10H17z')+line('M6 22h6m8 0h6')+accent('M12 18h8v3h-8z')+cut('M8 7h2v3H8zm14 0h2v3h-2z'),
 clans:shell('M5 3h22v16L16 30 5 19z')+line('M8 6h16v12l-8 8-8-8z')+accent('M14 8h4v4h-4zM9 18h4v4H9zm10 0h4v4h-4z')+line('M16 12v3m-5 3v-3h10v3'),
 conflict:shell('M4 3l5 1 19 23-3 3L4 9zM28 3l-5 1-8 10 4 4 9-9zM12 18l4 4-9 8-3-3z')+line('M7 7l18 21M25 7l-7 8')+accent('M3 23l7 7 2-2-7-7zM21 5l7 7 2-2-7-7z'),
 settings:shell('M13 3h6l1 4 4 2 4-1 2 6-4 3v4l-4 5-5-1-4 3-5-3 1-4-4-3-3-1v-7l4-1 2-4 4 1z')+cut('M22 16a6 6 0 1 1-12 0 6 6 0 0 1 12 0')+accent('M19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0'),
 medical:shell('M4 9h24v16l-3 3H7l-3-3zM11 4h10v5H11z')+line('M4 14h24M8 24h3m10 0h3')+accent('M14 12h4v5h5v4h-5v5h-4v-5H9v-4h5z'),
 energy:shell('M11 4h10v3h5v20H6V7h5z')+line('M9 10h4m6 14h4')+accent('M18 7l-8 11h6l-2 10 10-14h-7z'),
 diamond:shell('M16 2l12 9v11L16 30 4 22V11z')+line('M4 11h24M16 2l-5 9 5 19 5-19z')+accent('M16 8l5 8-5 9-5-9z'),
 skull:shell('M8 6l8-3 8 3 4 8-3 9-5 2v4h-8v-4l-5-2-3-9z')+cut('M8 12l6 2v5H8zm10 2 6-2v7h-6z')+accent('M16 19l3 4h-6z')+line('M13 29v-4m6 4v-4'),
 star:shell('M10 3h12l5 8-3 11-8 8-8-8-3-11z')+accent('M16 8l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z')+line('M11 3l2 4m8-4-2 4'),
 menu:shell('M5 4h22v24H5z')+line('M9 10h14m-14 6h10m-10 6h14')+accent('M21 14h3v4h-3z'),
 close:shell('M8 4h16l4 4v16l-4 4H8l-4-4V8z')+line('M10 10l12 12m0-12L10 22'),
 pause:shell('M8 4h16l4 4v16l-4 4H8l-4-4V8z')+accent('M10 9h4v14h-4zm8 0h4v14h-4z'),
 repulse:shell('M16 4l8 4v11l-8 9-8-9V8z')+accent('M14 10h4v5h4l-6 8-6-8h4z')+line('M5 8l-3 8 3 8m22-16 3 8-3 8'),
 run:shell('M19 3l4 2-1 5-4 1-3-3 1-4z')+line('M18 13l-6 5-5-3M13 18l5 5-3 6m3-16 7 6 4-1M12 18l-3 9H4')+accent('M14 10h6l-3 9-5-2z')+line('M3 6h8M2 11h6'),
 arrow:shell('M5 7h22v20H5z')+line('M11 21L22 10m-10 0h10v10')+accent('M22 10h2v3h-2z'),
 refresh:shell('M16 4a12 12 0 1 0 12 12h-5a7 7 0 1 1-7-7z')+accent('M16 2l9 5-9 5z'),
 unknown:shell('M8 4h16l4 4v16l-4 4H8l-4-4V8z')+line('M11 11a5 5 0 0 1 10 0c0 4-5 3-5 8m0 4v1')
};
export const ICON_NAMES=Object.freeze(Object.keys(symbols).filter(name=>name!=='unknown'));
export const icon=name=>{
 const key=Object.prototype.hasOwnProperty.call(symbols,name)?name:'unknown';
 return '<svg class="ui-icon obitel-glyph shelter-insignia" data-icon="'+key+'" viewBox="0 0 32 32" aria-hidden="true" focusable="false">'+symbols[key]+'</svg>';
};
export const shelterIcon=icon;
