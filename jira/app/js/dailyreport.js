(function () {
  'use strict';
  const avalibleCss = [
    'font-size', 'font-family', 'color', 'text-transform', 'text-align', 'table-layout', 'padding',
    'background-color', 'background-image', 'border-collapse', 'font-size', 'font-weight', 'font-style', 'overflow', 'overflow-x', 'overflow-y',
    'text-decoration', 'text-underline-style', 'vertical-align', 'border', 'white-space', 'max-height'
  ];

  var dailyReport = angular.module('DailyReport', []);
  dailyReport.controller('DailyReportController', DailyReportController);

  DailyReportController.$inject = ['$scope'];

  function DailyReportController($scope) {
    $scope.appLoaded = true;
    $scope.emailSend = false;
    $scope.todayTask = [];
    $scope.nextTask = [];
    $scope.listTaskMode = null;
    $scope.init = function () {
      $scope.jiraURL = config.JIRA_URL;
      $scope.tows = config.ISSUE.typeOfWork;
      $scope.dailyReportConfig = config.DAILY_REPORT;
      $scope.defaultEffort = config.WORKED_TIME;
      $scope.useEffort = 0;
      $scope.freeEffort = config.WORKED_TIME;
      $scope.userName = config.USER;
      $scope.project = $scope.dailyReportConfig.defaultProject;
      $scope.reportDate = new Date();
      $scope.toList = $scope.dailyReportConfig.to.join(';');
      $scope.ccList = $scope.dailyReportConfig.cc.join(';');
      $scope.subject = $scope.dailyReportConfig.subject;
      $scope.logwork = $scope.dailyReportConfig.logwork;
      $scope.mailHeader = $scope.dailyReportConfig.defaultIntroMsg.replace('{{date}}', moment($scope.reportDate).format($scope.dailyReportConfig.formatDate));
      $scope.mailFooter = $scope.dailyReportConfig.defaultOuttroMsg.replace('{{user}}', config.USER);

      if (location.search.indexOf('autoaddtask') !== -1) {
        $scope.getTaskList([], `(status in (Open, "In Progress", Reopened) AND due = "0") AND assignee in (currentUser())&maxResults=500`, function (allTasks) {
          $scope.todayTask = allTasks;
        });
      }
    };
    
    $scope.detectTypeOfWork = function (task) {
      task.tow = JIRA.__Issue_detectTypeOfWork(task);
    };

    $scope.changeDate = function () {
      $scope.mailHeader = $scope.dailyReportConfig.defaultIntroMsg.replace('{{date}}', moment($scope.reportDate).format($scope.dailyReportConfig.formatDate));
    };

    $scope.openTaskList = function (type) {
      $scope.allTasks = [];
      var selectedList = type == 'today' ? $scope.todayTask : $scope.nextTask;
      $scope.getTaskList(selectedList, null, function (allTasks) {
        $scope.allTasks = allTasks;
      });
      $scope.listTaskMode = type;
      $scope.showTaskList = true;
    };

    $scope.closeTaskList = function (type) {
      $scope.showTaskList = false;
    };

    $scope.getTaskList = function (selectedList, query, cb) {
      var toDay = moment().format('YYYY-MM-DD');
      if (!query) {
        query = `((status in (Open, "In Progress", Reopened) AND due >= "0") OR updated >= ${toDay}) AND assignee in (currentUser())&maxResults=500`;
      }
      JIRA.getTaskList.call(query, function (res) {
        var allTasks = [];
        var subItems = [];
        if (res.issues.length == 0) {
          return;
        }
        angular.forEach(res.issues, function (item) {
          if (item.fields.parent) {
            item.checked = isTaskChecked(selectedList, item);
            subItems.push(item);
            return;
          }
          item.checked = isTaskChecked(selectedList, item);
          item.type = 'task';
          allTasks.push(item);
          if (item.fields.subtasks && item.fields.subtasks.length > 0) {
            item.allSubTask = [];
            angular.forEach(item.fields.subtasks, function (subTask) {

              var subItem = res.issues.find(function (element) {
                return element.key === subTask.key;
              });
              if (!subItem) {
                return;
              }

              subItems = subItems.filter(function (t) {
                return t.key !== subTask.key;
              });
              subItem.checked = isTaskChecked(selectedList, subItem);
              subItem.type = 'sub-task';
              allTasks.push(subItem);
            });
          }
        });

        allTasks = allTasks.concat(subItems);
        cb && cb(allTasks);
        $scope.$apply();
      }, $scope);
    };

    $scope.toggleTask = function (item) {
      if (item.checked) {
        if ($scope.listTaskMode == 'today') {
          $scope.todayTask.push(item);
        } else {
          $scope.nextTask.push(item);
        }
      } else {
        if ($scope.listTaskMode == 'today') {
          $scope.todayTask = $scope.todayTask.filter(function (task) {
            return task.key != item.key;
          });
          $scope.effortChange();
        } else {
          $scope.nextTask = $scope.nextTask.filter(function (task) {
            return task.key != item.key;
          });
        }
      }
    };

    $scope.completeChange = function (item) {
      if (item.progress < 100) {
        var isExisted = $scope.nextTask.find(function (ele) {
          return ele.key == item.key;
        });
        if (isExisted) {
          return;
        }
        $scope.nextTask.push(item);
      } else {
        $scope.nextTask = $scope.nextTask.filter(function (ele) {
          return ele.key !== item.key;
        });
      }
    };

    $scope.effortChange = function () {
      $scope.freeEffort = config.WORKED_TIME;
      $scope.useEffort = 0;
      angular.forEach($scope.todayTask, function (item) {
        var effort = parseFloat(item.actualEffort);
        if (isNaN(effort)) {
          effort = 0;
        }
        $scope.freeEffort -= effort;
        $scope.useEffort += effort;
      });
    };

    $scope.addTodayTaskBlankRow = function () {
      $scope.todayTask.push({});
    };

    $scope.removeRowToday = function (index) {
      $scope.todayTask = $scope.todayTask.filter(function (ele, i) {
        return i !== index;
      });
    };

    $scope.addNextTaskBlankRow = function () {
      $scope.nextTask.push({});
    };

    $scope.addIssuse = function () {
      $scope.nextTask.push({});
    };

    $scope.removeRow = function (index) {
      $scope.nextTask = $scope.nextTask.filter(function (ele, i) {
        return i !== index;
      });
    };

    $scope.sendEmail = function (cb) {
      if (!$scope.dailyReportForm.$valid || $scope.todayTask.length == 0 || $scope.nextTask.length == 0) {
        alert('Chưa nhập đủ thông tin bắt buộc (danh sách TODAY và NEXT TASK không được bỏ trống.)');
        return;
      }
      if ($scope.logwork && !$scope.emailSend) {
        JIRA.multiLogwork.call($scope.todayTask, $scope.reportDate, function (status) {
          if (!status) {
            alert('Quá trình logwork bị lỗi');
            return;
          }
          sendMail(cb);
        });
      } else {
        sendMail(cb);
      }
    };

    $scope.reMake = function () {
      location.reload();
    };

    $scope.onBodyClicked = function (e) {
      var target = $(e.target);
      if (target.hasClass('open-jira-tasks-dialog') || target.closest('#left-panel').length > 0) {
        return;
      }

      $scope.closeTaskList();
    };

    $scope.init();

    /* jshint ignore:start */
    async function convertToHtmlEmail() {
      var reportElement = $('.report-email-content').clone();
      reportElement.hide();
      $('body').append(reportElement);
      await convertElement(reportElement);
      let emailContent = `<html><head></head><body style="width:1767px !important;max-width:1767px !important;min-width:1767px !important;mso-width:1767px;">${reportElement.html()}</body></html>`
      return emailContent;
    }

    /* jshint ignore:end */
    function convertElement($element) {
      let eleTextStyleInline = $element.attr('style');
      let eleTextStyle = eleTextStyleInline ? `${getElementTextStyle($element)}${eleTextStyleInline}` : getElementTextStyle($element);

      if ($element.hasClass('remove-before-send')) {
        $element.remove();
        return;
      }

      let $child = $element.children();

      if ($element.is('input') || $element.is('select')) {
        let inputValue = $element.val();
        $element.replaceWith(`<span style='${eleTextStyle}'>${inputValue}</span>`);
      } else if ($element.is('textarea')) {
        let inputValue = $element.val();
        $element.replaceWith(`<p style='${eleTextStyle}'>${inputValue ? inputValue.replace(/\n/g, '<br>') : ''}</p>`);
      }

      //set text style to inline style
      if (eleTextStyle) {
        $element.attr('style', eleTextStyle);
      }

      angular.forEach($child, function ($childEle) {
        convertElement($($childEle));
      });
    }

    function getElementTextStyle($element) {
      let eleStyleCom = window.getComputedStyle($element[0]);
      let styleStr = '';
      angular.forEach(eleStyleCom, function (cssKey) {
        let cssValue = eleStyleCom.getPropertyValue(cssKey);

        if (!cssValue) {
          return;
        }

        if (!avalibleCss.find(function (avalibleKey) {
            return avalibleKey == cssKey;
          })) {
          return;
        }

        if (cssValue.indexOf('"') !== -1) {
          cssValue = cssValue.replace('/"/g', "`");
        }

        styleStr += `${cssKey}:${cssValue};`;
      });
      return styleStr;
    }

    function isTaskChecked(checkedList, task) {
      return !!checkedList.find(function (element) {
        return element.key == task.key;
      });
    }

    function makeMailList(str) {
      if (!str) {
        return;
      }
      var list = str.split(';');
      var listMail = [];
      angular.forEach(list, function (mail) {
        if (!mail) {
          return;
        }
        listMail.push(`${mail}@${config.DAILY_REPORT.domain}`);
      });

      return listMail.join(';');
    }

    function sendMail(cb) {
      convertToHtmlEmail().then(function (emailContent) {
        var to = makeMailList($scope.toList);
        var cc = makeMailList($scope.ccList);
        var message = {
          command: 'send_mail',
          content: emailContent,
          to: to,
          cc: cc,
          subject: `[${$scope.project}][${moment($scope.reportDate).format(config.DAILY_REPORT.formatDate)}]${$scope.subject}`,
        };

        chrome.runtime.sendNativeMessage(config.NATIVE, message,
          function (response) {
            alert(response ? 'Gửi mail thành công' : 'Gửi mail thất bại, xin hãy thử lại');
            $scope.emailSend = true;
            cb && cb(response);
          });
      });
    }
  }
})();