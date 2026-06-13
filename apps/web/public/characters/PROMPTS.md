# Prompt tạo nhân vật (chibi 3D, khớp hệ thống)

## Thông số bắt buộc (đã nhúng trong mọi prompt)
- **Khung:** vuông **768×768 px**.
- **Nền trong suốt** (PNG có alpha) cho MỌI lớp — TRỪ "Nền" (background) thì phủ kín, đục.
- Nhân vật **chính diện, đứng thẳng, toàn thân**, tay hơi dang.
- **Đầu gần đỉnh (~22% từ trên), chân gần đáy (~92%)**, thân cao ~70% khung, rộng ~45%, **căn giữa**.
- Mỗi món vẽ **đúng vị trí trên khung**, phần còn lại trong suốt → xếp lớp khít.
- Thứ tự lớp: nền → cánh → thân(giới tính) → trang phục → thú cưng → mũ → vũ khí.

## Tọa độ neo từng ô (px trên khung 768×768) — căn cho khớp
| Ô | Tâm ngang x | Vùng dọc y | Bề rộng ~ |
|---|---|---|---|
| Mũ (hat) | 384 | 70–160 | 200 |
| Cánh (wings) | 384 | 300–460 | 490 |
| Trang phục (outfit) | 384 | 300–660 | 250 |
| Thú cưng (pet) | 170 (góc dưới-trái) | 560–680 | 130 |
| Vũ khí (weapon) | 550 (tay phải) | 290–545 | 90 |
| Nền (background) | full | full | 768×768 |

## Negative prompt (dán vào ô Negative / sau `--no` của MJ)
`text, watermark, signature, multiple characters, cropped, cut off, extra limbs, realistic human proportions, side view, back view, busy background, ground shadow, drop shadow, frame, border`

---

## PROMPT ĐẦY ĐỦ (copy-paste)

### 1) Thân nền — NAM  → `base/male.png`
> cute chibi 3D boy, big round head, small body about two heads tall, large friendly sparkly eyes, short brown hair, light skin, simple blue t-shirt and dark navy shorts, little sneakers, gentle smile, soft rounded shapes, smooth glossy 3D render, Pixar and Gunny mobile-game style, vibrant saturated colors, soft studio lighting with subtle rim light, clean smooth edges, front view, symmetrical, standing straight, arms slightly away from body, full body from head to feet, centered on a square 768x768 canvas, head near the top and feet near the bottom, fully transparent background, isolated, no ground, no shadow, no text

### 2) Thân nền — NỮ  → `base/female.png`
> cute chibi 3D girl, big round head, small body about two heads tall, large sparkly eyes with eyelashes, soft brown hair with a pink hair bow, light skin, cute pink one-piece dress with white collar, little shoes, sweet smile, rosy cheeks, soft rounded shapes, smooth glossy 3D render, Pixar and Gunny mobile-game style, vibrant pastel colors, soft studio lighting, clean smooth edges, front view, symmetrical, standing straight, arms slightly away from body, full body from head to feet, centered on a square 768x768 canvas, head near the top and feet near the bottom, fully transparent background, isolated, no ground, no shadow, no text

### 3) Trang phục (lớp phủ) — vd Pháp Sư  → `outfit/outfit_mage.png`
> ONLY a wizard robe clothing layer for a chibi character, purple robe with golden star pattern and a belt, glossy 3D game-asset style, shaped and positioned to fit a standing chibi character's torso and legs (covering roughly the central area from y=300 to y=660 on a 768x768 canvas), NO head, NO face, NO bare limbs, everything outside the clothing fully transparent, front view, centered, 768x768, transparent PNG, no shadow, no text
> *(Đổi "wizard robe / purple, golden star" thành: ninja outfit, astronaut suit, superhero costume, robot armor, prince royal outfit, farmer overalls…)*

