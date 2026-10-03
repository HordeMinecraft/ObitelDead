# Предметы рейда — 0.15

Созданы встроенным imagegen 3 октября 2026. Исходник `assets/raid-kit.png`, 2172×724, три квадратных ячейки, прозрачный фон. Вариант `assets/raid-kit.webp` — FFmpeg, lossless, compression_level=6, без изменения цветов или размеров. Рендерер сохраняет пропорции и кэширует основной связный объект каждой ячейки, отсекая маленькие обрывки соседнего предмета. Исходное изображение при этом сохранено.

Результат инструмента: `C:/Users/user/.codex/generated_images/01a09c80-acb8-77f0-9718-6aba60b3d849/exec-d8c4a7fe-2186-48a3-99f9-c4d24448692a.png`.

Стилевой референс: ранее просмотренный `assets/weapons-loot.png`; передан как последнее изображение (num_last_images_to_include=1). transparent_background=true.

## Точный промпт

Use case: stylized-concept. Asset type: ONE transparent game-item sprite atlas, exactly one horizontal row of three equal-width cells. Three items centered separately in their own cells from left to right: (1) a worn wooden baseball bat wrapped with tan fabric at the handle; (2) a rusted steel pipe with one elbow joint, wrapped handle; (3) an old olive glass bottle with a cloth wick and small amber flame, a fictional game-item fire bottle. Match the detailed shaded retro pixel-art survival inventory style of the provided reference, warm brass highlights, olive and rust colors, crisp stepped outlines and textured materials. Each item is large, fully visible with generous empty padding, no item overlaps cell boundaries. Bat and pipe diagonal so silhouettes read clearly. Truly transparent background, no magenta, no checkerboard, no labels, no border, no text, no watermark, no people. Overall atlas wide 3:1; each of the three cells square. Reference image is a style reference ONLY, do not reproduce the guns or other objects. Deliver one sprite atlas.
