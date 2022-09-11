var AutoTest = {
  data: [],
  inputTag: ['INPUT', 'TEXTAREA'],
  mouseTarget: null,
  inputFocus: false,
  mouseData: {},
  copyXPath: function (condition) {
    var self = this;
    if (!condition) {
      $(document).off('click.copyXPath');
      return;
    }
    console.log('ok')
    $(document)
      .off('click.copyXPath')
      .on('click.copyXPath', function (e) {
        var xPath = self.createXPathFromElement(e.target);
        console.log(111111, xPath)
        self.copyToClipboard(xPath);
      });
  },

  init: function () {
    var self = this;
    $(document)
      .off('mousedown.autotest')
      .off('mouseup.autotest')
      // .off('drop.autotest')
      // .off('dragend.autotest')
      .off('keydown.autotest')
      .off('keyup.autotest')
      .on('mousedown.autotest', $.proxy(self.handleMouseDown, self))
      .on('mouseup.autotest', $.proxy(self.handleMouseUp, self))
      // .on('drop.autotest', $.proxy(self.handleMouseDrop, self))
      // .on('dragend.autotest', $.proxy(self.handleMouseDragEnd, self))
      .on('keydown.autotest', $.proxy(self.handleKeyDown, self))
      .on('keyup.autotest', $.proxy(self.handleKeyUp, self));
  },

  createXPathFromElement: function (ele) {
    var allNodes = document.getElementsByTagName('*');
    for (var segs = []; ele && ele.nodeType == 1; ele = ele.parentNode) {
      if (ele.hasAttribute('id')) {
        var uniqueIdCount = 0;
        for (var n = 0; n < allNodes.length; n++) {
          if (allNodes[n].hasAttribute('id') && allNodes[n].id == ele.id) uniqueIdCount++;
          if (uniqueIdCount > 1) break;
        }
        if (uniqueIdCount == 1) {
          segs.unshift('id("' + ele.getAttribute('id') + '")');
          return segs.join('/');
        } else {
          segs.unshift(ele.localName.toLowerCase() + '[@id="' + ele.getAttribute('id') + '"]');
        }
      } else if (ele.hasAttribute('class')) {
        segs.unshift(ele.localName.toLowerCase() + '[@class="' + ele.getAttribute('class') + '"]');
      } else {
        for (i = 1, sib = ele.previousSibling; sib; sib = sib.previousSibling) {
          if (sib.localName == ele.localName) i++;
        }
        segs.unshift(ele.localName.toLowerCase() + '[' + i + ']');
      }
    }
    return segs.length ? '/' + segs.join('/') : null;
  },

  copyToClipboard: function (text, fallback) {
    var fb = function () {
      $t.remove();
      if (fallback !== undefined && fallback) {
        var fs = 'Please, copy the following text:';
        if (window.prompt(fs, text) !== null) return true;
      }
      return false;
    };
    var $t = $('<textarea />');
    $t.val(text).css({
      width: '100px',
      height: '40px'
    }).appendTo('body');
    $t.select();
    try {
      if (document.execCommand('copy')) {
        $t.remove();
        return true;
      }
      fb();
    } catch (e) {
      fb();
    }
  },


  handleMouseDown: function (e) {
    var self = this,
      xpath = self.createXPathFromElement(e.target);
    self.mouseTarget = xpath;
  },

  handleMouseUp: function (e) {
    var self = this;
    self.mouseData.type = 'click';
    self.mouseData.target = self.mouseTarget;
    self.data.push(self.mouseData);

    self.inputFocus = self.isInput(e.target.tagName);

    // reset mouse event
    self.mouseTarget = null;
    self.mouseData = {};
  },

  handleMouseDrop: function (e) {
    var self = this,
      xpath = self.createXPathFromElement(e.target);

    self.mouseData.type = 'dragdrop';
    self.mouseData.from = self.mouseTarget;
    self.mouseData.to = xpath;
    console.log(self.mouseData)
    // reset mouse event
    self.mouseTarget = null;
    self.mouseData = {};
  },

  handleMouseDragEnd: function (e) {
    var self = this,
      xpath = self.createXPathFromElement(e.target);

    console.log('dragend', xpath)

    self.mouseTarget = xpath;
  },

  handleKeyDown: function (e) {
    var self = this,
      xpath = self.createXPathFromElement(e.target);

    self.currentTarget = xpath;
    console.log(e, xpath)

  },

  handleKeyUp: function (e) {
    var self = this,
      xpath = self.createXPathFromElement(e.target);

    if (self.inputFocus) {
      self.inputValue = e.target.value
    }
    console.log(self.inputValue)

  },

  isInput: function (tagName) {
    var self = this;
    return self.inputTag.indexOf(tagName) !== -1;
  },
};


window.AutoTest = AutoTest;
chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.name == 'getXPath') {
    AutoTest.copyXPath(request.value);
  }
});

chrome.runtime.sendMessage({command: 'getXPath'}, function(response) {
  if (response) {
    AutoTest.copyXPath(response);
  }
});