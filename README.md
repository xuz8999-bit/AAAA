# Memory Garden
An interactive, personal storybook built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion and Konva. The garden is an original ink-and-watercolor SVG illustration on aged paper, with bundled Caveat and Ma Shan Zheng handwriting fonts (SIL Open Font License files included).

## Develop and build
Node.js 22 or later:

```sh
npm ci
npm run dev
```

Validate with `npm run typecheck` and `npm run build`. Production Node hosting: `npm run build`, then `npm start`.

## Explore
- **Garden:** click year fruits to open a memory room, or planted flowers, trees and stars to reopen individual stories. The pocket watch changes the year and season. Seasons also have manual controls. Click the bird, rabbit, butterfly or dog to discover a short hidden story.
- **Timeline:** explore every year with stored memories, including years restored from the original scrapbook.
- **Plant a memory:** add a title, story and up to eight images, then choose a date, place, mood, plant and optional audio file. Joy and growth bring sunshine, nostalgia brings rain, and special memories bring stars. Saving plays a seed-growth animation.
- **Memory room:** read stories and photographs, listen to attached audio, or use the optional collage editor to arrange materials and export a 2000×1500 PNG. Existing scrapbook boards remain editable; saving preserves garden metadata and audio.
- **Collection:** save books, songs, movies, pictures and small keepsakes, with a note and optional image.

## Personal data
Memory and collection data are stored in browser IndexedDB, using the original `fragments-of-me` database so existing boards are retained. There is no account, server, cloud sync or external AI service. Memory images are resized to 1400px during planting. Audio files are stored locally and limited to 10 MB. Browser storage availability and quota still apply. Clearing browser data removes the garden; export precious memories as PNG backups. Data on different domains or browsers does not transfer automatically. The homepage shows up to nine plants for the selected year; all memories remain available in that year's room and the timeline. Empty historic years are blank chapters, not fabricated personal stories.

## GitHub Pages
`.github/workflows/pages.yml` deploys the static export from `main`. Select **GitHub Actions** in repository Settings → Pages. Locally, `BUILD_TARGET=pages npm run build` exports to `out/` with `/AAAA` as the base path. After deployment, the website is served at https://xuz8999-bit.github.io/AAAA/. Ordinary `npm run build` continues to support Node hosting.

## Printed scrapbook theme
The current visual direction uses charcoal ink, aged paper, faded mustard and a distressed Anton headline. Navigation is **去过的地方 / 我的故事 / 喜欢的音乐 / 关于我**. Music includes songs attached to saved memories and manually collected favorites. Other keepsakes remain accessible via the second tab. About text is editable and stored as a hidden profile entry in the existing collection store. Photo material sources: `pytorch/hub/images/dog.jpg` and `pytorch/vision/gallery/assets/dog1.jpg`, `dog2.jpg`; original local vector clipping shapes and SVG print filters are applied in the browser. Anton is bundled with its SIL Open Font License.

### 拾光剪贴簿更新

导航为首页、去过的地方、我的故事、喜欢的事物、关于我。首页及动物剪贴使用低饱和褪色油墨、纸纹和网点；「喜欢的事物」可上传图片和 10MB 以内的音乐，音乐可直接播放，收藏仍保存在原 IndexedDB 中。

首页「制作复古拼贴 · 相机冲印」可直接进入编辑器，上传照片并自动拼贴或手动调整。冲印支持褪色胶片、Old School 网点版画、古早 CCD 和原色，生成过程显示相机吐出相纸动画，下载 PNG 为 2000 × 1500。滤镜、颗粒和网点实际写入导出像素，保存作品时保留原始照片、布局及冲印风格，便于重新编辑。

年份可通过时光装置旁的「增加年份」手动加入，包括未来年份；列表单独保存在同一个 IndexedDB 中，不覆盖已有记忆。四季既可点击，也可拖动春夏秋冬滑块（键盘方向键同样可用），树冠、叶色、春花、秋季落叶及冬季积雪会随之变化；切换年份保留当前季节。

### Digital Botanical Archive 视觉重设计

新版以深海军蓝、冰白、钴蓝与银蓝花瓣构成实验海报式界面：大字号标题、黑白网点照片、印刷套色偏移、颗粒、扫描线与缓慢移动的花瓣摄影叠层。主视觉 `public/prints/blue-lilies.png` 为专门生成的原创银蓝百合图像。支持系统减少动画设置。

首页植物索引使用六个情绪分类：Things I Remember、Places I Kept、People I Met、Dreams I Had、Things I Loved、Little Moments。新记忆可选择 `botanicalCategory`；旧记忆根据原有 `category` 映射显示，原始数据不被改写。年份不再作为植物标签；年份新增、删除和日期索引保留在「去过的地方」区域，「我的故事」仍可按年查看。

照片、音乐收藏、个人介绍、本地存储、拼贴编辑与相机冲印继续可用。新拼贴默认蓝色网点印刷，下载时将冷色油墨、网点与颗粒写入 PNG；旧作品保存的冲印风格继续保留。

### 米白拼贴工作台与自定义剪贴

拼贴编辑区域改为淡米白色，画布在工作区居中，新的作品默认保留原色（仍可选择蓝色网点等冲印风格）。艺术素材区可上传自己的图片，保存在同一个 IndexedDB 的独立素材库中，刷新后可继续添加到作品。

选中图片或素材后可使用「圈选主体 / 抠图」：沿主体轮廓标记至少三个点，将圈外区域变透明并裁去多余边缘。支持撤销点、重新圈选和恢复原图。此功能为手动轮廓剪贴，不是自动 AI 主体识别。透明 PNG、原图备份及布局都会随作品保存，冲印时仍能正确叠放导出。
