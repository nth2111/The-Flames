/* global angular */
(function () {
    'use strict';

    var worklog = angular.module('Worklog', []);
    worklog.controller('WorklogController', WorklogController);

    WorklogController.$inject = ['$scope'];

    function WorklogController($scope) {
        var __offDay = [0, 6],
            offDay,
            requiredTime = config.WORKED_TIME,
            bgColor = {
                off: '#808080',
                warn: '#FFFF00',
                err: '#FF0000',
                over: '#FF00FF',
            };

        $scope.bgColor = bgColor;
        $scope.params = Util.parseParams(location.search);
        $scope.worklogs = [];
        $scope.__worklogs = [];
        $scope.abs = [];
        $scope.headers = ['Date', 'JIRA', 'Desc', 'TOW', 'Worked', 'Action'];
        $scope.tow = config.ISSUE.typeOfWork;
        $scope.isOffDay = isOffDay;
        $scope.from = new Date($scope.params.from);
        $scope.to = new Date($scope.params.to);

        $scope.dateChanged = function () {
            location.search = Util.toUrlParams({
                from: Util.toJIRAFormatDate($scope.from),
                to: Util.toJIRAFormatDate($scope.to),
            });
        };

        $scope.getWorklog = function () {
            $scope.worklogs = [];
            $scope.__worklogs = [];
            JIRA.getUserWorkLog.call(
                $scope.from,
                $scope.to,
                function (worklogs, abs, record) {
                    $scope.abs = abs;
                    offDay = __offDay;
                    $scope.abs = abs;
                    var allWorklog = {};
                    angular.forEach(worklogs, function (item) {
                        var date = new Date(item.date).getTime();

                        if (!allWorklog[date]) {
                            allWorklog[date] = [];
                        }
                        item.worked = parseFloat(item.worked);
                        allWorklog[date].push(item);
                    });

                    $scope.worklogs = allWorklog;
                    $scope.__worklogs = angular.copy($scope.worklogs);
                    $scope.dateRange = createDateRange();
                    $scope.$apply();
                }
            );
        };

        $scope.getRowSpan = function (date) {
            return $scope.worklogs[date]
                ? $scope.worklogs[date].filter(function (item) {
                      return !item.isDel;
                  }).length
                : 1;
        };

        $scope.getBgColor = function (date, worklogs) {
            if (isOffDay(date)) {
                return bgColor.off;
            }

            if (!worklogs) {
                return bgColor.err;
            }
            var totalTime = $scope.calTotalWorklog(worklogs);

            if (date.requiredTime - totalTime > 0.5) {
                return bgColor.warn;
            }

            if (totalTime > date.requiredTime) {
                return bgColor.over;
            }
        };

        $scope.deleteWorklog = function (worklog, index, date) {
            worklog.isDel = true;
            $scope.calTotalWorklog($scope.worklogs[date]);
        };

        $scope.addNewWorklog = function (date) {
            if (!$scope.worklogs[date]) {
                $scope.worklogs[date] = [];
            }

            $scope.worklogs[date].push({ isCreate: true });
        };

        $scope.revertData = function () {
            $scope.worklogs = angular.copy($scope.__worklogs);
        };

        $scope.saveChange = function () {
            var allProcess = [];
            angular.forEach($scope.worklogs, function (item, date) {
                angular.forEach(item, function (worklog, index) {
                    if (worklog.isDel) {
                        if (!worklog.isCreate) {
                            allProcess.push(
                                delWorkLog(worklog.key, worklog.id)
                            );
                        }
                        return;
                    }

                    if (worklog.isCreate) {
                        allProcess.push(createLogWorkProcess(worklog, date));
                        return;
                    }

                    var changeObj = worklogChanged(
                        worklog,
                        $scope.__worklogs[date][index]
                    );
                    if (changeObj) {
                        allProcess.push(createUpdateProcess(changeObj));
                    }
                });
            });

            if (allProcess.length == 0) {
                alert('Không có gì thay đổi');
                return;
            }

            Promise.all(allProcess).then(function () {
                location.reload();
            });
        };

        $scope.calTotalWorklog = function (worklogs) {
            var total = 0;
            angular.forEach(worklogs, function (worklog) {
                if (worklog.isDel) {
                    return;
                }
                var worked = parseFloat(worklog.worked);
                if (isNaN(worked)) {
                    worked = 0;
                }

                total += worked;
            });

            return total;
        };

        $scope.getTaskInfo = function (task) {
            JIRA.getTaskInfo.call(task.key, function (res) {
                task.description = res.fields.summary;
                task.attributeValue = JIRA.__Issue_detectTypeOfWork(res);
                $scope.$apply();
            });
        };

        $scope.parseNumberValue = function (task) {
            task.worked = parseFloat(task.worked);
        };

        function createDateRange() {
            var today = Util.setTimeToZero(new Date()).getTime();
            var start = $scope.from.getTime();
            var end = $scope.to.getTime();
            var dateRange = [];
            for (var i = start; i <= end; i += config.A_DAY) {
                if (i > today) {
                    continue;
                }
                var offTime = getOffTime(i);
                dateRange.push({
                    date: i,
                    off: offTime,
                    requiredTime: requiredTime - offTime,
                });
            }
            return dateRange;
        }

        function getOffTime(date) {
            var abs = $scope.abs.find(function (item) {
                // console.log(item.date, date)
                return item.date == date;
            });

            if (abs) {
                return parseFloat(abs.time);
            }
            return 0;
        }

        function isOffDay(date) {
            var day = new Date(date.date).getDay();
            var isOffDay = offDay.indexOf(day) !== -1 || date.off == 8;

            if (isOffDay) {
                return isOffDay;
            }
        }

        function delWorkLog(key, id) {
            return new Promise(function (resolve, reject) {
                JIRA.deleteWorklog.call(key, id, resolve);
            });
        }

        $scope.decodeEntities = (function () {
            // this prevents any overhead from creating the object each time
            var element = document.createElement('div');

            function decodeHTMLEntities(str) {
                if (str && typeof str === 'string') {
                    // strip script/html tags
                    str = str.replace(
                        /<script[^>]*>([\S\s]*?)<\/script>/gim,
                        ''
                    );
                    str = str.replace(
                        /<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gim,
                        ''
                    );
                    element.innerHTML = str;
                    str = element.textContent;
                    element.textContent = '';
                }

                return str;
            }

            return decodeHTMLEntities;
        })();

        function createLogWorkProcess(worklog, date) {
            return new Promise(function (resolve, reject) {
                JIRA.logwork.call(
                    {
                        key: worklog.key,
                        tow: worklog.attributeValue,
                        fields: {
                            summary: worklog.description,
                        },
                        actualEffort: worklog.worked,
                    },
                    new Date(parseInt(date)),
                    function () {
                        resolve();
                    }
                );
            });
        }

        function createUpdateProcess(changeObj) {
            return new Promise(function (resolve, reject) {
                JIRA.updateWorklog.call(changeObj, function () {
                    console.log('resolve');
                    resolve();
                });
            });
        }

        function worklogChanged(worklog, __worklog) {
            var changeObj = { id: worklog.id };
            angular.forEach(worklog, function (v, k) {
                if (v !== __worklog[k]) {
                    changeObj[k] = v;
                }
            });
            return Object.keys(changeObj).length == 1 ? null : changeObj;
        }

        $scope.getWorklog();
    }
})();
