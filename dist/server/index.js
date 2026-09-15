// balance.js
var MAPS = [
  { name: "\u0422\u0438\u0445\u0438\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B", desc: "\u0412 \u043E\u043A\u043D\u0430\u0445 \u0435\u0449\u0451 \u0433\u043E\u0440\u0438\u0442 \u0441\u0432\u0435\u0442. \u041D\u0430 \u0443\u043B\u0438\u0446\u0430\u0445 \u0443\u0436\u0435 \u043D\u0438\u043A\u043E\u0433\u043E \u0436\u0438\u0432\u043E\u0433\u043E.", goal: "\u0417\u0430\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0436\u0438\u043B\u043E\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B", boss: "\u0421\u043C\u043E\u0442\u0440\u0438\u0442\u0435\u043B\u044C", level: 1, palette: ["#6c7660", "#485340", "#8b8870", "#a4a080"], reward: 85, kind: "town" },
  { name: "\u0410\u0417\u0421 \xAB\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F\xBB", desc: "\u0417\u0430\u043F\u0430\u0445 \u0431\u0435\u043D\u0437\u0438\u043D\u0430. \u041F\u0443\u0441\u0442\u044B\u0435 \u0431\u0430\u043A\u0438. \u0418 \u043A\u0442\u043E-\u0442\u043E \u0437\u0430 \u043A\u043E\u043B\u043E\u043D\u043A\u043E\u0439.", goal: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0437\u0430\u043F\u0430\u0441 \u0442\u043E\u043F\u043B\u0438\u0432\u0430", boss: "\u041F\u043E\u0434\u0436\u0438\u0433\u0430\u0442\u0435\u043B\u044C", level: 2, palette: ["#786953", "#514b3a", "#a38d65", "#c5a271"], reward: 110, kind: "gas" },
  { name: "\u0413\u0440\u0443\u0437\u043E\u0432\u043E\u0439 \u0434\u0432\u043E\u0440", desc: "\u041A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u044B \u0437\u0430\u043F\u0435\u0440\u0442\u044B \u0438\u0437\u043D\u0443\u0442\u0440\u0438. \u0421\u0442\u0443\u043A \u043D\u0435 \u043F\u0440\u0435\u043A\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F.", goal: "\u0412\u0441\u043A\u0440\u044B\u0442\u044C \u0441\u043A\u043B\u0430\u0434 \u0441\u043D\u0430\u0431\u0436\u0435\u043D\u0438\u044F", boss: "\u041A\u0440\u0430\u043D\u043E\u0432\u0449\u0438\u043A", level: 3, palette: ["#627272", "#3e5150", "#738886", "#98a5a0"], reward: 140, kind: "yard" },
  { name: "\u0411\u043E\u043B\u044C\u043D\u0438\u0446\u0430 \u2116 6", desc: "\u041A\u0430\u0440\u0430\u043D\u0442\u0438\u043D \u0441\u043D\u044F\u0442. \u041F\u0430\u0446\u0438\u0435\u043D\u0442\u044B \u043E\u0441\u0442\u0430\u043B\u0438\u0441\u044C.", goal: "\u041D\u0430\u0439\u0442\u0438 \u043C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0439 \u043C\u043E\u0434\u0443\u043B\u044C", boss: "\u0413\u043B\u0430\u0432\u0432\u0440\u0430\u0447", level: 4, palette: ["#687468", "#465b4f", "#8c9a84", "#b0b49b"], reward: 175, kind: "hospital" },
  { name: "\u0427\u0451\u0440\u043D\u044B\u0439 \u043B\u0435\u0441", desc: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0441\u0438\u0433\u043D\u0430\u043B \u043F\u0440\u0438\u0448\u0451\u043B \u043E\u0442\u0441\u044E\u0434\u0430. \u0414\u0430\u043B\u044C\u0448\u0435 \u2014 \u0442\u0438\u0448\u0438\u043D\u0430.", goal: "\u041D\u0430\u0439\u0442\u0438 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0441\u0438\u0433\u043D\u0430\u043B\u0430", boss: "\u041A\u043E\u0440\u043D\u0435\u0432\u043E\u0439", level: 5, palette: ["#525f4a", "#354736", "#71825b", "#94a071"], reward: 220, kind: "forest" }
];
var WEAPONS = [{ name: "\u041F\u0438\u0441\u0442\u043E\u043B\u0435\u0442 \xAB\u0421\u0438\u0433\u043D\u0430\u043B\xBB", damage: 22, rate: 0.48, range: 370, cost: 0, description: "\u0422\u043E\u0447\u043D\u044B\u0439 \u0438 \u043D\u0430\u0434\u0451\u0436\u043D\u044B\u0439. \u0425\u043E\u0440\u043E\u0448 \u0434\u043B\u044F \u043F\u0435\u0440\u0432\u044B\u0445 \u0432\u044B\u043B\u0430\u0437\u043E\u043A." }, { name: "\u041A\u0430\u0440\u0430\u0431\u0438\u043D \xAB\u0420\u0443\u0431\u0435\u0436\xBB", damage: 15, rate: 0.28, range: 430, cost: 360, description: "\u0412\u044B\u0441\u043E\u043A\u0430\u044F \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0440\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C. \u0414\u0435\u0440\u0436\u0438 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u044E." }, { name: "\u0414\u0440\u043E\u0431\u043E\u0432\u0438\u043A \xAB\u0413\u0440\u043E\u043C\xBB", damage: 13, rate: 0.82, range: 240, pellets: 5, cost: 440, description: "\u041F\u044F\u0442\u044C \u0434\u0440\u043E\u0431\u0438\u043D. \u041F\u043E\u0434\u043F\u0443\u0441\u043A\u0430\u0439 \u0431\u043B\u0438\u0436\u0435 \u0438 \u043E\u0442\u0445\u043E\u0434\u0438 \u0431\u0435\u0433\u043E\u043C." }];
var ENERGY_MAX = 60;
var ENERGY_INTERVAL = 5 * 60 * 1e3;
var RAID_COST = 8;
var BOSS_COST = 12;
var freshSave = () => ({ version: 1, armorTier: 0, ownedArmor: [0], bossKills: 0, cloth: 0, scrap: 180, cores: 0, xp: 0, cleared: [], districtRuns: [0, 0, 0, 0, 0], energy: 60, energyAt: Date.now(), weapon: 0, owned: [0], weaponLevel: 0, armor: 0, engine: 0, body: 0, trunk: 0, kills: 0, daily: { date: "", kills: 0, claimed: false } });
function restoreEnergy(s, now = Date.now()) {
  s.energy = Math.min(ENERGY_MAX, Math.max(0, s.energy ?? ENERGY_MAX));
  s.energyAt = Math.min(now, s.energyAt ?? now);
  if (s.energy >= ENERGY_MAX) {
    s.energyAt = now;
    return s.energy;
  }
  const recovered = Math.floor((now - s.energyAt) / ENERGY_INTERVAL);
  s.energy = Math.min(ENERGY_MAX, s.energy + recovered);
  if (s.energy === ENERGY_MAX) s.energyAt = now;
  else s.energyAt += recovered * ENERGY_INTERVAL;
  return s.energy;
}
function spendEnergy(s, amount, now = Date.now()) {
  restoreEnergy(s, now);
  if (s.energy < amount) return false;
  if (s.energy === ENERGY_MAX) s.energyAt = now;
  s.energy -= amount;
  return true;
}
var bossUnlocked = (s, i) => unlocked(s, i) && (s.districtRuns?.[i] || 0) >= 3 && playerLevel(s) >= MAPS[i].level;
var xpForLevel = (level) => Math.round(240 * (level - 1) + 90 * (level - 1) * (level - 2));
var playerLevel = (s) => {
  let level = 1;
  while (level < 100 && s.xp >= xpForLevel(level + 1)) level++;
  return level;
};
var runXP = (kills, win, map = 0) => Math.floor(kills * 1.5) + (win ? 24 + map * 8 : 0);
var raidDamage = (s) => Math.round(stats(s).damage * (WEAPONS[s.weapon].pellets || 1) / WEAPONS[s.weapon].rate * 5 * (s.weapon === 2 ? 0.72 : 1));
var stats = (s) => ({ hp: Math.round((110 + s.armor * 8 + (ARMOR[s.armorTier || 0]?.hp || 0)) * (1 + s.body * 0.04)), damage: WEAPONS[s.weapon].damage * (1 + s.weaponLevel * 0.08) * (1 + s.engine * 0.04), loot: 1 + s.trunk * 0.05, speed: 148 });
var upgradeCost = (level) => Math.round(80 * Math.pow(1.42, level));
var unlocked = (s, i) => i === 0 || s.cleared.includes(i - 1);
var ARMOR = [
  { name: "\u041E\u0434\u0435\u0436\u0434\u0430 \u0432\u044B\u0436\u0438\u0432\u0448\u0435\u0433\u043E", hp: 0, level: 1, bosses: 0, cost: 0, cloth: 0, cores: 0, icon: 3, description: "\u0422\u0432\u043E\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043D\u0430\u044F \u0444\u0443\u0442\u0431\u043E\u043B\u043A\u0430 \u0438 \u0431\u0440\u044E\u043A\u0438. \u0421\u0432\u043E\u0431\u043E\u0434\u0430 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F." },
  { name: "\u0416\u0438\u043B\u0435\u0442 \xAB\u0411\u0430\u0440\u044C\u0435\u0440\xBB", hp: 28, level: 2, bosses: 1, cost: 320, cloth: 8, cores: 0, icon: 4, description: "\u041F\u043B\u0438\u0442\u044B, \u0440\u0435\u043C\u043D\u0438 \u0438 \u043F\u043E\u0434\u0441\u0443\u043C\u043A\u0438. \u041F\u0435\u0440\u0432\u0430\u044F \u0441\u0435\u0440\u044C\u0451\u0437\u043D\u0430\u044F \u0437\u0430\u0449\u0438\u0442\u0430." },
  { name: "\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442 \xAB\u0414\u043E\u0437\u043E\u0440\xBB", hp: 60, level: 4, bosses: 3, cost: 780, cloth: 24, cores: 3, icon: 4, description: "\u041F\u043E\u043B\u0435\u0432\u0430\u044F \u043A\u0443\u0440\u0442\u043A\u0430, \u0443\u0441\u0438\u043B\u0435\u043D\u043D\u044B\u0439 \u0436\u0438\u043B\u0435\u0442 \u0438 \u0437\u0430\u0449\u0438\u0442\u0430 \u043F\u043B\u0435\u0447." },
  { name: "\u0411\u0440\u043E\u043D\u044F \xAB\u0426\u0438\u0442\u0430\u0434\u0435\u043B\u044C\xBB", hp: 100, level: 6, bosses: 6, cost: 1600, cloth: 48, cores: 9, icon: 5, description: "\u0422\u044F\u0436\u0451\u043B\u044B\u0435 \u043F\u043B\u0430\u0441\u0442\u0438\u043D\u044B. \u041E\u0442\u043A\u0440\u044B\u0442\u043E\u0435 \u043B\u0438\u0446\u043E, \u0437\u043D\u0430\u043A\u043E\u043C\u044B\u0439 \u0441\u0438\u043B\u0443\u044D\u0442." }
];
var armorUnlocked = (s, i) => playerLevel(s) >= ARMOR[i].level || (s.bossKills || 0) >= ARMOR[i].bosses && ARMOR[i].bosses > 0 || i === 0;
function migrateSave(s) {
  s.armorTier ??= s.armor > 0 ? 1 : 0;
  s.ownedArmor ??= s.armor > 0 ? [0, 1] : [0];
  s.bossKills ??= s.cleared.length;
  s.cloth ??= 0;
  return s;
}

// domain.js
function createHandler(db, commit, id) {
  const err = (text, status = 400) => {
    throw Object.assign(new Error(text), { status });
  };
  function daily(s) {
    let date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
    if (s.daily.date !== date) s.daily = { date, kills: 0, claimed: false };
    restoreEnergy(s);
  }
  function viewRaid(r, uid) {
    return { id: r.id, map: r.map, hp: r.hp, maxHp: r.maxHp, created: r.created, owner: r.owner === uid, members: Object.entries(r.members).map(([pid, v]) => ({ name: db.players[pid].name, damage: v.damage, me: pid === uid, claimed: v.claimed })), nextAttack: r.members[uid]?.nextAttack || 0, joined: !!r.members[uid] };
  }
  return async function handle(req, res, url) {
    if (!url.pathname.startsWith("/api/")) return false;
    const send = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify(data));
    };
    try {
      if (req.method === "POST" && req.headers.origin && req.headers.origin !== url.origin) err("\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0437\u0430\u043F\u0440\u043E\u0441\u0430", 403);
      let session = (req.headers.cookie || "").match(/(?:^|;\s*)obitel_session=([a-f0-9]{32})(?:;|$)/)?.[1];
      if (!session || !db.players[session]) {
        session = id();
        db.players[session] = { name: "\u0421\u0442\u0440\u0430\u043D\u043D\u0438\u043A " + session.slice(0, 4).toUpperCase(), save: freshSave(), ticket: null };
        res.setHeader("Set-Cookie", `obitel_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`);
        commit();
      }
      let p = db.players[session], s = migrateSave(p.save);
      daily(s);
      let b = {};
      if (req.method === "POST") {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 4096) err("\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441", 413);
        }
        try {
          b = raw ? JSON.parse(raw) : {};
        } catch {
          err("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 JSON");
        }
      }
      let result = {};
      const path = url.pathname;
      if (req.method === "GET" && path === "/api/profile") result = { name: p.name };
      else if (req.method === "POST" && path === "/api/upgrade") {
        const f = b.field;
        if (!["weaponLevel", "armor", "engine", "body", "trunk"].includes(f)) err("\u041D\u0435\u0442 \u0442\u0430\u043A\u043E\u0433\u043E \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044F");
        let price = upgradeCost(s[f]);
        if (s[f] >= 10 || s.scrap < price) err("\u041D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0434\u0435\u0442\u0430\u043B\u0435\u0439");
        s.scrap -= price;
        s[f]++;
      } else if (req.method === "POST" && path === "/api/armor") {
        let i = b.armor;
        if (!Number.isInteger(i) || !ARMOR[i]) err("\u041D\u0435\u0442 \u0442\u0430\u043A\u043E\u0439 \u0431\u0440\u043E\u043D\u0438");
        if (!s.ownedArmor.includes(i)) {
          let a = ARMOR[i];
          if (!armorUnlocked(s, i)) err("\u041D\u0443\u0436\u0435\u043D \u0443\u0440\u043E\u0432\u0435\u043D\u044C " + a.level + " \u0438\u043B\u0438 \u043F\u043E\u0431\u0435\u0434\u044B \u043D\u0430\u0434 \u0431\u043E\u0441\u0441\u0430\u043C\u0438: " + a.bosses);
          if (s.scrap < a.cost || s.cloth < a.cloth || s.cores < a.cores) err("\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432");
          s.scrap -= a.cost;
          s.cloth -= a.cloth;
          s.cores -= a.cores;
          s.ownedArmor.push(i);
        }
        s.armorTier = i;
      } else if (req.method === "POST" && path === "/api/weapon") {
        let i = b.weapon;
        if (!Number.isInteger(i) || !WEAPONS[i]) err("\u041D\u0435\u0442 \u0442\u0430\u043A\u043E\u0433\u043E \u043E\u0440\u0443\u0436\u0438\u044F");
        if (!s.owned.includes(i)) {
          if (s.scrap < WEAPONS[i].cost) err("\u041D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0434\u0435\u0442\u0430\u043B\u0435\u0439");
          s.scrap -= WEAPONS[i].cost;
          s.owned.push(i);
        }
        s.weapon = i;
      } else if (req.method === "POST" && path === "/api/daily") {
        if (s.daily.kills < 20 || s.daily.claimed) err("\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430");
        s.scrap += 120;
        s.cores++;
        s.daily.claimed = true;
      } else if (req.method === "POST" && path === "/api/run/start") {
        let m = b.map;
        if (!Number.isInteger(m) || !MAPS[m] || !unlocked(s, m)) err("\u0420\u0430\u0439\u043E\u043D \u0437\u0430\u043A\u0440\u044B\u0442");
        if (!spendEnergy(s, RAID_COST)) err("\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u044D\u043D\u0435\u0440\u0433\u0438\u0438");
        p.ticket = { id: id(), map: m, started: Date.now() };
        result.ticket = p.ticket.id;
      } else if (req.method === "POST" && path === "/api/run/end") {
        if (p.lastResult?.ticket === b.ticket) {
          send(200, { ...p.lastResult.result, save: s, serverTime: Date.now() });
          return true;
        }
        let t = p.ticket;
        if (!t || t.id !== b.ticket) err("\u0412\u044B\u043B\u0430\u0437\u043A\u0430 \u0443\u0436\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430 \u0438\u043B\u0438 \u043D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u0430", 409);
        let maxKills = 27 + t.map * 3, kills = Math.max(0, Math.min(maxKills, Math.floor(Number(b.kills) || 0)));
        let win = b.win === true && kills === maxKills && Date.now() - t.started > 18e3;
        let loot = Math.max(0, Math.min(kills * 8, Math.floor(Number(b.loot) || 0)));
        let reward = Math.round((win ? MAPS[t.map].reward + loot : loot * 0.35) * stats(s).loot), xp = runXP(kills, win, t.map);
        s.scrap += reward;
        s.cloth += win ? 3 + t.map : 0;
        s.xp += xp;
        s.kills += kills;
        s.daily.kills += kills;
        if (win) s.districtRuns[t.map]++;
        p.ticket = null;
        result = { reward, xp, win };
        p.lastResult = { ticket: t.id, result };
      } else if (req.method === "POST" && path === "/api/raids") {
        let m = b.map;
        if (!Number.isInteger(m) || !MAPS[m] || !bossUnlocked(s, m)) err("\u041D\u0443\u0436\u043D\u044B 3 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0438 \u0438 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C");
        let existing = Object.values(db.raids).find((r) => r.owner === session && r.map === m && r.hp > 0);
        if (existing) {
          result.raid = viewRaid(existing, session);
        } else {
          let rid = id().slice(0, 12), hp = 750 * (1 + m * 0.7);
          let r = { id: rid, map: m, owner: session, hp, maxHp: hp, created: Date.now(), members: { [session]: { damage: 0, nextAttack: 0, claimed: false } } };
          db.raids[rid] = r;
          result.raid = viewRaid(r, session);
        }
      } else if (/^\/api\/raids\/[a-f0-9]{12}(\/join|\/attack|\/claim)?$/.test(path)) {
        let parts = path.split("/"), r = db.raids[parts[3]];
        if (!r) err("\u0420\u0435\u0439\u0434 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D", 404);
        let action = parts[4];
        if (req.method === "POST" && action === "join") {
          if (r.hp <= 0) err("\u0411\u043E\u0441\u0441 \u0443\u0436\u0435 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D");
          if (!r.members[session]) {
            if (Object.keys(r.members).length >= 10) err("\u0412 \u0440\u0435\u0439\u0434\u0435 \u0443\u0436\u0435 10 \u0438\u0433\u0440\u043E\u043A\u043E\u0432");
            r.members[session] = { damage: 0, nextAttack: 0, claimed: false };
          }
        } else if (req.method === "POST" && action === "attack") {
          let member = r.members[session];
          if (!member) err("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0441\u044C \u043A \u0440\u0435\u0439\u0434\u0443");
          if (!bossUnlocked(s, r.map)) err("\u041D\u0443\u0436\u043D\u044B 3 \u0437\u0430\u0447\u0438\u0441\u0442\u043A\u0438 \u0440\u0430\u0439\u043E\u043D\u0430 \u0438 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C");
          if (r.hp <= 0) err("\u0411\u043E\u0441\u0441 \u0443\u0436\u0435 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D");
          if (member.nextAttack > Date.now()) err("\u041E\u0442\u0440\u044F\u0434 \u0435\u0449\u0451 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F");
          if (!spendEnergy(s, BOSS_COST)) err("\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u044D\u043D\u0435\u0440\u0433\u0438\u0438");
          let st = stats(s), weapon = WEAPONS[s.weapon], damage = Math.min(r.hp, raidDamage(s));
          r.hp -= damage;
          member.damage += damage;
          member.nextAttack = Date.now() + 45e3;
          result.damage = damage;
        } else if (req.method === "POST" && action === "claim") {
          let member = r.members[session];
          if (!member || !member.damage || member.claimed || r.hp > 0) err("\u041D\u0430\u0433\u0440\u0430\u0434\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430");
          member.claimed = true;
          s.scrap += MAPS[r.map].reward * 2;
          s.cores += 3;
          s.bossKills++;
          s.cloth += 6;
          s.xp += 45;
          if (!s.cleared.includes(r.map)) s.cleared.push(r.map);
        } else if (req.method !== "GET" || action) err("\u041C\u0435\u0442\u043E\u0434 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F", 405);
        result.raid = viewRaid(r, session);
      } else err("\u041C\u0435\u0442\u043E\u0434 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D", 404);
      commit();
      send(200, { ...result, save: s, serverTime: Date.now() });
    } catch (e) {
      send(e.status || 500, { error: e.status ? e.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
    }
    return true;
  };
}

