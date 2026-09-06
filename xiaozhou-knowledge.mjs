// Public, hand-curated knowledge. Keep source documents and private contact data out of this module.
const homepage = 'https://zhouchengjian-user.github.io/personal-homepage/';
const resumeSource = { label: '周承健提供的简历' };
const pageSource = (anchor, label) => ({ label, url: `${homepage}#${anchor}` });

export const suggestedQuestions = Object.freeze([
  '介绍一下周承健',
  '他做过哪些 AI 产品？',
  '展厅数字人项目有哪些成果？',
  '为什么他适合 AI 产品经理岗位？',
]);

const entries = {
  intro: {
    text: '周承健是一名 AI 产品经理，也在做独立产品开发。他关注从用户需求到模型能力、产品体验和实际交付的完整过程。根据他提供的简历，他做过企业 AI 应用生成平台、建筑方案智审和展厅数字人，也独立开发了多模态素材检索与视频动效工具。你可以挑一个项目，我接着介绍他的职责和成果。',
    sources: [resumeSource, pageSource('about', '主页 · 关于我')],
  },
  assistant: {
    text: '你好，我是小周，周承健的主页助手。我可以根据他提供的简历和主页内容，介绍他的工作经历、AI 产品项目和能力。现在使用整理好的资料回答；资料里没有的内容，我会直接说明。你想先了解哪个项目？',
    sources: [pageSource('home', '周承健个人主页')],
  },
  career: {
    text: '按照简历，周承健在 2020 年 7 月至 2023 年 5 月担任大型房建项目的项目总工程师，2023 年 6 月至 2026 年 8 月在一家大型建筑企业担任 AI 产品经理。AI 产品工作覆盖业务调研、需求规划、模型评测、研发协同、灰度上线与培训推广。简历写的是 6 年以上总工作经验；主页的 3 年以上指 AI 产品经验，两者口径不同。',
    sources: [resumeSource, pageSource('about', '主页 · 工作经验')],
  },
  education: {
    text: '根据简历，周承健于 2016 年至 2020 年在天津城建大学就读土木工程本科，并于 2024 年取得建筑工程专业国家一级建造师资格。他的工程背景，也与后来建筑方案审查等 AI 产品的业务场景相关。',
    sources: [resumeSource],
  },
  skills: {
    text: '从简历和主页看，周承健的能力集中在三方面。第一是理解真实业务，把高频、重复、耗时的问题转成产品需求；第二是把 RAG、Agent 和多模态能力落实到可使用的工作流；第三是推进交付与效果迭代，包括评测集、Bad Case 分析和用户反馈。他也使用 AI 编程工具快速搭建原型，验证产品想法。这些经历可以支持你评估他与具体 AI 产品经理岗位的匹配度。',
    sources: [resumeSource, pageSource('skills', '主页 · 我的技能')],
  },
  projects: {
    text: '简历重点列出了 5 个项目：企业 AI 产品批量化生成平台、建筑方案智审平台、展厅数字人、索见多模态素材检索，以及 Motif Cue 视频动效工作台。前三个是企业项目，后两个是个人独立开发项目。主页还展示了 CourtCast 智能解说和 LAYRA 智能穿搭助手的演示。你想听产品解决的问题、他的具体职责，还是项目成果？',
    sources: [resumeSource, pageSource('projects', '主页 · 我的作品')],
  },
  factory: {
    text: 'AI 产品批量化生成平台面向企业产品、研发与业务人员，把需求分析、PRD 审阅、开发、测试和上线放到同一个 Web 工作台。根据简历，周承健负责产品定位、版本规划、Agent 分工与关键节点的人工确认，也规划了多模型配置、Token 用量和成本估算。项目时间为 2025 年 3 月至 2026 年 8 月。',
    outcomes: '简历记录，这个平台累计生成 300 个以上 MVP 原型，完成 10 余个 AI 项目实际落地，覆盖 7 个部门，面向约 1000 名员工开展培训。单个项目上线时间相较原有流程缩短超过 90%；研发规范整理为 6 套 Skill 包、32 项 Agent Skills 和 155 条检查规则。这些是简历中的项目成果，具体统计方法需要由周承健进一步说明。',
    method: '根据简历，他把流程拆成需求、技术、前端和上线四个阶段，为每个阶段定义输入、交付文件、进入条件、验收标准和返工规则。Agent 按产品经理、架构师、前端、开发和审查等角色分工，在关键节点由用户审核、修改或批准继续，并提供执行状态、失败重试和结果查看。简历没有展开具体模型版本或调度代码。',
    sources: [resumeSource, pageSource('projects', '主页 · AI 批量化生产工厂')],
  },
  review: {
    text: '建筑方案智审平台面向技术部门和方案审核人员，辅助识别专项施工方案中的严重缺陷、内容缺失、规范引用异常和前后矛盾，并生成可追溯的结构化意见。根据简历，周承健负责需求规划、Agent 流程、RAG 知识库和评测优化。项目时间为 2025 年 3 月至 8 月，存疑内容转交人工核查。',
    outcomes: '简历记录，建筑方案智审平台覆盖 10 家分公司和 70 名审核人员，累计完成近 110 个项目的 500 余份方案审核；意见准确率超过 95%，单份方案审核耗时缩短约 90%。这些数值属于简历陈述，现有资料没有附上评测样本和逐条判定记录。',
    method: '简历中的审查流程是：文档解析、工程类型匹配、规则选择、逐项审查、证据校验、结果自审和报告生成。知识库整理了严重缺陷清单、编制指南、200 余本规范和历史审批意见，并按工程类型与规则来源匹配。规则引擎、大模型与人工审核分别承担适合的工作，存疑内容转人工核查。',
    sources: [resumeSource, pageSource('projects', '主页 · 危大方案智审平台')],
  },
  avatar: {
    text: '展厅数字人面向调研、参观和展会接待，支持实时讲解、自由问答和用户打断。根据简历，周承健负责交互流程、音色与语速调优、RAG 问答边界，以及 ASR、大模型、TTS、口型驱动和三维渲染的方案选型。项目时间为 2023 年 6 月至 2024 年 3 月；主页也展示了实时语音、插话打断和展项联动这些能力。',
    outcomes: '根据简历，展厅数字人累计支撑 50 余场接待，服务访客 1000 余人次，完成 15000 余次语音问答。知识部分基于 37 份材料整理 3000 条标准问答，经 7000 条真实问题测试，库内回答准确率为 92%，库外无依据作答率在 2% 以内；首音响应在 2.5 秒以内，声画同步偏差在 200 毫秒以内。以上是简历记录，我没有独立核验这些指标。',
    method: '简历描述了标准问答优先、RAG 补充、低置信度拒答的分级策略，并规划材料解析、文本切分、混合召回和结果重排序。实时交互采用流式识别、生成和播报，结合 TTS 音素信息驱动口型，并支持播报打断、任务取消和异常降级。具体模型版本、切块大小和阈值未在资料中提供。',
    sources: [resumeSource, pageSource('projects', '主页 · 展厅数字人')],
  },
  search: {
    text: '索见是周承健独立开发的多模态 RAG 素材检索系统，简历记载从 2024 年 6 月开始。它解决剪辑团队依赖文件名和人工标签、反复打开文件找内容的问题，支持自然语言、图片、人脸和视频片段检索，并跳转到命中的视频时间码。他负责功能设计、多模态方案、融合排序和本地部署。',
    outcomes: '根据简历，索见累计为 30 余个剪辑团队提供试用或部署，Top 5 素材检索命中率超过 95%，素材查找步骤减少约 60%，人工审片时间减少约 80%。这里的 95% 指素材检索命中率，不能等同于问答准确率；详细评测数据尚未包含在现有资料中。',
    method: '根据简历，索见整合多模态 Embedding、镜头边界检测、ASR、OCR 和人脸识别，对画面、人物、台词、字幕和标签进行解析与索引。召回后结合语义、视觉、人脸特征及时间片段信息排序，并支持本地私有化部署、批量入库和异常任务恢复。资料没有列出具体模型型号。',
    sources: [resumeSource],
  },
  motif: {
    text: 'Motif Cue 是周承健独立开发的视频剪辑 AI 动效工作台，简历记载从 2025 年 9 月开始。它读取 SRT 字幕，完成内容识别和动效编排，用户可以在线预览、逐段调整，然后导出透明背景视频用于后期合成。重点是减少知识类视频创作者理解字幕、选动效和对齐时间轴的重复工作。',
    outcomes: '根据简历，Motif Cue 累计服务 300 余名用户，完成 2000 余条视频制作导出，建设 100 余种动效模板。知识类视频动效制作效率提升约 70%，70% 至 80% 的 AI 初稿动效可直接使用或只需轻微调整；连续制作 3 至 5 期后，重复修改量减少约 20% 至 30%。这些是简历陈述，不能据此推算营收或付费用户数。',
    method: '简历中的流程包括 SRT 解析、语义分段、内容分类、动效匹配、JSON 生成和质量检查，并区分 AI 推荐、程序校验与人工调整。产品提供时间轴预览、参数修改、效果替换和透明视频导出，还记录用户确认与修改，将高频动效整理成可复用模板与制作 Skill。',
    sources: [resumeSource],
  },
  courtcast: {
    text: '主页把 CourtCast 展示为一款个人 AI 作品，定位是让比赛拥有专业级的智能解说，并提供产品介绍视频。现有主页与简历没有给出它的具体模型架构、准确率、用户规模或商业数据，我不能替他补充。你可以到主页作品区观看演示。',
    sources: [pageSource('projects', '主页 · CourtCast 演示')],
  },
  layra: {
    text: '主页展示的 LAYRA 是智能穿搭助手，介绍语是让衣橱里的每一件都有新可能，并提供产品演示视频。现有资料没有展开其推荐算法、数据来源、用户规模或商业成果，我只能确认这些已展示的信息。你可以到主页作品区查看。',
    sources: [pageSource('projects', '主页 · LAYRA 演示')],
  },
  rag: {
    text: '结合简历，周承健在三个场景使用了 RAG：展厅数字人用企业材料支持有边界的问答；建筑方案智审按工程类型和规则来源检索依据；索见则把文本、画面、人脸与时间片段关联起来做多模态素材检索。他关注资料结构化、召回排序、来源证据与效果评测。具体切块大小、向量模型和检索阈值没有在资料里展开。',
    sources: [resumeSource],
  },
  agent: {
    text: '从简历看，周承健做 Agent 产品时，重点是把任务分工、执行流程和人工确认变成可操作的功能。AI 产品生成平台按产品、架构、开发和审查等角色协作，设有关键节点确认与失败重试；方案智审则围绕解析、规则匹配、证据校验和报告生成编排流程。具体框架版本和源码细节没有写在简历中。',
    sources: [resumeSource],
  },
  metrics: {
    text: '这些项目的指标口径不同。根据简历，数字人关注库内回答准确率、库外无依据作答率和首音响应；方案智审关注红线召回率、规则覆盖率、意见准确率和审查时长；索见关注 Top 5 素材检索命中率；Motif Cue 关注制作效率与初稿可用性。现有资料没有完整说明各指标的分母、样本划分、时间窗口及延迟分位数，所以不能把不同项目的百分比直接比较。',
    sources: [resumeSource],
  },
  contact: {
    text: '如果你想沟通岗位、面试或产品合作，可以通过主页“联系我”区域直接联系周承健。我的资料里没有他的实时求职状态、到岗时间或薪酬意向，这些由他本人确认更合适。',
    sources: [pageSource('contact', '前往主页 · 联系我')],
  },
};

