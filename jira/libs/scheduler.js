var Scheduler = {
  __DEFAULT_SCHEDULER: [{
      id: 1,
      time: '{day} {dat}/{mon}/{yea} 09:15:00',
      task: 'checkOverDueAndTodayTask',
    },
    {
      id: 2,
      time: 'Mon {dat}/{mon}/{yea} 09:15:00',
      task: 'checkWorkLogPreWeek',
    },
    {
      id: 3,
      time: 'Fri {dat}/{mon}/{yea} 16:00:00',
      task: 'checkWorkLogCurrentWeek',
    },
    {
      id: 4,
      time: '{day} {dat}/{mon}/{yea} 16:30:00',
      task: 'checkOverDueAndTodayTask',
    },
    {
      id: 5,
      time: '{day} {dat}/{mon}/{yea} 16:55:00',
      task: 'dailyReportRemind',
    }
  ],

  __getScheduler: function () {
    return JSON.parse(localStorage.getItem('SCHEDULER')) || [];
  },

  __getEventTime: function (str, dateInfo) {
    var repArr = str.match(/\{[a-z]+\}/g);
    for (item of repArr) {
      var key = item.match(/[a-z]+/)[0];
      str = str.replace(item, dateInfo[key]);
    }

    return str;
  },
  run: function () {
    var self = this;
    self.schedulerProcess = setTimeout(function () {
      var d = moment(),
        dateInfo = {
          day: d.format('ddd'),
          dat: d.format('DD'),
          mon: d.format('MM'),
          yea: d.format('YYYY'),
          hou: d.format('HH'),
          min: d.format('mm'),
          sec: d.format('ss')
        },
        now = `${dateInfo.day} ${dateInfo.dat}/${dateInfo.mon}/${dateInfo.yea} ${dateInfo.hou}:${dateInfo.min}:${dateInfo.sec}`,
        scheduler = self.__getScheduler();

      for (var item of scheduler) {
        var scheduleDate = self.__getEventTime(item.time, dateInfo);
        console.log(now, scheduleDate)

        if (now == scheduleDate) {
          if (!__COMMON_TASK[item.task]) {
            return;
          }
          console.log(`Schedule:Start job:Time-${now}:Job name-${item}`);
          __COMMON_TASK[item.task].action(item);

          if (item.time.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)) {
            scheduler = scheduler.filter(function (it) {
              return it.time !== item.time;
            });

            localStorage.setItem('SCHEDULER', JSON.stringify(scheduler));
          }
        }
      }
      self.run();
    }, 1000);
  },

  reloadSchedulerProcess: function () {
    console.log('Scheduler:Reset scheduler process');
    var self = this;
    console.log('Scheduler:Stop process');
    clearTimeout(self.schedulerProcess);
    console.log('Scheduler:Start process');
    self.run();
  }
};