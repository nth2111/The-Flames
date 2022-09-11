var commands = {
  checkCurrentWeekWorkLogs: function (request, sender, sendResponse) {
    var currentWeek = Util.getWeek();
    JIRA.logWorkRemine.call(currentWeek);
    sendResponse({
      success: true,
      msg: 'worklog checked'
    });
  },
  setRemindTask: function (request, sender, sendResponse) {
    console.log(request);
    Scheduler.addTask('remindByMsg', request.data.time, { msg : request.data.msg });
  },
  resetToDefault: function (request, sender, sendResponse) {
    localStorage.setItem('SCHEDULER', JSON.stringify(Scheduler.__DEFAULT_SCHEDULER));
  },
  reloadScheduler: function (request, sender, sendResponse) {
    Scheduler.reloadSchedulerProcess();
    sendResponse(true);
  },
  
  saveConfig: function (request, sender, sendResponse) {
    window.config = request.data;
    sendResponse(true);
  },
  getXPath: function (request, sender, sendResponse) {
    sendResponse(localStorage.getItem('copyXPath') == 1);
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (!request.command || !commands[request.command]) {
    sendResponse({
      success: false,
      msg: 'command not found'
    });
    return;
  }
  commands[request.command](request, sender, sendResponse);
});