const topicPatterns = [
  ['courtcast', /court\s*cast|智能解说|比赛解说/iu],
  ['layra', /layra|智能穿搭|穿搭助手/iu],
  ['motif', /motif\s*cue|动效|srt|透明背景视频/iu],
  ['search', /索见|素材检索|素材搜索|全域检索|以图搜图|人脸检索|素材查找/iu],
  ['review', /危大|智审|方案审查|方案审核|建筑方案|施工方案/iu],
  ['factory', /批量化|生成平台|生产工厂|应用开发平台|智造云|研发流程|多项目管理/iu],
  ['avatar', /展厅|数字人|口型|首音|插话|播报打断|语音问答/iu],
  ['rag', /\brag\b|检索增强|混合召回|重排序|知识库/iu],
  ['agent', /\bagents?\b|智能体|工作流|人工确认|human\s*in\s*the\s*loop/iu],
  ['education', /学历|教育经历|毕业|大学|专业证书|建造师/iu],
  ['career', /工作经历|职业经历|工作经验|从业|转型|转行|以前做什么|之前做什么|工作几年/iu],
  ['projects', /做过哪些|有哪些项目|什么项目|项目经历|项目介绍|个人项目|企业项目|公司项目|介绍.*作品|做过什么|哪些.*产品/iu],
  ['skills', /优势|能力|技能|擅长|适合|匹配|竞争力|产品方法|英语|英文|原型|vibe\s*coding/iu],
  ['metrics', /评测|评价指标|评估指标|指标|准确率|命中率|测试集|怎么测|如何测|数据.*真实|成果.*真实/iu],
  ['contact', /联系|合作|面试|求职|招聘|入职|到岗|电话|邮箱|微信/iu],
];
const followupPattern = /^(那|那么|还有|再|能不能|可以|请|嗯|好)?(具体|详细|再详细|展开)?(说说|讲讲|介绍)?(一下)?(它|他|这个|该项目|这个项目|那个项目|上一个项目)?(的)?(成果|结果|效果|数据|职责|工作|方案|流程|架构|方法|技术|实现|指标|亮点|细节|难点|背景|呢|吗|怎么样|是什么|做了什么|怎么做的|如何实现|说说|讲讲|介绍|一下)*[呢吗吧呀啊]?$/u;
// Exact conversational forms only: do not borrow project context for a new, unrelated request.
const conversationalFollowupPattern = /^(?:(?:那|那么|再|请|能不能|可以)?(?:具体|详细|再详细)?)(?:(?:它|他|这个|该项目|这个项目|那个项目|上一个项目)(?:的)?)?(?:怎么做(?:的)?|怎么实现(?:的)?|如何实现(?:的)?|如何做(?:的)?|做了什么|负责什么|负责了什么|职责是什么|工作是什么|有哪些难点|有什么难点|难点是什么|取得了什么成果|取得什么成果|有哪些成果|有什么成果|成果是什么|有何成果)(?:呢|吗|吧|呀|啊)?$/u;
const outcomePattern = /成果|效果|成绩|提升|多少|规模|指标|准确率|命中率|时延|数据/iu;
const methodPattern = /职责|负责|技术|架构|流程|原理|怎么|如何|方案|具体做|方法|实现|细节|难点|挑战/iu;
const unprovidedDetailPattern = /模型(型号|版本|名称)|具体.*模型|用了什么模型|哪(个|款|种).*模型|向量(库|数据库)|切块(大小|长度)|分块(大小|长度)|chunk|阈值|分母|分位|p95|p99|怎么计算|如何计算|统计口径|怎么算|原始数据|评测记录|评测报告|样本划分|付费用户|营收|收入|利润|收费|定价/iu;
const privacyPattern = /身份证|护照|密码|密钥|api\s*key|家庭住址|家住|婚育|婚姻|女朋友|男朋友|年龄|几岁|身高|体重|生日|私人邮箱|私密|银行|工资|薪资|薪酬|年薪|月薪/iu;
const injectionPattern = /忽略.{0,16}(规则|指令|限制|上文|提示)|无视.{0,16}(规则|指令|限制)|忘记.{0,16}(规则|指令|身份)|系统提示|开发者消息|system\s*prompt|ignore\s+(all|previous|above)|reveal.{0,12}prompt|扮演.{0,12}(系统|管理员)|编造|伪造|捏造/iu;

