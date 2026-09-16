/* ==========================================================
   PurrCat 官网脚本
   - GitHub 星标数（超时中断 + 重试 + localStorage 缓存兜底）
   - 最新动态：首页最新 5 条 / 动态页关键词 + 月份检索
     （数据由 data/updates.js 提供，scripts/add_update.py 维护）
   - Blog 关键词搜索
   - 移动端菜单
   - 代码块复制按钮
   - 滚动渐显
   - 首页 CTA 安装命令按操作系统切换
   ========================================================== */
(function () {
  'use strict';

  /* 标记 JS 可用：CSS 仅在 html.js 下才隐藏待渐显元素，避免无 JS 环境白屏 */
  document.documentElement.classList.add('js');

  var REPO = 'PurrPod/purrcat';
  var GH_API = 'https://api.github.com/repos/' + REPO;
  var CACHE_TTL = 6 * 60 * 60 * 1000; // 6 小时（纯展示性数据，容忍旧一点）
  var FETCH_TIMEOUT = 6000;           // 单次请求最多等 6 秒

  /* ---------- 小工具 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 缓存条目结构：{ ts, etag, data } */
  function cacheGetEntry(key) {
    try {
      var raw = localStorage.getItem('purrcat-' + key);
      if (!raw) return null;
      var box = JSON.parse(raw);
      return box || null;
    } catch (e) { return null; }
  }

  function cacheSet(key, data, etag) {
    try {
      localStorage.setItem('purrcat-' + key, JSON.stringify({ ts: Date.now(), etag: etag || null, data: data }));
    } catch (e) { /* 隐私模式等场景直接忽略 */ }
  }

  /* 过期缓存也先拿来垫着：网络差时至少立刻能显示上次的结果 */
  function cacheGetStale(key) {
    var box = cacheGetEntry(key);
    return (box && box.data !== undefined) ? box.data : null;
  }

  /* api.github.com 在部分网络下能连上但极慢（甚至假死挂起）。
     策略：
     1) 超时中断 + 重试一次：砍掉卡死的连接马上重连，第二次往往就通了；
     2) If-None-Match 条件请求：数据没变时 GitHub 只回一个 304 空响应（~1KB），
        和星标请求一样轻量，慢链路也能很快钻过去（GitHub 通过 CORS 暴露 ETag） */
  function ghFetch(url, etag) {
    function once() {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, FETCH_TIMEOUT) : null;
      var headers = { Accept: 'application/vnd.github+json' };
      if (etag) headers['If-None-Match'] = etag;
      return fetch(url, {
        headers: headers,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        clearTimeout(timer);
        var newEtag = (r.headers && r.headers.get) ? r.headers.get('ETag') : null;
        if (r.status === 304) return { notModified: true, etag: newEtag };
        if (!r.ok) return null;
        return r.json().then(function (d) { return { data: d, etag: newEtag }; });
      }, function (err) {
        clearTimeout(timer);
        throw err;
      });
    }
    return once().catch(function () {
      return new Promise(function (resolve) { setTimeout(resolve, 400); })
        .then(once);
    });
  }

  function fmtStars(n) {
    if (typeof n !== 'number') return '★';
    return n >= 1000 ? '★ ' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : '★ ' + n;
  }

  /* ---------- GitHub 星标 ---------- */
  function renderStars(count) {
    $all('[data-gh-stars]').forEach(function (el) { el.textContent = fmtStars(count); });
  }

  function loadStars() {
    if (!$all('[data-gh-stars]').length) return;
    var entry = cacheGetEntry('stars');
    if (entry && typeof entry.data === 'number') renderStars(entry.data);
    ghFetch(GH_API, entry && entry.etag)
      .then(function (res) {
        if (res && res.data && typeof res.data.stargazers_count === 'number') {
          cacheSet('stars', res.data.stargazers_count, res.etag);
          renderStars(res.data.stargazers_count);
        }
        /* 304（无变化）或异常：继续显示缓存值即可 */
      })
      .catch(function () {
        var stale = cacheGetStale('stars');
        if (stale !== null) renderStars(stale);
      });
  }

  /* ---------- 最新动态（data/updates.js 提供 window.PURRCAT_UPDATES） ---------- */
  function getUpdates() {
    return Array.isArray(window.PURRCAT_UPDATES) ? window.PURRCAT_UPDATES : [];
  }

  function isExtLink(url) {
    return /^https?:\/\//.test(url || '');
  }

  /* 首页：最新 5 条，紧凑列表 */
  function renderHomeUpdates() {
    var box = $('#update-list');
    if (!box) return;
    var list = getUpdates().slice(0, 5);
    if (!list.length) {
      box.innerHTML = '<li class="update-item"><span class="update-body">暂无动态，猫在打盹～</span></li>';
      return;
    }
    box.innerHTML = list.map(function (u) {
      var body = esc(u.content || '(no content)');
      if (u.link) {
        body = '<a class="update-link" href="' + esc(u.link) + '"' +
          (isExtLink(u.link) ? ' target="_blank" rel="noopener"' : '') + '>' + body + '</a>';
      }
      return '<li class="update-item">' +
        '<span class="update-time">' + esc((u.time || '').slice(0, 10)) + '</span>' +
        '<span class="update-body">' + body + '</span>' +
      '</li>';
    }).join('');
  }

  /* 动态页：卡片时间线 */
  function updateCardItem(u) {
    var ext = isExtLink(u.link);
    return '<li class="tl-item">' +
      '<div class="tl-card">' +
        '<time class="tl-time">' + esc(u.time || '') + '</time>' +
        '<p class="tl-content">' + esc(u.content || '') + '</p>' +
        (u.link
          ? '<a class="tl-link" href="' + esc(u.link) + '"' +
              (ext ? ' target="_blank" rel="noopener"' : '') + '>查看详情 →</a>'
          : '') +
      '</div>' +
    '</li>';
  }

  function initUpdatesPage() {
    var box = $('#updates-list');
    if (!box) return;
    var input = $('#update-search');
    var monthRow = $('#update-months');
    var empty = $('#updates-empty');
    var list = getUpdates();
    var q = '';
    var month = '';

    /* 月份筛选按钮：由数据自动生成 */
    var months = [];
    list.forEach(function (u) {
      var m = (u.time || '').slice(0, 7); /* YYYY-MM */
      if (m && months.indexOf(m) === -1) months.push(m);
    });
    months.sort().reverse();

    function apply() {
      var kw = q.toLowerCase();
      var shown = list.filter(function (u) {
        var okMonth = !month || (u.time || '').slice(0, 7) === month;
        var okKw = !kw || (u.content || '').toLowerCase().indexOf(kw) !== -1;
        return okMonth && okKw;
      });
      box.innerHTML = shown.map(updateCardItem).join('');
      if (empty) empty.hidden = shown.length > 0;
    }

    if (monthRow) {
      monthRow.innerHTML = '<button type="button" class="mchip is-on" data-m="">全部</button>' +
        months.map(function (m) {
          return '<button type="button" class="mchip" data-m="' + m + '">' + m + '</button>';
        }).join('');
      monthRow.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.mchip') : null;
        if (!btn) return;
        month = btn.getAttribute('data-m') || '';
        $all('.mchip', monthRow).forEach(function (b) {
          b.classList.toggle('is-on', b === btn);
        });
        apply();
      });
    }
    if (input) {
      input.addEventListener('input', function () {
        q = input.value.trim();
        apply();
      });
    }
    apply();
  }

  /* ---------- Blog 关键词搜索 ---------- */
  function initBlogSearch() {
    var input = $('#blog-search');
    if (!input) return;
    var cards = $all('.card-grid .card-link');
    var empty = $('#blog-search-empty');
    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var hit = !q || card.textContent.toLowerCase().indexOf(q) !== -1;
        card.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      if (empty) empty.hidden = q.length > 0 && shown === 0;
    }
    input.addEventListener('input', apply);
  }

  /* ---------- 移动端菜单 ---------- */
  function initNav() {
    var nav = $('#site-nav');
    var burger = $('#nav-burger');
    if (!nav || !burger) return;
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $all('.nav-link').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('nav-open'); });
    });
  }

  /* ---------- 代码复制按钮 ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function initCopyButtons() {
    var sel = 'pre.code, .article pre, .terminal pre[data-copyable]';
    $all(sel).forEach(function (pre) {
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.textContent = '复制';
      btn.addEventListener('click', function () {
        copyText(pre.innerText).then(function () {
          btn.textContent = '已复制 ✓';
          btn.classList.add('done');
          setTimeout(function () { btn.textContent = '复制'; btn.classList.remove('done'); }, 1600);
        }).catch(function () { btn.textContent = '复制失败'; });
      });
      pre.appendChild(btn);
    });
  }

  /* ---------- 滚动渐显 ---------- */
  function initReveal() {
    var els = $all('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('revealed');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 页脚年份 ---------- */
  function initYear() {
    $all('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- 安装命令操作系统切换 ---------- */
  function initOsSwitch() {
    var term = $('#install-term');
    if (!term) return;
    var cmds = {
      windows: { label: 'powershell', cmd: 'irm https://raw.githubusercontent.com/PurrPod/purrcat/main/install.ps1 | iex' },
      macos:   { label: 'terminal',   cmd: 'curl -fsSL https://raw.githubusercontent.com/PurrPod/purrcat/main/install.sh | bash' },
      linux:   { label: 'terminal',   cmd: 'curl -fsSL https://raw.githubusercontent.com/PurrPod/purrcat/main/install.sh | bash' }
    };
    var label = $('.term-label', term);
    var code = $('code', term);
    var btns = $all('.os-btn');

    function select(os) {
      var d = cmds[os];
      if (!d) return;
      btns.forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-os') === os); });
      label.textContent = d.label;
      code.textContent = d.cmd;
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () { select(b.getAttribute('data-os')); });
    });

    /* 按访客系统预选 */
    var ua = navigator.userAgent;
    select(/Windows/i.test(ua) ? 'windows' : /Mac/i.test(ua) ? 'macos' : 'linux');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initBlogSearch();
    initCopyButtons();
    initReveal();
    initYear();
    initOsSwitch();
    loadStars();
    renderHomeUpdates();
    initUpdatesPage();
  });
})();
