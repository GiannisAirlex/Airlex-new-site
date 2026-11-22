(function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Mobile: tap category link toggles its submenu instead of navigating away
  var hasMega = document.querySelector('.has-mega');
  if (hasMega) {
    var megaLink = hasMega.querySelector(':scope > a');
    megaLink.addEventListener('click', function (e) {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        hasMega.classList.toggle('open');
      }
    });
  }

  // Close mobile menu when a nav link is followed
  if (nav) {
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 860 && !(hasMega && link.parentElement === hasMega)) {
          nav.classList.remove('open');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // Animated count-up for stat numbers, once the stats band becomes visible
  var counters = document.querySelectorAll('.stat-count');
  var statsBand = document.querySelector('.stats-band');
  if (counters.length) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var triggered = false;

    var runCount = function (el) {
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      if (reduceMotion) {
        el.textContent = target;
        return;
      }
      var duration = 1400;
      var start = null;
      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };

    var startAll = function () {
      if (triggered) return;
      triggered = true;
      counters.forEach(runCount);
    };

    if ('IntersectionObserver' in window && statsBand) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startAll();
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(statsBand);
    } else {
      startAll();
    }

    // Safety net: if the observer never fires for any reason, start anyway.
    setTimeout(startAll, 2500);
  }
})();

/* Contact form: never fail silently.
   Set data-mailto="name@domain" on #contactForm to open the visitor's
   email app with the message pre-filled; until then, point to the phone. */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var status = document.getElementById('formStatus');
  function show(html, ok) {
    status.innerHTML = html;
    status.className = 'form-status ' + (ok ? 'is-ok' : 'is-info');
    status.hidden = false;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var to = (form.getAttribute('data-mailto') || '').trim();
    var v = function (id) { return (document.getElementById(id).value || '').trim(); };
    if (to) {
      var subject = 'Αίτημα από την ιστοσελίδα — ' + v('fullname');
      var body = 'Ονοματεπώνυμο: ' + v('fullname') + '\nΤηλέφωνο: ' + v('phone') +
                 '\nEmail: ' + v('email') + '\n\n' + v('message');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      show('Ανοίγει η εφαρμογή email σας με το μήνυμα έτοιμο — πατήστε «Αποστολή» για να το στείλετε.', true);
    } else {
      show('Η αποστολή μέσω φόρμας δεν είναι ακόμη διαθέσιμη. Για άμεση εξυπηρέτηση καλέστε μας στο <a href="tel:+302109650850">210 9650850</a>.', false);
    }
  });
})();

/* ============================================================
   Motion & mobile polish
   ============================================================ */
(function () {
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('siteHeader');
  var nav = document.getElementById('mainNav');

  // --- Stagger index for mobile menu items ---
  if (nav) {
    nav.querySelectorAll(':scope > ul > li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  }

  // --- Scroll reveal: cards and section heads fade/rise in as they enter the screen ---
  var revealSelector = [
    '.section-head', '.subcat-head', '.cat-card', '.series-card', '.news-card', '.value-card',
    '.variant-row', '.stat-item', '.why-copy', '.why-visual', '.about-visual', '.about-copy',
    '.infra-inner', '.cta-inner', '.contact-info-card', '.contact-form', '.map-visual',
    '.series-intro-visual', '.series-intro-copy', '.subcat-section > .container > .btn', '.iso-band img'
  ].join(',');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var targets = Array.prototype.slice.call(document.querySelectorAll(revealSelector));
    // Skip anything already on screen at load, so nothing above the fold flickers
    var vh = window.innerHeight;
    targets = targets.filter(function (el) { return el.getBoundingClientRect().top > vh * 0.92; });

    // Siblings in the same grid get a small stagger
    targets.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return targets.indexOf(c) !== -1; });
      el.style.setProperty('--i', siblings.indexOf(el) % 4);
      el.classList.add('reveal');
    });
    doc.classList.add('motion-ready');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // Hand the element back to its normal hover styles once it has arrived
        var done = function (e) {
          if (e && e.target !== el) return;
          el.classList.remove('reveal', 'is-visible');
          el.style.removeProperty('--i');
          el.removeEventListener('transitionend', done);
        };
        el.addEventListener('transitionend', done);
        setTimeout(done, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // --- Mobile quick-action bar: Call + Request a quote ---
  var bar = null;
  if (!/contact\.html$/.test(location.pathname)) {
    bar = document.createElement('div');
    bar.className = 'mobile-cta';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Γρήγορη επικοινωνία');
    bar.innerHTML =
      '<a class="btn btn-outline" href="tel:+302109650850">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
        'Κλήση</a>' +
      '<a class="btn btn-primary" href="contact.html">Ζητήστε Προσφορά</a>';
    document.body.appendChild(bar);
  }
  var footer = document.querySelector('.site-footer');
  var footerVisible = false;
  if (bar && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      footerVisible = entries[0].isIntersecting;
      onScroll();
    }).observe(footer);
  }

  // --- Scroll-driven bits: progress line, header shadow, hide-on-scroll-down, action bar ---
  var progress = null;
  if (header) {
    progress = document.createElement('span');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    header.appendChild(progress);
  }
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = doc.scrollHeight - window.innerHeight;
    var menuOpen = nav && nav.classList.contains('open');
    if (progress) progress.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1) : 0);
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      var goingDown = y > lastY + 4, goingUp = y < lastY - 4;
      if (menuOpen || y < 140) header.classList.remove('is-hidden');
      else if (goingDown) header.classList.add('is-hidden');
      else if (goingUp) header.classList.remove('is-hidden');
    }
    if (bar) bar.classList.toggle('is-shown', y > 360 && !footerVisible && !menuOpen);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Re-evaluate when the menu opens/closes (hide the action bar behind the menu)
  if (nav && 'MutationObserver' in window) {
    new MutationObserver(function () {
      doc.classList.toggle('menu-open', nav.classList.contains('open'));
      onScroll();
    }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }
})();

