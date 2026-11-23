// 安全 Markdown 渲染器：纯 DOM 节点构建，杜绝原始 HTML 注入风险
(function () {
  function isSafeHttpUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function appendInlineNodes(parent, text) {
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[\d+\])/g;
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const token = match[0];

      if (token.startsWith('`') && token.endsWith('`')) {
        const code = document.createElement('code');
        code.className = 'mp-inline-code';
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
      } else if (token.startsWith('**') && token.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = token.slice(2, -2);
        parent.appendChild(strong);
      } else if (/^\[\d+\]$/.test(token)) {
        const cite = document.createElement('span');
        cite.className = 'mp-cite';
        cite.textContent = token;
        parent.appendChild(cite);
      } else if (token.startsWith('[')) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch && isSafeHttpUrl(linkMatch[2])) {
          const a = document.createElement('a');
          a.href = linkMatch[2];
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'mp-link';
          a.textContent = linkMatch[1];
          parent.appendChild(a);
        } else {
          parent.appendChild(document.createTextNode(token));
        }
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function renderMarkdown(container, markdown, showCursor) {
    container.textContent = '';
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    let i = 0;

    while (i < lines.length) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        i += 1;
        continue;
      }

      // Fenced code block
      if (trimmed.startsWith('```')) {
        const codeLines = [];
        i += 1;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i += 1;
        }
        i += 1;
        const pre = document.createElement('pre');
        pre.className = 'mp-code-block';
        const code = document.createElement('code');
        code.textContent = codeLines.join('\n');
        pre.appendChild(code);
        container.appendChild(pre);
        continue;
      }

      // Headings
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length + 1, 4);
        const h = document.createElement('h' + level);
        h.className = 'mp-heading';
        appendInlineNodes(h, headingMatch[2]);
        container.appendChild(h);
        i += 1;
        continue;
      }

      // Unordered list
      if (/^[-*•]\s+/.test(trimmed)) {
        const ul = document.createElement('ul');
        ul.className = 'mp-list';
        while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
          const li = document.createElement('li');
          appendInlineNodes(li, lines[i].trim().replace(/^[-*•]\s+/, ''));
          ul.appendChild(li);
          i += 1;
        }
        container.appendChild(ul);
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        const ol = document.createElement('ol');
        ol.className = 'mp-list mp-list-ordered';
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          const li = document.createElement('li');
          appendInlineNodes(li, lines[i].trim().replace(/^\d+\.\s+/, ''));
          ol.appendChild(li);
          i += 1;
        }
        container.appendChild(ol);
        continue;
      }

      // Paragraph
      const p = document.createElement('p');
      p.className = 'mp-paragraph';
      appendInlineNodes(p, trimmed);
      container.appendChild(p);
      i += 1;
    }

    if (showCursor) {
      const cursor = document.createElement('span');
      cursor.className = 'mp-cursor';
      const lastEl = container.lastElementChild;
      if (lastEl && (lastEl.tagName === 'P' || lastEl.tagName === 'UL' || lastEl.tagName === 'OL')) {
        if (lastEl.tagName === 'UL' || lastEl.tagName === 'OL') {
          const lastLi = lastEl.lastElementChild;
          if (lastLi) lastLi.appendChild(cursor);
          else container.appendChild(cursor);
        } else {
          lastEl.appendChild(cursor);
        }
      } else {
        container.appendChild(cursor);
      }
    }
  }

  window.MONIPULSE_RENDER_MD = renderMarkdown;
})();
