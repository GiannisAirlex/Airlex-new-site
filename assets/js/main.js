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

