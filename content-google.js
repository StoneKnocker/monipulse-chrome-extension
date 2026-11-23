// Google SERP 内容脚本：页面加载完成后自动提取前排结果并注入右侧栏中文摘要卡片
(async function () {
  if (window.__MONIPULSE_GOOGLE_INIT__) return;
  window.__MONIPULSE_GOOGLE_INIT__ = true;

  function detectGoogleDark() {
    const bg = window.getComputedStyle(document.body).backgroundColor || '';
    const match = bg.match(/\d+/g);
    if (match && match.length >= 3) {
      const luminance = 0.299 * Number(match[0]) + 0.587 * Number(match[1]) + 0.114 * Number(match[2]);
      return luminance < 128;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function extractSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('q');
    if (fromUrl && fromUrl.trim()) return fromUrl.trim();
    const input = document.querySelector('textarea[name="q"], input[name="q"]');
    return input ? String(input.value || '').trim() : '';
  }

  function extractGoogleResults() {
    const results = [];
    const seenUrls = new Set();
    const blocks = document.querySelectorAll('#search .g, #rso .MjjYud, #rso [data-hveid]');

    for (const block of blocks) {
      if (results.length >= 8) break;
      const h3 = block.querySelector('h3');
      const link = h3 ? h3.closest('a') : block.querySelector('a[href^="http"]');
      if (!h3 || !link || !link.href) continue;

      const url = link.href;
      if (seenUrls.has(url) || url.includes('google.com/search')) continue;
      seenUrls.add(url);

      const snippetNode =
        block.querySelector('[data-sncf], .VwiC3b, .IsZvec, .lEBKkf') ||
        block.querySelector('div[style*="-webkit-line-clamp"]');
      const title = h3.textContent.trim();
      const snippet = snippetNode ? snippetNode.textContent.trim() : '';
      if (!title) continue;

      results.push({
        index: results.length + 1,
        title,
        url,
        snippet: snippet.slice(0, 320),
      });
    }
    return results;
  }

  function ensureRightRailContainer() {
    let rhs = document.getElementById('rhs');
    if (rhs) return rhs;

    const rcnt = document.getElementById('rcnt') || document.getElementById('center_col')?.parentElement;
    if (!rcnt) return null;

    rhs = document.createElement('div');
    rhs.id = 'monipulse-google-rhs';
    rhs.style.width = '368px';
    rhs.style.marginLeft = '40px';
    rhs.style.flexShrink = '0';
    rcnt.appendChild(rhs);
    return rhs;
  }

  const query = extractSearchQuery();
  if (!query) return;

  const stored = await chrome.storage.sync.get(null);
  const cfg = { ...window.MONIPULSE_DEFAULTS, ...stored };

  const results = extractGoogleResults();
  if (results.length === 0) return;

  const container = ensureRightRailContainer();
  if (!container) return;

  const userLines = ['搜索关键词：' + query, '', '【前排自然搜索结果】'];
  results.forEach((item) => {
    userLines.push('[' + item.index + '] ' + item.title);
    userLines.push('链接：' + item.url);
    if (item.snippet) userLines.push('摘要：' + item.snippet);
    userLines.push('');
  });
  userLines.push('请使用中文按结构化格式总结以上搜索结果。');

  const widget = window.MONIPULSE_CREATE_WIDGET({
    hostId: 'monipulse-google-card',
    title: 'MoniPulse 搜索摘要',
    subtitle: '已分析 ' + results.length + ' 条结果',
    detectDark: detectGoogleDark,
    themeMode: cfg.themeMode || 'auto',
    model: cfg.model || 'gpt-4o-mini',
    autoStart: cfg.autoSummarizeGoogle !== false,
    suggestedQuestions: [
      '用更通俗的语言解释核心结论',
      '这些搜索结果之间有哪些分歧或注意点？',
      '给我一个可直接执行的最佳实践步骤',
    ],
    initialMessages: [
      { role: 'system', content: cfg.googlePrompt },
      { role: 'user', content: userLines.join('\n') },
    ],
  });

  widget.host.style.marginBottom = '20px';
  container.prepend(widget.host);
})();
