import 'reflect-metadata';
import { PublishStatus, UserRole } from '@cp/shared';

import { AppDataSource } from '../data-source';
import { BlogPost } from '../../modules/blog/blog-post.entity';
import { User } from '../../modules/users/user.entity';

// ── Single intro blog post for the Character feature (idempotent by slug) ─────
const SLUG = 'ra-mat-tinh-nang-nhan-vat';

const TITLE = 'Ra mắt Nhân vật — Avatar của bạn, lên cấp là đổi!';

const EXCERPT =
  'Nhân vật giờ là avatar của bạn trên toàn hệ thống. Càng lên cấp, bạn càng mở khóa những nhân vật xịn hơn — từ Tân thủ đến Thần thánh!';

// 15 tiers in level order (unlock = index * 5). Images live in
// apps/web/public/character/<gender>/<stem>.svg and are served at /character/...
const TIERS: { stem: string; label: string }[] = [
  { stem: '1-new-biew', label: 'Tân thủ' },
  { stem: '2-brown', label: 'Đồng' },
  { stem: '3-iron', label: 'Sắt' },
  { stem: '4-silver', label: 'Bạc' },
  { stem: '5-gold', label: 'Vàng' },
  { stem: '6-platinum', label: 'Bạch kim' },
  { stem: '7-diamond', label: 'Kim cương' },
  { stem: '8-emerald', label: 'Ngọc lục bảo' },
  { stem: '9-ruby', label: 'Hồng ngọc' },
  { stem: '10-turquoise', label: 'Lam ngọc' },
  { stem: '11-amethyst', label: 'Thạch anh tím' },
  { stem: '12-royal', label: 'Hoàng gia' },
  { stem: '13-legend', label: 'Huyền thoại' },
  { stem: '14-myth', label: 'Thần thoại' },
  { stem: '15-divine', label: 'Thần thánh' },
];

const tableRows = TIERS.map((tier, i) => `| ${i + 1}. ${tier.label} | Cấp ${i * 5} |`).join('\n');

// A row of character thumbnails (markdown images). The blog renderer shows
// `/character/*` images as labeled thumbnails, so the alt text becomes a caption.
const gallery = (gender: 'male' | 'female') =>
  TIERS.map((tier, i) => `![Lv ${i * 5} · ${tier.label}](/character/${gender}/${tier.stem}.svg)`).join(' ');

const CONTENT = `# 🎭 Ra mắt tính năng **Nhân vật**

Chào mừng đến với bản cập nhật lớn nhất của cửa hàng! Từ hôm nay, **Nhân vật** sẽ
thay thế ảnh đại diện cũ và trở thành **avatar của bạn ở mọi nơi**: trang chủ,
bảng xếp hạng, trang cá nhân, danh sách bài nộp…

## Nhân vật là gì?

Mỗi nhân vật là một hình đại diện được thiết kế riêng theo **15 bậc danh giá**,
có cả phiên bản **Nam** và **Nữ**. Khi bạn trang bị một nhân vật trong Cửa hàng,
nó sẽ ngay lập tức hiện lên thay cho avatar của bạn.

## ⭐ Lên cấp là đổi nhân vật!

Đây là điều thú vị nhất: **mỗi khi bạn lên cấp, hệ thống sẽ mở khóa nhân vật mới**
để bạn thay đổi diện mạo. Cứ mỗi **5 cấp**, một bậc nhân vật cao hơn sẽ xuất hiện
trong Cửa hàng:

| Bậc nhân vật | Mở khóa từ |
| --- | --- |
${tableRows}

> Càng chăm học, càng lên cấp nhanh — và bộ sưu tập nhân vật của bạn càng hoành tráng!

## 🖼️ Bộ sưu tập nhân vật (theo cấp độ)

**Phiên bản Nam:**

${gallery('male')}

**Phiên bản Nữ:**

${gallery('female')}

## 🛒 Cách sở hữu

1. Mở **Cửa hàng → tab Nhân vật**.
2. Những nhân vật bạn **đủ cấp** sẽ sẵn sàng để mua bằng **đá quý** 💎.
   Nhân vật chưa đủ cấp sẽ hiển thị mốc *"Cần Lv X"*.
3. Bấm **Mua**, rồi vào **Kho đồ** để **Trang bị** — avatar của bạn đổi ngay tức thì!

Hãy tích lũy đá quý, lên cấp thật nhanh và khoe nhân vật xịn nhất của bạn trên
**Bảng xếp hạng** nhé. Chúc bạn học vui! 🚀`;

async function run() {
  console.log('📝 Seeding character intro blog post…');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const users = AppDataSource.getRepository(User);
  const posts = AppDataSource.getRepository(BlogPost);

  // Author the post as an admin (fallback: any user).
  const author =
    (await users.findOne({ where: { role: UserRole.ADMIN } })) ??
    (await users.findOne({ where: {} }));
  if (!author) {
    throw new Error('No user found to author the blog post. Seed users first.');
  }

  const existing = await posts.findOne({ where: { slug: SLUG } });
  if (existing) {
    await posts.update(
      { id: existing.id },
      {
        title: TITLE,
        excerpt: EXCERPT,
        content: CONTENT,
        tags: ['Nhân vật', 'Tính năng mới', 'Cửa hàng'],
        status: PublishStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
      },
    );
    console.log(`  ♻️  Updated existing post: ${SLUG}`);
  } else {
    await posts.save(
      posts.create({
        title: TITLE,
        slug: SLUG,
        excerpt: EXCERPT,
        content: CONTENT,
        coverUrl: null,
        tags: ['Nhân vật', 'Tính năng mới', 'Cửa hàng'],
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: author.id,
      }),
    );
    console.log(`  📰 Created post: ${SLUG}`);
  }

  console.log('✅ Blog seed complete.');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during blog seed:', err);
  process.exit(1);
});
