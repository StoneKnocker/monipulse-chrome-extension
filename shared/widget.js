// Shadow DOM 隔离的 Monica 风格嵌入式摘要卡片组件（Google SERP 与 GitHub 通用）
(function () {
  const CARD_CSS = `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      font-family: "Plus Jakarta Sans", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color-scheme: light dark;
      --mp-bg: rgba(255, 255, 255, 0.96);
      --mp-surface: #f8fafc;
      --mp-border: #e2e8f0;
      --mp-text: #0f172a;
      --mp-muted: #64748b;
      --mp-accent: #5b5bd6;
      --mp-accent-hover: #4c4cc4;
      --mp-accent-soft: rgba(91, 91, 214, 0.08);
      --mp-code-bg: #f1f5f9;
      --mp-danger: #dc2626;
      --mp-danger-bg: rgba(220, 38, 38, 0.06);
      --mp-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    }

    :host([data-theme="dark"]) {
      --mp-bg: rgba(15, 23, 42, 0.94);
      --mp-surface: #131c31;
      --mp-border: #1e293b;
      --mp-text: #f1f5f9;
      --mp-muted: #94a3b8;
      --mp-accent: #7c7cf2;
      --mp-accent-hover: #9090f7;
      --mp-accent-soft: rgba(124, 124, 242, 0.14);
      --mp-code-bg: #1e293b;
      --mp-danger: #f87171;
      --mp-danger-bg: rgba(248, 113, 113, 0.12);
      --mp-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    * { box-sizing: border-box; }

    .mp-card {
      background: var(--mp-bg);
      border: 1px solid var(--mp-border);
      border-radius: 12px;
      color: var(--mp-text);
      box-shadow: var(--mp-shadow);
      overflow: hidden;
      max-width: 100%;
      min-width: 0;
      backdrop-filter: blur(12px);
      font-size: 14px;
      line-height: 1.65;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .mp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px 12px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--mp-border);
      min-width: 0;
    }

    .mp-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1 1 140px;
      min-width: 0;
    }

    .mp-logo {
      width: 24px;
      height: 24px;
      border-radius: 7px;
      background: var(--mp-accent);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }

    .mp-title-wrap {
      flex: 1;
      min-width: 0;
    }

    .mp-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--mp-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mp-meta {
      font-size: 12px;
      color: var(--mp-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-variant-numeric: tabular-nums;
    }

    .mp-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 4px;
      min-width: 0;
    }

    .mp-icon-btn {
      appearance: none;
      border: 1px solid transparent;
      background: transparent;
      color: var(--mp-muted);
      border-radius: 7px;
      padding: 5px 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 150ms ease, color 150ms ease;
    }

    .mp-icon-btn:hover {
      background: var(--mp-surface);
      color: var(--mp-text);
    }

    .mp-icon-btn.mp-stop {
      color: var(--mp-danger);
    }

    .mp-body {
      padding: 12px;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .mp-body[hidden] {
      display: none;
    }

    .mp-skeleton {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 4px 0;
    }

    .mp-skel-line {
      height: 12px;
      border-radius: 6px;
      background: var(--mp-border);
      opacity: 0.65;
    }

    .mp-heading {
      font-size: 14px;
      font-weight: 600;
      margin: 14px 0 6px;
      color: var(--mp-text);
    }

    .mp-heading:first-child {
      margin-top: 0;
    }

    .mp-paragraph {
      margin: 6px 0;
      color: var(--mp-text);
    }

    .mp-list {
      margin: 6px 0 10px;
      padding-left: 18px;
    }

    .mp-list li {
      margin: 4px 0;
    }

    .mp-inline-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      background: var(--mp-code-bg);
      padding: 1px 5px;
      border-radius: 5px;
      overflow-wrap: anywhere;
      word-break: break-all;
    }

    .mp-code-block {
      background: var(--mp-code-bg);
      border: 1px solid var(--mp-border);
      border-radius: 8px;
      padding: 10px 12px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      margin: 8px 0;
    }

    .mp-cite {
      color: var(--mp-accent);
      font-weight: 600;
      font-size: 12px;
      margin: 0 2px;
      font-variant-numeric: tabular-nums;
    }

    .mp-link {
      color: var(--mp-accent);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .mp-cursor {
      display: inline-block;
      width: 2px;
      height: 1em;
      margin-left: 2px;
      vertical-align: -0.15em;
      background: var(--mp-accent);
      animation: mp-blink 0.9s steps(1) infinite;
    }

    @keyframes mp-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }

    .mp-error {
      background: var(--mp-danger-bg);
      border: 1px solid var(--mp-danger);
      border-radius: 8px;
      padding: 12px;
      color: var(--mp-danger);
      font-size: 13px;
    }

    .mp-error-actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
    }

    .mp-btn-primary {
      appearance: none;
      border: none;
      background: var(--mp-accent);
      color: #ffffff;
      border-radius: 7px;
      padding: 6px 12px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 150ms ease;
    }

    .mp-btn-primary:hover {
      background: var(--mp-accent-hover);
    }

    .mp-btn-primary:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .mp-btn-secondary {
      appearance: none;
      border: 1px solid var(--mp-border);
      background: var(--mp-surface);
      color: var(--mp-text);
      border-radius: 7px;
      padding: 6px 10px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    }

    .mp-thread {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--mp-border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .mp-turn-user {
      background: var(--mp-accent-soft);
      color: var(--mp-text);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
    }

    .mp-turn-assistant {
      padding-left: 2px;
    }

    .mp-followups {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--mp-border);
    }

    .mp-quick-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }

    .mp-quick-btn {
      appearance: none;
      border: 1px solid var(--mp-border);
      background: var(--mp-surface);
      color: var(--mp-text);
      border-radius: 7px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      text-align: left;
      max-width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
      transition: border-color 150ms ease, color 150ms ease;
    }

    .mp-quick-btn:hover:not(:disabled) {
      border-color: var(--mp-accent);
      color: var(--mp-accent);
    }

    .mp-quick-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .mp-form {
      display: flex;
      gap: 8px;
      min-width: 0;
    }

    .mp-input {
      flex: 1;
      min-width: 0;
      border: 1px solid var(--mp-border);
      background: var(--mp-surface);
      color: var(--mp-text);
      border-radius: 8px;
      padding: 7px 11px;
      font-size: 13px;
      outline: none;
    }

    .mp-input:focus {
      border-color: var(--mp-accent);
    }
  `;

  function createSummaryWidget(options) {
    const {
      hostId,
      title,
      subtitle,
      detectDark,
      themeMode,
      model,
      suggestedQuestions,
      initialMessages,
      autoStart,
    } = options;

    const existing = document.getElementById(hostId);
    if (existing) existing.remove();

    const host = document.createElement('div');
    host.id = hostId;
    const shadow = host.attachShadow({ mode: 'open' });

    function applyTheme() {
      const dark =
        themeMode === 'dark' || (themeMode === 'auto' && Boolean(detectDark()));
      host.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
    applyTheme();

    const styleEl = document.createElement('style');
    styleEl.textContent = CARD_CSS;
    shadow.appendChild(styleEl);

    const card = document.createElement('section');
    card.className = 'mp-card';

    // Header
    const header = document.createElement('div');
    header.className = 'mp-header';

    const brand = document.createElement('div');
    brand.className = 'mp-brand';

    const logo = document.createElement('span');
    logo.className = 'mp-logo';
    logo.textContent = 'M';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'mp-title-wrap';
    const titleEl = document.createElement('div');
    titleEl.className = 'mp-title';
    titleEl.textContent = title;
    const metaEl = document.createElement('div');
    metaEl.className = 'mp-meta';
    metaEl.textContent = subtitle + ' · ' + model;

    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(metaEl);
    brand.appendChild(logo);
    brand.appendChild(titleWrap);

    const actions = document.createElement('div');
    actions.className = 'mp-actions';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'mp-icon-btn mp-stop';
    stopBtn.type = 'button';
    stopBtn.textContent = '停止';
    stopBtn.hidden = true;

    const regenBtn = document.createElement('button');
    regenBtn.className = 'mp-icon-btn';
    regenBtn.type = 'button';
    regenBtn.textContent = '重新生成';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'mp-icon-btn';
    copyBtn.type = 'button';
    copyBtn.textContent = '复制';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mp-icon-btn';
    toggleBtn.type = 'button';
    toggleBtn.textContent = '折叠';

    actions.appendChild(stopBtn);
    actions.appendChild(regenBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(toggleBtn);

    header.appendChild(brand);
    header.appendChild(actions);

    // Body
    const body = document.createElement('div');
    body.className = 'mp-body';

    const summaryEl = document.createElement('div');
    const threadEl = document.createElement('div');
    threadEl.className = 'mp-thread';
    threadEl.hidden = true;

    const followupWrap = document.createElement('div');
    followupWrap.className = 'mp-followups';

    const quickList = document.createElement('div');
    quickList.className = 'mp-quick-list';

    const form = document.createElement('form');
    form.className = 'mp-form';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mp-input';
    input.placeholder = '针对当前页面继续追问...';
    const sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'mp-btn-primary';
    sendBtn.textContent = '追问';

    form.appendChild(input);
    form.appendChild(sendBtn);
    followupWrap.appendChild(quickList);
    followupWrap.appendChild(form);

    body.appendChild(summaryEl);
    body.appendChild(threadEl);
    body.appendChild(followupWrap);

    card.appendChild(header);
    card.appendChild(body);
    shadow.appendChild(card);

    let activePort = null;
    let isStreaming = false;
    let summaryText = '';
    let conversation = initialMessages.slice();
    let extraTurns = [];

    function setStreamingUI(streaming, statusLabel) {
      isStreaming = streaming;
      stopBtn.hidden = !streaming;
      regenBtn.disabled = streaming;
      sendBtn.disabled = streaming;
      input.disabled = streaming;
      quickList.querySelectorAll('button').forEach((b) => {
        b.disabled = streaming;
      });
      metaEl.textContent = subtitle + ' · ' + model + (statusLabel ? ' · ' + statusLabel : '');
    }

    function renderSkeleton() {
      summaryEl.textContent = '';
      const skel = document.createElement('div');
      skel.className = 'mp-skeleton';
      [92, 78, 86, 62].forEach((w) => {
        const line = document.createElement('div');
        line.className = 'mp-skel-line';
        line.style.width = w + '%';
        skel.appendChild(line);
      });
      summaryEl.appendChild(skel);
    }

    function renderError(message) {
      summaryEl.textContent = '';
      const box = document.createElement('div');
      box.className = 'mp-error';
      const p = document.createElement('div');
      p.textContent = message;
      box.appendChild(p);

      const btnRow = document.createElement('div');
      btnRow.className = 'mp-error-actions';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'mp-btn-primary';
      retry.textContent = '重试摘要';
      retry.addEventListener('click', () => startSummary());
      btnRow.appendChild(retry);

      box.appendChild(btnRow);
      summaryEl.appendChild(box);
    }

    function renderThread(streamingLastTurn) {
      threadEl.textContent = '';
      if (extraTurns.length === 0) {
        threadEl.hidden = true;
        return;
      }
      threadEl.hidden = false;
      extraTurns.forEach((turn, idx) => {
        const q = document.createElement('div');
        q.className = 'mp-turn-user';
        q.textContent = turn.question;
        threadEl.appendChild(q);

        const a = document.createElement('div');
        a.className = 'mp-turn-assistant';
        const isLast = idx === extraTurns.length - 1;
        window.MONIPULSE_RENDER_MD(a, turn.answer || '思考中...', Boolean(streamingLastTurn && isLast));
        threadEl.appendChild(a);
      });
    }

    function disconnectPort() {
      if (activePort) {
        try {
          activePort.disconnect();
        } catch (_) {}
        activePort = null;
      }
    }

    function runStream(messages, onDelta, onDone, onError) {
      disconnectPort();
      setStreamingUI(true, '流式生成中');

      const port = chrome.runtime.connect({ name: 'monipulse-openai-stream' });
      activePort = port;
      let finished = false;

      port.onMessage.addListener((msg) => {
        if (msg.type === 'delta') {
          onDelta(msg.content || '');
        } else if (msg.type === 'done') {
          finished = true;
          disconnectPort();
          setStreamingUI(false, '已完成');
          onDone();
        } else if (msg.type === 'error') {
          finished = true;
          disconnectPort();
          setStreamingUI(false, '请求失败');
          onError(msg.error || '请求 OpenAI 接口失败');
        }
      });

      port.onDisconnect.addListener(() => {
        if (!finished && activePort === port) {
          activePort = null;
          setStreamingUI(false, '已停止');
        }
      });

      port.postMessage({ type: 'start', messages });
    }

    function startSummary() {
      summaryText = '';
      extraTurns = [];
      conversation = initialMessages.slice();
      renderThread(false);
      renderSkeleton();

      runStream(
        conversation,
        (chunk) => {
          summaryText += chunk;
          window.MONIPULSE_RENDER_MD(summaryEl, summaryText, true);
        },
        () => {
          window.MONIPULSE_RENDER_MD(summaryEl, summaryText || '未收到模型输出。', false);
          conversation.push({ role: 'assistant', content: summaryText });
        },
        (errMsg) => {
          renderError(errMsg);
        },
      );
    }

    function askFollowUp(question) {
      const q = question.trim();
      if (!q || isStreaming) return;
      input.value = '';

      if (summaryText && conversation[conversation.length - 1]?.role !== 'assistant') {
        conversation.push({ role: 'assistant', content: summaryText });
      }
      conversation.push({ role: 'user', content: q });
      const turn = { question: q, answer: '' };
      extraTurns.push(turn);
      renderThread(true);

      runStream(
        conversation,
        (chunk) => {
          turn.answer += chunk;
          renderThread(true);
        },
        () => {
          renderThread(false);
          conversation.push({ role: 'assistant', content: turn.answer });
        },
        (errMsg) => {
          turn.answer = '请求失败：' + errMsg;
          renderThread(false);
        },
      );
    }

    (suggestedQuestions || []).forEach((qText) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mp-quick-btn';
      btn.textContent = qText;
      btn.addEventListener('click', () => askFollowUp(qText));
      quickList.appendChild(btn);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      askFollowUp(input.value);
    });

    stopBtn.addEventListener('click', () => {
      disconnectPort();
      setStreamingUI(false, '已停止');
      if (summaryText) {
        window.MONIPULSE_RENDER_MD(summaryEl, summaryText, false);
      }
      renderThread(false);
    });

    regenBtn.addEventListener('click', () => startSummary());

    copyBtn.addEventListener('click', async () => {
      const fullMarkdown = [
        summaryText,
        ...extraTurns.map((t) => '\n\n**追问：' + t.question + '**\n\n' + t.answer),
      ].join('');
      if (!fullMarkdown.trim()) return;
      try {
        await navigator.clipboard.writeText(fullMarkdown);
        copyBtn.textContent = '已复制';
        setTimeout(() => {
          copyBtn.textContent = '复制';
        }, 1600);
      } catch (_) {}
    });

    toggleBtn.addEventListener('click', () => {
      const collapsed = !body.hidden;
      body.hidden = collapsed;
      toggleBtn.textContent = collapsed ? '展开' : '折叠';
    });

    if (autoStart) {
      startSummary();
    } else {
      summaryEl.textContent = '';
      const idleBtn = document.createElement('button');
      idleBtn.type = 'button';
      idleBtn.className = 'mp-btn-primary';
      idleBtn.textContent = '立即生成中文摘要';
      idleBtn.addEventListener('click', () => startSummary());
      summaryEl.appendChild(idleBtn);
      setStreamingUI(false, '手动触发');
    }

    return { host, destroy: disconnectPort, applyTheme };
  }

  window.MONIPULSE_CREATE_WIDGET = createSummaryWidget;
})();
