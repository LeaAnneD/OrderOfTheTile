/* ===== SHARED NAV + FOOTER — The Order of the Tile ===== */
/* Single source of truth. Edit here, every page updates. */

(function () {
  'use strict';

  // Detect current page for active link highlighting
  var path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === '') path = 'index.html';
  if (/\/dispatch\/?$/.test(window.location.pathname)) path = 'dispatch';

  function activeClass(page) {
    return path === page ? ' class="active"' : '';
  }

  // ===== NAV =====
  var navHTML = ''
    + '<a class="nav-wordmark" href="https://www.orderofthetile.com/">'
    +   '<img src="/images/seal.png" alt="seal" />The Order of the Tile'
    + '</a>'
    + '<div class="nav-menu">'
    +   '<button class="nav-menu-toggle" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="primary-nav-list">'
    +     'MENU'
    +     '<svg class="nav-menu-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>'
    +   '</button>'
    +   '<ul class="nav-links" id="primary-nav-list">'
    +     '<li><a href="https://www.orderofthetile.com/"' + activeClass('index.html') + '>📖 The Story</a></li>'
    +     '<li><a href="https://www.orderofthetile.com/alls-fair-in-love-and-mahjong.html"' + activeClass('alls-fair-in-love-and-mahjong.html') + '>🎬 The Movie</a></li>'
    +     '<li><a href="https://newsletter.orderofthetile.com/"' + activeClass('the-letters.html') + '>✉️ The Letters</a></li>'
    +     '<li><a href="https://www.orderofthetile.com/dispatch"' + activeClass('dispatch') + '>📰 The Dispatch</a></li>'
    +     '<li><a href="https://www.orderofthetile.com/the-game.html"' + activeClass('the-game.html') + '>🀄 The Game</a></li>'
    +     '<li><a href="https://www.orderofthetile.com/find-mahjong.html"' + activeClass('find-mahjong.html') + '>🗺️ Find Mah Jongg</a></li>'
    +     '<li><a href="https://www.orderofthetile.com/where-to-buy.html"' + activeClass('where-to-buy.html') + '>🛍️ Shop Boutiques</a></li>'
    +     '<li><a href="https://www.orderofthetile.com/events.html"' + activeClass('events.html') + '>📅 Events</a></li>'
    +     '<li><a href="https://www.orderofthetile.com/about-prim.html"' + activeClass('about-prim.html') + '>🌸 About Prim</a></li>'
    +     '<li><a href="https://newsletter.orderofthetile.com/#/portal/signup" class="nav-cta">✨ Join the Table Here</a></li>'
    +   '</ul>'
    + '</div>';

  var navEl = document.querySelector('nav');
  if (navEl) {
    navEl.innerHTML = navHTML;
  }

  // ===== FOOTER =====
  var footerHTML = ''
    + '<div class="footer-inner">'
    +   '<div class="footer-brand">'
    +     '<img class="footer-seal" src="/images/seal.png" alt="seal" />'
    +     '<div>'
    +       '<div class="footer-wordmark">Order of the Tile</div>'
    +       '<div class="footer-tagline">A newsletter for those who know the game</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="social-links">'
    +     '<a href="https://www.facebook.com/profile.php?id=61578790151147" target="_blank" rel="noopener" class="social-link-circle" title="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>'
    +     '<a href="https://www.instagram.com/orderofthetile/" target="_blank" rel="noopener" class="social-link-circle" title="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>'
    +     '<a href="https://www.tiktok.com/@oott_prim_proper" target="_blank" rel="noopener" class="social-link-circle" title="TikTok"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg></a>'
    +   '</div>'
    + '</div>';

  var footerEl = document.querySelector('footer');
  if (footerEl) {
    footerEl.innerHTML = footerHTML;
  }

  // ===== MENU TOGGLE =====
  var toggle = document.querySelector('.nav-menu-toggle');
  var navMenu = document.querySelector('.nav-menu');
  var navLinks = document.querySelector('.nav-links');
  var hoverCloseTimer = null;

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

  if (toggle && navMenu && navLinks) {
    // Tap/click toggle
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isVisible = window.getComputedStyle(navLinks).display !== 'none';
      setOpen(!isVisible);
    });

    // Hover-to-open with 1-second close delay (mouse devices only)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      navMenu.addEventListener('mouseenter', function () {
        setOpen(true);
      });
      navMenu.addEventListener('mouseleave', function () {
        if (hoverCloseTimer !== null) clearTimeout(hoverCloseTimer);
        hoverCloseTimer = setTimeout(function () {
          setOpen(false);
        }, 1000);
      });
    }

    // Close when a link inside the menu is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    // Click outside closes (catches taps on touch devices)
    document.addEventListener('click', function (e) {
      if (!navMenu.contains(e.target)) setOpen(false);
    });

    // Esc closes and returns focus to the toggle
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close on resize past breakpoint
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1280) setOpen(false);
    });
  }
})();
