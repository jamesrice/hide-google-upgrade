/**
 * Hide Google Upgrade Buttons
 *
 * Google's Workspace apps ship the "Upgrade" promo as a dynamically rendered
 * control with obfuscated, rotating class names, so a static CSS rule alone
 * can't be relied on. This script re-checks the DOM as the app re-renders and
 * marks matching controls with [data-hide-upgrade], which the stylesheet hides.
 *
 * Design constraints:
 *   - Never touches message bodies, documents, or anything editable, so it
 *     can't hide legitimate content (e.g. an "Upgrade" link inside an email).
 *   - Text matching only counts inside a chrome region (header / toolbar /
 *     nav) or for a control pinned to the top strip of the window.
 *   - No network calls, no storage, no message passing, no extension APIs.
 */
(() => {
  'use strict';

  const MARK = 'data-hide-upgrade';

  // Controls worth checking at all.
  const CANDIDATES = 'a[href], button, [role="button"], [role="link"]';

  // App chrome: the only place a bare "Upgrade" label is treated as the promo.
  const CHROME_REGION = 'header, [role="banner"], [role="toolbar"], [role="navigation"]';

  // User content. Anything inside these is left completely alone.
  const CONTENT = [
    '[contenteditable="true"]',
    '.a3s',            // Gmail message body
    '.ii',             // Gmail message body wrapper
    '.adn',            // Gmail message container
    '[role="listitem"]',
    '[role="textbox"]',
    '[role="document"]',
    'iframe',
  ].join(', ');

  // Links that are unambiguously a sales / billing destination.
  const UPGRADE_URL = new RegExp(
    [
      'workspace\\.google\\.com/(intl/[^/]+/)?(pricing|business/signup)',
      'admin\\.google\\.com/[^?#]*billing',
      'one\\.google\\.com/[^?#]*(storage/)?upgrade',
      '/upgrade(\\b|[/?#])',
    ].join('|'),
    'i'
  );

  const isPromoLabel = (text) => /^upgrade\b/.test(text) || /^try\s+(google\s+)?workspace\b/.test(text);

  function label(el) {
    const raw =
      el.getAttribute('aria-label') ||
      el.getAttribute('data-tooltip') ||
      el.textContent ||
      '';
    return raw.trim().toLowerCase();
  }

  /** Is this control pinned to the top strip of the window? */
  function inTopStrip(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top < 140 && rect.width > 0 && rect.width < 320;
  }

  function shouldHide(el) {
    if (el.hasAttribute(MARK)) return false;
    if (el.closest(CONTENT)) return false;

    const href = el.getAttribute('href');
    if (href && UPGRADE_URL.test(href)) return true;

    const text = label(el);
    if (text.length > 32 || !isPromoLabel(text)) return false;

    return Boolean(el.closest(CHROME_REGION)) || inTopStrip(el);
  }

  /**
   * Hide the control, plus up to two ancestors that exist purely to wrap it.
   * Without this, Google's flex spacing can leave a visible empty gap where
   * the button used to be.
   */
  function hide(el) {
    el.setAttribute(MARK, '');

    let node = el;
    for (let depth = 0; depth < 2; depth++) {
      const parent = node.parentElement;
      if (!parent) break;
      if (parent.childElementCount !== 1) break;
      if (parent.matches(CHROME_REGION)) break;
      if (parent.textContent.trim() !== node.textContent.trim()) break;
      parent.setAttribute(MARK, '');
      node = parent;
    }
  }

  function sweep() {
    const nodes = document.querySelectorAll(CANDIDATES);
    for (const el of nodes) {
      if (shouldHide(el)) hide(el);
    }
  }

  // Google re-renders constantly, so the observer is throttled rather than
  // firing a sweep per mutation batch.
  let queued = false;
  function scheduleSweep() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      sweep();
    }, 300);
  }

  function start() {
    sweep();
    new MutationObserver(scheduleSweep).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    // Catch controls that only settle after layout (e.g. lazy-rendered chrome).
    window.addEventListener('resize', scheduleSweep, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
