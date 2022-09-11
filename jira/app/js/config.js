(function () {
  'use strict';

  var app = angular.module('Config', []);
  app.controller('ConfigController', ConfigController);

  ConfigController.$inject = ['$scope'];

  function ConfigController($scope) {
    $scope.config = JSON.parse(localStorage.getItem('config'));
    parse();
    $scope.save = function () {
      parse(true);
      localStorage.setItem('firstInstall', 1);
      localStorage.setItem('config', JSON.stringify($scope.config));

      localStorage.removeItem('project');

      chrome.runtime.sendMessage({
        command: 'saveConfig',
        data: $scope.config
      }, function () {
        window.close();
      });
    };

    function parse(isSave) {
      if (isSave) {
        $scope.config.PROJECT = $scope.config.PROJECT.split(';');
        $scope.config.DAILY_REPORT.to = $scope.config.DAILY_REPORT.to.split(';');
        $scope.config.DAILY_REPORT.cc = $scope.config.DAILY_REPORT.cc.split(';');
        return;
      }

      $scope.config.PROJECT = $scope.config.PROJECT.join(';');
      $scope.config.DAILY_REPORT.to = $scope.config.DAILY_REPORT.to.join(';');
      $scope.config.DAILY_REPORT.cc = $scope.config.DAILY_REPORT.cc.join(';');
    }
  }
})();