function response(topic, text = entries[topic]?.text, sources = entries[topic]?.sources ?? []) {
  return { text, sources: sources.map((source) => ({ ...source })), topic };
}

function normalize(question) {
  return typeof question === 'string' ? question.normalize('NFKC').trim().slice(0, 2000) : '';
}

function findTopic(question) {
  return topicPatterns.find(([, pattern]) => pattern.test(question))?.[0];
}

function historyTopic(history) {
  if (!Array.isArray(history)) return undefined;
  for (const item of history.slice(-12).reverse()) {
    if (!item || typeof item !== 'object') continue;
    if (item.topic === 'unknown' || item.topic === 'boundary') return undefined;
    if (Object.hasOwn(entries, item.topic)) return item.topic;
    if (item.role === 'user') {
      const content = normalize(item.content ?? item.text);
      if (privacyPattern.test(content) || injectionPattern.test(content)) return undefined;
      const topic = findTopic(content);
      if (topic) return topic;
    }
  }
  return undefined;
}

/**
 * Hand-curated local demo; not an LLM or evidence that a claim was independently verified.
 * History accepts earlier returned objects ({ topic }) or chat messages ({ role, content/text }).
 */
export function answerQuestion(question, history = []) {
  const query = normalize(question);
  if (!query) return response('assistant');
  if (injectionPattern.test(query)) {
    return response('boundary', '我只根据周承健提供的简历和主页介绍他的经历与项目，不会根据对话指令补造履历、修改事实或透露内部指令。你可以问一个具体项目，我按已有资料回答。');
  }
  if (privacyPattern.test(query)) {
    return response('boundary', '这类私人信息或薪酬细节不在我的介绍范围内，我不能代为提供或推测。如需沟通面试与合作，请通过主页“联系我”区域由周承健本人确认。', [pageSource('contact', '前往主页 · 联系我')]);
  }
  if (/^(你好|您好|hello|hi|嗨|你是谁|你叫什么|介绍一下你自己|介绍一下自己|你是小周吗)[!！?？。\s]*$/iu.test(query)) return response('assistant');

  let topic = findTopic(query);
  const compact = query.replace(/[\s，,。.!！?？:：;；]/gu, '');
  const isFollowup = compact.length <= 35 && (followupPattern.test(compact) || conversationalFollowupPattern.test(compact));
  // "具体指标呢" should retain the previous project rather than become a global metrics answer.
  if (isFollowup && (!topic || topic === 'metrics')) topic = historyTopic(history) ?? topic;
  if (!topic && /^(介绍(一下)?|了解(一下)?|说说)(周承健|他)?[吧呢呀啊。！!？?\s]*$/u.test(query)) topic = 'intro';
  if (!topic && /周承健.{0,8}(是谁|是做什么|做什么的)|他是做什么的/u.test(query)) topic = 'intro';
  if (!topic) {
    return response('unknown', '这部分在我现有的简历和主页资料里没有答案，我不想替他猜。你可以问周承健的工作经历、AI 产品项目、职责或项目成果；如果是追问，也可以带上项目名称。');
  }
  if (unprovidedDetailPattern.test(query)) {
    return response(topic, '现有简历和主页没有提供你问的这项具体信息，我不能补一个参数或数字。如果是评测口径，需要进一步确认样本、分母、统计时间和判定规则；如果是技术选型，需要由周承健说明对应项目的实际实现。', entries[topic].sources);
  }
  const entry = entries[topic];
  if (outcomePattern.test(query) && entry.outcomes) return response(topic, entry.outcomes);
  if (methodPattern.test(query) && entry.method) return response(topic, entry.method);
  return response(topic);
}

export const knowledgeText = [
  '你是小周，周承健个人主页的介绍助手。只依据以下简历陈述与主页事实作答，第三人称介绍周承健；不要把自述成果表述为独立验证。不得推测私人资料、薪资、未提供的技术选型或评测口径。未知内容明确说明，并可引导主页联系区域。',
  ...Object.values(entries).flatMap((entry) => [entry.text, entry.outcomes, entry.method].filter(Boolean)),
].join('\n\n');
