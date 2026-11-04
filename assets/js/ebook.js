/* Ebook behaviour: navigation, reading progress, active section tracking,
   sidebar search, and copy buttons for code blocks. */
(function () {
  "use strict";

  var calcBtn = document.getElementById("calcBtn");
  if (calcBtn) {
    calcBtn.addEventListener("click", function () {
      var target = document.getElementById("ipcalc");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------- chapter numbers ---------- */
  document.querySelectorAll(".chapter > h1").forEach(function (heading) {
    var match = heading.textContent.match(/^([A-D]|\d{1,2}B?)\s*·\s*/);
    if (!match) return;
    var chip = document.createElement("span");
    chip.className = "ch-num";
    chip.setAttribute("aria-hidden", "true");
    chip.textContent = match[1];
    heading.textContent = heading.textContent.slice(match[0].length);
    heading.insertBefore(chip, heading.firstChild);
    heading.setAttribute("data-chapter", match[1]);
  });

  /* ---------- responsive navigation ---------- */
  var sidebar = document.querySelector(".sidebar");
  var layout = document.querySelector(".layout");
  var scrim = document.querySelector(".scrim");
  var menuBtn = document.getElementById("menuBtn");
  var menuLabel = menuBtn ? menuBtn.querySelector(".menu-toggle-label") : null;
  var compactLayout = window.matchMedia("(max-width: 1080px)");

  function isCompactLayout() { return compactLayout.matches; }

  function setNavigationOpen(isOpen) {
    if (isCompactLayout()) {
      sidebar.classList.toggle("open", isOpen);
      layout.classList.remove("sidebar-collapsed");
      scrim.classList.toggle("show", isOpen);
    } else {
      sidebar.classList.remove("open");
      layout.classList.toggle("sidebar-collapsed", !isOpen);
      scrim.classList.remove("show");
    }
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    var navigationLabel = isOpen
      ? (isCompactLayout() ? "Close navigation" : "Hide navigation")
      : (isCompactLayout() ? "Open navigation" : "Show navigation");
    menuBtn.setAttribute("aria-label", navigationLabel);
    if (menuLabel) menuLabel.textContent = navigationLabel;
  }

  function closeNavigation() { setNavigationOpen(false); }

  if (menuBtn && sidebar && layout) {
    menuBtn.addEventListener("click", function () {
      setNavigationOpen(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    scrim.addEventListener("click", closeNavigation);
    compactLayout.addEventListener("change", function () {
      setNavigationOpen(!isCompactLayout());
      if (activeChapterId) setActive(activeChapterId);
    });
  }

  /* ---------- nav structure ---------- */
  var items = Array.from(document.querySelectorAll(".nav-item"));
  var navGroups = [
    { start: "ch-0", label: "Foundations" },
    { start: "ch-6", label: "Switching & routing" },
    { start: "ch-11", label: "Services & security" },
    { start: "ch-14", label: "Practice & career" },
    { start: "ch-18", label: "Quick reference" }
  ];

  items.forEach(function (item) {
    var group = navGroups.find(function (entry) { return entry.start === item.dataset.id; });
    if (group) {
      var heading = document.createElement("li");
      heading.className = "nav-group-label";
      var label = document.createElement("span");
      label.setAttribute("role", "heading");
      label.setAttribute("aria-level", "2");
      label.textContent = group.label;
      heading.appendChild(label);
      item.parentNode.insertBefore(heading, item);
    }
    var title = item.querySelector(".nav-title");
    var prefix = title.textContent.match(/^([A-D]|\d{2}B?)\s*·\s*/);
    if (prefix) {
      var indexLabel = document.createElement("span");
      indexLabel.className = "nav-index";
      indexLabel.setAttribute("aria-hidden", "true");
      indexLabel.textContent = prefix[1];
      title.textContent = title.textContent.slice(prefix[0].length);
      item.querySelector(".nav-link").insertBefore(indexLabel, title);
    }
  });

  document.querySelectorAll(".nav-link, .nav-sub a").forEach(function (a) {
    a.addEventListener("click", function () { if (isCompactLayout()) closeNavigation(); });
  });

  /* ---------- sidebar search ---------- */
  var search = document.getElementById("navSearch");
  if (search) {
    var groupLabels = Array.from(document.querySelectorAll(".nav-group-label"));

    function filterNavigation() {
      var query = search.value.trim().toLowerCase();
      items.forEach(function (item) {
        var text = item.textContent.toLowerCase();
        var match = !query || text.indexOf(query) !== -1;
        item.classList.toggle("is-hidden", !match);
        if (query && match) item.classList.add("active");
        else if (query) item.classList.remove("active");
      });
      groupLabels.forEach(function (label) {
        var node = label.nextElementSibling;
        var anyVisible = false;
        while (node && !node.classList.contains("nav-group-label")) {
          if (node.classList.contains("nav-item") && !node.classList.contains("is-hidden")) anyVisible = true;
          node = node.nextElementSibling;
        }
        label.style.display = anyVisible ? "" : "none";
      });
      if (!query && activeChapterId) setActive(activeChapterId);
    }

    var searchTimer = null;
    search.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(filterNavigation, 90);
    });
    search.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        search.value = "";
        filterNavigation();
        search.blur();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        event.preventDefault();
        if (isCompactLayout()) setNavigationOpen(true);
        search.focus();
        search.select();
      }
    });
  }

  /* ---------- active chapter / subsection ---------- */
  var sections = Array.from(document.querySelectorAll(".chapter"));
  var navItems = new Map();
  document.querySelectorAll(".nav-item").forEach(function (it) {
    navItems.set(it.dataset.id, it);
  });

  var activeChapterId = null;

  function setActive(id) {
    if (activeChapterId === id) return;
    activeChapterId = id;
    navItems.forEach(function (it) {
      it.classList.toggle("active", it.dataset.id === id);
    });
  }

  function updateActiveChapter() {
    var marker = 150;
    var activeSection = sections[0];
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= marker) activeSection = section;
    });
    if (activeSection) setActive(activeSection.id);
  }

  if (menuBtn && sidebar && layout) setNavigationOpen(!isCompactLayout());
  updateActiveChapter();

  var subsectionLinks = new Map(Array.from(document.querySelectorAll(".nav-sub a"), function (link) {
    return [link.hash.slice(1), link];
  }));

  if ("IntersectionObserver" in window) {
    var subsectionObserver = new IntersectionObserver(function (entries) {
      var currentEntry = entries.filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; })[0];
      if (!currentEntry) return;
      document.querySelectorAll(".nav-sub a.current").forEach(function (link) {
        link.classList.remove("current");
        link.removeAttribute("aria-current");
      });
      var link = subsectionLinks.get(currentEntry.target.id);
      if (link) {
        link.classList.add("current");
        link.setAttribute("aria-current", "location");
      }
    }, { rootMargin: "-88px 0px -70% 0px", threshold: 0 });
    document.querySelectorAll(".chapter h2[id], .chapter h3[id]").forEach(function (heading) {
      if (subsectionLinks.has(heading.id)) subsectionObserver.observe(heading);
    });
  }

  /* ---------- progress + back to top ---------- */
  var progress = document.getElementById("progress");
  var toTop = document.getElementById("toTop");
  var readingProgressValue = document.getElementById("readingProgressValue");
  var readingProgressValueBar = document.getElementById("readingProgressValueBar");
  var readingProgressTrack = document.getElementById("readingProgressTrack");
  var lastPercent = -1;

  function onScroll() {
    var h = document.scrollingElement || document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var percent = max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0;
    if (percent !== lastPercent) {
      lastPercent = percent;
      if (progress) progress.style.width = percent + "%";
      if (readingProgressValue) readingProgressValue.textContent = percent + "%";
      if (readingProgressValueBar) readingProgressValueBar.style.width = percent + "%";
      if (readingProgressTrack) readingProgressTrack.setAttribute("aria-valuenow", String(percent));
    }
    if (toTop) toTop.classList.toggle("show", h.scrollTop > 600);
    updateActiveChapter();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isCompactLayout()) closeNavigation();
  });

  /* ---------- copy buttons on code blocks ---------- */
  document.querySelectorAll(".chapter pre").forEach(function (pre) {
    var code = pre.querySelector("code");
    if (!code) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-code";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.addEventListener("click", function () {
      var text = code.innerText;
      var done = function () {
        btn.textContent = "Copied";
        btn.classList.add("done");
        setTimeout(function () {
          btn.textContent = "Copy";
          btn.classList.remove("done");
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        try { document.execCommand("copy"); done(); } catch (err) { /* ignore */ }
        area.remove();
      }
    });
    pre.appendChild(btn);
  });

  /* ---------- remember scroll position ---------- */
  var POS_KEY = "nfg-reading-position";
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var storedPos = null;
  try { storedPos = Number(localStorage.getItem(POS_KEY)); } catch (err) { storedPos = null; }
  if (!window.location.hash && storedPos > 0) {
    window.scrollTo(0, storedPos);
  }
  var saveTimer = null;
  window.addEventListener("scroll", function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(POS_KEY, String(window.scrollY));
      } catch (err) { /* ignore */ }
    }, 250);
  }, { passive: true });
})();

