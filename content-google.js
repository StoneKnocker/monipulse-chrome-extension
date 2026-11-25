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

  let modifiedCenterCol = false;
  let origCenterGridColumn = '';

  function restoreCenterCol(centerCol) {
    if (!modifiedCenterCol || !centerCol) return;
    centerCol.style.gridColumn = origCenterGridColumn;
    modifiedCenterCol = false;
  }

  function removeCustomRhs() {
    const custom = document.getElementById('monipulse-google-rhs');
    if (custom) custom.remove();
  }

  function getGridColumnCount(el) {
    if (!el) return 0;
    const cs = window.getComputedStyle(el);
    if (cs.display !== 'grid' && cs.display !== 'inline-grid') return 0;
    const cols = (cs.gridTemplateColumns || '').trim();
    if (!cols || cols === 'none') return 0;
    return cols.split(/\s+/).length;
  }

  function isUsableNativeRhs(rhs) {
    if (!rhs) return false;
    const cs = window.getComputedStyle(rhs);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const rect = rhs.getBoundingClientRect();
    return rect.width >= 220 && rect.left >= 0 && rect.right <= window.innerWidth + 4;
  }

  function findDirectChildContaining(parent, node) {
    let cur = node;
    while (cur && cur.parentElement && cur.parentElement !== parent) {
      cur = cur.parentElement;
    }
    return cur && cur.parentElement === parent ? cur : null;
  }

  function ensureCustomRhs(rcnt, centerCol) {
    let rhs = document.getElementById('monipulse-google-rhs');
    if (!rhs) {
      rhs = document.createElement('div');
      rhs.id = 'monipulse-google-rhs';
    }
    const anchor = findDirectChildContaining(rcnt, centerCol);
    const desiredNext = anchor ? anchor.nextSibling : null;
    if (rhs.parentElement !== rcnt || (anchor && rhs.previousSibling !== anchor)) {
      rcnt.insertBefore(rhs, desiredNext);
    }
    return rhs;
  }

  function applyHostStyles(host) {
    host.style.marginBottom = '20px';
    host.style.width = '100%';
    host.style.maxWidth = '100%';
    host.style.minWidth = '0';
    host.style.boxSizing = 'border-box';
  }

  function mountHostIn(container, host) {
    applyHostStyles(host);
    if (host.parentElement !== container || container.firstElementChild !== host) {
      container.prepend(host);
    }
  }

  function placeGoogleWidget(host) {
    const rcnt = document.getElementById('rcnt') || document.getElementById('center_col')?.parentElement;
    const centerCol = document.getElementById('center_col');
    const nativeRhs = document.getElementById('rhs');

    // 1. 优先复用 Google 原生且可见、未越界的右侧栏 #rhs
    if (isUsableNativeRhs(nativeRhs)) {
      mountHostIn(nativeRhs, host);
      removeCustomRhs();
      restoreCenterCol(centerCol);
      return true;
    }

    if (!rcnt) return false;

    const colCount = getGridColumnCount(rcnt);

    // 2. 新版 Google 22 列 CSS Grid（无 #rhs 时，#center_col 默认占 2 / -2，直接 append 会落入最右外边距列导致溢出）
    if (colCount >= 21 && centerCol) {
      const centerWidthBefore = !modifiedCenterCol ? centerCol.getBoundingClientRect().width : 0;
      const isWideCenter = !modifiedCenterCol && centerWidthBefore > 700;

      if (!isWideCenter) {
        if (!modifiedCenterCol) {
          origCenterGridColumn = centerCol.style.gridColumn;
          modifiedCenterCol = true;
        }
        centerCol.style.gridColumn = '2 / span 12';

        const customRhs = ensureCustomRhs(rcnt, centerCol);
        customRhs.style.gridColumn = 'span 7 / -2';
        customRhs.style.width = '100%';
        customRhs.style.maxWidth = '100%';
        customRhs.style.minWidth = '0';
        customRhs.style.marginLeft = '0';
        customRhs.style.flexShrink = '';
        customRhs.style.position = 'relative';
        customRhs.style.boxSizing = 'border-box';
        mountHostIn(customRhs, host);

        const rhsRect = customRhs.getBoundingClientRect();
        const centerRect = centerCol.getBoundingClientRect();
        if (
          rhsRect.width >= 240 &&
          rhsRect.left >= centerRect.right - 2 &&
          rhsRect.right <= window.innerWidth + 2
        ) {
          return true;
        }
      }
      // 空间不足或布局异常时回退到主列顶部并清理自定义右侧栏
      mountHostIn(centerCol, host);
      restoreCenterCol(centerCol);
      removeCustomRhs();
      return true;
    }

    if (centerCol && window.getComputedStyle(rcnt).display.includes('flex')) {
      // 3. 兼容旧版 Flex 布局：根据剩余视口宽度动态计算右侧栏宽度
      restoreCenterCol(centerCol);
      const centerRect = centerCol.getBoundingClientRect();
      const avail = window.innerWidth - centerRect.right;
      if (avail >= 300) {
        const gap = Math.min(40, Math.max(16, Math.floor((avail - 280) / 2)));
        const width = Math.min(372, Math.floor(avail - gap - 16));
        const customRhs = ensureCustomRhs(rcnt, centerCol);
        customRhs.style.gridColumn = '';
        customRhs.style.width = width + 'px';
        customRhs.style.maxWidth = '100%';
        customRhs.style.minWidth = '0';
        customRhs.style.marginLeft = gap + 'px';
        customRhs.style.flexShrink = '0';
        customRhs.style.position = 'relative';
        customRhs.style.boxSizing = 'border-box';
        mountHostIn(customRhs, host);

        const rhsRect = customRhs.getBoundingClientRect();
        if (rhsRect.width >= 240 && rhsRect.right <= window.innerWidth + 2) {
          return true;
        }
      }
    }

    // 4. 窄屏（< 800px）或兜底：挂载到主搜索结果列顶部，避免溢出屏幕边界
    if (centerCol) {
      mountHostIn(centerCol, host);
      restoreCenterCol(centerCol);
      removeCustomRhs();
      return true;
    }
    restoreCenterCol(centerCol);
    removeCustomRhs();
    return false;
  }

  const query = extractSearchQuery();
  if (!query) return;

  const stored = await chrome.storage.sync.get(null);
  const cfg = { ...window.MONIPULSE_DEFAULTS, ...stored };

  const results = extractGoogleResults();
  if (results.length === 0) return;

  const rcnt = document.getElementById('rcnt') || document.getElementById('center_col')?.parentElement;
  if (!rcnt && !document.getElementById('rhs')) return;

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

  if (!placeGoogleWidget(widget.host)) {
    widget.destroy();
    return;
  }

  let relayoutTimer = 0;
  let isRelayouting = false;
  function scheduleRelayout() {
    if (isRelayouting) return;
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(() => {
      if (!widget.host.isConnected && !document.getElementById('rcnt')) return;
      isRelayouting = true;
      try {
        placeGoogleWidget(widget.host);
      } finally {
        isRelayouting = false;
      }
    }, 120);
  }

  window.addEventListener('resize', scheduleRelayout);
  if (rcnt && typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(scheduleRelayout);
    ro.observe(rcnt);
  }
})();
