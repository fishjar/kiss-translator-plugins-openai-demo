# 简约翻译 · OpenAI 兼容外部插件示例

简约翻译的独立接口插件示例，基于官方 OpenAI 兼容插件 2.0.5，使用插件 API 1。仓库根目录可直接导入，也可作为开发其他接口插件的起点。

[English](README.en.md) · [简约翻译](https://github.com/fishjar/kiss-translator) · [插件开发指南](https://github.com/fishjar/kiss-translator-plugins/blob/main/docs/plugin-development-guide.md)

## 安装与配置

1. 使用支持插件 API 1 的简约翻译扩展，例如 v2.2.1。进入设置的「接口插件」，在「GitHub 项目或 HTTPS ZIP 地址」输入 `https://github.com/fishjar/kiss-translator-plugins-openai-demo` 并安装。也可以克隆或解压仓库，再通过「导入文件夹」选中直接包含 `manifest.json` 的目录。
2. 到「服务配置 → 添加 → 插件接口」选择所需服务并创建实例。文本服务的四项能力可以在同一个实例中分别启用。
3. 在实例中填写 API 基础地址、API Key 和模型 ID 后保存。基础地址包含服务商要求的路径前缀，例如 `https://api.openai.com/v1`。插件会在其后追加下表中的端点。API Key 由宿主作为 Bearer 凭据注入，每个实例独立保存配置。
4. 先在实例下方运行能力测试，再在对应场景选择该实例。聊天可输入 `Hello`，翻译可用一段短文本，语音识别和图片识别需要选取本地样本。

## 服务与兼容要求

| 服务 | 请求端点 | 能力与模型要求 |
| --- | --- | --- |
| 对话与翻译（LLM） | `/chat/completions` | 聊天、翻译和 AI 词典支持完整及流式输出，字幕断句使用完整输出。批量翻译和字幕断句要求模型按提示词返回结构化结果并保留输入 ID。流式请求要求服务返回兼容的 SSE 及结束帧。 |
| 语音识别（ASR） | `/audio/transcriptions` | 模型需接受 multipart 音频上传并返回包含 `text` 的 JSON。实例提供全文转写。 |
| 语音合成 | `/audio/speech` | 模型需支持实例配置的音色和 MP3 输出。 |
| 图片全文识别 | `/chat/completions` | 模型需接受 `image_url` 中的 Base64 data URL，输出全文。适用于全文识别场景。 |

各实例可以使用不同的兼容服务和模型。请根据服务商支持的端点、模型、参数和音色填写配置，并按所需能力分别测试。支持聊天的服务可能仅实现文本端点。

## 目录与更新

- `manifest.json` 声明配置、能力、提示词和实现入口。`services/chat.js` 与 `services/vision.js` 演示脚本及宿主 SDK，两个音频 JSON 文件演示声明式 HTTP。
- GitHub 安装读取公开仓库默认分支的提交归档。Manifest、入口和资源已就绪，导入前无需构建。将示例改作自己的插件时，请换用独立的插件 ID 和名称。
- 修改已分发的插件后保持插件 ID 和服务 ID 稳定，提高 `manifest.json` 中的三段版本号。先在「接口插件」中更新模板，再在「服务配置」中升级实例并测试。现有实例使用各自保存的快照。

代码源自[官方 OpenAI 兼容插件](https://github.com/fishjar/kiss-translator-plugins/tree/f985236bef25a110832bf004fd68dc65ced5e79b/plugins/openai-compatible-bundle)，采用 [MIT 许可证](LICENSE)。

## 提示词规则与测试

原始系统和用户模板都为空（缺失、null、空字符串或纯空白）时使用完整默认模板：有效选定预设优先，其次插件预设，再次宿主任务默认模板。只填一边时，另一边保持空，不自动补原文、术语或语气。自定义模板展开后均为空则报错，不再回退。占位符只展开一次。SDK 直接调用保留空模板对默认行为，属于 Plugin API 1；运行时回退不覆盖已有实例配置。

单句和词典使用 `{{text}}`，批量使用 `{{segments}}`，术语使用 `{{glossary}}`。能力测试复用相同规则；字幕 JSON、聊天 messages 和图片继续遵循固定协议。

安装相邻宿主及官方插件仓库依赖后运行 `node --test tests/prompts.test.cjs`。可用 `KISS_TRANSLATOR_ROOT` 和 `KISS_TRANSLATOR_PLUGINS_ROOT` 指定位置。测试使用真实宿主、SDK 和执行器，只模拟 HTTP。
