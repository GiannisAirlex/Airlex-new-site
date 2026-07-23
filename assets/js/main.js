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
})();
