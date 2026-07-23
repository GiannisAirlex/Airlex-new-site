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
        if (window.innerWidth <= 860 && link.closest('.has-mega') === null) {
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
