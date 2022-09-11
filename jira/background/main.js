var Main = {
  __init__: localStorage.getItem('firstInstall'),
  init: function () {
    var self = this;
    if (!self.__init__ || self.__init__ == 0) {
      AppNotification.show('remindByMsg', {
        title: 'Nhắc nhở cài đặt',
        message: 'Hãy cài đặt lại tham số cho lần sử dụng đầu tiên.',
        buttons: [{
          title: `OK`
        }]}, [function (notifId) {
          chrome.tabs.create({
            url: `/app/config.html`
          });
          AppNotification.hide(notifId);
      }]);
    }
    if (!localStorage.getItem('SCHEDULER')) {
      localStorage.setItem('SCHEDULER', JSON.stringify(Scheduler.__DEFAULT_SCHEDULER));
    }
    Scheduler.run();
  }
};

Main.init();