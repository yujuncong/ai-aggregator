import type { CrawlItem } from "./types";

/** AI 术语 → 中文对照 + 一句话解释 */
interface Concept {
  keys: string[];
  zh: string;
  desc: string;
}

const GLOSSARY: Concept[] = [
  { keys: ["computer use", "computer-use", "cua", "computer control"], zh: "计算机操作（Computer Use）", desc: "让 AI 直接操控电脑/浏览器完成任务" },
  { keys: ["harness"], zh: "执行框架（Harness）", desc: "承载并运行 AI 任务的框架或环境" },
  { keys: ["agent", "agents"], zh: "AI 智能体（Agent）", desc: "能自主规划并执行任务的 AI 程序" },
  { keys: ["llm", "large language model", "language model"], zh: "大语言模型（LLM）", desc: "以文本为核心的大规模神经网络模型" },
  { keys: ["rag"], zh: "检索增强生成（RAG）", desc: "先生成检索外部资料再作答，提升准确率" },
  { keys: ["fine-tun", "finetun", "fine tuning"], zh: "微调（Fine-tuning）", desc: "在预训练模型基础上做针对性再训练" },
  { keys: ["multimodal", "multi-modal", "vision language"], zh: "多模态（Multimodal）", desc: "同时处理文本、图像、音频等多种数据" },
  { keys: ["prompt"], zh: "提示词（Prompt）", desc: "给模型的输入指令，决定输出方向" },
  { keys: ["embedding"], zh: "向量嵌入（Embedding）", desc: "把文本映射成向量，用于相似度检索" },
  { keys: ["inference"], zh: "推理（Inference）", desc: "模型加载后产生输出的运行过程" },
  { keys: ["evaluation", "eval", "benchmark"], zh: "评估与基准测试（Evaluation）", desc: "用标准任务衡量模型的能力与效果" },
  { keys: ["copilot"], zh: "编程助手（Copilot）", desc: "辅助开发者写代码的 AI 工具" },
  { keys: ["chatbot", "chat bot"], zh: "聊天机器人（Chatbot）", desc: "面向对话场景的 AI 应用" },
  { keys: ["automation"], zh: "自动化（Automation）", desc: "把重复流程交给 AI 自动完成" },
  { keys: ["open source", "opensource"], zh: "开源（Open Source）", desc: "代码公开、可自由使用与改进" },
  { keys: ["api"], zh: "API 接口", desc: "供程序化调用 AI 能力的接口" },
  { keys: ["claude"], zh: "Claude 模型", desc: "Anthropic 出品的大语言模型" },
  { keys: ["gpt"], zh: "GPT 模型", desc: "OpenAI 出品的大语言模型" },
  { keys: ["vision"], zh: "视觉理解（Vision）", desc: "对图像/视频内容的理解能力" },
  { keys: ["training"], zh: "模型训练（Training）", desc: "用数据训练或继续训练模型" },
  { keys: ["workflow"], zh: "工作流（Workflow）", desc: "把多个 AI 步骤编排成固定流程" },
  { keys: ["mcp"], zh: "MCP 协议", desc: "模型上下文协议，让 AI 接入外部工具与数据" },
  { keys: ["skill"], zh: "技能（Skill）", desc: "AI 可复用的专项能力包" },
  { keys: ["memory"], zh: "记忆（Memory）", desc: "AI 跨会话保存并调用上下文" },
  { keys: ["search"], zh: "联网搜索（Search）", desc: "让 AI 检索实时信息再作答" },
  { keys: ["voice", "speech", "tts", "asr"], zh: "语音能力（Voice）", desc: "语音合成（TTS）或识别（ASR）" },
  { keys: ["video"], zh: "视频生成（Video）", desc: "根据文字/图片生成视频" },
  { keys: ["image"], zh: "图像生成（Image）", desc: "根据文字描述生成图片" },
  { keys: ["onchain", "blockchain", "crypto", "web3"], zh: "链上/Web3", desc: "与区块链、智能合约结合的应用" },
  { keys: ["code", "coding", "programming"], zh: "代码开发", desc: "生成或修改代码的开发类工具" },
];

function detectConcepts(texts: string[]): Concept[] {
  const hay = texts.join(" ").toLowerCase();
  const found: Concept[] = [];
  for (const c of GLOSSARY) {
    if (c.keys.some((k) => hay.includes(k))) found.push(c);
    if (found.length >= 3) break;
  }
  return found;
}

function renderZh(texts: string[]): { terms: string; desc?: string } {
  const found = detectConcepts(texts);
  return {
    terms: found.map((c) => c.zh).join("、"),
    desc: found[0]?.desc,
  };
}

/** 为每条记录生成一段中文解释说明（规则化，不调用外部 LLM） */
export function explainInChinese(it: CrawlItem): string {
  const { terms, desc } = renderZh([it.title, it.summary, it.tags.join(" ")]);

  if (it.source === "github") {
    const lang = it.lang ? `主语言 ${it.lang}` : "语言未标注";
    const stars = it.score ?? 0;
    let s = `GitHub 近期新增的 AI 开源项目（${lang}）。`;
    if (terms) s += `核心方向：${terms}。`;
    if (desc) s += `${desc}。`;
    if (stars > 0) s += `当前已获 ${stars} 颗星。`;
    return s;
  }

  if (it.source === "ecommerce") {
    let s = `Product Hunt 上发布的 AI 相关新产品。`;
    if (terms) s += `主打方向：${terms}。`;
    if (desc) s += `${desc}。`;
    return s;
  }

  if (it.source === "hf" || it.source === "hf-video") {
    const lib = it.lang ? `基于 ${it.lang} 库` : "库未标注";
    const head =
      it.source === "hf-video"
        ? "Hugging Face 上热门的 AI 视频开源模型"
        : "Hugging Face 上热门的 AI 开源模型";
    let s = `${head}（${lib}）。`;
    if (terms) s += `核心方向：${terms}。`;
    if (desc) s += `${desc}。`;
    const likes = it.score ?? 0;
    if (likes > 0) s += `社区已点赞 ${likes} 次。`;
    return s;
  }

  if (it.source === "discover") {
    const stars = it.score ?? 0;
    let s = `DiscoverAISkills 收录的热门 AI 技能榜（按 GitHub star 排序）。`;
    if (terms) s += `核心方向：${terms}。`;
    if (desc) s += `${desc}。`;
    if (stars > 0) s += `站点收录 star 约 ${stars}。`;
    return s;
  }

  // source === "x"
  let s = `X 平台上关于 AI 的热门推文。`;
  if (terms) s += `话题：${terms}。`;
  if (desc) s += `${desc}。`;
  return s;
}
