(function () {
  'use strict';

  if (window.__mpePanzoomInstalled) {
    return;
  }
  window.__mpePanzoomInstalled = true;

  var boundTargets = new WeakSet();
  var animationFrame = 0;

  // This runs before MPE's deferred lightbox script, so SVG images remain
  // available for dragging instead of opening the lightbox on click.
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
    animationFrame = 0;

    if (typeof window.Panzoom !== 'function') {
      console.warn('[MPE Panzoom] Panzoom failed to load.');
      return;
    }

    findTargets().forEach(function (target) {
      if (boundTargets.has(target)) {
        return;
      }
      boundTargets.add(target);

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
    if (animationFrame) {
      return;
    }
    animationFrame = window.requestAnimationFrame(bindPanzoom);
  }

  function start() {
    new MutationObserver(scheduleBind).observe(document.body, {
      childList: true,
      subtree: true,
    });
    scheduleBind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
