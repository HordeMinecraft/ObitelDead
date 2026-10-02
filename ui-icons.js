const paths={"leaderboard":"M7 3h10v7a5 5 0 0 1-10 0z M7 5H3v3a4 4 0 0 0 4 4 M17 5h4v3a4 4 0 0 1-4 4 M12 15v5 M7 21h10","map": "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16", "gear": "M4 14l3-3 3 3 8-8 2 2-8 8 2 3-3 2-3-3-3 1-2-2z", "garage": "M4 15V9l3-5h10l3 5v6 M3 10h18v7H3z M6 17v3 M18 17v3 M6 13h2 M16 13h2", "daily": "M7 4H4v17h16V4h-3 M8 2h8v5H8z M8 11h8 M8 15h6", "raids": "M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6z M9 9l6 6 M15 9l-6 6", "guide": "M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3z M12 6v15", "settings": "M9 3h6l1 4 4 1v8l-4 1-1 4H9l-1-4-4-1V8l4-1z M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0", "friends": "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a6 6 0 0 1 12 0v3 M17 4a4 4 0 0 1 0 8 M18 15a5 5 0 0 1 4 5v1", "clans": "M5 3v18 M5 4h14l-3 5 3 5H5 M2 21h6", "conflict": "M4 3l6 2 10 14-2 2L4 7z M20 3l-6 2-3 4 M9 13l-5 6 2 2 5-5 M2 17l6 5 M16 22l6-5", "medical": "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z", "energy": "M14 2L4 14h7l-1 8 10-13h-7z", "diamond": "M12 2l9 10-9 10L3 12z M3 12h18 M12 2l-4 10 4 10 4-10z", "skull": "M6 16C0 6 6 2 12 2s12 4 6 14v5H6z M8 10h1v2H8z M15 10h1v2h-1z M10 21v-4 M14 21v-4", "star": "M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z", "menu": "M4 6h16 M4 12h16 M4 18h16", "close": "M6 6l12 12 M18 6L6 18", "pause": "M8 4v16 M16 4v16"};
export const icon=name=>'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+(paths[name]||paths.medical)+'"/></svg>';

// Original shelter insignia: stamped brass silhouettes with dark cut-outs.
const insignia={
 repulse:'<path d="M12 1l9 5v8l-9 9-9-9V6z"/><path class="icon-cut" d="M7 7h10v7l-5 5-5-5z"/><path class="icon-light" d="M10 6h4v5h4l-6 6-6-6h4z"/>',
 map:'<path d="M3 4l6-2 6 3 6-2v17l-6 2-6-3-6 2z"/><path class="icon-cut" d="M8 5h2v11H8zm6 3h2v11h-2z"/><path class="icon-light" d="M4 11h3v2H4zm13-3h3v2h-3z"/><path class="icon-mark" d="M10 10l3-4 3 4-3 4z"/>',
 gear:'<path d="M2 9h4l3-4h12v5h-6l-2 4H9l-2 7H3l3-10H2z"/><path class="icon-cut" d="M11 7h8v1h-8zM8 11h4v1H8z"/><path class="icon-light" d="M16 13h4v8h-4zm1-3h2v2h-2z"/>',
 garage:'<path d="M3 10l3-6h12l3 6v8h-3v3h-4v-3H9v3H5v-3H2v-8z"/><path class="icon-cut" d="M7 6h9l2 4H5zm-3 7h4v2H4zm12 0h4v2h-4z"/><path class="icon-light" d="M10 12h4v5h-4z"/>',
 daily:'<path d="M5 3h14v19H5zM9 1h6v5H9z"/><path class="icon-cut" d="M8 8h8v2H8zm0 4h5v2H8zm0 4h3v2H8z"/><path class="icon-mark" d="M15 13l6 3-1 5-4 2-4-4z"/>',
 raids:'<path d="M12 1l9 4v9l-9 9-9-9V5z"/><path class="icon-cut" d="M7 7l5-2 5 2v7l-3 2v3h-4v-3l-3-2z"/><path class="icon-light" d="M8 9l3 1v3H8zm5 1l3-1v4h-3zm-2 5h2v2h-2z"/>',
 guide:'<path d="M3 3h8l2 2 2-2h6v17h-7l-2 2-2-2H3z"/><path class="icon-cut" d="M11 6h2v13h-2zM5 6h4v2H5zm0 4h4v1H5zm0 3h4v1H5z"/><path class="icon-mark" d="M16 6h3v9l-2-2-1 2z"/>',
 leaderboard:'<path d="M9 2h6l2 5-2 8H9L7 7zm1 14h4v3h5v3H5v-3h5zM3 4h3v8l3 3-2 2-4-5zm15 0h3v8l-4 5-2-2 3-3z"/><path class="icon-cut" d="M12 5l1 3 2 1-2 2v2h-2v-2L9 9l2-1z"/>',
 friends:'<path d="M4 4h6l2 4-2 5H4L2 8zm10 0h6l2 4-2 5h-6l-2-5zM1 16l5-2 5 2v6H1zm12 0l5-2 5 2v6H13z"/><path class="icon-cut" d="M4 8h6v2H4zm10 0h6v2h-6z"/><path class="icon-light" d="M5 17h2v4H5zm12 0h2v4h-2z"/>',
 clans:'<path d="M3 2h18v11l-9 10-9-10z"/><path class="icon-cut" d="M7 5h10v8l-5 5-5-5z"/><path class="icon-light" d="M11 6h2v3h3v2h-3v4h-2v-4H8V9h3z"/>',
 conflict:'<path d="M2 4l3-2 15 17-3 3zM19 2l3 3-6 7-3-3zM8 13l3 3-6 6-3-3z"/><path class="icon-cut" d="M5 5l13 14-1 1L4 6z"/><path class="icon-light" d="M3 15l6 6-2 2-6-6zm12-12l6 6 2-2-6-6z"/>',
 settings:'<path d="M9 1h6v3l3 2 3-1 2 5-3 2v3l2 2-4 4-3-2h-3l-2 3-5-2 1-3-2-3H1V8h3l2-3 3 1z"/><path class="icon-cut" d="M8 8h8v8H8z"/><path class="icon-light" d="M10 10h4v4h-4z"/>'
};
const standardIcon=icon;
export const shelterIcon=name=>insignia[name]?'<svg class="ui-icon shelter-insignia" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+insignia[name]+'</svg>':standardIcon(name);
