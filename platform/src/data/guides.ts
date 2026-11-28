export interface GuideSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface GuideArticle {
  slug: string;
  category: string;
  title: string;
  summary: string;
  audience: string;
  readingTime: string;
  publishedAt: string;
  updatedAt: string;
  relatedToolHref: string;
  relatedToolLabel: string;
  sections: GuideSection[];
  limitations: string[];
  keyTakeaways: string[];
}

const GUIDES_DATA: Record<'zh' | 'en', GuideArticle[]> = {
  zh: [
    {
      slug: 'browser-based-file-processing',
      category: '隐私与安全',
      title: '浏览器本地文件处理是如何工作的？如何验证在线工具没有上传你的文件',
      summary:
        '拆解 File API、Canvas、Web Worker、Blob Object URL 与 localStorage 的工作机制，并教你用浏览器开发者工具亲自核验“零上传”承诺。',
      audience: '关注数据隐私的创作者、开发者与日常办公用户',
      readingTime: '6 分钟阅读',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/imgcompress',
      relatedToolLabel: '体验本地图片压缩器',
      sections: [
        {
          id: 'why-local-matters',
          heading: '一、传统在线工具上传文件后会发生什么？',
          paragraphs: [
            '许多传统在线图片压缩或格式转换网站采用“服务端处理”架构：你选择文件后，浏览器通过 HTTP POST 将原始文件上传到对方的云端服务器，服务器调用后端程序处理完毕后，再把结果回传供你下载。',
            '这种方式本身并非恶意，但它带来了天然的隐私与可控性问题：你无法确定文件在服务器上会保留多久、是否会被写入临时日志、或者是否经过第三方 CDN 缓存。对于包含合同截图、财务表格、证件照或未公开设计稿的文件，上传风险尤其值得警惕。',
          ],
        },
        {
          id: 'how-browser-processing-works',
          heading: '二、浏览器本地处理的四个核心组件',
          paragraphs: [
            '现代浏览器早已具备直接处理二进制文件与像素数据的能力。以本站的自研工具为例，文件从导入到导出主要依赖以下 Web 标准能力：',
          ],
          bullets: [
            'File API 与 Blob：浏览器在用户主动选择、拖拽或粘贴文件后，直接在本地内存中读取字节流，无需发往任何服务器。',
            'HTML5 Canvas 2D：用于离屏绘制、几何路径裁切（如正圆、多边形）以及将图像重新编码为 PNG、WebP 或 JPEG。',
            'Web Worker：把耗时的图片压缩与解码计算放到后台线程执行，防止主线程卡顿，保证页面依然可以流畅滚动与点击。',
            'Object URL（URL.createObjectURL）：为内存中的处理结果生成临时的 blob: 预览地址；一旦用户更换文件或关闭标签页，即通过 revokeObjectURL 释放内存。',
          ],
        },
        {
          id: 'local-vs-server',
          heading: '三、客户端本地处理 vs 服务端处理对比',
          paragraphs: [
            '本地处理并不是在所有场景下都完美无缺。理解两者的差异，能帮你为不同任务挑选最合适的工具。',
          ],
          table: {
            headers: ['维度', '浏览器本地处理', '远程服务器处理'],
            rows: [
              ['文件隐私', '文件不离开本机内存，泄露面极小', '文件必须经过网络传输与服务器暂存'],
              ['处理速度', '省去上传和下载等待，小文件几乎瞬时完成', '受限于网络带宽与服务器队列排队'],
              ['大文件与算力', '受限于当前设备内存与 CPU（尤其是移动端）', '可利用云端高性能多核或 GPU 集群'],
              ['离线可用性', '页面加载完成后断网通常仍可正常使用', '必须全程保持网络连接'],
            ],
          },
        },
        {
          id: 'how-to-verify',
          heading: '四、三步用 DevTools 亲自验证“零上传”',
          paragraphs: [
            '不要轻信任何网站的口头隐私口号。无论使用哪款宣称“纯本地处理”的工具，你都可以用不到 30 秒自行验证：',
          ],
          bullets: [
            '第 1 步：打开工具页面并按 F12（或右键「检查」），切换到 Network（网络）面板，点击清空图标。',
            '第 2 步：在页面中导入一张测试图片、执行压缩或裁剪，并点击下载导出结果。',
            '第 3 步：检查 Network 列表：如果存在体积较大的 POST/PUT 请求（如几百 KB 或数 MB 的 multipart/form-data），说明文件被上传了；如果只有零星几百字节的匿名统计或静态脚本请求，则说明计算确实发生在本地。',
          ],
        },
      ],
      limitations: [
        '浏览器内存有安全上限，单张超大分辨率图片（例如超过 20 MB 或数万像素）在手机端仍可能触发降采样或处理失败。',
        '像 AI 额度追踪器这类使用 localStorage 保存状态的工具，清理浏览器站点数据或使用无痕模式会导致未备份的数据丢失，因此定期导出 JSON 备份非常重要。',
      ],
      keyTakeaways: [
        '涉及敏感截图、内部文档或私人照片时，优先选择经过验证的浏览器本地处理工具。',
        '真正的本地工具在页面加载完成后，不会在 Network 面板中产生包含文件二进制数据的上传请求。',
        '本地工具同时需要清晰的透明边界：例如页面仍可能包含普通访问统计或广告脚本，这些与文件本地处理是相互独立的。',
      ],
    },
    {
      slug: 'image-format-compression-guide',
      category: '图片处理',
      title: 'JPG、PNG、WebP 与 HEIC 怎么选？网页图片格式与压缩实战指南',
      summary:
        '从有损与无损编码原理出发，结合实际网页性能指标（LCP），帮你为照片、截图、透明图标和 iPhone 原图选择最合理的格式与质量参数。',
      audience: '独立开发者、内容创作者、运营与前端工程师',
      readingTime: '7 分钟阅读',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/imgcompress',
      relatedToolLabel: '打开本地图片压缩器',
      sections: [
        {
          id: 'why-image-size-matters',
          heading: '一、为什么图片体积直接决定网页体验？',
          paragraphs: [
            '在绝大多数博客、作品集和产品落地页中，图片占据了页面总下载体积的 50% 以上。一张未经处理的手机照片动辄 4～8 MB，在移动网络下不仅会拖慢首屏最大内容绘制（LCP），还会直接增加访客的跳出率。',
            '但优化图片并不意味着“把质量拉到最低”。盲目降质会导致文字锯齿、色带断层，甚至在格式选错时出现压缩后体积反而变大的情况。',
          ],
        },
        {
          id: 'lossy-vs-lossless',
          heading: '二、有损压缩与无损压缩的核心差异',
          paragraphs: [
            '理解两种压缩策略是选对格式的前提：',
          ],
          bullets: [
            '有损压缩（如 JPEG、有损 WebP）：主动丢弃人眼不敏感的高频色彩细节，换取 60%～85% 的体积缩减。适合风景、人像、产品实拍等色彩连续过渡的照片。',
            '无损压缩（如 PNG、无损 WebP）：完整保留每一个像素值，不会产生模糊或压缩伪影，但对复杂照片的压缩率较低。适合 UI 界面截图、代码图、徽标和需要透明背景的素材。',
          ],
        },
        {
          id: 'format-matrix',
          heading: '三、四种常见格式实战选型表',
          paragraphs: [
            '在实际发布内容前，可以参考下表快速决定最终导出格式：',
          ],
          table: {
            headers: ['图片类型', '推荐格式', '建议质量 / 处理方式', '常见误区'],
            rows: [
              ['博客实拍照片 / 封面图', 'WebP 或 JPEG', '质量 75%～85%，长边控制在 1024px～1600px', '直接上传 4000px 原图或误存为 PNG'],
              ['软件界面 / 代码截图', 'PNG 或高质量 WebP', '保持 85%+ 清晰度，避免文字边缘发虚', '使用低质量 JPEG 导致文字周围出现噪点'],
              ['圆形头像 / 透明贴纸', 'PNG 或 WebP', '保留 Alpha 透明通道', '导出为 JPEG 导致透明角变成白色或黑色方块'],
              ['iPhone HEIC 原图', '本地转为 JPEG 后压缩', '在浏览器本地解码转换为 JPEG 再控质导出', '直接上传到不支持 HEIC 的网页表单导致报错'],
            ],
          },
        },
        {
          id: 'practical-workflow',
          heading: '四、一套高效的日常图片瘦身流程',
          paragraphs: [
            '发布一篇技术文章或产品介绍前，建议遵循“先定尺寸，再选格式，最后调质量”的顺序：',
          ],
          bullets: [
            '先裁剪多余留白：如果只需要画面局部或固定比例（如 16:9），先用形状裁剪器裁掉无用区域，像素越少体积天然越小。',
            '合理约束分辨率：普通正文插图在大多数桌面与移动屏幕上显示宽度不超过 800～1024px，保留 4K 原图通常没有视觉收益。',
            '用肉眼对比而非只看数字：将质量滑块从 80% 开始微调，放大检查关键文字或边缘没有明显模糊即可停止。',
          ],
        },
      ],
      limitations: [
        '浏览器端 Canvas 重编码主要面向网页与日常分享优化；如果你需要印刷级 CMYK 色彩管理或保留完整 EXIF 摄影元数据，请使用专业桌面软件。',
        '对已经用专业工具极限压过的 PNG 图标再次进行浏览器重编码，可能无法进一步缩小体积。',
      ],
      keyTakeaways: [
        '照片优先用有损压缩（JPEG / WebP，75%～85% 质量），文字截图与透明素材优先用 PNG 或高质量 WebP。',
        '控制合理的像素尺寸往往比把质量拉到 50% 以下更有效且更清晰。',
        '处理 iPhone HEIC 照片时，可在浏览器本地先转 JPEG 再压缩，兼顾兼容性与隐私。',
      ],
    },
    {
      slug: 'shape-cropping-transparent-exports',
      category: '图片处理',
      title: '圆形头像与透明背景裁剪指南：PNG 与 WebP 导出避坑',
      summary:
        '介绍正圆、超椭圆、五角星及自定义多边形裁剪的实用技巧，解释透明通道原理与常见比例规范，帮助你一次导出干净无白边的素材。',
      audience: '自媒体作者、产品经理、设计师与个人站长',
      readingTime: '5 分钟阅读',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/imgcrop',
      relatedToolLabel: '打开本地形状裁剪器',
      sections: [
        {
          id: 'why-shape-cropping',
          heading: '一、什么时候需要真正裁出形状，而不是靠 CSS 遮罩？',
          paragraphs: [
            '在网页开发中，我们常用 CSS 的 border-radius: 50% 把方形图片显示成圆形。但在制作 PPT、Word 文档、微信图文、海报贴纸或提交给第三方平台时，目标环境往往不支持自定义遮罩，这时就需要一张本身带有透明背景的成品图片。',
          ],
        },
        {
          id: 'common-shapes-and-ratios',
          heading: '二、常见形状与比例的应用场景',
          paragraphs: [
            '不同几何形状传递的视觉感受不同，选对比例能让页面更协调：',
          ],
          bullets: [
            '正圆（1:1）：最通用的个人头像、团队成员介绍与作者徽章形状，主体人物面部建议居中偏上留出呼吸感。',
            '超椭圆（Squircle）：类似移动应用图标的平滑圆角过渡，比普通圆角矩形更柔和，适合工具卡片与功能徽章。',
            '固定比例圆角矩形（16:9 / 4:3 / 3:2）：非常适合统一博客插图、视频封面与产品截图的外框比例，避免文章排版高低不齐。',
            '自定义多边形：当你需要沿物体轮廓粗略抠出不规则区域（例如斜切海报图、菱形拼接卡片）时，用顶点连线即可快速完成。',
          ],
        },
        {
          id: 'transparency-pitfalls',
          heading: '三、透明背景导出最常见的 3 个坑',
          paragraphs: [
            '很多用户在裁剪完圆形或多边形后，发现放进深色背景 PPT 里依然带着四个白角，原因通常出在以下三点：',
          ],
          bullets: [
            '误选 JPEG 导出：JPEG 标准不支持 Alpha 透明通道，任何透明区域都会被强行填充为不透明底色。需要透明角落时必须选择 PNG 或 WebP。',
            '微信/社交软件二次压缩：部分聊天工具在发送原图未勾选时会把透明 PNG 转成白底 JPG。传输透明素材给同事时建议以“文件”形式发送。',
            '源图过小导致锯齿：如果从一张 150×150 的小图里再局部放大裁剪，边缘会出现明显像素锯齿。尽量使用清晰度充足的原图再裁切。',
          ],
        },
      ],
      limitations: [
        '形状裁剪是基于几何路径的精准蒙版裁切，不等同于 AI 语义抠图（如发丝级背景移除）。',
        '为避免移动端内存溢出，单边超过 4096px 的超高分辨率图片会在本地等比降采样后再导出。',
      ],
      keyTakeaways: [
        '需要透明角落（正圆、五角星、自定义多边形）时，务必导出为 PNG 或 WebP。',
        '文档与博客插图尽量统一使用 16:9 或 4:3 比例，能显著提升阅读观感。',
        '自定义多边形应保持顶点顺序不自相交，才能得到干净封闭的裁切边缘。',
      ],
    },
    {
      slug: 'qr-code-and-ai-quota-workflows',
      category: '效率工作流',
      title: '静态二维码与多平台 AI 额度管理实战指南',
      summary:
        '拆解静态二维码的容错级别、留白规范与 SVG/PNG 选择标准，并分享一套低摩擦、纯本地的多平台 AI 额度追踪习惯。',
      audience: '高频 AI 工具用户、开发者、运营与活动组织者',
      readingTime: '6 分钟阅读',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/aiquota',
      relatedToolLabel: '打开 AI 额度追踪器',
      sections: [
        {
          id: 'static-qr-best-practices',
          heading: '一、制作可靠静态二维码的四个细节',
          paragraphs: [
            '二维码看似简单，但在实际印刷或大屏投影时依然经常出现“扫不出来”的尴尬。确保高识别率只需要守住四个工程细节：',
          ],
          bullets: [
            '优先使用静态二维码承载长期链接：只要目标网址不变，静态二维码永远不会因为第三方短链服务过期或收费而失效。',
            '保留 4 模块白边（Quiet Zone）：扫码器依赖二维码外围的空白边框定位图案，切勿把二维码紧贴彩色背景或文字边缘裁剪。',
            '控制网址长度：去掉链接中不必要的 utm 或追踪参数，能降低二维码矩阵阶数，让黑白模块更大、远距离扫码更轻松。',
            '屏幕用高清 PNG，印刷必用 SVG：1024×1024 的锐利 PNG 足以应付网页与 PPT；只要涉及名片、易拉宝或纸质手册，一律交付矢量 SVG。',
          ],
        },
        {
          id: 'why-track-ai-quotas',
          heading: '二、为什么需要手动管理多平台 AI 额度？',
          paragraphs: [
            '现在的 AI 工作流很少只依赖单一平台：你可能用 ChatGPT 或 Claude 处理长文档与代码，用 Midjourney 生成视觉素材，同时还保留着几个带每日免费额度或签到积分的工具。',
            '不同平台的刷新周期各不相同——有的是按自然日重置，有的是按月提供 Fast GPU 时长，还有的赠送积分会在 24 小时后过期。把这些状态集中在一个无需授权第三方账号的本地看板里，可以避免关键任务中途撞上限流，也减少付费额度的闲置浪费。',
          ],
        },
        {
          id: 'quota-workflow-tips',
          heading: '三、建立可持续的本地追踪习惯',
          paragraphs: [
            '手动记录工具最怕“配置太复杂导致懒得用”。结合 AI 额度追踪器的能力，建议遵循三条轻量化原则：',
          ],
          bullets: [
            '只追踪真正容易撞上限额的核心指标：例如每月 Fast GPU 时长、每日高频模型次数、或带过期时间的签到积分，不必事无巨细全部录入。',
            '善用每日自动重置与官网直达链接：给每个平台填好官方入口 URL，把追踪器当成每天打开浏览器后的 AI 效率启动页。',
            '每月末或换设备前导出一份 JSON 备份：数据存放在浏览器 localStorage 中虽然隐私安全，但养成导出备份习惯可以彻底避免误清缓存带来的重配成本。',
          ],
        },
      ],
      limitations: [
        '静态二维码无法在印制后远程修改跳转地址，如果活动链接尚未确定，应先确认最终 URL 再印刷。',
        'AI 额度追踪器不会自动读取第三方平台的实时账单或 API 用量，所有数字均依赖你的主动记录。',
      ],
      keyTakeaways: [
        '长期有效与隐私敏感的链接优先生成本地静态二维码，印刷物料务必使用 SVG 格式。',
        '管理多平台 AI 额度时，聚焦关键限额与过期签到奖励即可，保持记录动作低摩擦。',
        '纯本地存储工具兼顾了零授权隐私安全，配合定期 JSON 导出即可实现稳定的跨设备迁移。',
      ],
    },
  ],
  en: [
    {
      slug: 'browser-based-file-processing',
      category: 'Privacy & Security',
      title: 'How Browser-Based File Processing Works (and How to Verify Zero Uploads)',
      summary:
        'A plain-English look at File API, HTML5 Canvas, Web Workers, Blob Object URLs, and localStorage—plus a 30-second DevTools check to verify local execution.',
      audience: 'Privacy-conscious creators, developers, and everyday users',
      readingTime: '6 min read',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/imgcompress',
      relatedToolLabel: 'Try Local Image Compressor',
      sections: [
        {
          id: 'why-local-matters',
          heading: '1. What Happens When You Upload a File to a Traditional Online Tool?',
          paragraphs: [
            'Most conventional image compressors and converters rely on server-side processing: you pick a file, your browser sends it via HTTP POST to a remote server, a backend script processes it, and the server sends the output back for download.',
            'While server-side processing is not inherently malicious, it forces you to trust an unknown third party with retention policies, temporary disk storage, and server logs. When you are working with screenshots of internal dashboards, contracts, invoices, or personal photos, uploading them unnecessarily creates avoidable exposure.',
          ],
        },
        {
          id: 'how-browser-processing-works',
          heading: '2. Four Web Technologies Behind Client-Side Tools',
          paragraphs: [
            'Modern browsers are capable of decoding, transforming, and re-encoding media files directly on your device. Our browser utilities rely on four standard APIs:',
          ],
          bullets: [
            'File API & Blobs: Reads binary file data directly from your local selection, drag-and-drop, or clipboard paste without making network calls.',
            'HTML5 Canvas 2D: Performs offscreen drawing, geometric clipping paths (circles, polygons, stars), and image re-encoding into PNG, WebP, or JPEG.',
            'Web Workers: Moves CPU-intensive compression off the main UI thread so the page stays smooth and responsive.',
            'Blob Object URLs: Creates temporary in-memory preview URLs (blob:...) that are revoked automatically when you switch files or close the tab.',
          ],
        },
        {
          id: 'local-vs-server',
          heading: '3. Client-Side vs. Server-Side Processing',
          paragraphs: [
            'Client-side processing is not a silver bullet for every workload. Knowing the trade-offs helps you choose the right tool for the job.',
          ],
          table: {
            headers: ['Factor', 'Browser-Local Processing', 'Remote Server Processing'],
            rows: [
              ['File Privacy', 'Files remain in local browser memory', 'Files travel over the network and touch remote storage'],
              ['Turnaround Time', 'No upload/download delay; near-instant for typical files', 'Depends on upload bandwidth and server queues'],
              ['Heavy Workloads', 'Bounded by local device RAM and CPU (especially on mobile)', 'Can leverage multi-core cloud servers or GPUs'],
              ['Offline Support', 'Works offline once the page assets are loaded', 'Requires continuous internet connectivity'],
            ],
          },
        },
        {
          id: 'how-to-verify',
          heading: '4. How to Verify "No Upload" Yourself in 30 Seconds',
          paragraphs: [
            'You never have to take any website at its word. You can verify local execution in any desktop browser:',
          ],
          bullets: [
            'Step 1: Open the tool page, press F12 (or right-click → Inspect), open the Network tab, and clear the log.',
            'Step 2: Drop a test image into the tool, run compression or cropping, and click Download.',
            'Step 3: Inspect the Network log. A large POST/PUT request (hundreds of KB or MB) indicates a file upload; only tiny static asset or anonymous counter pings confirm the file stayed local.',
          ],
        },
      ],
      limitations: [
        'Browser memory is finite: extremely large images (over 20 MB or tens of thousands of pixels) may be downscaled or rejected on mobile devices to avoid crashes.',
        'Tools that store user preferences in localStorage (such as AI Quota Tracker) lose unexported data if you clear site storage or use incognito mode—export JSON backups regularly.',
      ],
      keyTakeaways: [
        'Use verified browser-local tools whenever handling private photos, internal screenshots, or unpublished designs.',
        'You can independently confirm zero-upload claims in under a minute using the browser Network panel.',
        'Clear privacy means separating file processing (100% local) from standard website telemetry or ad scripts, and disclosing both honestly.',
      ],
    },
    {
      slug: 'image-format-compression-guide',
      category: 'Image Processing',
      title: 'JPG vs PNG vs WebP vs HEIC: A Practical Web Image Compression Guide',
      summary:
        'Learn how lossy and lossless compression work, when to pick each format, and how to shrink blog and UI images without turning text blurry.',
      audience: 'Developers, technical writers, designers, and site owners',
      readingTime: '7 min read',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/imgcompress',
      relatedToolLabel: 'Open Local Image Compressor',
      sections: [
        {
          id: 'why-image-size-matters',
          heading: '1. Why Image Optimization Directly Impacts Page Speed',
          paragraphs: [
            'On most blogs, documentation sites, and product landing pages, images account for more than half of total page weight. Uploading an unedited 5 MB phone photo degrades Largest Contentful Paint (LCP) and wastes mobile data.',
            'Good optimization is not about dragging the quality slider as low as possible. Picking the wrong format can introduce ugly text halos or even produce a larger file than you started with.',
          ],
        },
        {
          id: 'lossy-vs-lossless',
          heading: '2. Lossy vs. Lossless Compression Explained',
          paragraphs: [
            'Every web image format balances fidelity against compression ratio using one of two strategies:',
          ],
          bullets: [
            'Lossy compression (JPEG, lossy WebP): Discards subtle color variations the human eye barely notices, cutting photo sizes by 60%–85%. Best for photographs and rich gradients.',
            'Lossless compression (PNG, lossless WebP): Preserves every pixel verbatim with zero artifacts, at the cost of larger file sizes on complex photos. Best for UI screenshots, code blocks, icons, and transparent graphics.',
          ],
        },
        {
          id: 'format-matrix',
          heading: '3. Practical Format Selection Matrix',
          paragraphs: [
            'Use this quick reference before publishing images to the web:',
          ],
          table: {
            headers: ['Image Type', 'Recommended Format', 'Suggested Settings', 'Common Mistake'],
            rows: [
              ['Blog photos & hero banners', 'WebP or JPEG', '75%–85% quality, max width 1024px–1600px', 'Uploading 4000px originals or saving photos as PNG'],
              ['App UI & code screenshots', 'PNG or high-quality WebP', '85%+ quality to keep text edges crisp', 'Over-compressing JPEG and creating fuzzy text halos'],
              ['Circle avatars & transparent icons', 'PNG or WebP', 'Preserve Alpha transparency', 'Exporting as JPEG and getting solid white/black corners'],
              ['iPhone HEIC photos', 'Convert locally to JPEG', 'Decode HEIC to JPEG locally, then tune quality', 'Uploading raw HEIC to forms that reject the format'],
            ],
          },
        },
        {
          id: 'practical-workflow',
          heading: '4. A Simple Three-Step Optimization Workflow',
          paragraphs: [
            'Before publishing an article or uploading assets, follow this sequence: crop first, size appropriately, then tune quality.',
          ],
          bullets: [
            'Crop unnecessary margins first: Fewer pixels mean fewer bytes before compression even starts.',
            'Right-size dimensions: Most article body layouts render images under 800–1024px wide; shipping 4K originals rarely adds visible value.',
            'Inspect at 100% zoom: Start around 80% quality and adjust until file size drops noticeably without visible banding or soft text.',
          ],
        },
      ],
      limitations: [
        'Browser Canvas re-encoding targets web and everyday sharing—not CMYK print pipelines or preserving full camera EXIF metadata.',
        'Re-compressing an already heavily optimized PNG icon in the browser may yield little reduction or slightly larger output.',
      ],
      keyTakeaways: [
        'Use lossy JPEG/WebP (75%–85%) for photos and PNG/WebP for crisp screenshots or transparent graphics.',
        'Sensible resolution limits usually save more bytes than harsh low-quality compression.',
        'Convert Apple HEIC photos locally in the browser to avoid compatibility issues without exposing private photos.',
      ],
    },
    {
      slug: 'shape-cropping-transparent-exports',
      category: 'Image Processing',
      title: 'Circle Avatars & Transparent Exports: Avoiding PNG and WebP Pitfalls',
      summary:
        'Practical guidance on geometric shape cropping, aspect ratios, transparent alpha channels, and keeping custom polygon cutouts razor sharp.',
      audience: 'Creators, product teams, and website owners',
      readingTime: '5 min read',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/imgcrop',
      relatedToolLabel: 'Open Local Shape Cropper',
      sections: [
        {
          id: 'why-shape-cropping',
          heading: '1. When You Need an Actual Cropped Shape Instead of CSS',
          paragraphs: [
            'On your own website, CSS border-radius can mask a square image into a circle. However, when inserting visuals into slide decks, documents, newsletters, or third-party platforms that do not apply custom masks, you need an exported file with genuine transparent corners.',
          ],
        },
        {
          id: 'common-shapes-and-ratios',
          heading: '2. Matching Shapes and Ratios to Your Use Case',
          paragraphs: [
            'Consistent geometry makes documentation and profiles look intentional:',
          ],
          bullets: [
            'Circle (1:1): The standard for profile avatars, author bios, and team grids—center the subject with slight headroom.',
            'Squircle: Smooth app-icon curvature that feels softer than a standard rounded rectangle, ideal for tool badges.',
            'Fixed-ratio Rounded Rectangles (16:9 / 4:3 / 3:2): Keeps blog screenshots and tutorial illustrations visually uniform.',
            'Custom Polygons: Great for slanted editorial cutouts or irregular visual highlights using 3 or more non-intersecting vertices.',
          ],
        },
        {
          id: 'transparency-pitfalls',
          heading: '3. Three Common Transparency Mistakes',
          paragraphs: [
            'If your circular crop still shows solid corners on a dark slide, one of these three issues is usually responsible:',
          ],
          bullets: [
            'Exporting as JPEG: JPEG has no alpha channel and fills outer corners with a solid color. Always choose PNG or WebP for non-rectangular shapes.',
            'Messaging app re-compression: Some chat apps convert transparent PNGs to opaque JPEGs unless sent as an uncompressed file attachment.',
            'Over-zooming tiny sources: Cropping a tiny region from a low-res image magnifies jagged edges. Start with a reasonably sharp source.',
          ],
        },
      ],
      limitations: [
        'Geometric and polygon cropping uses clean vector clipping paths rather than AI hair-level background segmentation.',
        'Images exceeding 4096px per edge are downscaled locally to keep mobile browser memory usage safe.',
      ],
      keyTakeaways: [
        'Always pick PNG or WebP when exporting circles, stars, hexagons, or custom polygons with transparent corners.',
        'Standardize documentation screenshots on 16:9 or 4:3 ratios for cleaner layouts.',
        'Keep custom polygon edges non-intersecting to ensure clean, predictable clipping masks.',
      ],
    },
    {
      slug: 'qr-code-and-ai-quota-workflows',
      category: 'AI & Productivity',
      title: 'Static QR Codes & Multi-Platform AI Quota Workflows',
      summary:
        'How to generate reliable permanent QR codes (SVG vs PNG, quiet zones, error correction) and build a lightweight local habit for tracking AI usage limits.',
      audience: 'AI power users, developers, marketers, and event organizers',
      readingTime: '6 min read',
      publishedAt: '2026-11-28',
      updatedAt: '2026-11-28',
      relatedToolHref: '/aiquota',
      relatedToolLabel: 'Open AI Quota Tracker',
      sections: [
        {
          id: 'static-qr-best-practices',
          heading: '1. Four Rules for Reliable Static QR Codes',
          paragraphs: [
            'A QR code that fails to scan on a printed poster or conference slide is completely preventable if you follow four technical basics:',
          ],
          bullets: [
            'Use static QR codes for permanent links: Encoding your real URL directly means the code will never break if a third-party redirect service shuts down.',
            'Preserve the 4-module quiet zone: Scanners rely on the white border around the pattern to detect edges—never crop tightly into the black modules.',
            'Keep URLs short and clean: Removing unnecessary tracking parameters produces fewer modules and faster camera focus from a distance.',
            'Use PNG for screens, SVG for print: A crisp 1024×1024 PNG works great in slides and docs; always hand vector SVG files to print designers.',
          ],
        },
        {
          id: 'why-track-ai-quotas',
          heading: '2. Why Track Multi-Platform AI Quotas Manually?',
          paragraphs: [
            'Modern AI workflows rarely live on a single platform. You might combine ChatGPT or Claude for writing and code, Midjourney for imagery, and several specialized services with daily free tiers or expiring check-in credits.',
            'Because each vendor uses different reset schedules—daily message caps, monthly Fast GPU hours, or 24-hour check-in bonuses—a single local dashboard lets you see remaining capacity at a glance without handing API keys or login cookies to a third-party aggregator.',
          ],
        },
        {
          id: 'quota-workflow-tips',
          heading: '3. Keeping Your Local Quota Board Low-Friction',
          paragraphs: [
            'Manual trackers only stick when they take seconds to update:',
          ],
          bullets: [
            'Track only your bottleneck limits: Focus on quotas you actually risk hitting or check-in rewards that expire—skip unlimited features.',
            'Add official platform links to each card: Turn the tracker into your daily AI launchpad so checking remaining quota and opening the tool happen in one place.',
            'Export a JSON backup monthly: Storing everything in localStorage maximizes privacy, and a periodic JSON export protects against accidental cache clears or device switches.',
          ],
        },
      ],
      limitations: [
        'Static QR codes cannot be edited after printing—double-check the target URL with your phone camera before sending files to print.',
        'AI Quota Tracker is intentionally manual and does not pull live usage via third-party APIs.',
      ],
      keyTakeaways: [
        'Choose browser-generated static QR codes for permanent, tracker-free links, and export SVG for any print use.',
        'Track only meaningful AI limits and expiring daily check-ins to keep manual updates effortless.',
        'Pair localStorage privacy with periodic JSON exports for safe cross-device migration.',
      ],
    },
  ],
};

export function getAllGuides(locale: string): GuideArticle[] {
  return GUIDES_DATA[locale === 'en' ? 'en' : 'zh'];
}

export function getGuideBySlug(locale: string, slug: string): GuideArticle | undefined {
  return getAllGuides(locale).find((g) => g.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return GUIDES_DATA.zh.map((g) => g.slug);
}
