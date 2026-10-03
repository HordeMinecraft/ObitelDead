# Звуки игры — выпуск 0.15

Скачаны 3 октября 2026. Исходные ZIP сохранены локально в игнорируемой `.data/audio-sources/`.

- Kenney Impact Sounds — https://kenney.nl/assets/impact-sounds — CC0. `impactWood_medium_000` → wood, `impactMetal_heavy_000` → metal, `footstep_concrete_000` → step, `impactGeneric_light_000` → hit.
- Kenney Sci-Fi Sounds — https://kenney.nl/assets/sci-fi-sounds — CC0. `lowFrequency_explosion_000` → fire.
- Kenney Interface Sounds — https://kenney.nl/assets/interface-sounds — CC0. `click_001` → click, `confirmation_002` → success, `error_002` → error.
- Gunshot Sounds, опубликовано Tabasco — https://opengameart.org/content/gunshot-sounds — архив `sounds.zip`: `cz.wav` → shot, `shotty.wav` → shotgun. На странице указан CC0, однако `creativecommons.txt` внутри скачанного архива требует CC BY 3.0 и содержит © 2009 Vincent Sevedge. Поэтому сохранена более строгая атрибуция CC BY 3.0: https://creativecommons.org/licenses/by/3.0/. В игре доступны сведения об авторах в Настройках.

Исходные лицензии сохранены в `LICENSE-audio-impact.txt`, `LICENSE-audio-scifi.txt`, `LICENSE-audio-interface.txt`, `LICENSE-audio-gun.txt`.

Преобразование FFmpeg: PCM WAV, 22050 Hz, 16 bit, mono. Из записей CZ и shotgun взяты первые громкие импульсы (начало 0.253 и 0.130 s соответственно), длительность по 0.48 s, highpass 120 Hz, lowpass 6500 Hz, fade out 0.38–0.48 s. Звуки Kenney переупакованы без изменения длительности. Движок регулирует громкость и ограничивает голоса; никакого звука до пользовательского жеста.

| Файл | Байт | SHA-256 |
|---|---:|---|
| sfx-click.wav | 4362 | 6c88ba9bf11e985f2c60eff3b618c2b084370e3341c127e14e5a448ea410fc74 |
| sfx-error.wav | 7374 | deb916a01c85dfb730c77850baf4cde8a4eb99c88a8b8420f7ff67c94eb0d47e |
| sfx-fire.wav | 88280 | dc3e6d1a77fc28ec0203b4772f1e17231f4cd057bee63c37145ad378848c53b0 |
| sfx-hit.wav | 7182 | 0fa78eb4698cddd9b979137882a0f13fd2fd0379d01c1896de2ec18a0d71fe40 |
| sfx-metal.wav | 7344 | c96d14873a43dc620a6c749fe5b79ae02d39d41f1cd2a0694155c929c88193b7 |
| sfx-shot.wav | 21290 | d7b0f2555ed10542dbdc4fd412d61dda9e55d11a514a35f599b790c759e1a690 |
| sfx-shotgun.wav | 21294 | 042efa31460de01954c520472013d394bdf31714daf8699279ea582d126c1f98 |
| sfx-step.wav | 4622 | 86d9898f0a8750d54de3101863cb3084a3308277dc183e83b4fbaa937b84bece |
| sfx-success.wav | 23848 | 7d09a6cedf62220e4820ca6ad9d99f1795e9c0d54b7901750d40b927f68498b3 |
| sfx-wood.wav | 14622 | 0744599aa05304ad36a2b573d35ba1e35c89c61569a291a86759e0aff3af3184 |
