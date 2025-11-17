(function () {
  'use strict';

  var RESET_DELAY = 2000;
  var DEFAULT_LABEL = 'Copy code to clipboard';
  var CLIPBOARD_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false"><rect x="6.25" y="5" width="11.5" height="14" rx="2"></rect><rect x="9" y="2.5" width="6" height="2.5" rx="0.75"></rect><path d="M9 9h6m-6 3h6m-6 3h4"></path></svg>';

  function initCopyButtons() {
    var blocks = document.querySelectorAll('pre code');
    if (!blocks.length) {
      return;
    }

    Array.prototype.forEach.call(blocks, function (codeBlock) {
      var pre = codeBlock.parentNode;
      if (!pre || pre.dataset.copyCodeAttached === 'true') {
        return;
      }

      var codeText = codeBlock.textContent || '';
      var normalized = codeText.replace(/\r\n/g, '\n');
      var trimmed = normalized.replace(/\s+$/, '');
      var lineCount = trimmed ? trimmed.split('\n').length : 0;
      if (lineCount < 3) {
        return;
      }

      var wrapper = pre.parentNode;
      if (!wrapper || !wrapper.classList || !wrapper.classList.contains('copy-code-block')) {
        wrapper = document.createElement('div');
        wrapper.className = 'copy-code-block';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code-button';
      button.dataset.defaultLabel = DEFAULT_LABEL;
      button.dataset.status = '';
      button.setAttribute('aria-label', DEFAULT_LABEL);
      button.innerHTML = CLIPBOARD_ICON + '<span class="sr-only">' + DEFAULT_LABEL + '</span>';

      button.addEventListener('click', function () {
        handleCopy(codeBlock, button);
      });

      wrapper.appendChild(button);
      pre.dataset.copyCodeAttached = 'true';
    });
  }

  function handleCopy(codeBlock, button) {
    var text = codeBlock.innerText;
    if (!text) {
      flashState(button, 'is-error', 'Empty');
      return;
    }

    var onSuccess = function () {
      flashState(button, 'is-copied', 'Copied!');
    };
    var onError = function () {
      flashState(button, 'is-error', 'Error');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess, function () {
        fallbackCopy(text, onSuccess, onError);
      });
    } else {
      fallbackCopy(text, onSuccess, onError);
    }
  }

  function fallbackCopy(text, onSuccess, onError) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);

    var selection = document.getSelection();
    var selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    try {
      var copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (selectedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }
      copied ? onSuccess() : onError();
    } catch (err) {
      document.body.removeChild(textarea);
      onError();
    }
  }

  function flashState(button, className, label) {
    if (!button) {
      return;
    }

    clearTimeout(button._copyResetTimeout);
    button.classList.remove('is-copied', 'is-error');
    button.classList.add(className);
    var statusText = label || '';
    var ariaLabel = label || button.dataset.defaultLabel || DEFAULT_LABEL;
    button.dataset.status = statusText;
    button.setAttribute('aria-label', ariaLabel);

    button._copyResetTimeout = window.setTimeout(function () {
      button.classList.remove('is-copied', 'is-error');
      button.dataset.status = '';
      button.setAttribute('aria-label', button.dataset.defaultLabel || DEFAULT_LABEL);
    }, RESET_DELAY);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopyButtons);
  } else {
    initCopyButtons();
  }
})();
