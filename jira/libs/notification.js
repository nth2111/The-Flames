var AppNotification = {
  MSG_SHOWED: [],
  MSG_EVENT: {},
  init: function () {
    console.log('AppNotification: Init AppNotification');
    var self = this;
    //if extension hasnt permis for show notification, request permis from user
    if (Notification.permission != `granted`) {
      console.log('AppNotification: Request permission:');
      Notification.requestPermission();
    }

    //listen event click button
    chrome.notifications.onButtonClicked.addListener(function (id, i) {
      console.log('AppNotification: Click AppNotification:', id);
      if (!id) {
        console.log('AppNotification: Click AppNotification:', 'AppNotification not found');
        return;
      }
      console.log('AppNotification: Click AppNotification:', 'Call handle function', i, self.MSG_EVENT[id]);
      self.MSG_EVENT[id] && self.MSG_EVENT[id][i] && self.MSG_EVENT[id][i](id);
    });

    chrome.notifications.onClicked.addListener(function (id, i) {
      // chrome.notifications.clear(id);
      self.__removeShowedMsg(id);
    });
  },

  /**
   * @desc hide notification
   * @param {string} id notification id
   */
  hide: function (id) {
    var self = this;
    console.log('AppNotification: Close AppNotification:', id);
    chrome.notifications.clear(id);
    console.log(self.MSG_SHOWED);
    self.__removeShowedMsg(id);
  },

  /**
   * @desc create notification
   * @param {string} id notification id
   * @param {object} opt notification options
   * @param {array} eventHandle event
   */
  show: function (id, opt, eventHandle) {
    var self = this,
      notifiId = `${id}_${new Date().getTime().toString()}`;
    console.log(self.MSG_SHOWED)
    if (self.MSG_SHOWED.indexOf(id) !== -1) {
      console.log('AppNotification: Notification showed:', id)
      return;
    }
    console.log('AppNotification: Show AppNotification:', id);
    if (Notification.permission == `granted`) {
      var options = {
        type: `basic`,
        title: `Anh ơi!`,
        iconUrl: chrome.extension.getURL(`img/my-baby.png`),
        requireInteraction: true
      };
      opt = self.__createDefaultButton(id, opt, eventHandle);
      if (eventHandle) {
        self.MSG_EVENT[notifiId] = eventHandle;
      }

      $.extend(options, opt);
      chrome.notifications.create(notifiId, options, function () {
        self.MSG_SHOWED.push(id);
      });
      return;
    }
    console.log('AppNotification: Show AppNotification error:', 'User not grant permission');
  },

  __removeShowedMsg: function (id) {
    var self = this;
    self.MSG_SHOWED = self.MSG_SHOWED.filter(function (item) {
      return item !== id.split('_')[0];
    });
  },

  __createDefaultButton: function (id, opt, eventHandle) {
    var self = this;
    if (!opt.buttons) {
      opt.buttons = [];
    }

    if (!eventHandle) {
      eventHandle = [];
    }

    opt.buttons.push({title: `Nhắc lại sau: ${config.REMIND.remindAfter} phút`});
    eventHandle.push(function (id) {
      self.__remindAfter(id, opt, eventHandle);
      self.hide(id);
    });
    opt.buttons.push({title: `Xóa nhắc nhở`});
    opt.buttons.push({title: `Xóa nhắc nhở`});
    opt.buttons.push({title: `Xóa nhắc nhở`});
    opt.buttons.push({title: `Xóa nhắc nhở`});
    return opt;
  },

  __remindAfter: function (id, options, eventHandle) {
    var self = this;
    var after = config.REMIND.remindAfter * 60 * 1000;

    setTimeout(function () {
      self.show(id, options, eventHandle);
    }, after);
  },

  __delete: function () {
    var now = new Date().getTime(),
      after = config.REMIND.remindAfter * 60 * 1000,
      timeRemind = now + after;

    setTimeout(function () {
      
    })
  }
};
AppNotification.init();
window.AppNotification = AppNotification;