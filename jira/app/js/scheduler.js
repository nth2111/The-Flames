(function () {
  'use strict';

  var app = angular.module('Scheduler', []);
  app.controller('SchedulerController', SchedulerController);

  SchedulerController.$inject = ['$scope'];

  function SchedulerController($scope) {
    var defaultTaskName = 'remindByMsg';
    $scope.scheduler = JSON.parse(localStorage.getItem('SCHEDULER'));
    $scope.__scheduler = angular.copy($scope.scheduler);
    $scope.allTask = __COMMON_TASK;

    $scope.wd = ['any', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    $scope.makeRange = function (from, to) {
      var range = ['any'];

      if (!from && !to) {
        var d = new Date();
        from = d.getFullYear();
        to = d.getFullYear() + 5;
      }

      for (var i = from; i <= to; i++) {
        range.push(i);
      }

      return range;
    };

    $scope.getMaxDateOfMonth = function (month, year) {
      var d = new Date();
      if (month == 'any') {
        month = d.getMonth() + 1;
      }

      if (year == 'any') {
        year = d.getFullYear();
      }
      return new Date(year, month, 0).getDate();
    };

    $scope.parseTime = function (time, key) {
      if (!time) {
        return 'any';
      }

      var reg = new RegExp(`{${key}}`),
        match = time.match(reg);

      if (match) {
        return 'any';
      }

      return __getValue(time, key);
    };

    $scope.save = function () {
      for (var item of $scope.scheduler) {
        var time = __makeTimeStr(item);
        item.time = time;
      }

      localStorage.setItem('SCHEDULER', JSON.stringify($scope.scheduler));
      __reloadScheduler();
      location.reload();
    };

    $scope.revertChange = function () {
      $scope.scheduler = $scope.__scheduler;
    };

    $scope.resetToDefault = function () {
      chrome.runtime.sendMessage({
        command: 'resetToDefault'
      }, function () {
        __reloadScheduler();
      });
      location.reload();
    };

    $scope.preview = function (item) {
      $scope.allTask[item.task] && $scope.allTask[item.task].action(item);
    };

    $scope.remove = function (index) {
      $scope.scheduler = $scope.scheduler.filter(function (item, i) {
        return index !== i;
      });
    };

    $scope.add = function () {
      $scope.scheduler.push({
        task: defaultTaskName
      });
    };

    function __getValue(time, key) {
      var arr = time.split(' ');
      switch (key) {
        case 'day':
          return arr[0];
        case 'dat':
        case 'mon':
        case 'yea':
          return __getDate(arr[1], key);
        case 'hou':
        case 'min':
        case 'sec':
          return __getTime(arr[2], key);
        default:
          return null;
      }
    }

    function __getDate(date, key) {
      var index = 0;
      date = date.split('/');

      if (key == 'dat') index = 0;
      if (key == 'mon') index = 1;
      if (key == 'yea') index = 2;

      return parseInt(date[index]).toString();
    }

    function __getTime(time, key) {
      var index = 0;
      time = time.split(':');
      if (key == 'hou') index = 0;
      if (key == 'min') index = 1;
      if (key == 'sec') index = 2;

      return parseInt(time[index]).toString();
    }

    function __makeTimeStr(obj) {
      return `${__timeVal(obj.day, 'day')} ${__timeVal(obj.dat, 'dat')}/${__timeVal(obj.mon, 'mon')}/${__timeVal(obj.yea, 'yea')} ` +
        `${__timeVal(obj.hou, 'hou')}:${__timeVal(obj.min, 'min')}:${__timeVal(obj.sec, 'sec')}`;
    }

    function __timeVal(v, key) {
      if ($scope.wd.indexOf(v) !== -1) {
        if (v == 'any') {
          return `{${key}}`;
        }
        return v;
      }

      v < 10 && (v = '0' + v);

      return v;
    }

    function __reloadScheduler(cb) {
      chrome.runtime.sendMessage({
        command: 'reloadScheduler'
      }, function () {
        cb && cb();
      });
    }
  }
})();