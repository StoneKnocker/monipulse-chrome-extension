document.addEventListener('DOMContentLoaded', async () => {
  const fields = {
    baseUrl: document.getElementById('baseUrl'),
    apiKey: document.getElementById('apiKey'),
    model: document.getElementById('model'),
    themeMode: document.getElementById('themeMode'),
    autoSummarizeGoogle: document.getElementById('autoSummarizeGoogle'),
    autoSummarizeGithub: document.getElementById('autoSummarizeGithub'),
    googlePrompt: document.getElementById('googlePrompt'),
    githubPrompt: document.getElementById('githubPrompt'),
  };
  const statusEl = document.getElementById('status-msg');
  const form = document.getElementById('settings-form');
  const testBtn = document.getElementById('test-btn');

  function showStatus(text, isError) {
    statusEl.hidden = false;
    statusEl.textContent = text;
    statusEl.className = 'status-msg ' + (isError ? 'err' : 'ok');
  }

  const stored = await chrome.storage.sync.get(null);
  const cfg = { ...window.MONIPULSE_DEFAULTS, ...stored };

  fields.baseUrl.value = cfg.baseUrl || '';
  fields.apiKey.value = cfg.apiKey || '';
  fields.model.value = cfg.model || '';
  fields.themeMode.value = cfg.themeMode || 'auto';
  fields.autoSummarizeGoogle.checked = cfg.autoSummarizeGoogle !== false;
  fields.autoSummarizeGithub.checked = cfg.autoSummarizeGithub !== false;
  fields.googlePrompt.value = cfg.googlePrompt || '';
  fields.githubPrompt.value = cfg.githubPrompt || '';

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      fields.baseUrl.value = btn.dataset.url || '';
      fields.model.value = btn.dataset.model || '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nextConfig = {
      baseUrl: fields.baseUrl.value.trim().replace(/\/+$/, ''),
      apiKey: fields.apiKey.value.trim(),
      model: fields.model.value.trim(),
      themeMode: fields.themeMode.value,
      autoSummarizeGoogle: fields.autoSummarizeGoogle.checked,
      autoSummarizeGithub: fields.autoSummarizeGithub.checked,
      googlePrompt: fields.googlePrompt.value.trim() || window.MONIPULSE_DEFAULTS.googlePrompt,
      githubPrompt: fields.githubPrompt.value.trim() || window.MONIPULSE_DEFAULTS.githubPrompt,
    };
    await chrome.storage.sync.set(nextConfig);
    showStatus('配置已保存，刷新 Google 或 GitHub 页面即可生效。', false);
  });

  testBtn.addEventListener('click', () => {
    showStatus('正在测试 OpenAI 接口连接...', false);
    chrome.runtime.sendMessage(
      {
        type: 'MONIPULSE_TEST_API',
        baseUrl: fields.baseUrl.value.trim(),
        apiKey: fields.apiKey.value.trim(),
        model: fields.model.value.trim(),
      },
      (res) => {
        if (chrome.runtime.lastError) {
          showStatus('后台服务未响应：' + chrome.runtime.lastError.message, true);
          return;
        }
        if (res?.ok) {
          showStatus('连接成功，模型返回：' + res.reply, false);
        } else {
          showStatus('连接失败：' + (res?.error || '请检查地址与密钥'), true);
        }
      },
    );
  });
});
