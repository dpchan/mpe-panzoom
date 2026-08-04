(function () {
  'use strict';

  var state = window.__mpePanzoomState;
  if (!state) {
    state = {
      animationFrame: 0,
      boundTargets: new WeakSet(),
      lightboxDocument: null,
      observer: null,
      observerDocument: null,
      retryAttempts: 0,
      retryTimer: 0,
    };
    window.__mpePanzoomState = state;
  }

  var maxRetryAttempts = 100;
  var retryDelay = 50;

  // This runs before MPE's deferred lightbox script, so SVG images remain
  // available for dragging instead of opening the lightbox on click.
  if (state.lightboxDocument !== document) {
    document.addEventListener(
      'click',
      function (event) {
        if (
          event.target instanceof Element &&
          event.target.closest('.mpe-panzoom-viewport img')
        ) {
          event.stopImmediatePropagation();
        }
      },
      true,
    );
    state.lightboxDocument = document;
  }

  function isSvgImage(image) {
    try {
      return new URL(image.currentSrc || image.src).pathname
        .toLowerCase()
        .endsWith('.svg');
    } catch (_error) {
      return false;
    }
  }

  function findTargets() {
    var targets = Array.from(
      document.querySelectorAll(
        '.preview-container .mermaid svg, ' +
          '.preview-container svg.mpe-panzoom, ' +
          '.preview-container img.mpe-panzoom',
      ),
    );

    Array.from(
      document.querySelectorAll('.preview-container img'),
    ).forEach(function (image) {
      if (isSvgImage(image) && targets.indexOf(image) === -1) {
        targets.push(image);
      }
    });

    return targets;
  }

  function bindPanzoom() {
    state.animationFrame = 0;

    if (typeof window.Panzoom !== 'function') {
      retryBind();
      return;
    }
    state.retryAttempts = 0;

    findTargets().forEach(function (target) {
      if (state.boundTargets.has(target)) {
        return;
      }
      state.boundTargets.add(target);

      var viewport = document.createElement('div');
      viewport.className = 'mpe-panzoom-viewport';
      target.replaceWith(viewport);
      viewport.appendChild(target);
      target.classList.add('mpe-panzoom-target');

      var panzoom = window.Panzoom(target, {
        minScale: 0.25,
        maxScale: 10,
        step: 0.2,
      });

      viewport.addEventListener('wheel', panzoom.zoomWithWheel, {
        passive: false,
      });
      viewport.addEventListener('dblclick', function (event) {
        event.preventDefault();
        panzoom.reset({ animate: true });
      });
    });
  }

  function scheduleBind() {
    if (state.animationFrame) {
      return;
    }
    state.animationFrame = window.requestAnimationFrame(bindPanzoom);
  }

  function retryBind() {
    if (state.retryTimer || state.retryAttempts >= maxRetryAttempts) {
      return;
    }
    state.retryAttempts += 1;
    state.retryTimer = window.setTimeout(function () {
      state.retryTimer = 0;
      scheduleBind();
    }, retryDelay);
  }

  function start() {
    if (!state.observer || state.observerDocument !== document) {
      if (state.observer) {
        state.observer.disconnect();
      }
      // MPE manual refresh can replace body. Observing document keeps the
      // adapter attached to the next preview tree in the same Webview.
      state.observer = new MutationObserver(scheduleBind);
      state.observerDocument = document;
      state.observer.observe(document, {
        childList: true,
        subtree: true,
      });
    }
    scheduleBind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
