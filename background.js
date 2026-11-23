// MoniPulse Manifest V3 Service Worker — 负责通过 OpenAI 兼容接口发起流式 SSE 请求

const FALLBACK_CONFIG = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: '',
  model: "gpt-4o-mini",
  maxTokens: 1200
};

async function loadConfig() {
  const stored = await chrome.storage.sync.get(Object.keys(FALLBACK_CONFIG));
  return { ...FALLBACK_CONFIG, ...stored };
}

function buildCompletionsUrl(baseUrl) {
  const clean = String(baseUrl || FALLBACK_CONFIG.baseUrl).trim().replace(/\/+$/, '');
  if (clean.endsWith('/chat/completions')) return clean;
  return clean + '/chat/completions';
}

function isLocalEndpoint(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch (_) {
    return false;
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'monipulse-openai-stream') return;

  let controller = null;

  port.onDisconnect.addListener(() => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  });

  port.onMessage.addListener(async (msg) => {
    if (msg?.type !== 'start' || !Array.isArray(msg.messages)) return;

    if (controller) controller.abort();
    controller = new AbortController();

    try {
      const cfg = await loadConfig();
      const endpoint = buildCompletionsUrl(cfg.baseUrl);

      if (!cfg.apiKey && !isLocalEndpoint(endpoint)) {
        port.postMessage({
          type: 'error',
          error: '尚未配置 OpenAI 格式 API Key。请点击浏览器右上角 MoniPulse 扩展图标完成配置。',
        });
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
      };
      if (cfg.apiKey) {
        headers.Authorization = 'Bearer ' + cfg.apiKey.trim();
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: cfg.model || FALLBACK_CONFIG.model,
          messages: msg.messages,
          stream: true,
          max_tokens: Number(cfg.maxTokens) || 1200,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = 'HTTP ' + response.status;
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) detail = errBody.error.message;
        } catch (_) {}
        port.postMessage({ type: 'error', error: '接口返回错误：' + detail });
        return;
      }

      if (!response.body) {
        port.postMessage({ type: 'error', error: '当前接口不支持 SSE 流式响应。' });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || !line.startsWith('data:')) continue;
          const dataStr = line.slice(5).trim();
          if (dataStr === '[DONE]') {
            port.postMessage({ type: 'done' });
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed?.error?.message) {
              port.postMessage({ type: 'error', error: parsed.error.message });
              return;
            }
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              port.postMessage({ type: 'delta', content: delta });
            }
          } catch (_) {
            // 忽略心跳或非 JSON 注释行
          }
        }
      }

      port.postMessage({ type: 'done' });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      port.postMessage({
        type: 'error',
        error: '网络请求失败：' + (err?.message || '请检查 Base URL 与网络连接'),
      });
    }
  });
});

// Popup 测试连接接口
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'MONIPULSE_TEST_API') return false;

  (async () => {
    try {
      const endpoint = buildCompletionsUrl(message.baseUrl);
      const headers = { 'Content-Type': 'application/json' };
      if (message.apiKey) headers.Authorization = 'Bearer ' + message.apiKey.trim();

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: message.model || FALLBACK_CONFIG.model,
          messages: [{ role: 'user', content: '回复 OK 即可' }],
          max_tokens: 16,
          stream: false,
        }),
      });

      if (!res.ok) {
        let detail = 'HTTP ' + res.status;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) detail = errJson.error.message;
        } catch (_) {}
        sendResponse({ ok: false, error: detail });
        return;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || 'OK';
      sendResponse({ ok: true, reply: text.slice(0, 60) });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || '连接失败' });
    }
  })();

  return true;
});