// worker.js
async function api(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const allowed = origin === url.origin || origin === "https://obitel.sourcecraft.site";
  if (origin && !allowed) return Response.json({ error: "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0437\u0430\u043F\u0440\u043E\u0441\u0430" }, { status: 403 });
  const cors = new Headers({ "Vary": "Origin", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Obitel-Session", "Access-Control-Expose-Headers": "X-Obitel-Session", "Cache-Control": "no-store" });
  if (origin) cors.set("Access-Control-Allow-Origin", origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (!["GET", "POST"].includes(request.method)) return Response.json({ error: "\u041C\u0435\u0442\u043E\u0434 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F" }, { status: 405 });
  if (Number(request.headers.get("content-length") || 0) > 4096) return new Response(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > 4096) return new Response(null, { status: 413 });
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await env.DB.prepare("SELECT data, revision FROM game_world WHERE id = ?").bind("beta").first();
    if (!row) {
      await env.DB.prepare("INSERT OR IGNORE INTO game_world (id, data, revision) VALUES (?, ?, 0)").bind("beta", JSON.stringify({ players: {}, raids: {} })).run();
      continue;
    }
    const db = JSON.parse(row.data), headers = new Headers(cors);
    let status = 200, body = "";
    const inbound = Object.fromEntries(request.headers);
    delete inbound.origin;
    const session = request.headers.get("x-obitel-session");
    if (session && /^[a-f0-9]{32}$/.test(session)) inbound.cookie = "obitel_session=" + session;
    const req = { method: request.method, headers: inbound, async *[Symbol.asyncIterator]() {
      yield raw;
    } };
    const res = { setHeader(k, v) {
      if (k.toLowerCase() === "set-cookie") {
        headers.set("X-Obitel-Session", v.match(/session=([a-f0-9]{32})/)[1]);
        v = v.replace("SameSite=Strict", "SameSite=None; Secure");
      }
      headers.set(k, v);
    }, writeHead(s, h) {
      status = s;
      for (const [k, v] of Object.entries(h)) headers.set(k, v);
    }, end(v) {
      body = v;
    } };
    await createHandler(db, () => {
    }, () => crypto.randomUUID().replaceAll("-", ""))(req, res, url);
    if (status >= 400) return new Response(body, { status, headers });
    const committed = await env.DB.prepare("UPDATE game_world SET data = ?, revision = revision + 1 WHERE id = ? AND revision = ?").bind(JSON.stringify(db), "beta", row.revision).run();
    if (committed.meta.changes === 1) return new Response(body, { status, headers });
  }
  return Response.json({ error: "\u0421\u0435\u0440\u0432\u0435\u0440 \u0437\u0430\u043D\u044F\u0442. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434." }, { status: 503, headers: { "Retry-After": "2" } });
}
var worker_default = { async fetch(request, env) {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return await api(request, env);
    return await env.ASSETS.fetch(request);
  } catch {
    return Response.json({ error: "\u0421\u0435\u0440\u0432\u0435\u0440 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D" }, { status: 503 });
  }
} };
export {
  api,
  worker_default as default
};
