(function () {
  'use strict';
  var extensionMenu = angular.module('ExtensionMenu', []);
  extensionMenu.controller('ExtensionMenuController', ExtensionMenuController);

  ExtensionMenuController.$inject = ['$scope'];

  function ExtensionMenuController($scope) {
    $scope.setTask = false;
    $scope.checkWorkLog = false;
    $scope.cicdData = null;
    $scope.copyXPath = localStorage.getItem('copyXPath') == 1;

    startCopyXPath();

    var currentWeek = Util.getWeek();
    $scope.from = currentWeek.from;
    $scope.to = currentWeek.to;

    $scope.createDailyReport = function () {
      openNewTab(`${location.origin}/app/dailyreport.html?autoaddtask=true`, 'DAILY REPORT');
    };

    $scope.openConfigPage = function () {
      openNewTab(`${location.origin}/app/config.html`, 'CONFIG');
    };

    $scope.openSubTarget = function (e, name) {
      if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'BUTTON') {
        return;
      }

      $scope[name] = !$scope[name];
    };

    $scope.setRemindTask = function () {
      if (!$scope.taskTime || !$scope.taskMsg) {
        return;
      }
      var val = $scope.taskTime.match(/[0-9]+/);
      var unit = $scope.taskTime.match(/[a-z]+/);
      if (!unit) {
        return;
      }

      unit = unit[0];
      var now = new Date();
      // time;
      // switch(unit) {
      //   case 'h':
      //     time = new Date(new Date().setHours)
      // }
    };

    $scope.openWorkLogPage = function () {
      openNewTab(`${location.origin}/app/worklog.html?from=${Util.toJIRAFormatDate($scope.from)}&to=${Util.toJIRAFormatDate($scope.to)}`, 'WORKLOG');
    };

    $scope.schedulerConfig = function () {
      openNewTab(`${location.origin}/app/scheduler.html`, 'SCHEDULER');
    };

    $scope.copyXPathChanged = function () {
      localStorage.setItem('copyXPath', $scope.copyXPath ? 1 : 0);
      startCopyXPath()

    };

    function startCopyXPath() {
      chrome.tabs.query({
        active: true
      }, function (res) {

        chrome.tabs.sendMessage(res[0].id, {
          name: 'getXPath',
          value: $scope.copyXPath
        });
      });
    }

    function openNewTab(url, title) {
      console.log(`Main:Open Tab:${title}:${url}`);
      chrome.tabs.query({
        title: title
      }, function (res) {
        if (res.length > 0) {
          console.log('Main:Tab is opened', res);
          chrome.tabs.update(res.id, {
            url: url
          }, function () {
            // window.close();
          });
          return;
        }
        console.log('Main:Open new tab');
        chrome.tabs.create({
          url: url
        });
      });
    }
  }
})();