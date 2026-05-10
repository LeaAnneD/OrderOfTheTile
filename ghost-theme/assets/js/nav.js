/* The Order of the Tile — nav menu toggle */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-menu-toggle');
  var navMenu = document.querySelector('.nav-menu');
  var navLinks = document.querySelector('.nav-links');
  var hoverCloseTimer = null;

  if (!(toggle && navMenu && navLinks)) return;

  function setOpen(open) {
    if (hoverCloseTimer !== null) {
      clearTimeout(hoverCloseTimer);
      hoverCloseTimer = null;
    }
    if (open) {
      navLinks.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var isVisible = window.getComputedStyle(navLinks).display !== 'none';
    setOpen(!isVisible);
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    navMenu.addEventListener('mouseenter', function () { setOpen(true); });
    navMenu.addEventListener('mouseleave', function () {
      if (hoverCloseTimer !== null) clearTimeout(hoverCloseTimer);
      hoverCloseTimer = setTimeout(function () { setOpen(false); }, 1000);
    });
  }

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('click', function (e) {
    if (!navMenu.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1280) setOpen(false);
  });
})();
