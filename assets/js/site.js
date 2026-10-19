/* 站点交互：Before/After 拖拽滑杆、移动端导航、代码复制、滚动进场 */

(function () {
  /* ---------- Before / After 对比滑杆 ---------- */

  document.querySelectorAll("[data-hero-proof]").forEach(function (root) {
    var panel = root.querySelector(".hero-proof-panel");
    var stage = root.querySelector(".hero-proof-stage");
    var drag = root.querySelector(".hero-proof-drag");
    var range = root.querySelector("[data-proof-range]");
    var card = root.querySelector(".hero-proof-layer--before article");
    if (!stage) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var minPct = 0;
    var maxPct = 100;
    var peeking = false;

    // 把滑杆的可动范围收紧到对比卡片的水平区间，小黄条滑不出卡片
    function measure() {
      if (!card) return;
      var stageRect = stage.getBoundingClientRect();
      var cardRect = card.getBoundingClientRect();
      if (!stageRect.width || !cardRect.width) return;
      minPct = ((cardRect.left - stageRect.left) / stageRect.width) * 100;
      maxPct = ((cardRect.right - stageRect.left) / stageRect.width) * 100;
      if (range) {
        range.step = "any";
        range.min = minPct.toFixed(1);
        range.max = maxPct.toFixed(1);
      }
      [range, drag].forEach(function (el) {
        if (!el) return;
        el.style.left = minPct + "%";
        el.style.width = maxPct - minPct + "%";
      });
    }

    function setPosition(pct) {
      pct = Math.max(minPct, Math.min(maxPct, pct));
      root.style.setProperty("--proof-position", pct + "%");
      if (range) range.value = String(pct);
    }

    // 用户一动手就停掉自动扫描，把控制权交回去
    function stopPeek() {
      if (!peeking || !panel) return;
      peeking = false;
      panel.classList.remove("is-peeking");
    }

    function positionFromEvent(event) {
      var rect = stage.getBoundingClientRect();
      return ((event.clientX - rect.left) / rect.width) * 100;
    }

    measure();
    setPosition(parseFloat(range && range.value) || 71);

    if (panel && !reduced) {
      peeking = true;
      panel.classList.add("is-peeking");
    }

    if (range) {
      range.addEventListener("input", function () {
        stopPeek();
        setPosition(parseFloat(range.value));
      });
    }

    window.addEventListener("resize", measure, { passive: true });

    if (!drag || !panel) return;

    var dragging = false;

    drag.addEventListener("pointerdown", function (event) {
      stopPeek();
      dragging = true;
      panel.classList.add("is-dragging");
      if (range) range.focus({ preventScroll: true });
      if (drag.setPointerCapture) drag.setPointerCapture(event.pointerId);
      setPosition(positionFromEvent(event));
      event.preventDefault();
    });

    drag.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      setPosition(positionFromEvent(event));
    });

    function stop() {
      dragging = false;
      panel.classList.remove("is-dragging");
    }

    drag.addEventListener("pointerup", stop);
    drag.addEventListener("pointercancel", stop);
  });

  /* ---------- 移动端导航 ---------- */

  var header = document.querySelector("[data-site-header]");
  var menu = document.querySelector("[data-site-header-menu]");

  if (header && menu) {
    function setOpen(open) {
      header.setAttribute("data-nav-open", String(open));
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    }

    menu.addEventListener("click", function () {
      setOpen(header.getAttribute("data-nav-open") !== "true");
    });

    header.querySelectorAll(".site-header-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
  }

  /* ---------- 安装流程：方法切换 / 复制命令 / 下一步 ---------- */

  document.querySelectorAll("[data-install-tabs]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".downloads-tab"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-method-panel]"));
    if (!tabs.length) return;

    function select(method) {
      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-method") === method;
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");
        tab.classList.toggle("is-active", active);
      });
      panels.forEach(function (panel) {
        if (panel.getAttribute("data-method-panel") === method) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
        }
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab.getAttribute("data-method"));
      });
    });

    var initial = root.querySelector(".downloads-tab[aria-selected='true']") || tabs[0];
    select(initial.getAttribute("data-method"));
  });

  document.querySelectorAll("[data-copy-command]").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy-command");

      // 先同步给出反馈，再异步写剪贴板
      button.classList.add("copied");
      window.clearTimeout(button._resetTimer);
      button._resetTimer = window.setTimeout(function () {
        button.classList.remove("copied");
      }, 1600);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
    });
  });

  document.querySelectorAll("[data-install-next]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.querySelector('[data-install-step="' + button.getAttribute("data-install-next") + '"]');
      if (!target) return;
      target.open = true;
      var heading = target.querySelector(".downloads-flow-heading");
      if (!heading) return;
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  });

  /* ---------- 首页演示：before/now 对比 + 三场景插件工作台 ---------- */

  var DEMO_SCENARIOS = [
    {
      id: "video",
      label: "video",
      prompt:
        "Help me cut the demo video: grab the three clips in ~/footage/demo, drop the boring middle, caption it from the audio, pick a music bed that fits the pacing, keep it under 60 seconds, export 9:16 for shorts and 16:9 for the site, use the $ffmpeg skill and the $caption skill, follow the $brand-edit workflow my team wrote, and pull the brand colours from the asset MCP server. Last time you cut the ending too early.",
      plugin: "video-studio",
      loop: "Video create",
      // 面板上的选项组预设：播放时会一组组自动挑好
      picks: [["aspect", "9:16"], ["captions", "on"], ["music", "lo-fi"]],
      action: ["action", "render · 3 shots"]
    },
    {
      id: "learning",
      label: "learning",
      prompt:
        "Teach me backprop one more time — in Chinese, first-year undergrad level: chain rule first, then a tiny numeric example, then one diagram, then ten exam-style questions with answers, each linked back to my lecture notes, skip the second-order stuff, use the $explain skill and the $socratic workflow, and remember that I keep failing the gradient quiz.",
      plugin: "learn-workbench",
      loop: "Learn",
      picks: [["level", "year 1"], ["language", "中文"], ["quiz", "10 qs"]],
      action: ["action", "start lesson · week 4"]
    },
    {
      id: "quant",
      label: "quant",
      prompt:
        "Screen the CSI 300 for me: pull five years of daily bars from the Tushare MCP, winsorise at 1%, drop ST names, rank by 20-day reversal, backtest a monthly rebalance at 0.15% cost, report turnover and max drawdown, write the code with the $backtest workflow and the $factor-library skill, and reuse the universe rules from last time.",
      plugin: "quant-lab",
      loop: "Quant",
      picks: [["strategy", "reversal 20d"], ["rebalance", "monthly"], ["cost", "0.15%"]],
      action: ["action", "screen · CSI 300"]
    }
  ];

  document.querySelectorAll("[data-demo]").forEach(function (root) {
    var typedLong = root.querySelector('[data-demo-typed="long"]');
    var chatLong = root.querySelector('[data-demo-chat="long"]');
    var beforeEcho = root.querySelector("[data-demo-echo]");
    var beforeSent = root.querySelector("[data-demo-sent]");
    var beforeInput = root.querySelector("[data-demo-input]");
    var beforeSend = root.querySelector("[data-demo-send]");
    var compareRoot = root.querySelector("[data-demo-compare]");
    var workbench = root.querySelector("[data-demo-workbench]");
    var compareTabs = Array.prototype.slice.call(root.querySelectorAll("[data-demo-view]"));
    var switchLabel = root.querySelector("[data-demo-switch-label]");
    var prevBtn = root.querySelector("[data-demo-prev]");
    var nextBtn = root.querySelector("[data-demo-next]");
    var mountRoot = root.querySelector("[data-demo-mount]");
    var views = Array.prototype.slice.call(root.querySelectorAll("[data-demo-mount-item]"));
    var slotName = root.querySelector("[data-demo-slot]");
    var cursor = root.querySelector("[data-demo-cursor]");
    var msgs = root.querySelector("[data-demo-msgs]");
    var thread = root.querySelector("[data-demo-thread]");
    var modeBtn = root.querySelector("[data-demo-mode-btn]");
    var modeLabel = root.querySelector("[data-demo-mode-label]");
    var modeMenu = root.querySelector("[data-demo-mode-menu]");
    var loopName = root.querySelector("[data-demo-loop-name]");
    var optGroups = Array.prototype.slice.call(root.querySelectorAll("[data-demo-opt-group]"));
    if (!typedLong || !switchLabel) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var index = 0;
    var timers = [];
    var running = false;

    // 不同 agentloop 注入的 skill / 上下文不一样，同一次点击补发的信息也就不一样
    var LOOPS = [
      { id: "Default", inject: [["skills", "none"], ["context", "repo only"]] },
      {
        id: "Video create",
        inject: [
          ["skills", "ffmpeg-cut · auto-caption"],
          ["workflow", "brand-edit v3"],
          ["render", "review before export"]
        ]
      },
      {
        id: "Learn",
        inject: [
          ["skills", "explain · socratic"],
          ["workflow", "socratic v2"],
          ["level", "year 1 undergrad"],
          ["memory", "gradient quiz keeps failing"]
        ]
      },
      {
        id: "Quant",
        inject: [
          ["skills", "factor-library · backtest"],
          ["workflow", "backtest-monthly"],
          ["universe", "CSI 300 · no ST"],
          ["cost", "monthly · 0.15%"]
        ]
      }
    ];

    var REPLY = "All requirements received — starting now.";
    var current = LOOPS[0].id;

    function later(fn, ms) {
      timers.push(window.setTimeout(fn, ms));
    }

    function stopTimers() {
      timers.forEach(window.clearTimeout);
      timers = [];
    }

    var SKILL_TOKEN = /\$[a-z0-9][a-z0-9-]*/gi;

    // 简报里 $开头的 skill / workflow 名，用紫色高亮笔框出来
    function promptHtml(text) {
      var escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return escaped.replace(SKILL_TOKEN, function (token) {
        return '<span class="demo-skill">' + token + "</span>";
      });
    }

    var beforeTyping = false;

    // Before 卡：左边是自己把简报整段打进去，所以文本先在输入条里逐字打出来，
    // 打完了才“发送”，落成会话里的那条用户气泡
    function beforeReset() {
      beforeTyping = false;
      if (beforeEcho) beforeEcho.innerHTML = "";
      if (beforeInput) beforeInput.classList.remove("is-typing");
      if (beforeSend) beforeSend.classList.remove("is-press");
      if (typedLong) typedLong.innerHTML = "";
      if (beforeSent) beforeSent.hidden = true;
    }

    // 静态终态：输入条空着，简报已经作为气泡“发”出去了
    function beforeFill(text) {
      beforeTyping = false;
      if (beforeEcho) beforeEcho.innerHTML = "";
      if (beforeInput) beforeInput.classList.remove("is-typing");
      if (beforeSend) beforeSend.classList.remove("is-press");
      if (typedLong) typedLong.innerHTML = text ? promptHtml(text) : "";
      if (beforeSent) beforeSent.hidden = !text;
      var box = chatLong && chatLong.querySelector(".demo-thread");
      if (box) box.scrollTop = box.scrollHeight;
    }

    function typeBefore(text, onDone) {
      beforeReset();
      if (!text || !beforeEcho || reduced) {
        beforeFill(text);
        if (onDone) onDone();
        return;
      }
      beforeTyping = true;
      if (beforeInput) beforeInput.classList.add("is-typing");
      var chars = Array.from(text);
      var n = 0;

      function step() {
        if (!beforeTyping) return;
        var ch = chars[n];
        n += 1;
        beforeEcho.innerHTML = promptHtml(chars.slice(0, n).join(""));
        if (n >= chars.length) {
          // 打完最后一个字，停顿一下让发送键亮起来，然后才把气泡发出去
          beforeTyping = false;
          if (beforeInput) beforeInput.classList.remove("is-typing");
          later(function () {
            if (beforeSend) beforeSend.classList.add("is-press");
            later(function () {
              beforeFill(text);
              if (onDone) onDone();
            }, 280);
          }, 340);
          return;
        }
        var delay = ch === " " ? 42 : 13;
        if (/[.,;:!?]/.test(ch)) delay += 120;
        later(step, delay);
      }

      later(step, 260);
    }

    // 面板容器：只显示当前场景对应的那块插件界面
    function mountView(id) {
      if (!mountRoot) return;
      mountRoot.setAttribute("data-mounted", String(!!id));
      views.forEach(function (item) {
        item.hidden = item.getAttribute("data-demo-mount-item") !== id;
      });
      if (slotName) slotName.textContent = id || "none";
      if (msgs) msgs.innerHTML = "";
    }

    function runFor(id) {
      for (var n = 0; n < views.length; n += 1) {
        if (views[n].getAttribute("data-demo-mount-item") === id) {
          return views[n].querySelector("[data-demo-run]");
        }
      }
      return null;
    }

    function scrollToEnd() {
      if (thread) thread.scrollTop = thread.scrollHeight;
    }

    function pushAuto(key, val) {
      if (!msgs) return;
      var li = document.createElement("li");
      li.className = "demo-bubble demo-bubble--user demo-bubble--auto";
      li.innerHTML =
        '<b class="demo-auto-tag">Auto</b>' +
        '<span class="demo-auto-key">' + key + "</span>" +
        '<span class="demo-auto-val">' + val + "</span>";
      msgs.appendChild(li);
      requestAnimationFrame(function () {
        li.classList.add("is-in");
        scrollToEnd();
      });
    }

    // PurrCat 收到需求之后的回复
    function pushReply(text) {
      if (!msgs) return;
      var li = document.createElement("li");
      li.className = "demo-bubble demo-bubble--agent";
      li.textContent = text;
      msgs.appendChild(li);
      requestAnimationFrame(function () {
        li.classList.add("is-in");
        scrollToEnd();
      });
    }

    function emit(rows) {
      rows.forEach(function (row, i) {
        later(function () {
          pushAuto(row[0], row[1]);
        }, i * 150);
      });
      return 150 * rows.length;
    }

    // 插件里的选项组：组内单选，挑一下就等于把这条要求补发给 agent
    function findOpt(key, val) {
      for (var n = 0; n < optGroups.length; n += 1) {
        if (optGroups[n].getAttribute("data-demo-opt-key") !== key) continue;
        var items = optGroups[n].querySelectorAll("[data-demo-opt]");
        for (var k = 0; k < items.length; k += 1) {
          if (items[k].textContent.trim() === val) return items[k];
        }
      }
      return null;
    }

    // 手动挑选项只是选中，不发送；等按 Start 时连同其它选中项一起发
    function pickOpt(btn) {
      var group = btn.closest("[data-demo-opt-group]");
      if (!group) return;
      Array.prototype.forEach.call(group.querySelectorAll("[data-demo-opt]"), function (item) {
        item.setAttribute("aria-pressed", String(item === btn));
      });
    }

    // 当前面板上选中的选项（组内单选，按插件里的顺序排）
    function pickedRows() {
      return Array.prototype.map.call(
        root.querySelectorAll('[data-demo-opt][aria-pressed="true"]'),
        function (btn) {
          var group = btn.closest("[data-demo-opt-group]");
          return [group ? group.getAttribute("data-demo-opt-key") : "option", btn.textContent.trim()];
        }
      );
    }

    // 按一次 Start / Run 发出去的一整批：选中的选项 + 这次的动作 + agentloop 注入的东西
    function requestRows(i) {
      return pickedRows().concat([DEMO_SCENARIOS[i].action], loopById(current).inject);
    }

    // 静态终态：直接把预设选项标成选中，不发送
    function applyPresets(picks) {
      picks.forEach(function (pair) {
        var btn = findOpt(pair[0], pair[1]);
        if (btn) pickOpt(btn);
      });
    }

    // 自动播放：一组一组慢慢选中，选完再交给假光标去按 Start
    function stepPresets(picks, onDone) {
      var wait = 0;
      picks.forEach(function (pair, i) {
        var ms = i * 380;
        wait = ms + 300;
        later(function () {
          var btn = findOpt(pair[0], pair[1]);
          if (btn) pickOpt(btn);
        }, ms);
      });
      later(onDone, wait);
    }

    function loopById(id) {
      for (var n = 0; n < LOOPS.length; n += 1) {
        if (LOOPS[n].id === id) return LOOPS[n];
      }
      return LOOPS[0];
    }

    function paintLoop() {
      if (modeLabel) modeLabel.textContent = current;
      if (loopName) loopName.textContent = current;
      if (!modeMenu) return;
      Array.prototype.forEach.call(modeMenu.children, function (item) {
        var on = item.getAttribute("data-loop") === current;
        item.classList.toggle("sel", on);
        item.setAttribute("aria-checked", String(on));
      });
    }

    function setLoop(id, echo) {
      if (current === id && !echo) return;
      current = id;
      paintLoop();
      if (echo) pushAuto("loop", id.toLowerCase());
    }

    // 假光标：从面板右下角滑到按钮上按一下
    function cursorJump(x, y) {
      if (!cursor) return;
      cursor.classList.add("is-jump");
      cursor.classList.remove("is-in", "is-click");
      cursor.style.setProperty("--cx", x + "px");
      cursor.style.setProperty("--cy", y + "px");
      void cursor.offsetWidth;
      cursor.classList.remove("is-jump");
    }

    function cursorTo(el) {
      if (!cursor || !el || !cursor.parentElement) return;
      var box = cursor.parentElement.getBoundingClientRect();
      var rect = el.getBoundingClientRect();
      cursor.style.setProperty("--cx", rect.left - box.left + rect.width / 2 - 2 + "px");
      cursor.style.setProperty("--cy", rect.top - box.top + rect.height / 2 - 2 + "px");
    }

    function pressRun(el, onDone) {
      if (!cursor || reduced || !el) {
        onDone();
        return;
      }
      var box = cursor.parentElement.getBoundingClientRect();
      cursorJump(box.width * 0.86 - 12, box.height * 0.82 - 12);
      later(function () {
        cursor.classList.add("is-in");
        later(function () {
          cursorTo(el);
          later(function () {
            cursor.classList.add("is-click");
            el.classList.add("is-press");
            later(function () {
              cursor.classList.remove("is-click");
              el.classList.remove("is-press");
              onDone();
            }, 320);
          }, 800);
        }, 140);
      }, 260);
    }

    // 把滑动块挪到当前选中的那颗键下面，宽度也照它量
    function syncCompareThumb() {
      var strip = compareTabs.length ? compareTabs[0].parentElement : null;
      var thumb = strip && strip.querySelector(".ks-thumb");
      if (!thumb) return;
      var active = null;
      compareTabs.forEach(function (tab) {
        if (tab.getAttribute("aria-pressed") === "true") active = tab;
      });
      if (!active) {
        thumb.style.width = "0px";
        return;
      }
      var stripRect = strip.getBoundingClientRect();
      var keyRect = active.getBoundingClientRect();
      // thumb 的 left:0 落在 padding 边上，所以要再减掉那道 1px 边框
      thumb.style.width = keyRect.width + "px";
      thumb.style.transform = "translateX(" + (keyRect.left - stripRect.left - (strip.clientLeft || 0)) + "px)";
    }

    // Before 显示那张手打长简报的卡；Now 就是下面的工作台，切到哪个就显示哪个
    function setCompare(which) {
      if (compareRoot) compareRoot.hidden = which !== "before";
      if (workbench) workbench.hidden = which !== "now";
      compareTabs.forEach(function (tab) {
        tab.setAttribute("aria-pressed", String(tab.getAttribute("data-demo-view") === which));
      });
      syncCompareThumb();
    }

    function resetStage() {
      beforeReset();
      if (msgs) msgs.innerHTML = "";
      if (cursor) cursor.classList.remove("is-in", "is-click");
      Array.prototype.forEach.call(root.querySelectorAll("[data-demo-opt]"), function (item) {
        item.setAttribute("aria-pressed", "false");
      });
    }

    function applyScenario(i) {
      var s = DEMO_SCENARIOS[i];
      if (switchLabel) switchLabel.textContent = s.label;
      beforeReset();
      // 选中的场景就是挂进面板容器的那块插件，agentloop 也跟着切
      mountView(s.plugin);
      setLoop(s.loop);
    }

    // 静态终态：JS 未启动或用户偏好减少动效时展示的样子
    function renderFinal(i) {
      applyScenario(i);
      var s = DEMO_SCENARIOS[i];
      setCompare("now");
      beforeFill(s.prompt);
      applyPresets(s.picks);
      requestRows(i).forEach(function (row) {
        pushAuto(row[0], row[1]);
      });
      pushReply(REPLY);
    }

    // 一个场景的完整链路：
    // 选项组替你挑好需求 → 假光标按下 Start → 补发信息 → PurrCat 回复 → 下一个场景
    function play(i) {
      if (!running) return;
      stopTimers();
      resetStage();
      applyScenario(i);
      if (reduced) {
        renderFinal(i);
        return;
      }

      var s = DEMO_SCENARIOS[i];

      function next() {
        index = (i + 1) % DEMO_SCENARIOS.length;
        play(index);
      }

      function reply() {
        pushReply(REPLY);
        later(next, 4200);
      }

      function pressStart() {
        pressRun(runFor(s.plugin), function () {
          // 按下的这一刻，才把选中的选项连同动作、loop 注入项一起发出去
          var wait = emit(requestRows(i));
          later(reply, wait + 420);
        });
      }

      stepPresets(s.picks, function () {
        later(pressStart, 240);
      });
    }

    // 左右箭头循环切场景：video → learning → quant → 回到 video
    function stepScenario(dir) {
      var total = DEMO_SCENARIOS.length;
      index = (index + dir + total) % total;
      // 正在看 Before：换场景就是换那段要手打的简报，重新打一遍，不切走
      if (compareRoot && !compareRoot.hidden) {
        if (running) {
          running = false;
        }
        beforeTyping = false;
        stopTimers();
        applyScenario(index);
        typeBefore(DEMO_SCENARIOS[index].prompt);
        return;
      }
      if (!running) {
        resetStage();
        renderFinal(index);
        return;
      }
      play(index);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        stepScenario(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        stepScenario(1);
      });
    }

    // Before / Now 手动切换：一动手就先把自动播放停下来。
    // 切到 Before 时，把整段简报用打字机效果慢慢打出来，打完再“发送”出去。
    compareTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var which = tab.getAttribute("data-demo-view");
        if (running) {
          running = false;
          stopTimers();
        }
        setCompare(which);
        if (which === "before") {
          beforeTyping = false;
          stopTimers();
          typeBefore(DEMO_SCENARIOS[index].prompt);
        } else {
          beforeTyping = false;
          stopTimers();
        }
      });
    });

    // 字体加载完和窗口尺寸变化都会改变键的宽度，重新量一次滑动块
    window.addEventListener("resize", syncCompareThumb);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncCompareThumb);
    }

    // 手动挑选项：组内单选，不发消息，等 Start 再一起发
    Array.prototype.forEach.call(root.querySelectorAll("[data-demo-opt]"), function (btn) {
      btn.addEventListener("click", function () {
        pickOpt(btn);
      });
    });

    // 也可以自己点插件界面里的 Start / Run
    views.forEach(function (item) {
      var run = item.querySelector("[data-demo-run]");
      if (!run) return;
      run.addEventListener("click", function () {
        var wait = emit(requestRows(index));
        later(function () {
          pushReply(REPLY);
        }, wait + 420);
      });
    });

    function closeMenu() {
      if (!modeMenu || !modeBtn) return;
      modeMenu.classList.remove("open");
      modeBtn.setAttribute("aria-expanded", "false");
    }

    paintLoop();

    if (modeBtn && modeMenu) {
      LOOPS.forEach(function (loop) {
        var item = document.createElement("button");
        item.type = "button";
        item.setAttribute("role", "menuitemradio");
        item.setAttribute("data-loop", loop.id);
        item.textContent = loop.id;
        item.addEventListener("click", function () {
          setLoop(loop.id, true);
          closeMenu();
        });
        modeMenu.appendChild(item);
      });

      paintLoop();

      modeBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        var open = !modeMenu.classList.contains("open");
        modeMenu.classList.toggle("open", open);
        modeBtn.setAttribute("aria-expanded", String(open));
      });

      document.addEventListener("click", closeMenu);
      modeMenu.addEventListener("click", function (event) {
        event.stopPropagation();
      });
    }

    renderFinal(0);

    var canObserve = !reduced && "IntersectionObserver" in window;

    if (!canObserve) {
      running = true;
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (running) return;
            running = true;
            play(index);
            return;
          }
          if (!running) return;
          running = false;
          stopTimers();
          resetStage();
          renderFinal(index);
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(root);
  });

  /* ---------- 越用越聪明：迭代进度条进场 ---------- */

  document.querySelectorAll(".evolve-stage").forEach(function (stage) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      stage.classList.add("is-in");
      return;
    }

    var fillObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          fillObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );

    fillObserver.observe(stage);
  });

  /* ---------- 滚动进场 ---------- */

  var reveals = document.querySelectorAll(".reveal");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- 英雄区粒子扰动：悬浮靠近被推开，离开后回弹归位 ---------- */

  document.querySelectorAll(".hero").forEach(function (hero) {
    var canvas = hero.querySelector(".hero-particles");
    if (!canvas || !canvas.getContext) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var mouse = { x: -9999, y: -9999 };
    var rafId = 0;
    var playing = false;

    /* 金箔 kinpaku 的近似 RGB，与站点金色强调保持一致 */
    var GOLD = "rgb(216, 164, 62)";
    var REPEL_RADIUS = 120; // 鼠标影响半径
    var REPEL_FORCE = 2.6; // 推开力度
    var FRICTION = 0.9; // 速度衰减
    var SPRING = 0.02; // 回弹刚度

    function seed(w, h) {
      var count = Math.max(80, Math.min(400, Math.round((w * h) / 7000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        var x = Math.random() * w;
        var y = Math.random() * h;
        particles.push({
          hx: x, hy: y, // 归位点
          x: x, y: y,
          vx: 0, vy: 0,
          r: 0.8 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
          amp: 0.1 + Math.random() * 0.25 // 闲置时的漂浮幅度
        });
      }
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      seed(rect.width, rect.height);
    }

    function tick(now) {
      if (!playing) return;
      var t = now * 0.001;
      var w = canvas.width / dpr;
      var h = canvas.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = GOLD;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // 鼠标斥力：越近推得越狠
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.01) {
          var push = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
          p.vx += (dx / dist) * push;
          p.vy += (dy / dist) * push;
        }

        // 弹簧归位 + 摩擦
        p.vx += (p.hx - p.x) * SPRING;
        p.vy += (p.hy - p.y) * SPRING;
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        // 闲置漂浮：绕归位点做缓慢正弦摆动
        var wobbleX = Math.cos(t * 0.6 + p.phase) * p.amp;
        var wobbleY = Math.sin(t * 0.5 + p.phase * 1.7) * p.amp;

        p.x += p.vx + wobbleX;
        p.y += p.vy + wobbleY;

        ctx.globalAlpha = 0.18 + (p.r / 2.2) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    }

    function play() {
      if (playing) return;
      playing = true;
      rafId = requestAnimationFrame(tick);
    }

    function pause() {
      playing = false;
      cancelAnimationFrame(rafId);
    }

    hero.addEventListener("pointermove", function (event) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    });

    hero.addEventListener("pointerleave", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    var resizePending = 0;
    window.addEventListener(
      "resize",
      function () {
        cancelAnimationFrame(resizePending);
        resizePending = requestAnimationFrame(resize);
      },
      { passive: true }
    );

    // 视口外或标签页隐藏时停表，省电
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) play();
            else pause();
          });
        },
        { threshold: 0 }
      ).observe(hero);
    } else {
      play();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
      else play();
    });

    resize();
  });
})();
