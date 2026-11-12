const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const pluginsRoot =
  process.env.KISS_TRANSLATOR_PLUGINS_ROOT ||
  path.resolve(__dirname, "../../kiss-translator-plugins");
const fixture = require(
  path.join(pluginsRoot, "tests/support/declarative-host.cjs"),
);
const { load } = require(path.join(pluginsRoot, "tests/support/host.cjs"));
const { withDefaultPromptInput } = load("providers/defaultPrompts.js");
const manifest = require("../manifest.json");
const root = path.resolve(__dirname, "..");
test("demo templates use supported placeholders and declare their input", () => {
  const supported = new Set([
    "title",
    "description",
    "summary",
    "context",
    "glossary",
    "tone",
    "to",
    "from",
    "fromLang",
    "toLang",
    "text",
    "transcript",
    "segments",
    "items",
    "language",
    "sourceLanguage",
    "targetLanguage",
    "url",
  ]);
  for (const service of manifest.services)
    for (const [slot, prompts] of Object.entries(service.defaultPrompts || {}))
      for (const prompt of prompts) {
        const text = [prompt.systemPrompt, prompt.userPrompt].join("\n");
        for (const match of text.matchAll(/\{\{(\w+)\}\}/g))
          assert.ok(
            supported.has(match[1]),
            `${service.id}/${slot}: ${match[1]}`,
          );
        if (["batch", "nobatch", "dictionary"].includes(slot))
          assert.ok(
            text.includes(slot === "batch" ? "{{segments}}" : "{{text}}"),
          );
        if (slot === "dictionary") assert.ok(text.includes("{{glossary}}"));
      }
});
test("demo dictionary default sends glossary; custom system owns all content", async () => {
  const f = fixture(root, "chat-completions");
  const input = { text: "bank", language: "zh", glossary: { bank: "娌冲哺" } };
  await f.invoke(
    "dictionary",
    withDefaultPromptInput(f.instance, "dictionary", input),
  );
  assert.match(
    JSON.parse(f.calls.at(-1).init.body).messages[1].content,
    /- bank: 娌冲哺/,
  );
  const text = "bank {{tone}} $$ $&";
  await f.invoke(
    "dictionary",
    withDefaultPromptInput(f.instance, "dictionary", {
      ...input,
      text,
      instructions: "{{text}}",
    }),
  );
  const messages = JSON.parse(f.calls.at(-1).init.body).messages;
  assert.equal(messages[0].content, text);
  assert.equal(
    messages.some((m) => m.role === "user"),
    false,
  );
  const count = f.calls.length;
  await f.invoke(
      "dictionary",
      withDefaultPromptInput(f.instance, "dictionary", {
        ...input,
        instructions: null,
      }),
    );
  assert.equal(f.calls.length, count + 1);
  assert.ok(JSON.stringify(JSON.parse(f.calls.at(-1).init.body).messages).includes("bank"));
});
test("demo translation templates explicitly supply input, including system-only custom batches", async () => {
  const f = fixture(root, "chat-completions");
  f.respond(() =>
    Response.json({
      choices: [
        {
          message: { content: '[{"id":"a","text":"娌冲哺"}]' },
          finish_reason: "stop",
        },
      ],
    }),
  );
  const base = {
    items: [{ id: "a", text: "bank" }],
    targetLanguage: "zh",
    translationMode: "batch",
    outputProtocol: "json",
  };
  await f.invoke(
    "translate",
    withDefaultPromptInput(f.instance, "translate", base),
  );
  assert.ok(
    JSON.stringify(JSON.parse(f.calls.at(-1).init.body).messages).includes(
      "bank",
    ),
  );
  await f.invoke(
    "translate",
    withDefaultPromptInput(f.instance, "translate", {
      ...base,
      systemPrompt: "{{segments}}",
    }),
  );
  const messages = JSON.parse(f.calls.at(-1).init.body).messages;
  assert.equal(messages[0].content, '[{"id":"a","text":"bank"}]');
  assert.equal(
    messages.some((m) => m.role === "user"),
    false,
  );
  const count = f.calls.length;
  await f.invoke(
      "translate",
      withDefaultPromptInput(f.instance, "translate", {
        ...base,
        userPrompt: "",
      }),
    );
  assert.equal(f.calls.length, count + 1);
  assert.ok(JSON.stringify(JSON.parse(f.calls.at(-1).init.body).messages).includes("bank"));
});
test("demo chat and subtitle retain explicit messages and fixed protocol input", async () => {
  const f = fixture(root, "chat-completions");
  await f.invoke("chat", { messages: [{ role: "user", content: "Hello" }] });
  assert.deepEqual(JSON.parse(f.calls.at(-1).init.body).messages, [
    { role: "user", content: "Hello" },
  ]);
  f.respond(() =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              groups: [{ ids: ["a"], text: "bank", translation: "娌冲哺" }],
            }),
          },
          finish_reason: "stop",
        },
      ],
    }),
  );
  await f.invoke(
    "segmentSubtitle",
    withDefaultPromptInput(f.instance, "segmentSubtitle", {
      items: [{ id: "a", text: "bank" }],
      targetLanguage: "zh",
      tone: "formal",
      glossary: { bank: "娌冲哺" },
    }),
  );
  const messages = JSON.parse(f.calls.at(-1).init.body).messages;
  assert.match(messages[0].content, /formal/);
  assert.match(messages[0].content, /娌冲哺/);
  assert.deepEqual(JSON.parse(messages[1].content), [
    { id: "a", text: "bank" },
  ]);
});

test("demo image service keeps the selected prompt and image protocol", async () => {
  const f = fixture(root, "vision");
  const image = f.assets.put(new Blob(["png"], { type: "image/png" }));
  const input = withDefaultPromptInput(f.instance, "parseImage", { image });
  await f.invoke("parseImage", input);
  const content = JSON.parse(f.calls.at(-1).init.body).messages[0].content;
  assert.equal(content[0].text, input.prompt);
  assert.equal(content[1].image_url.url, "data:image/png;base64,cG5n");
});