/* ---------- chapter check quizzes ---------- */
(function () {
  "use strict";

  var quizzes = Array.prototype.slice.call(document.querySelectorAll(".quiz[data-quiz]"));

  quizzes.forEach(function (quiz) {
    var questions = Array.prototype.slice.call(quiz.querySelectorAll(".quiz-q"));
    var score = quiz.querySelector(".quiz-score");
    var reset = quiz.querySelector(".quiz-reset");
    var total = questions.length;

    function updateScore() {
      var answered = 0;
      var correct = 0;
      questions.forEach(function (q) {
        if (!q.classList.contains("answered")) return;
        answered += 1;
        var chosen = q.querySelector(".quiz-opt.chosen");
        if (chosen && chosen.dataset.correct === "true") correct += 1;
      });
      if (!score) return;
      if (answered === total) {
        score.textContent = "Score: " + correct + " / " + total + (correct === total ? " - perfect." : "");
      } else {
        score.textContent = answered + " of " + total + " answered - " + correct + " correct";
      }
    }

    quiz.addEventListener("click", function (event) {
      var opt = event.target.closest(".quiz-opt");
      if (!opt || !quiz.contains(opt)) return;
      var q = opt.closest(".quiz-q");
      if (!q || q.classList.contains("answered")) return;

      var isCorrect = opt.dataset.correct === "true";
      q.classList.add("answered");
      opt.classList.add(isCorrect ? "correct" : "wrong", "chosen");
      if (!isCorrect) {
        var right = q.querySelector('.quiz-opt[data-correct="true"]');
        if (right) right.classList.add("correct");
      }
      Array.prototype.forEach.call(q.querySelectorAll(".quiz-opt"), function (button) {
        button.disabled = true;
      });
      var feedback = q.querySelector(".quiz-feedback");
      if (feedback) feedback.textContent = (isCorrect ? "Correct. " : "Not quite. ") + (q.dataset.why || "");
      updateScore();
    });

    if (reset) {
      reset.addEventListener("click", function () {
        questions.forEach(function (q) {
          q.classList.remove("answered");
          Array.prototype.forEach.call(q.querySelectorAll(".quiz-opt"), function (button) {
            button.disabled = false;
            button.classList.remove("correct", "wrong", "chosen");
          });
          var feedback = q.querySelector(".quiz-feedback");
          if (feedback) feedback.textContent = "";
        });
        updateScore();
        var first = quiz.querySelector(".quiz-opt");
        if (first) first.focus();
      });
    }

    updateScore();
  });
})();
