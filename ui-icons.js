// Original 24-unit pictograms. Open silhouettes keep their meaning at 18–22 px.
const shell=d=>'<path class="icon-base" d="'+d+'"/>';
const line=d=>'<path class="icon-detail" d="'+d+'"/>';
const accent=d=>'<path class="icon-accent" d="'+d+'"/>';
const cut=d=>'<path class="icon-cut" d="'+d+'"/>';
const symbols={
 map:shell('M3 4h6v6H3zm12 0h6v6h-6zM3 15h6v6H3z')+line('M12 3v9H3m9 0h9m-9 0v9')+accent('M17 14h3l2 3-4 5-4-5z')+cut('M17 16h2v2h-2z'),
 gear:shell('M2 9h5l3-3h9v3h3v3h-9l-2 4H8l-2 5H3l3-9H2z')+line('M10 4h6v2m-2 7h5v5h-3l-2-5')+accent('M11 8h8v2h-8z'),
 garage:shell('M3 11l3-6h12l3 6v7H3zM5 18h3v3H5zm11 0h3v3h-3z')+cut('M7 7h10l2 4H5z')+accent('M5 13h3v2H5zm11 0h3v2h-3z')+line('M10 14h4'),
 daily:shell('M5 4h14v17H5z')+line('M9 2h6v4H9')+cut('M8 9h8v1.5H8zm0 4h5v1.5H8z')+accent('M14 16l3 3 5-6 1 2-6 7-4-4z'),
 raids:shell('M6 4l6-2 6 2 3 7-2 6-4 2v3H9v-3l-4-2-2-6z')+cut('M6 8h12v7H6z')+accent('M7 10h3v3H7zm7 0h3v3h-3z')+line('M10 18h4m-3 2v2m2-2v2'),
 guide:shell('M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3z')+cut('M11 6h2v14h-2zM5 8h4v1.5H5zm0 4h4v1.5H5z')+accent('M16 4h3v10l-1.5-2-1.5 2z'),
 leaderboard:shell('M7 3h10v8l-3 5h-4l-3-5zM10 17h4v3h4v2H6v-2h4z')+line('M7 5H3v4l4 3m10-7h4v4l-4 3')+accent('M11 6h2v5h-2z'),
 friends:shell('M5 3h4l2 2v4l-2 2H5L3 9V5zm10 0h4l2 2v4l-2 2h-4l-2-2V5zM2 16l5-3 5 3v6H2zm12 0 3-3 5 3v6h-8z')+accent('M10 15h4v3h-4z'),
 clans:shell('M4 3h16v11l-8 8-8-8z')+cut('M7 6h10v7l-5 5-5-5z')+accent('M9 7h6v3h-6zm-1 5h3v3H8zm5 0h3v3h-3z'),
 conflict:shell('M3 2l4 1 14 17-3 2L3 7zM21 2l-4 1-6 7 3 4 7-7zM8 14l4 4-6 4-3-2z')+accent('M2 17l5 5 2-2-5-5zM16 4l4 5 2-2-4-5z'),
 settings:shell('M4 3h16v18H4z')+cut('M7.25 6h1.5v12h-1.5zm8 0h1.5v12h-1.5z')+accent('M6 9h4v3H6zm8 5h4v3h-4z'),
 medical:shell('M3 7h18v13H3z')+line('M8 3h8v4')+cut('M5 9h14v9H5z')+accent('M10 9h4v3h3v3h-3v3h-4v-3H7v-3h3z'),
 energy:accent('M13 2L4 14h7l-1 8 10-12h-7z'),
 diamond:shell('M7 3h10l5 7-10 12L2 10z')+line('M2 10h20M7 3l-1 7 6 12 6-12-1-7')+accent('M11 6h2l2 4-3 7-3-7z'),
 skull:shell('M6 4l6-2 6 2 3 6-2 7-4 2v3H9v-3l-4-2-2-7z')+cut('M6 8h5v5H6zm7 0h5v5h-5z')+accent('M12 13l2 3h-4z')+line('M10 20v2m4-2v2'),
 star:accent('M12 2l3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z')+cut('M12 7l1.5 4 4 .5-3 3 .5 4-3-2-3 2 .5-4-3-3 4-.5z'),
 menu:line('M3 5h18M3 12h12M3 19h18')+accent('M18 10h3v4h-3z'),
 close:line('M5 5l14 14M19 5L5 19'),
 pause:accent('M5 3h5v18H5zm9 0h5v18h-5z'),
 repulse:shell('M12 2l8 4v8l-8 8-8-8V6z')+accent('M11 6h2v5h4l-5 6-5-6h4z'),
 run:shell('M14 2h4v4h-4zM11 8l5-1 3 6-3 1-2-4-2 5-4-1z')+line('M11 15l5 3-2 4m-3-7-4 6H3M9 9l-4 3H2')+accent('M19 10h3v2h-3z'),
 arrow:line('M4 12h16M14 6l6 6-6 6'),
 refresh:line('M20 10a8 8 0 1 0-2 8M20 3v7h-7')+accent('M19 15h3v3h-3z'),
 unknown:line('M8 7a4 4 0 1 1 6 4c-2 1-2 3-2 4m0 4v1')
};
export const ICON_NAMES=Object.freeze(Object.keys(symbols).filter(name=>name!=='unknown'));
export const icon=name=>{
 const key=Object.prototype.hasOwnProperty.call(symbols,name)?name:'unknown';
 return '<svg class="ui-icon obitel-glyph shelter-insignia" data-icon="'+key+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+symbols[key]+'</svg>';
};
export const shelterIcon=icon;
