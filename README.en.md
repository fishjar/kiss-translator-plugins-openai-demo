# OpenAI-compatible plugin demo for KISS Translator

This standalone provider plugin is based on the official OpenAI-compatible plugin 2.0.5 and uses Plugin API 1. Import the repository directly or use it as a starting point for your own provider plugin.

[简体中文](README.md) · [KISS Translator](https://github.com/fishjar/kiss-translator) · [Plugin development guide](https://github.com/fishjar/kiss-translator-plugins/blob/main/docs/plugin-development-guide.en.md)

## Install and configure

1. Use a KISS Translator extension that supports Plugin API 1, such as v2.2.1. Open **Provider Plugins**, enter `https://github.com/fishjar/kiss-translator-plugins-openai-demo` in the GitHub repository or HTTPS ZIP field, and install it. For a local import, clone or extract the repository and use **Import folder** to select the directory containing `manifest.json`.
2. In **Service Configuration**, add a plugin service instance for the service you want. You can enable the four text capabilities individually on the same instance.
3. Set the API base URL, API key, and model ID on the instance. Include the provider's path prefix in the base URL, for example `https://api.openai.com/v1`. The plugin appends the endpoint shown below. The host injects the key as a Bearer credential. Each instance stores its own configuration.
4. Run a capability test before selecting the instance in a feature. Try `Hello` for chat, a short passage for translation, and local sample files for transcription or image text recognition.

## Services and requirements

| Service | Request endpoint | Capabilities and model requirements |
| --- | --- | --- |
| Chat and translation (LLM) | `/chat/completions` | Chat, translation, and dictionary support complete and streaming results. Subtitle segmentation uses complete results. Batch translation and subtitle segmentation require structured output that preserves input IDs. Streaming requires compatible SSE events and a terminal frame. |
| Audio transcription (ASR) | `/audio/transcriptions` | Accepts a multipart audio upload and expects JSON with a `text` field. Returns transcript text. |
| Speech synthesis | `/audio/speech` | Requires a model that supports the configured voice and MP3 output. |
| Image text recognition | `/chat/completions` | Requires a model that accepts a Base64 data URL in `image_url`. Returns recognized text for full-text workflows. |

Each instance can use a different compatible provider and model. Check which endpoints, models, parameters, and voices your provider supports, and test each capability you plan to use. Some providers implement only the text endpoint.

## Source and updates

- `manifest.json` declares settings, capabilities, prompts, and entry points. `services/chat.js` and `services/vision.js` demonstrate scripts and the host SDK. The two audio JSON files demonstrate declarative HTTP.
- GitHub installation reads the public repository's default-branch commit archive. The manifest, entry points, and assets are ready to import as checked in. Give your plugin its own ID and name when adapting this demo.
- When updating a distributed plugin, keep the plugin and service IDs stable and increment the three-part version in `manifest.json`. Update the template in **Provider Plugins**, then upgrade and test your service instances in **Service Configuration**. Existing instances use their saved snapshots.

Adapted from the [official OpenAI-compatible plugin](https://github.com/fishjar/kiss-translator-plugins/tree/f985236bef25a110832bf004fd68dc65ced5e79b/plugins/openai-compatible-bundle) under the [MIT license](LICENSE).
