// Original etched pictograms: one 24-unit grid, 1.6-unit strokes, small brass marks.
const line=d=>'<path class="icon-detail" d="'+d+'"/>';
const accent=d=>'<path class="icon-accent" d="'+d+'"/>';
const symbols={
 map:line('M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16')+accent('M5 9h2v2H5z'),
 gear:line('M3 9h5l2-3h10v4h2v2H12l-2 5H7l-2 4H2l4-9H3zM11 4h6m-5 8h6v5h-3l-2-5')+accent('M17 7h2v2h-2z'),
 garage:line('M3 11l3-6h12l3 6v8H3zM3 11h18M5 19v2m14-2v2M6 14h2m8 0h2M10 17h4')+accent('M11 7h2v2h-2z'),
 daily:line('M8 4H4v17h16V4h-4M8 2h8v5H8zM8 11h8m-8 4h5')+accent('M15 15h2v2h-2z'),
 raids:line('M12 2l8 4v7c0 4-5 7-8 9-3-2-8-5-8-9V6zM8 9l2-2h4l2 2v5l-2 2h-4l-2-2zm2 7v2m4-2v2')+accent('M9 10h2v2H9zm4 0h2v2h-2z'),
 guide:line('M3 4h6l3 2 3-2h6v16h-6l-3 2-3-2H3zM12 6v16M6 8h3m-3 4h3m6 3h3')+accent('M16 5h2v6h-2z'),
 leaderboard:line('M7 3h10v8l-3 5h-4l-3-5zM7 5H3v4l4 3m10-7h4v4l-4 3M12 16v5m-5 0h10')+accent('M11 6h2v4h-2z'),
 friends:line('M10 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0m10 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0M2 20v-4l2-3h6l2 3v4m2-7h6l2 3v4')+accent('M15 18h2v2h-2z'),
 clans:line('M4 3h16v11l-8 8-8-8zM7 6h10v7l-5 5-5-5z')+accent('M10 8h4v2h-4z'),
 conflict:line('M3 3l4 1 14 16-2 2L3 7zM21 3l-4 1-4 5m-3 4-7 7 2 2 6-5M2 17l5 5m10-5 5 5')+accent('M17 5h2v2h-2z'),
 settings:line('M6 3v18M12 3v18M18 3v18M4 7h4v4H4zm6 8h4v4h-4z')+accent('M16 6h4v4h-4z'),
 medical:line('M3 7h18v14H3zM8 7V3h8v4M10 10h4v3h3v3h-3v3h-4v-3H7v-3h3z')+accent('M19 18h2v2h-2z'),
 energy:line('M13 2L4 14h7l-1 8 10-12h-7z')+accent('M12 10h2v2h-2z'),
 diamond:line('M7 3h10l5 7-10 12L2 10zM2 10h20M7 3l-1 7 6 12 6-12-1-7')+accent('M11 6h2v2h-2z'),
 skull:line('M6 4l6-2 6 2 3 6-2 7-4 2v3H9v-3l-4-2-2-7zM7 8h3v4H7zm7 0h3v4h-3zM10 20v2m4-2v2')+accent('M12 13l2 3h-4z'),
 star:line('M12 2l3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z')+accent('M11 10h2v3h-2z'),
 menu:line('M4 6h16M4 12h11M4 18h16')+accent('M18 11h2v2h-2z'),
 close:line('M6 6l12 12M18 6L6 18'),
 pause:line('M6 4h3v16H6zm9 0h3v16h-3z'),
 repulse:line('M12 2l8 4v8l-8 8-8-8V6zM8 12l4 4 4-4M12 6v10')+accent('M11 18h2v2h-2z'),
 run:line('M16 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4M5 12l5-4 5 1 3 4h4M12 9l-2 6 5 3-1 4m-4-7-4 6H2')+accent('M1 8h3v2H1z'),
 arrow:line('M4 12h16M14 6l6 6-6 6'),
 refresh:line('M20 10a8 8 0 1 0-2 8M20 3v7h-7')+accent('M20 15h2v2h-2z'),
 unknown:line('M8 7a4 4 0 1 1 6 4c-2 1-2 3-2 4m0 4v1')
};
export const ICON_NAMES=Object.freeze(Object.keys(symbols).filter(name=>name!=='unknown'));
export const icon=name=>{
 const key=Object.prototype.hasOwnProperty.call(symbols,name)?name:'unknown';
 return '<svg class="ui-icon obitel-glyph shelter-insignia" data-icon="'+key+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+symbols[key]+'</svg>';
};
export const shelterIcon=icon;
