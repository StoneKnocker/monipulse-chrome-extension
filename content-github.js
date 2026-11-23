// GitHub 项目主页内容脚本：兼容 Turbo SPA 导航，加载后自动在右侧栏 About 上方注入中文摘要卡片
(function () {
  const RESERVED_OWNERS = new Set([
    'settings', 'explore', 'marketplace', 'topics', 'trending', 'collections',
    'events', 'sponsors', 'notifications', 'login', 'signup', 'search', 'orgs',
    'features', 'pricing', 'enterprise', 'pulls', 'issues', 'codespaces', 'new'
  ]);

  let currentRepoKey = '';
  let activeWidget = null;
  let mountTimer = 0;
  let mounting = false;

  function detectGithubDark() {
    const html = document.documentElement;
    const colorMode = html.getAttribute('data-color-mode');
    if (colorMode === 'dark') return true;
    if (colorMode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function parseRepoHome() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length !== 2) return null;
    const [owner, repo] = segments;
    if (RESERVED_OWNERS.has(owner.toLowerCase())) return null;
    return { owner, repo, key: owner + '/' + repo };
  }

  function headingByText(root, text) {
    return Array.from(root.querySelectorAll('h2, h3')).find((el) => {
      return el.textContent.replace(/\s+/g, ' ').trim() === text;
    }) || null;
  }

  function uniqueTrimmed(values, limit) {
    const out = [];
    const seen = new Set();
    for (const value of values) {
      const t = String(value || '').trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
      if (out.length >= limit) break;
    }
    return out;
  }

  function extractCount(el) {
    if (!el) return '';
    const hidden = el.querySelector('[class*="VisuallyHidden"]');
    const raw = ((hidden && hidden.textContent) || el.textContent || '').replace(/[()]/g, ' ');
    const match = raw.match(/[\d.,]+\s*[kKmMbB]?/);
    return match ? match[0].replace(/\s+/g, '') : '';
  }

  function sidebarPane() {
    return document.querySelector('[data-component="SplitPageLayout.Pane"]') ||
      document.querySelector('.Layout-sidebar') ||
      document.querySelector('[data-hpc] .Layout-sidebar');
  }

  function extractRepoContext(repoInfo) {
    const pane = sidebarPane() || document;
    const aboutHeading = headingByText(pane, 'About');
    const aboutSection = aboutHeading ? aboutHeading.parentElement : null;
    const descriptionEl =
      (aboutSection && aboutSection.querySelector('p')) ||
      document.querySelector('p.f4.my-3') ||
      document.querySelector('[data-pjax="#repo-content-pjax-container"] p.f4');
    const description = descriptionEl ? descriptionEl.textContent.trim().slice(0, 400) : '';

    const starsEl =
      document.querySelector('[data-testid="star-button"]') ||
      document.querySelector('#repo-stars-counter-star, a[href$="/stargazers"] strong');
    const forksEl =
      document.querySelector('[data-testid="fork-button"]') ||
      document.querySelector('#repo-network-counter, a[href$="/forks"] strong');

    const langHeading = headingByText(pane, 'Languages');
    const langSection = langHeading ? langHeading.parentElement : null;
    const languagesFromSection = langSection
      ? uniqueTrimmed(
          (langSection.innerText || '')
            .replace(/^Languages\s*/i, '')
            .split(/\n|(?<=%)\s+/),
          6,
        )
      : [];
    const langEls = languagesFromSection.length
      ? languagesFromSection
      : Array.from(document.querySelectorAll('.BorderGrid-cell a[href*="/search?l="] span'))
          .map((el) => el.textContent.trim())
          .filter(Boolean)
          .slice(0, 4);

    const topics = uniqueTrimmed(
      Array.from(
        pane.querySelectorAll('a[href^="/topics/"], a.topic-tag, a[class*="TopicTag"]'),
      ).map((el) => el.textContent),
      8,
    );

    const fileRows = uniqueTrimmed(
      Array.from(
        document.querySelectorAll(
          '[data-testid="directory-content"] tbody tr td:first-child a, [aria-labelledby="folders-and-files"] a.Link--primary, .js-navigation-item .js-navigation-open',
        ),
      ).map((el) => el.textContent),
      24,
    );

    const readmeEl =
      document.querySelector('#readme article.markdown-body') ||
      document.querySelector('article.markdown-body');
    const readmeText = readmeEl ? readmeEl.innerText.replace(/\n{3,}/g, '\n\n').trim().slice(0, 6800) : '';

    return {
      ...repoInfo,
      description,
      stars: extractCount(starsEl) || (starsEl ? starsEl.textContent.trim() : '未知'),
      forks: extractCount(forksEl) || (forksEl ? forksEl.textContent.trim() : '未知'),
      languages: langEls.join(', ') || '未识别',
      topics: topics.join(', ') || '无',
      files: fileRows.join(', ') || '未提取到目录',
      readmeText,
    };
  }

  function findAboutMountTarget() {
    // GitHub 新版 Primer SplitPageLayout 右侧栏，挂到 About 区块正上方
    const pane = document.querySelector('[data-component="SplitPageLayout.Pane"]');
    if (pane) {
      const about = headingByText(pane, 'About');
      const aboutSection = about ? about.parentElement : null;
      if (aboutSection && aboutSection.parentElement) {
        return { parent: aboutSection.parentElement, before: aboutSection };
      }
      return { parent: pane, before: pane.firstElementChild };
    }

    // 旧版 .Layout-sidebar
    const sidebar = document.querySelector('.Layout-sidebar') ||
      document.querySelector('[data-hpc] .Layout-sidebar');
    if (sidebar) {
      const borderGrid = sidebar.querySelector('.BorderGrid');
      if (borderGrid && borderGrid.parentElement) {
        return { parent: borderGrid.parentElement, before: borderGrid };
      }
      return { parent: sidebar, before: sidebar.firstElementChild };
    }

    // 窄屏或兜底：README 上方
    const readmeAnchor =
      document.getElementById('readme') ||
      document.querySelector('react-partial[partial-name="repos-overview"] [data-testid="readme-container"]') ||
      document.querySelector('article.markdown-body')?.closest('div[class*="Box"], section, div');
    if (readmeAnchor && readmeAnchor.parentElement) {
      return { parent: readmeAnchor.parentElement, before: readmeAnchor };
    }
    return null;
  }

  function placeWidget(host) {
    const target = findAboutMountTarget();
    if (!target || !target.parent) return false;
    if (host.parentElement === target.parent && host.nextElementSibling === (target.before || null)) {
      return true;
    }
    host.style.marginBottom = '16px';
    host.style.width = '100%';
    target.parent.insertBefore(host, target.before || null);
    return true;
  }

  function teardownWidget() {
    if (!activeWidget) {
      currentRepoKey = '';
      return;
    }
    activeWidget.destroy();
    if (activeWidget.host && activeWidget.host.parentElement) {
      activeWidget.host.remove();
    }
    activeWidget = null;
    currentRepoKey = '';
  }

  async function mountIfRepoHome() {
    if (mounting) return;
    const repoInfo = parseRepoHome();
    if (!repoInfo) {
      teardownWidget();
      return;
    }

    if (currentRepoKey === repoInfo.key && activeWidget) {
      placeWidget(activeWidget.host);
      return;
    }

    const target = findAboutMountTarget();
    if (!target || !target.parent) return;

    mounting = true;
    try {
      const stored = await chrome.storage.sync.get(null);
      const stillOnRepo = parseRepoHome();
      if (!stillOnRepo || stillOnRepo.key !== repoInfo.key) return;

      currentRepoKey = repoInfo.key;
      if (activeWidget) {
        activeWidget.destroy();
        if (activeWidget.host && activeWidget.host.parentElement) {
          activeWidget.host.remove();
        }
        activeWidget = null;
      }

      const cfg = { ...window.MONIPULSE_DEFAULTS, ...stored };
      const ctx = extractRepoContext(repoInfo);

      const userPrompt = [
        'GitHub 仓库：' + ctx.owner + '/' + ctx.repo,
        '简介：' + (ctx.description || '无'),
        '指标：Stars ' + ctx.stars + ' · Forks ' + ctx.forks + ' · 语言 ' + ctx.languages,
        '标签：' + ctx.topics,
        '',
        '【顶层文件与目录】',
        ctx.files,
        '',
        '【README 正文节选】',
        ctx.readmeText || '未找到 README 内容，请结合简介与目录总结。',
        '',
        '请使用中文按结构化格式总结该开源项目。',
      ].join('\n');

      activeWidget = window.MONIPULSE_CREATE_WIDGET({
        hostId: 'monipulse-github-card',
        title: 'MoniPulse 项目摘要',
        subtitle: ctx.owner + '/' + ctx.repo,
        detectDark: detectGithubDark,
        themeMode: cfg.themeMode || 'auto',
        model: cfg.model || 'gpt-4o-mini',
        autoStart: cfg.autoSummarizeGithub !== false,
        suggestedQuestions: [
          '这个项目如何在本地快速安装并跑起来？',
          '它适合什么规模和场景的工程使用？',
          '和同领域常见开源替代方案相比有什么优势？',
        ],
        initialMessages: [
          { role: 'system', content: cfg.githubPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      placeWidget(activeWidget.host);
    } finally {
      mounting = false;
    }

    const latest = parseRepoHome();
    if (!latest) {
      teardownWidget();
    } else if (!activeWidget || currentRepoKey !== latest.key) {
      scheduleMount();
    }
  }

  function scheduleMount() {
    clearTimeout(mountTimer);
    mountTimer = setTimeout(mountIfRepoHome, 250);
  }

  scheduleMount();
  document.addEventListener('turbo:load', scheduleMount);
  document.addEventListener('pjax:end', scheduleMount);
  window.addEventListener('popstate', scheduleMount);

  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      scheduleMount();
      return;
    }
    if (!parseRepoHome()) return;
    const card = document.getElementById('monipulse-github-card');
    if (!activeWidget || !card) {
      scheduleMount();
      return;
    }
    const pane = document.querySelector('[data-component="SplitPageLayout.Pane"]');
    if (pane && !pane.contains(card)) scheduleMount();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
