# MoniPulse Chrome 摘要插件（Manifest V3）

仿 Monica.im 体验的轻量化智能网页摘要 Chrome 扩展，采用标准 **OpenAI Chat Completions 流式 API 格式**，全程输出结构化简体中文摘要并支持多轮快速追问。

## 核心能力

1. **Google SERP 自动摘要**：打开 Google 搜索结果页加载完成后，自动抓取搜索词与前排结果，在右侧栏以 Shadow DOM 嵌入中文综述卡片。
2. **GitHub 项目主页自动摘要**：访问任意 GitHub 仓库主页（兼容 Turbo SPA 无刷新跳转）后，自动提取仓库简介、目录与 README，在右侧栏 About 正上方嵌入项目解析卡片。
3. **兼容所有 OpenAI 格式服务**：支持 OpenAI、DeepSeek、Moonshot (Kimi)、OpenRouter、OneAPI 及本地 Ollama。

## 安装步骤

1. 解压本 ZIP 文件到本地任意目录（例如 `monipulse-extension/`）。
2. 在 Chrome 地址栏打开 `chrome://extensions/`。
3. 开启右上角 **开发者模式（Developer mode）**。
4. 点击左上角 **加载已解压的扩展程序（Load unpacked）**，选择解压后的文件夹。
5. 点击浏览器工具栏的 **MoniPulse** 图标，填写你的 OpenAI 兼容 `Base URL`、`API Key` 与模型名称并保存。
6. 打开任意 Google 搜索页或 GitHub 项目主页，页面加载完成后即自动流式生成中文摘要。
