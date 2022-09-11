var __COMMON_TASK = {
  remindByMsg: {
    name: 'Hiển thị thông báo',
    desc: 'Hiển thị thông báo với message:',
    action: function (opt) {
      AppNotification.show('remindByMsg', {
        title: 'Nhắc nhở công việc',
        message: opt.message || 'Message chưa được nhập. Xin kiểm tra lại.',
        buttons: [{
          title: 'OK'
        }]
      }, [
        function (notifId) {
          AppNotification.hide(notifId);
        }
      ]);
    }
  },
  checkWorkLogPreWeek: {
    name: 'Tình trạng log work của tuần trước',
    desc: 'Tình trạng log work của tuần trước',
    action: function () {
      var week = Util.getWeek(new Date().setDate(new Date().getDate() - 7));
      JIRA.logWorkRemine.call(week);
    }
  },
  checkOverDueAndTodayTask: {
    name: 'Tình trạng JIRA task',
    desc: 'Hiển thị thông báo các task quá due date và task có due date trong ngày',
    action: JIRA.checkTaskJIRA.call
  },
  checkWorkLogCurrentWeek: {
    name: 'Tình trạng log work trong tuần',
    desc: 'Tình trạng log work trong tuần',
    action: function () {
      var week = Util.getWeek();
      JIRA.logWorkRemine.call(week);
    }
  },
  dailyReportRemind: {
    name: 'Nhắc nhở thực hiện daily report',
    desc: 'Nhắc nhở thực hiện daily report',
    action: function () {
      AppNotification.show('remindByMsg', {
        title: 'Nhắc nhở công việc',
        message: 'Cần thực hiện daily report',
        buttons: [{
            title: `OK`
          },
          {
            title: `Bỏ qua`
          }
        ]
      }, [function (notifId) {
        chrome.tabs.create({
          url: `/app/dailyreport.html?autoaddtask=true`
        });
        AppNotification.hide(notifId);
      }, function (notifId) {
        AppNotification.hide(notifId);
      }]);
    }
  }
};

window.__COMMON_TASK = __COMMON_TASK;