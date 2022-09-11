/* global angular */
(function () {
  'use strict';

  var issues = angular.module('Issues', []);
  issues.controller('IssuesController', IssuesController);

  IssuesController.$inject = ['$scope', '$http'];

  function IssuesController($scope, $http) {
    $scope.productKey = config.ISSUE.productKey;
    var allComponents = JSON.parse(localStorage.getItem('project')).info;

    $scope.getComponents = function (key) {
      return allComponents[key];
    };

    $scope.initMultiSelect = function (fields) {
      $('.select2').select2({
        multiple: true
      });
    };

    $scope.getIssueInfo = function (info) {
      if (info.fields.components) {
        return;
      }
      $http.get(info.self).then(function (res) {
        // info.fields
        info.fields = res.data.fields;
        initMultiSelectVal()
      });
    };

    function initMultiSelectVal () {
      console.log()
      angular.forEach($('.select2'), function (ele) {
        var issueComponents = angular.element(ele).scope().parentIssue.fields.components,
          selectedComponents = [];
        angular.forEach(issueComponents, function (item) {
          selectedComponents.push(item.id);
        });
        console.log(selectedComponents)
        ele.value = selectedComponents;
      });

      $('.select2').trigger('change');
    }


    function getMyIssues() {
      JIRA.getTaskList.call('project%20%3D%20FXWEBAPP2019%20AND%20assignee%20in%20(currentUser())', function (res) {
        $scope.bugNotLinked = [];
        $scope.issues = groupByProject(res.issues);
        console.log($scope.issues);
        $scope.$apply();
      });
    }

    getMyIssues();

    function groupByProject (issueList) {
      var group = {};
      issueList = issueList.reverse();
      for (var issue of issueList.reverse()) {
        var parent = issue.fields.parent;
        var issueType = issue.fields.issuetype.name;
        var projectKey = issue.key.split('-')[0];

        if (!group[projectKey]) {
          group[projectKey] = [];
        }

        if (issueType == 'Bug') {
          parent = getParentOfBug(issue.fields.issuelinks, issue);
          if (!parent) {
            $scope.bugNotLinked.push(issue);
          }
        }

        if (!parent || group[projectKey].find(function (item) { return item.key == parent.key; })) {
          continue;
        }

        if (!parent.fields.subtasks) {
          parent.fields.subtasks = [];
        }

        var parentInfo = issueList.find(function (item) { return item.key === parent.key; });

        for (var iss of issueList) {
          if (iss.key == parent.key) {
            parent.fields = parentInfo.fields;
          } else if (iss.fields.parent && 
                      parent.key == iss.fields.parent.key && 
                      !parent.fields.subtasks.find(function (item) { return item.key !== iss.key; })) {
            parent.fields.subtasks.push(iss);
          }
        }
        group[projectKey].push(parent);
      }

      return group;
    }

    function getParentOfBug (issueList, bugInfo) {
      for (var issue of issueList) {
        if (issue.type.name == 'Blocks') {
          issue.outwardIssue.fields.subtasks = [bugInfo];
          return issue.outwardIssue;
        }
      }
    }
  }
})();