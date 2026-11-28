export interface ToolFeature {
  title: string;
  desc: string;
}

export interface ToolStep {
  title: string;
  desc: string;
}

export interface ToolComparison {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
}

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface RelatedToolLink {
  name: string;
  desc: string;
  href: string;
}

export interface RelatedGuideLink {
  title: string;
  desc: string;
  href: string;
}

export interface ToolGuideContent {
  slug: 'imgcompress' | 'imgcrop' | 'qrcode' | 'aiquota';
  path: string;
  name: string;
  applicationCategory: string;
  overviewTitle: string;
  overview: string;
  features: ToolFeature[];
  howToTitle: string;
  steps: ToolStep[];
  comparison?: ToolComparison;
  howItWorksTitle: string;
  howItWorksParagraphs: string[];
  privacyTitle: string;
  privacyPoints: string[];
  useCases: string[];
  limitations: string[];
  faqs: ToolFaq[];
  relatedTools: RelatedToolLink[];
  relatedGuides: RelatedGuideLink[];
}

const TOOL_GUIDES: Record<'zh' | 'en', Record<ToolGuideContent['slug'], ToolGuideContent>> = {
  zh: {
    imgcompress: {
      slug: 'imgcompress',
      path: '/imgcompress',
      name: '本地图片压缩器',
      applicationCategory: 'MultimediaApplication',
      overviewTitle: '浏览器本地图片体积优化',
      overview:
        '在浏览器本地完成图片压缩与尺寸优化，支持实时调节质量并对比前后画质，原图全程不上传服务器。',
      features: [
        {
          title: '多格式输入支持',
          desc: '支持 JPG、PNG、WebP、BMP，以及 iPhone 拍摄的 HEIC / HEIF 照片（在本地自动转为 JPEG 后压缩）。',
        },
        {
          title: '质量滑块实时调节',
          desc: '可按需求调节压缩质量系数，在文件体积与画面清晰度之间找到合适平衡。',
        },
        {
          title: '原图与压缩图对比',
          desc: '并排展示压缩前后的文件大小、压缩率以及大图预览，方便肉眼检查细节损失。',
        },
        {
          title: '拖拽、点击与剪贴板粘贴',
          desc: '支持直接拖拽文件、选择本地文件或使用快捷键粘贴截图，减少操作步骤。',
        },
      ],
      howToTitle: '如何使用图片压缩器',
      steps: [
        {
          title: '导入本地图片',
          desc: '将图片拖入虚线区域、点击选择文件，或直接 Ctrl/Cmd + V 粘贴剪贴板中的截图（单文件上限 20 MB）。',
        },
        {
          title: '等待本地解码',
          desc: '普通格式会立即开始压缩；如果是 HEIC / HEIF 照片，浏览器会先在本地将其解码转换为标准 JPEG。',
        },
        {
          title: '调整压缩质量',
          desc: '拖动质量滑块观察压缩后文件大小变化，点击预览图可放大对比原图与压缩图的细节差异。',
        },
        {
          title: '导出优化后的图片',
          desc: '确认画质和体积符合要求后，点击下载按钮即可将结果保存到本地设备。',
        },
      ],
      comparison: {
        title: '常见图片格式与压缩特性对比',
        description:
          '不同图片格式的编码原理不同，选择合适的原始格式与压缩质量，往往比一味拉低质量滑块更有效。',
        headers: ['格式', '压缩方式', '透明通道', '典型适用场景'],
        rows: [
          ['JPEG / JPG', '有损压缩', '不支持', '实拍照片、博客配图、色彩渐变丰富的封面图'],
          ['PNG', '无损压缩', '支持', '界面截图、图标、需要保留清晰文字边缘或透明背景的图片'],
          ['WebP', '支持有损与无损', '支持', '现代网站配图，同等观感下通常比 JPG 和 PNG 更小'],
          ['HEIC / HEIF', '高效有损压缩', '支持', '苹果设备相册原图，本工具会在本地转为 JPEG 以便跨平台使用'],
        ],
      },
      howItWorksTitle: 'Web Worker 与本地 Canvas 重编码',
      howItWorksParagraphs: [
        '页面通过浏览器 File API 读取图片，在独立的 Web Worker 线程中调用 browser-image-compression 完成尺寸约束（长边上限 1024px）与质量重编码，避免卡顿页面。',
        '针对 HEIC / HEIF 照片，按需加载 heic2any 在本地解码，并通过临时 Blob Object URL 渲染预览。',
      ],
      privacyTitle: '你的图片始终留在本地设备',
      privacyPoints: [
        '原图与压缩结果全程留在本机浏览器内存，不上传至任何服务器。',
        '页面不持久化保存图片，刷新或关闭标签页后内存自动释放。',
        '服务端仅记录匿名访问与下载次数，不含文件名或图像数据。',
      ],
      useCases: [
        '博客文章与技术文档配图瘦身，加快网页首屏加载速度（LCP）。',
        '将手机拍摄的高体积 HEIC / JPG 照片快速压缩，满足招聘、报销或表单系统的文件大小限制。',
        '处理包含合同、证件或内部界面信息的敏感截图时，避免将原图上传到不可控的在线压缩网站。',
      ],
      limitations: [
        '当前版本每次处理单张图片，暂不支持多文件批量打包压缩。',
        '为兼顾网页加载与移动端内存安全，压缩时会限制输出图片的最大边长为 1024px，不适合需要保留超高清印刷分辨率的场景。',
        '单张输入文件大小上限为 20 MB；对已经高度压缩过的 PNG/WebP 图标，再次压缩可能出现体积变化不大甚至略微增大的情况。',
      ],
      faqs: [
        {
          question: '如何选择适合网页使用的压缩质量？',
          answer:
            '对于普通博客配图和照片，将质量设置在 75%～85% 通常能显著减小体积，同时肉眼几乎看不出明显噪点。如果图片包含细小文字或代码截图，建议保持在 85% 以上并放大预览检查边缘清晰度。',
        },
        {
          question: '压缩图片会改变原始分辨率吗？',
          answer:
            '会视原图尺寸而定。本工具为了控制网页加载体积与浏览器内存占用，会将长边超过 1024px 的图片按原比例缩放至 1024px 以内；小于该尺寸的图片则保持原有像素尺寸。',
        },
        {
          question: '为什么有些图片压缩后体积变化很小，甚至变大了？',
          answer:
            '如果原图本身已经经过高强度有损压缩，或是色彩极简的索引色 PNG，在浏览器 Canvas 重新编码为标准 24/32 位位图时，重编码开销可能导致体积反而略大于原文件。此时建议保留原图或改用更合适的格式。',
        },
        {
          question: '如何验证图片真的没有上传到服务器？',
          answer:
            '你可以打开浏览器的开发者工具（F12），切换到 Network（网络）面板，在导入和压缩图片的过程中观察请求列表：除了页面自身静态资源和可选的匿名计数请求外，不会有任何包含图片二进制数据的上传请求。',
        },
      ],
      relatedTools: [
        {
          name: '本地形状裁剪器',
          desc: '在浏览器本地裁剪正圆、多边形或自定义形状，并支持透明 PNG/WebP 导出。',
          href: '/imgcrop',
        },
        {
          name: '本地二维码生成器',
          desc: '无需上传内容，离线生成高清 PNG 与矢量 SVG 静态二维码。',
          href: '/qrcode',
        },
      ],
      relatedGuides: [
        {
          title: 'JPG、PNG、WebP 与 HEIC 怎么选？网页图片格式与压缩实战指南',
          desc: '系统了解有损与无损压缩差异，避免越压越糊或体积反增。',
          href: '/guides/image-format-compression-guide',
        },
        {
          title: '浏览器本地文件处理是如何工作的？',
          desc: '拆解 Canvas、Web Worker 与 Object URL，教你用 DevTools 验证零上传。',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
    imgcrop: {
      slug: 'imgcrop',
      path: '/imgcrop',
      name: '本地形状裁剪器',
      applicationCategory: 'MultimediaApplication',
      overviewTitle: '精准裁剪几何形状与自定义多边形',
      overview:
        '内置 8 种几何形状与自由多边形裁剪，支持旋转、镜像与透明 PNG / WebP 导出，全部在本地完成。',
      features: [
        {
          title: '8 种预设几何形状',
          desc: '内置正圆、圆角矩形（支持自由/1:1/16:9/4:3/9:16/3:2 比例与圆角半径）、正六边形、超椭圆、正三角形、菱形、五角星与正八边形。',
        },
        {
          title: '自定义多边形顶点裁剪',
          desc: '在图片上依次点击添加顶点（至少 3 个），支持拖拽微调与撤销，并自动检测边线自相交。',
        },
        {
          title: '旋转、镜像与无级缩放',
          desc: '支持左右 90° 旋转、水平/垂直镜像、缩放以及一键复位，方便快速构图。',
        },
        {
          title: '多格式导出与剪贴板复制',
          desc: '支持导出 PNG、WebP（保留透明背景）或 JPEG，并提供一键复制到剪贴板功能。',
        },
      ],
      howToTitle: '如何裁剪出清晰的形状图片',
      steps: [
        {
          title: '导入图片素材',
          desc: '拖拽、选择或粘贴本地静态图片（支持 JPG、PNG、WebP、HEIC，上限 20 MB，暂不支持动图 GIF）。',
        },
        {
          title: '选择形状或绘制多边形',
          desc: '在左侧工具栏选择正圆、五角星等预设形状，或切换「自定义」模式在画布上逐点绘制多边形。',
        },
        {
          title: '微调选框与画面姿态',
          desc: '拖动选框及控制点调整构图，按需使用缩放、90° 旋转、镜像或圆角半径滑块，右侧可实时预览。',
        },
        {
          title: '选择格式并下载或复制',
          desc: '需要透明背景时优先选择 PNG 或 WebP；确认右侧预览无误后点击下载或直接复制到剪贴板。',
        },
      ],
      comparison: {
        title: '导出格式选择建议',
        description:
          '形状裁剪后，选区之外的角落属于透明区域。不同导出格式对透明通道的处理方式不同。',
        headers: ['导出格式', '是否保留透明背景', '画质与体积特点', '推荐使用场景'],
        rows: [
          ['PNG', '支持（透明）', '无损清晰，体积相对较大', '圆形头像、五角星贴纸、透明徽章、PPT 素材'],
          ['WebP', '支持（透明）', '支持透明且体积更小', '现代网页配图、博客图标、轻量前端资源'],
          ['JPEG', '不支持（自动填充底色）', '有损压缩，体积小', '直角矩形照片裁剪、不需要透明背景的封面图'],
        ],
      },
      howItWorksTitle: 'HTML5 Canvas 2D 路径裁切',
      howItWorksParagraphs: [
        '所有预设几何图形与自定义多边形均通过数学路径构建 Canvas 2D clip() 蒙版，在离屏画布中应用旋转、镜像与缩放后直接导出。',
        '为防止移动端内存溢出，读写画布均设 4096px 单边上限，并借助 requestIdleCallback 保持拖拽预览流畅。',
      ],
      privacyTitle: '纯本地画布渲染，图片不离开浏览器',
      privacyPoints: [
        '解码、裁切与导出全部在本机浏览器完成，原图与成品不上传服务器。',
        '剪贴板复制直接调用浏览器 Clipboard API，不经第三方中转。',
        '仅记录匿名工具使用计数，不采集任何图像元信息或像素内容。',
      ],
      useCases: [
        '快速制作微信、GitHub、博客或论坛所需的正圆或超椭圆头像。',
        '将产品截图裁剪为圆角矩形或 16:9 / 4:3 固定比例，统一文档与幻灯片视觉风格。',
        '利用自定义多边形裁出不规则主体区域，导出透明 PNG 直接用于海报或演示文稿。',
      ],
      limitations: [
        '仅支持静态图片，暂不支持保留 GIF 动图帧动画。',
        '源图与导出单边像素上限为 4096px，超过该尺寸会按比例自动降采样以防浏览器内存溢出。',
        '部分较旧浏览器或非 HTTPS 环境下可能不支持一键复制图片到剪贴板，请改用下载按钮。',
      ],
      faqs: [
        {
          question: '为什么我裁了圆形，导出后四个角却不是透明的？',
          answer:
            '请检查导出格式是否选择了 JPEG。JPEG 格式本身不支持 Alpha 透明通道，四个角会被填充为实色背景。需要透明背景时，请选择 PNG 或 WebP 格式。',
        },
        {
          question: '自定义多边形为什么提示「边线交叉」？',
          answer:
            '为了确保生成的裁切区域是明确、封闭的简单多边形，工具会自动检测非相邻边是否相交。如果出现交叉，点击「撤销」或拖动顶点调整顺序即可解除提示。',
        },
        {
          question: '裁剪后图片会变模糊吗？',
          answer:
            '工具会根据实际选区映射到原始图像像素尺寸进行导出（最高 4096px），只要原图本身清晰且未过度放大极小局部，导出结果都会保持与原图一致的清晰度。',
        },
      ],
      relatedTools: [
        {
          name: '本地图片压缩器',
          desc: '裁剪完成后需要进一步减小文件体积？一键在本地完成质量优化。',
          href: '/imgcompress',
        },
        {
          name: '本地二维码生成器',
          desc: '离线生成高清 PNG 与矢量 SVG 二维码，不经过任何跳转服务器。',
          href: '/qrcode',
        },
      ],
      relatedGuides: [
        {
          title: '圆形头像与透明背景裁剪指南：PNG 与 WebP 导出避坑',
          desc: '了解透明通道、常见比例规范以及保持导出清晰度的实用技巧。',
          href: '/guides/shape-cropping-transparent-exports',
        },
        {
          title: '浏览器本地文件处理是如何工作的？',
          desc: '了解 Canvas 离屏渲染与前端隐私保护机制。',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
    qrcode: {
      slug: 'qrcode',
      path: '/qrcode',
      name: '本地二维码生成器',
      applicationCategory: 'UtilitiesApplication',
      overviewTitle: '生成永不过期的纯净静态二维码',
      overview:
        '在本地直接将文本或网址编码为标准静态二维码，无短链劫持与追踪，支持矢量 SVG 与高清 PNG 下载。',
      features: [
        {
          title: '纯静态编码，不做短链劫持',
          desc: '严格保留你输入的原始文本或 URL，不插入追踪参数，生成后永久有效，不依赖第三方服务器存活。',
        },
        {
          title: '完整 UTF-8 中文与 Emoji 支持',
          desc: '以 UTF-8 Byte 模式编码，确保中文文本、多语言字符及常见符号都能被主流扫码器正确识别。',
        },
        {
          title: '标准 M 级容错与 4 模块留白',
          desc: '内置约 15% 纠错能力（ECC Level M）及规范的 4 模块静默区白边，兼顾识别率与点阵密度。',
        },
        {
          title: '同源矢量 SVG 与高清 PNG 导出',
          desc: '预览与下载来自同一份锁定数据快照：SVG 可无限无损放大用于印刷，PNG 固定 1024×1024 像素且边缘锐利。',
        },
      ],
      howToTitle: '如何生成并测试二维码',
      steps: [
        {
          title: '选择内容模式',
          desc: '根据需要切换「文本」或「网址」模式，输入待编码的内容（工具不会擅自删改空格或补全协议）。',
        },
        {
          title: '点击生成二维码',
          desc: '点击生成按钮后，浏览器本地引擎会立即计算二维码矩阵并锁定当前结果快照。',
        },
        {
          title: '手机扫码实测',
          desc: '在下载或印刷前，建议先用手机自带相机或微信扫一扫右侧预览区，确认跳转或文本内容完全正确。',
        },
        {
          title: '下载 SVG 或 PNG',
          desc: '网页、PPT 或日常分享可选 1024×1024 PNG；海报、易拉宝等印刷物料请优先下载矢量 SVG。',
        },
      ],
      comparison: {
        title: '静态二维码 vs 动态二维码 / SVG vs PNG 对比',
        description:
          '在决定使用哪种二维码和导出格式前，先明确你的使用场景是否需要后续改链或大幅面印刷。',
        headers: ['对比维度', '本工具输出（静态二维码）', '常见动态短链二维码'],
        rows: [
          ['内容存储方式', '原始文本/网址直接编入黑白矩阵', '编入第三方短链，扫码后再重定向'],
          ['有效期与可靠性', '永久有效，不依赖任何网站运行', '若服务商停运或欠费，二维码立即失效'],
          ['隐私安全性', '无扫码追踪，内容不上传服务器', '服务商可记录扫码时间、设备与来源'],
          ['推荐导出格式', '屏幕展示用 PNG（1024px）；印刷排版用 SVG 矢量图', '通常受限于平台导出清晰度'],
        ],
      },
      howItWorksTitle: '本地矩阵编码与锐利栅格化',
      howItWorksParagraphs: [
        '基于 qr.js 在浏览器本地自动匹配二维码阶数与 M 级纠错码，输出带 crispEdges 渲染属性的矢量 SVG。',
        '导出 PNG 时将同一份 SVG 1:1 绘制到 1024×1024 离屏 Canvas 并关闭抗锯齿平滑，确保边缘绝对锐利。',
      ],
      privacyTitle: '输入内容绝不发送至服务器',
      privacyPoints: [
        '网址与文本仅在本地浏览器内存中编码，不调用任何后端生成接口。',
        '输入内容不写入数据库或日志，重新点击生成前不会覆盖当前快照。',
        '仅记录匿名按钮点击次数，绝不采集二维码载荷内容。',
      ],
      useCases: [
        '为开源项目文档、个人博客、产品手册或演示文稿制作永不失效的跳转二维码。',
        '在内网测试或临时传文本场景下，将敏感链接或短文本转为二维码供手机扫码，避免数据外泄。',
        '导出 SVG 矢量文件交给平面设计师排版到名片、海报或包装盒上，保证印刷清晰度。',
      ],
      limitations: [
        '静态二维码一旦印制，内容无法在后台修改；修改目标网址后必须重新生成二维码。',
        '受 QR Code 规范最大容量限制，输入过长文本（尤其是多字节中文）时会提示内容超长，建议精简内容或缩短链接。',
        '当前版本采用固定高对比度黑白配色与 M 级容错，暂不支持嵌入自定义 Logo 或彩色渐变，以优先保障跨设备扫码成功率。',
      ],
      faqs: [
        {
          question: '印刷海报应该下载 PNG 还是 SVG？',
          answer:
            '优先下载 SVG。SVG 是矢量格式，无论放大到名片还是数米宽的展板，模块边缘始终绝对锐利；如果你只需要插入微信文章、PPT 或 Word 文档，1024×1024 的高清 PNG 已经足够清晰。',
        },
        {
          question: '为什么文本很长时二维码看起来特别密、不好扫？',
          answer:
            '静态二维码的信息量直接决定矩阵阶数（Version）。字符越多，黑白小格越密集，对手机摄像头对焦和印刷精度的要求就越高。建议网址尽量精简掉不必要的追踪参数。',
        },
        {
          question: '生成的二维码会过期吗？',
          answer:
            '不会。因为本工具直接把你的原始内容编码进图案中，不经过任何中转服务器，只要目标网址本身还能打开，这个二维码就永久有效。',
        },
      ],
      relatedTools: [
        {
          name: '本地图片压缩器',
          desc: '在浏览器本地压缩 JPG、PNG、WebP 与 HEIC 图片。',
          href: '/imgcompress',
        },
        {
          name: 'AI 额度追踪器',
          desc: '在本地记录多个 AI 平台的套餐配额、剩余用量与每日签到。',
          href: '/aiquota',
        },
      ],
      relatedGuides: [
        {
          title: '静态二维码与多平台 AI 额度管理实战指南',
          desc: '了解容错级别、静默区规范，以及如何用本地工具管理日常数字工作流。',
          href: '/guides/qr-code-and-ai-quota-workflows',
        },
        {
          title: '浏览器本地文件处理是如何工作的？',
          desc: '理解为什么离线本地工具更能保护你的日常数据隐私。',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
    aiquota: {
      slug: 'aiquota',
      path: '/aiquota',
      name: 'AI 额度追踪器',
      applicationCategory: 'ProductivityApplication',
      overviewTitle: '本地统一管理多平台 AI 配额与签到',
      overview:
        '手动配置各平台每日次数、积分余额与签到有效期，在浏览器本地统一追踪，支持跨天自动重置与 JSON 备份。',
      features: [
        {
          title: '灵活的自定义指标模式',
          desc: '支持按「已用 / 总量」计数或按「剩余百分比」记录，可自由设置单位、预警阈值和每日自动重置。',
        },
        {
          title: '签到奖励与有效期追踪',
          desc: '支持配置每日签到奖励、有效期时长（按当天零点或签到时刻起算），自动结算过期记录。',
        },
        {
          title: '跨天自动重置与筛选',
          desc: '按本地自然日自动重置标记为每日刷新的配额与签到状态，并支持按状态筛选、搜索与拖拽排序。',
        },
        {
          title: 'JSON 备份与跨设备迁移',
          desc: '支持将全部平台配置导出为 JSON 文件或复制到剪贴板，在新浏览器中选择「替换」或「合并」恢复。',
        },
      ],
      howToTitle: '如何开始追踪你的 AI 额度',
      steps: [
        {
          title: '查看或替换示例平台',
          desc: '首次打开页面会加载一组 Midjourney Standard 套餐示例数据，帮助你快速熟悉进度条颜色与操作方式。',
        },
        {
          title: '添加常用 AI 平台',
          desc: '点击新增平台，填入中英文名称、官网快捷链接、主题色，以及你关注的配额指标或签到规则。',
        },
        {
          title: '日常点击微调记录',
          desc: '每次使用或签到后，通过卡片上的加减按钮、快捷百分比调整（按住 Shift 可步进 10%）或签到弹窗更新进度。',
        },
        {
          title: '定期导出 JSON 备份',
          desc: '由于数据仅存在当前浏览器本地，建议在清理浏览器缓存或更换设备前通过「数据同步」导出 JSON 备份。',
        },
      ],
      comparison: {
        title: '支持的记录类型说明',
        description:
          '不同 AI 服务的计费与限额机制差异很大，你可以根据平台规则组合使用以下记录模块。',
        headers: ['记录模块', '适用计费方式', '跨天行为'],
        rows: [
          ['用量型指标（已用 / 上限）', '每日对话次数、每月 Fast GPU 时长、并发任务数', '勾选「每日重置」后跨天归零，否则保留累计'],
          ['剩余百分比指标', '以剩余电量/百分比形式展示的限额窗口', '支持 1% / Shift+10% 快捷调整，可按需开启每日重置'],
          ['积分余额（Credit Balance）', '按次扣减的免费或付费积分池', '可配置是否每日重置为初始余额'],
          ['每日签到与有效期', '需要每日打卡领取、且带有过期时间的赠金或额度', '跨天自动刷新签到状态，到期后自动结算失效额度'],
        ],
      },
      howItWorksTitle: '纯前端手动看板与本地持久化',
      howItWorksParagraphs: [
        '所有平台配置、配额进度与签到历史均以 JSON 格式存储在浏览器 localStorage（键名 ichenghub_ai_quotas）中。',
        '跨过本地自然日午夜或次日重新打开页面时，前端脚本会自动刷新每日指标并结算过期签到。',
      ],
      privacyTitle: '无需授权第三方账号，数据仅存本地',
      privacyPoints: [
        '不连接第三方 AI 平台，无需输入任何 API Key、Cookie 或账号密码。',
        '所有配置与记录仅存在当前浏览器本地，不上传云端服务器。',
        '跨设备迁移完全由你通过 JSON 文件或剪贴板手动完成。',
      ],
      useCases: [
        '同时管理多个免费与付费 AI 工具的每日限额，避免高频任务中途触发限流。',
        '集中提醒带有「每日签到领积分」机制的 AI 绘图或视频平台，减少漏签和积分过期浪费。',
        '为团队或个人整理一份自带官网快捷入口的 AI 常用工作台，一目了然查看各平台余量。',
      ],
      limitations: [
        '用量数据需由用户手动更新，无法自动与第三方平台后台实时同步。',
        '数据依赖浏览器 localStorage，若使用无痕模式或清除站点数据，未导出的记录将会丢失。',
        '不同浏览器或手机/电脑之间不会自动云同步，需要手动使用内置的 JSON 导入导出功能迁移。',
      ],
      faqs: [
        {
          question: '这个工具能自动读取我的 ChatGPT 或 Midjourney 剩余额度吗？',
          answer:
            '不能。出于隐私安全与第三方平台接口限制，本工具不要求你授权任何 AI 账号，所有额度指标均由你根据自己的套餐手动配置和记录。',
        },
        {
          question: '为什么换一台电脑打开后，之前添加的平台不见了？',
          answer:
            '因为数据默认只保存在原设备的浏览器本地存储（localStorage）中，不会上传到服务器。你可以在原设备点击「数据同步」导出 JSON，再在新设备导入即可完整恢复。',
        },
        {
          question: '每日重置是按什么时区计算的？',
          answer:
            '按你当前设备操作系统的本地日期（YYYY-MM-DD）判断。只要本地日期发生变化，标记为每日重置的指标与签到状态就会自动刷新。',
        },
      ],
      relatedTools: [
        {
          name: 'AI 工具分类导航',
          desc: '按场景浏览经过筛选的 AI 与效率工具，了解适用人群与定位。',
          href: '/tools',
        },
        {
          name: '本地二维码生成器',
          desc: '离线生成高清 PNG 与矢量 SVG 静态二维码。',
          href: '/qrcode',
        },
      ],
      relatedGuides: [
        {
          title: '静态二维码与多平台 AI 额度管理实战指南',
          desc: '如何为多平台 AI 订阅建立清晰的配额追踪习惯，避免浪费与超限。',
          href: '/guides/qr-code-and-ai-quota-workflows',
        },
        {
          title: '浏览器本地文件处理是如何工作的？',
          desc: '了解 localStorage 与前端本地存储的隐私边界及备份建议。',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
  },
  en: {
    imgcompress: {
      slug: 'imgcompress',
      path: '/imgcompress',
      name: 'Local Image Compressor',
      applicationCategory: 'MultimediaApplication',
      overviewTitle: 'Optimize Images Locally in Your Browser',
      overview:
        'Compress and resize images directly in browser memory with live quality controls and before-and-after previews—no server uploads required.',
      features: [
        {
          title: 'Broad Format Support',
          desc: 'Works with JPG, PNG, WebP, BMP, and Apple HEIC/HEIF photos (automatically decoded to JPEG locally before compression).',
        },
        {
          title: 'Adjustable Quality Control',
          desc: 'Fine-tune output quality with a live slider to balance visual clarity against smaller file size.',
        },
        {
          title: 'Side-by-Side Comparison',
          desc: 'Compare original and compressed file sizes, savings percentage, and zoomable previews before saving.',
        },
        {
          title: 'Drag, Select, or Paste',
          desc: 'Drop files directly onto the page, pick from disk, or paste screenshots straight from your clipboard.',
        },
      ],
      howToTitle: 'How to Compress an Image',
      steps: [
        {
          title: 'Add a Local Image',
          desc: 'Drag an image into the drop zone, click to browse, or press Ctrl/Cmd + V to paste from your clipboard (up to 20 MB).',
        },
        {
          title: 'Local Decoding',
          desc: 'Standard formats begin compressing immediately. HEIC/HEIF files are decoded to JPEG locally first.',
        },
        {
          title: 'Adjust Quality & Compare',
          desc: 'Move the quality slider to see the updated file size and click either preview to inspect fine details.',
        },
        {
          title: 'Download the Result',
          desc: 'Once the size and clarity look right, click Download to save the optimized image to your device.',
        },
      ],
      comparison: {
        title: 'Image Formats & Compression Behavior',
        description:
          'Choosing the right format often saves more bytes than aggressively lowering quality. Here is how common formats behave.',
        headers: ['Format', 'Compression Type', 'Transparency', 'Best Suited For'],
        rows: [
          ['JPEG / JPG', 'Lossy', 'No', 'Photographs, blog hero images, and scenes with rich color gradients'],
          ['PNG', 'Lossless', 'Yes', 'UI screenshots, icons, sharp text graphics, and transparent overlays'],
          ['WebP', 'Lossy & Lossless', 'Yes', 'Modern web assets that need smaller sizes than JPG or PNG'],
          ['HEIC / HEIF', 'High-efficiency lossy', 'Yes', 'iPhone/iPad photos; converted locally to JPEG for broad compatibility'],
        ],
      },
      howItWorksTitle: 'Web Workers & Local Canvas Re-encoding',
      howItWorksParagraphs: [
        'The page reads your file via the browser File API and runs browser-image-compression in a Web Worker (capped at 1024px on the longest edge) without freezing the UI.',
        'For HEIC/HEIF photos, heic2any is loaded on demand locally, and previews render via temporary in-memory Blob Object URLs.',
      ],
      privacyTitle: 'Your Files Stay on Your Device',
      privacyPoints: [
        'Images are processed strictly in browser memory and never uploaded to any server.',
        'Files are not persisted to disk; refreshing or closing the tab releases them automatically.',
        'Only anonymous view and download counters are logged—never file names or image data.',
      ],
      useCases: [
        'Shrinking blog illustrations and documentation screenshots to improve Largest Contentful Paint (LCP).',
        'Converting and compressing heavy iPhone HEIC/JPG photos to fit email or web form upload limits.',
        'Optimizing sensitive screenshots (contracts, invoices, internal dashboards) without sending them to unknown servers.',
      ],
      limitations: [
        'Processes one image at a time; batch ZIP compression is not currently supported.',
        'Constrains the longest edge to 1024px to keep web assets light and prevent mobile memory spikes—not intended for high-DPI print masters.',
        'Input files are capped at 20 MB. Already heavily optimized PNGs or WebPs may show minimal reduction or slightly larger output after Canvas re-encoding.',
      ],
      faqs: [
        {
          question: 'What quality setting works best for websites?',
          answer:
            'For most photographs and blog images, 75% to 85% delivers substantial file size savings with minimal visible artifacts. For UI screenshots with small text, keep quality at 85% or higher and inspect the zoom preview.',
        },
        {
          question: 'Does compression change image resolution?',
          answer:
            'If your image is larger than 1024px on its longest side, the tool scales it proportionally down to 1024px to keep web file sizes practical. Smaller images retain their original dimensions.',
        },
        {
          question: 'Why is a compressed image occasionally larger than the original?',
          answer:
            'If the source file was already aggressively compressed or uses an indexed PNG palette, re-encoding it through the browser Canvas can add overhead. In that case, keep the original file or switch formats.',
        },
        {
          question: 'How can I verify my image is not being uploaded?',
          answer:
            'Open your browser DevTools (F12), switch to the Network tab, and drop an image into the tool. You will see no multipart upload or image payload leaving your browser.',
        },
      ],
      relatedTools: [
        {
          name: 'Local Shape Cropper',
          desc: 'Crop images into circles, polygons, or custom shapes with transparent PNG/WebP export.',
          href: '/imgcrop',
        },
        {
          name: 'Local QR Code Generator',
          desc: 'Generate permanent static QR codes in SVG and 1024px PNG completely offline.',
          href: '/qrcode',
        },
      ],
      relatedGuides: [
        {
          title: 'JPG vs PNG vs WebP vs HEIC: Practical Web Image Guide',
          desc: 'Understand lossy vs lossless trade-offs and choose the right format before compressing.',
          href: '/guides/image-format-compression-guide',
        },
        {
          title: 'How Browser-Based File Processing Works',
          desc: 'A plain-English breakdown of Canvas, Web Workers, Object URLs, and verifying local execution.',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
    imgcrop: {
      slug: 'imgcrop',
      path: '/imgcrop',
      name: 'Local Shape Cropper',
      applicationCategory: 'MultimediaApplication',
      overviewTitle: 'Crop Geometric Shapes and Custom Polygons',
      overview:
        'Cut clean avatars and custom polygons locally on HTML5 Canvas with 8 preset shapes, rotation/flip tools, and transparent PNG or WebP exports.',
      features: [
        {
          title: '8 Preset Geometric Shapes',
          desc: 'Includes Circle, Rounded Rectangle (with Free, 1:1, 16:9, 4:3, 9:16, 3:2 aspect ratios & corner radius), Hexagon, Squircle, Triangle, Diamond, Star, and Octagon.',
        },
        {
          title: 'Custom Polygon Drawing',
          desc: 'Click directly on the image to place 3 or more vertices, drag points to refine, undo steps, and get automatic self-intersection checks.',
        },
        {
          title: 'Rotate, Flip & Zoom Controls',
          desc: 'Rotate 90° left/right, flip horizontally or vertically, zoom smoothly, and reset transformations in one click.',
        },
        {
          title: 'PNG, WebP, JPEG & Clipboard Copy',
          desc: 'Export transparent cutouts as PNG or WebP, standard photos as JPEG, or copy the cropped image straight to your clipboard.',
        },
      ],
      howToTitle: 'How to Crop an Image into a Shape',
      steps: [
        {
          title: 'Load Your Image',
          desc: 'Drag, browse, or paste a static image (JPG, PNG, WebP, or HEIC up to 20 MB; animated GIFs are not supported).',
        },
        {
          title: 'Pick a Shape or Draw a Polygon',
          desc: 'Choose a preset shape like Circle or Star, or switch to Custom mode to place polygon vertices directly on the canvas.',
        },
        {
          title: 'Adjust Framing & Orientation',
          desc: 'Drag the selection box or handles, tweak corner radius, zoom, rotate, or flip while checking the live preview.',
        },
        {
          title: 'Export or Copy',
          desc: 'Select PNG or WebP to preserve transparent corners (or JPEG for opaque rectangular crops), then download or copy.',
        },
      ],
      comparison: {
        title: 'Choosing the Right Export Format',
        description:
          'Areas outside a circular or polygon crop require transparency. Pick your export format accordingly.',
        headers: ['Format', 'Transparent Background', 'Quality & Size', 'Recommended Use'],
        rows: [
          ['PNG', 'Yes', 'Lossless crisp edges, larger file size', 'Circle avatars, star badges, transparent stickers, slide decks'],
          ['WebP', 'Yes', 'Supports alpha transparency at smaller sizes', 'Modern websites, blog thumbnails, lightweight UI assets'],
          ['JPEG', 'No (solid fill)', 'Lossy compression, compact file size', 'Rectangular photos and opaque cover images'],
        ],
      },
      howItWorksTitle: 'HTML5 Canvas 2D Clipping',
      howItWorksParagraphs: [
        'Every preset shape and custom polygon builds a mathematical Canvas 2D clip() mask, rendering rotations, flips, and crops onto an offscreen canvas locally.',
        'Source and export canvases enforce a 4096px edge limit to prevent mobile memory spikes, using requestIdleCallback to keep previews smooth.',
      ],
      privacyTitle: '100% Local Canvas Rendering',
      privacyPoints: [
        'Decoding, clipping, and export run entirely in your browser with zero server uploads.',
        'Clipboard copy uses the native Clipboard API directly without any relay service.',
        'Only anonymous usage counts are recorded, with zero image metadata or pixel data.',
      ],
      useCases: [
        'Generating circular or squircle avatars for GitHub, social profiles, and team pages.',
        'Trimming product screenshots to consistent 16:9 or 4:3 rounded rectangles for documentation.',
        'Cutting irregular custom polygons with transparent backgrounds for slides and banners.',
      ],
      limitations: [
        'Static images only; animated GIFs are rejected to avoid silent frame loss.',
        'Source and exported dimensions are capped at 4096px per edge to protect browser memory.',
        'Clipboard image copy depends on browser Clipboard API support; use Download if unsupported.',
      ],
      faqs: [
        {
          question: 'Why are the corners not transparent after cropping a circle?',
          answer:
            'Check your selected export format. JPEG does not support transparency and fills outer areas with a solid background. Switch to PNG or WebP to keep transparent corners.',
        },
        {
          question: 'Why does Custom mode warn about crossing edges?',
          answer:
            'To guarantee a clean, valid clipping mask, the tool checks whether non-adjacent polygon edges intersect. Use Undo or drag a vertex to untangle the shape.',
        },
        {
          question: 'Does shape cropping reduce image sharpness?',
          answer:
            'Exports map your crop box to the source pixels (up to 4096px). As long as you are not heavily zooming into a tiny low-resolution region, the output retains the source clarity.',
        },
      ],
      relatedTools: [
        {
          name: 'Local Image Compressor',
          desc: 'Shrink your exported PNG, WebP, or JPEG right in the browser before publishing.',
          href: '/imgcompress',
        },
        {
          name: 'Local QR Code Generator',
          desc: 'Create permanent static QR codes in SVG and 1024px PNG without server tracking.',
          href: '/qrcode',
        },
      ],
      relatedGuides: [
        {
          title: 'Circle Avatars & Transparent Exports: PNG vs WebP Guide',
          desc: 'Avoid common transparency pitfalls and keep cropped graphics crisp across platforms.',
          href: '/guides/shape-cropping-transparent-exports',
        },
        {
          title: 'How Browser-Based File Processing Works',
          desc: 'See how Canvas and local APIs protect your files during everyday editing.',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
    qrcode: {
      slug: 'qrcode',
      path: '/qrcode',
      name: 'Local QR Code Generator',
      applicationCategory: 'UtilitiesApplication',
      overviewTitle: 'Create Permanent Static QR Codes Offline',
      overview:
        'Encode your exact text or URL directly into a standard static QR code with zero redirect tracking—exportable as vector SVG or 1024px PNG.',
      features: [
        {
          title: 'Pure Static Encoding',
          desc: 'Encodes your exact input without redirect links, tracking parameters, or expiration dates.',
        },
        {
          title: 'Full UTF-8 & Multilingual Support',
          desc: 'Encodes payloads in UTF-8 Byte mode so international characters, Chinese text, and symbols scan reliably.',
        },
        {
          title: 'Level M Error Correction & Quiet Zone',
          desc: 'Uses ~15% error recovery (ECC Level M) plus a standard 4-module white quiet zone for reliable scanning.',
        },
        {
          title: 'Matching SVG & 1024px PNG Exports',
          desc: 'Preview, SVG, and PNG all come from the same locked snapshot—crisp vector SVG for print and 1024×1024 PNG for screens.',
        },
      ],
      howToTitle: 'How to Generate and Verify a QR Code',
      steps: [
        {
          title: 'Choose Text or URL Mode',
          desc: 'Enter your exact text or web address. The generator preserves your input verbatim without altering protocols or whitespace.',
        },
        {
          title: 'Generate the Snapshot',
          desc: 'Click Generate to compute the QR matrix locally and lock the preview snapshot.',
        },
        {
          title: 'Test with a Phone Camera',
          desc: 'Before printing or sharing widely, scan the preview with your phone camera to confirm the destination or text.',
        },
        {
          title: 'Download SVG or PNG',
          desc: 'Choose 1024×1024 PNG for slides, docs, and web pages; choose vector SVG for print posters and packaging.',
        },
      ],
      comparison: {
        title: 'Static QR Codes vs. Dynamic Redirect QR Codes',
        description:
          'Understand the trade-offs between permanent static QR codes and hosted dynamic redirect links.',
        headers: ['Dimension', 'This Tool (Static QR)', 'Hosted Dynamic QR'],
        rows: [
          ['Encoded Data', 'Your exact text or URL stored in the matrix', 'A third-party short URL that redirects'],
          ['Expiration Risk', 'Never expires as long as your target URL works', 'Stops working if the provider shuts down or paywalls'],
          ['Privacy', 'No scan analytics or server-side payload logging', 'Provider logs scan times, IPs, and devices'],
          ['Export Quality', 'Vector SVG + sharp 1024×1024 PNG', 'Often watermarked or resolution-limited on free plans'],
        ],
      },
      howItWorksTitle: 'Client-Side Matrix Generation',
      howItWorksParagraphs: [
        'Runs qr.js locally with auto QR version matching and Level M error correction to build a crispEdges vector SVG.',
        'PNG downloads rasterize that exact SVG onto a 1024×1024 offscreen Canvas with image smoothing disabled so every module stays razor-sharp.',
      ],
      privacyTitle: 'Your Input Never Leaves Your Browser',
      privacyPoints: [
        'URLs and text are encoded strictly in local browser memory with no backend API.',
        'Payloads are never logged or stored; editing text will not overwrite your locked snapshot until you regenerate.',
        'Only anonymous button click counters are recorded—never your QR content.',
      ],
      useCases: [
        'Adding permanent, non-expiring QR links to open-source docs, product manuals, and slide decks.',
        'Transferring sensitive local URLs or short snippets from desktop to phone without using cloud clipboards.',
        'Exporting clean vector SVG files for print designers working on business cards, flyers, or signage.',
      ],
      limitations: [
        'Static QR codes cannot change their destination after printing; updating a URL requires generating a new code.',
        'Very long inputs (especially multi-byte Unicode text) can exceed QR specification capacity and trigger a length warning.',
        'Uses high-contrast black-on-white styling with fixed Level M error correction (no embedded logos) to maximize scanner compatibility.',
      ],
      faqs: [
        {
          question: 'Should I download PNG or SVG for printing?',
          answer:
            'Always choose SVG for print materials such as flyers, posters, or packaging—it scales to any physical size with razor-sharp edges. Use the 1024×1024 PNG for presentations, documents, and web pages.',
        },
        {
          question: 'Why does a long URL produce a denser, harder-to-scan QR code?',
          answer:
            'Static QR codes store every character directly in the pattern. More characters require a higher QR version with smaller modules. Stripping unnecessary tracking parameters from URLs makes codes cleaner and faster to scan.',
        },
        {
          question: 'Will my generated QR code ever expire?',
          answer:
            'No. Because the data is encoded directly into the image without a redirect service, it will work indefinitely as long as the destination URL remains online.',
        },
      ],
      relatedTools: [
        {
          name: 'Local Image Compressor',
          desc: 'Compress JPG, PNG, WebP, and HEIC images locally in your browser.',
          href: '/imgcompress',
        },
        {
          name: 'AI Quota Tracker',
          desc: 'Track usage limits and daily check-ins across AI platforms using localStorage.',
          href: '/aiquota',
        },
      ],
      relatedGuides: [
        {
          title: 'Static QR Codes & Multi-Platform AI Quota Workflows',
          desc: 'Learn QR error correction basics and practical habits for managing AI subscriptions.',
          href: '/guides/qr-code-and-ai-quota-workflows',
        },
        {
          title: 'How Browser-Based File Processing Works',
          desc: 'Why client-side utilities reduce privacy exposure for everyday digital tasks.',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
    aiquota: {
      slug: 'aiquota',
      path: '/aiquota',
      name: 'AI Quota Tracker',
      applicationCategory: 'ProductivityApplication',
      overviewTitle: 'Manage Multi-Platform AI Quotas Locally',
      overview:
        'Manually configure and track daily limits, credit balances, and check-in rewards in your browser, with automatic daily resets and JSON backup.',
      features: [
        {
          title: 'Flexible Usage & Remaining Modes',
          desc: 'Track either Used / Limit counters or Remaining Percentage bars with custom units, color coding, and optional daily reset.',
        },
        {
          title: 'Daily Check-Ins & Expiry Tracking',
          desc: 'Log recurring check-in rewards with configurable validity windows (from midnight or check-in time) and automatic expiration settlement.',
        },
        {
          title: 'Automatic Local-Day Reset & Filtering',
          desc: 'Automatically resets daily-flagged indicators when your local calendar date rolls over, plus search, status filters, and drag-to-reorder.',
        },
        {
          title: 'JSON Export & Merge Import',
          desc: 'Back up all platform configurations as JSON or copy to clipboard, and restore or merge them on another device.',
        },
      ],
      howToTitle: 'How to Track Your AI Quotas',
      steps: [
        {
          title: 'Explore or Clear the Sample Card',
          desc: 'First-time visitors see a sample Midjourney Standard plan card demonstrating normal, warning, and depleted states.',
        },
        {
          title: 'Add Your AI Platforms',
          desc: 'Click Add Platform to enter names, an optional official link, card color, usage indicators, credit balance, or check-in rules.',
        },
        {
          title: 'Update Progress as You Work',
          desc: 'Use +/- buttons, remaining percentage controls (hold Shift for 10% steps), or the daily check-in dialog to keep counts current.',
        },
        {
          title: 'Export JSON Backups Periodically',
          desc: 'Because data stays in your browser localStorage, export a JSON backup via Data Sync before clearing browser storage or switching devices.',
        },
      ],
      comparison: {
        title: 'Supported Tracking Modules',
        description:
          'Mix and match these tracking types to match how each AI service structures its limits.',
        headers: ['Tracking Module', 'Best For', 'Daily Rollover Behavior'],
        rows: [
          ['Usage Counter (Used / Limit)', 'Daily prompt caps, monthly Fast GPU hours, concurrent job slots', 'Resets to 0 on new local day if Daily Reset is enabled'],
          ['Remaining Percentage', 'Rolling quota bars shown as remaining %', 'Quick 1% / Shift+10% adjustments; optional daily reset'],
          ['Credit Balance', 'Prepaid or free credit pools deducted per generation', 'Can optionally reset to initial balance each day'],
          ['Daily Check-In & Expiry', 'Daily login bonuses with limited validity windows', 'Refreshes check-in status daily and settles expired rewards automatically'],
        ],
      },
      howItWorksTitle: 'Client-Side Board & Local Persistence',
      howItWorksParagraphs: [
        'All platform configs, usage counts, and check-in records are saved as JSON in your browser localStorage under ichenghub_ai_quotas.',
        'When your local calendar date rolls over past midnight, the client script automatically resets daily indicators and settles expired check-ins.',
      ],
      privacyTitle: 'No Third-Party Account Access Required',
      privacyPoints: [
        'Never connects to third-party AI accounts or asks for API keys, cookies, or passwords.',
        'All configurations and usage records remain strictly in local browser storage.',
        'Cross-device transfers happen only when you manually export and import JSON.',
      ],
      useCases: [
        'Monitoring multiple free and paid AI subscriptions in one place to avoid hitting rate limits mid-project.',
        'Keeping track of daily check-in bonuses and short-lived promotional credits before they expire.',
        'Building a quick-launch personal AI workspace with official links and live manual usage indicators.',
      ],
      limitations: [
        'Usage numbers must be updated manually; automatic live syncing with third-party AI providers is not supported.',
        'Data relies on browser localStorage—clearing site data or using incognito mode will erase unexported changes.',
        'No automatic cloud sync across devices; use the built-in JSON export/import tool to move your setup.',
      ],
      faqs: [
        {
          question: 'Can this tool automatically fetch my remaining ChatGPT or Midjourney quota?',
          answer:
            'No. For privacy reasons and because third-party platforms do not expose universal client-side quota APIs, all limits and usage updates are entered manually by you.',
        },
        {
          question: 'Why did my saved platforms not appear on another computer?',
          answer:
            'All data is stored locally in your browser localStorage rather than on our servers. Open Data Sync on your original device to export a JSON file, then import it on the new device.',
        },
        {
          question: 'Which timezone controls the daily reset?',
          answer:
            'Daily resets follow your device local calendar date (YYYY-MM-DD). Once your local date advances, indicators marked for daily reset and daily check-ins refresh automatically.',
        },
      ],
      relatedTools: [
        {
          name: 'AI Tools Directory',
          desc: 'Explore reviewed AI and productivity tools organized by practical category.',
          href: '/tools',
        },
        {
          name: 'Local QR Code Generator',
          desc: 'Create permanent static QR codes in SVG and 1024px PNG completely offline.',
          href: '/qrcode',
        },
      ],
      relatedGuides: [
        {
          title: 'Static QR Codes & Multi-Platform AI Quota Workflows',
          desc: 'Practical habits for tracking AI subscriptions and avoiding wasted credits.',
          href: '/guides/qr-code-and-ai-quota-workflows',
        },
        {
          title: 'How Browser-Based File Processing Works',
          desc: 'Understand localStorage privacy boundaries and when to back up browser data.',
          href: '/guides/browser-based-file-processing',
        },
      ],
    },
  },
};

export function getToolGuide(locale: string, slug: ToolGuideContent['slug']): ToolGuideContent {
  const lang = locale === 'en' ? 'en' : 'zh';
  return TOOL_GUIDES[lang][slug];
}