### 4) Mũ  → `hat/<code>.png` — vd Vương Miện
> ONLY a golden royal crown with red and blue jewels, cute glossy 3D game-asset style, sized for a chibi character's head and placed at the top-center of a 768x768 canvas (around x=384, y=70 to 160, about 200px wide), nothing else, fully transparent everywhere except the crown, front view, transparent PNG, no shadow, no text
> *(Đổi "golden royal crown" thành: baseball cap, straw hat, graduation cap, top hat, military helmet, witch hat…)*

### 5) Vũ khí  → `weapon/<code>.png` — vd Kiếm
> ONLY a shiny sword, cute glossy 3D game-asset style, vertical, placed at the right-hand area of a 768x768 canvas (around x=550, y=290 to 545), nothing else, fully transparent except the sword, front view, transparent PNG, no shadow, no text
> *(Đổi "sword" thành: bow, magic wand, hammer, axe, shield, water gun…)*

### 6) Thú cưng  → `pet/<code>.png` — vd Mèo
> ONLY a tiny cute baby cat companion sitting, kawaii glossy 3D game-asset style, small, placed at the bottom-left of a 768x768 canvas (around x=170, y=560 to 680, about 130px), nothing else, fully transparent except the pet, front view, transparent PNG, no shadow, no text
> *(Đổi "cat" thành: puppy, baby dragon, fox, panda, penguin, owl, unicorn…)*

### 7) Cánh  → `wings/<code>.png` — vd Cánh Thiên Thần
> ONLY a pair of white glowing angel wings, glossy 3D game-asset style, symmetrical, spread wide to sit behind a chibi character's shoulders, centered horizontally and placed around y=300 to 460 on a 768x768 canvas (full width up to ~490px), NO body, nothing else, fully transparent except the wings, front view, transparent PNG, no shadow, no text
> *(Đổi "angel wings" thành: bat wings, butterfly wings, phoenix fire wings…)*

### 8) Nền (PHỦ KÍN, không trong suốt)  → `bg/<code>.png` — vd Thiên Hà
> vibrant cartoon galaxy background, purple nebula, stars and soft glow, cute mobile-game backdrop, smooth gradient, no characters, no text, full frame 768x768
> *(Đổi "galaxy" thành: blue sky with clouds, sunset, ocean, green forest, night city, volcano…)*

---

## Tham số công cụ
- **Midjourney:** thêm `--ar 1:1 --style raw` và `--no text, shadow, frame, extra limbs`. MJ không xuất PNG trong suốt → xem mục Xử lý nền.
- **DALL·E 3 / ChatGPT:** dán nguyên prompt, yêu cầu "transparent background, 1:1".
- **Stable Diffusion / SDXL:** dùng model + LoRA "chibi/3d cartoon", bật **transparent** (vd ComfyUI "LayerDiffuse") để ra PNG alpha trực tiếp; size 768×768 hoặc 1024 rồi resize.

## Xử lý nền & kích thước (để khớp tuyệt đối)
1. Nếu công cụ không ra nền trong suốt: tách nền bằng remove.bg / Photoshop / Photopea.
2. Đưa về **canvas vuông 768×768**, đặt nhân vật/món **đúng tọa độ neo** ở bảng trên (căn giữa, đầu trên–chân dưới).
3. Xuất **PNG**. Đặt tên `slot/<mã item viết thường>.png` (vd item `HAT_CROWN` → `hat/hat_crown.png`; thân nền `base/male.png`).
4. Thêm `imageUrl` vào item trong `apps/api/src/database/seeds/seed-shop.ts` rồi `pnpm seed:shop`. Thân nền không cần seed (đường dẫn cố định theo giới tính).

## Mẹo nhất quán
Tạo **2 thân nền trước**. Với mỗi món, nếu công cụ hỗ trợ **img2img / reference**, đưa thân nền làm tham chiếu để căn đúng tư thế & tỉ lệ; nếu không, tạo món rời rồi đặt vào đúng tọa độ neo bằng editor.
