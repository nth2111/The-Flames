var Util = window.Util,
    productKey = config.ISSUE.productKey,
    productMapping = config.ISSUE.productMapping,
    productTowMapping = config.ISSUE.productTowMapping;

var JIRA = {
    /**
     * @desc
     * @param {Object} data
     */
    __WorkLog_updateTypeOfWork: function (data) {
        return new Promise(function (resolve, reject) {
            $.get(
                `${config.JIRA_URL}rest/tempo-core/1/work-attribute/value?worklogId=${data.id}`
            ).then(function (res) {
                $.ajax({
                    method: 'PUT',
                    url: `${config.JIRA_URL}rest/tempo-core/1/work-attribute/value/${res[0].id}`,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: JSON.stringify({
                        workAttribute: {
                            id: 1,
                        },
                        value: data.attributeValue,
                        worklogId: data.id,
                    }),
                }).then(resolve, reject);
            });
        });
    },

    /**
     * @desc
     * @param {*} data
     */
    __WorkLog_updateDesc: function (data) {
        return $.post({
            url: `${config.JIRA_URL}rest/tempo-rest/1.0/worklogs/description/update`,
            data: `worklogId=${data.id}&worklogDescription=${encodeURI(
                data.description
            )}`,
        });
    },

    /**
     * @desc
     * @param {*} data
     */
    __WorkLog_updateTime: function (data) {
        return $.post({
            url: `${config.JIRA_URL}rest/tempo-rest/1.0/worklogs/hours/update`,
            data: `worklogId=${data.id}&worklogHours=${data.worked}&hourType=hoursSpent`,
        });
    },

    /**
     * @desc detect type of work by type, product or summary
     * @param {*} task task informations from JIRA
     */
    __Issue_detectTypeOfWork: function (task) {
        console.log(`JIRA:__detectTypeOfWork`);
        var tow;
        if (task.fields.issuetype.name === 'Bug') {
            console.log(`JIRA:__detectTypeOfWork: detect by Type - Correct`);
            return 'Correct';
        }

        angular.forEach(productMapping, function (v, k) {
            if (task.fields[productKey].indexOf(v) !== -1) {
                tow = config.ISSUE.typeOfWork[productTowMapping[k]];
            }
        });
        if (task.fields.summary.indexOf('meeting') !== -1) {
            return 'Review';
        }

        if (tow) {
            console.log(
                `JIRA:__detectTypeOfWork: detect by Product - TOW: ${tow}`
            );
            return tow;
        }

        angular.forEach(config.ISSUE.typeOfWork, function (type) {
            if (task.fields.summary.indexOf(type) !== -1) {
                tow = type;
            }
        });

        console.log(`JIRA:__detectTypeOfWork: detect by summary - TOW: ${tow}`);
        return tow;
    },

    /**
     * @desc get user absent informations
     * @param {*} params
     * @param {*} cb
     */
    __getAbs: function (params, cb) {
        console.log(`JIRA:__getAbs`);
        var all = [],
            abs = [];

        $.ajax({
            url: `${config.JIRA_URL}rest/hunger/1.0/project-absence-resource/absence/page_info`,
            type: `GET`,
            data: {
                projectId: params.pid,
                filterUsername: params.username,
                filterFromDate: params.startDate,
                filterToDate: params.endDate,
                pageNo: 1,
            },
        }).then(function (data) {
            console.log(`JIRA:__getAbs:get page info`);
            absLen = data.totalPages * 1 || 1;
            for (var i = 1; i <= absLen; i++) {
                all.push(
                    new Promise(function (resolve, reject) {
                        $.ajax({
                            url: `${config.JIRA_URL}rest/hunger/1.0/project-absence-resource/absence/get_all`,
                            type: 'GET',
                            data: {
                                projectId: params.pid,
                                filterUsername: params.username,
                                filterFromDate: params.startDate,
                                filterToDate: params.endDate,
                                pageNo: i,
                            },
                        }).then(function (data) {
                            for (var j in data) {
                                var obj = {
                                    note: data[j].note,
                                    date: data[j].fromDate,
                                    time: data[j].duration,
                                };
                                if (data[j].fromDate == data[j].toDate) {
                                    obj.date = data[j].fromDate;
                                    if (
                                        parseInt(data[j].duration) ==
                                        config.HAFT_DAY
                                    ) {
                                        obj.working = config.HAFT_DAY;
                                    }
                                    abs.push(obj);
                                } else {
                                    for (
                                        var d = data[j].fromDate;
                                        d <= data[j].toDate;
                                        d += config.A_DAY
                                    ) {
                                        obj.date = d;
                                        if (
                                            parseInt(data[j].duration) ==
                                            config.HAFT_DAY
                                        ) {
                                            obj.working = config.HAFT_DAY;
                                        }
                                        abs.push(obj);
                                    }
                                }
                            }

                            resolve();
                        }, reject);
                    })
                );
            }
            Promise.all(all).then(function () {
                cb && cb(abs);
            });
        });
    },

    /**
     * @desc create log work message for show notification
     * @param {*} currentWeek
     * @param {*} userAbs
     * @param {*} workLogs
     */
    __makeWorkLogMsg: function (currentWeek, userAbs, workLogs) {
        var start = currentWeek.from.getTime();
        var end = currentWeek.to.getTime();
        var needLogWork = [];

        for (var i = start; i <= end; i += config.A_DAY) {
            var toDay = new Date().getTime();
            if (i > toDay) {
                continue;
            }
            var isAbs = userAbs.find(function (item) {
                return i == item.date;
            });

            var logWork = workLogs.filter(function (item) {
                return i == new Date(`${item.date} 00:00:00`).getTime();
            });
            var title = `${new Date(i).getDate()}/${
                currentWeek.from.getMonth() + 1
            }`;
            var msg = null;
            if ((!logWork || logWork.length == 0) && !isAbs) {
                msg = `Chưa log work`;
            } else {
                var totalTime = 0;
                for (var j = 0; j < logWork.length; j++) {
                    totalTime += Number(logWork[j].worked);
                }
                if (isAbs) {
                    if (isAbs.working) {
                        if (totalTime > config.HAFT_DAY) {
                            msg = `Đã log: ${totalTime}h vào ngày nghỉ nửa ngày`;
                        } else {
                            msg = `Ngày nghỉ nửa ngày, cần log 4h`;
                        }
                    } else if (totalTime > 0) {
                        msg = `Đã log: ${totalTime}h vào ngày nghỉ`;
                    }
                } else {
                    if (totalTime == 0) {
                        msg = `Chưa log work => Cần log ngay.`;
                    }
                    if (totalTime < config.WORKED_TIME) {
                        msg = `Worked: ${totalTime}h, còn thiếu: ${
                            config.WORKED_TIME - totalTime
                        }h.`;
                    }
                }
            }

            if (msg) {
                needLogWork.push({
                    title: title,
                    message: msg,
                });
            }
        }

        return needLogWork;
    },

    /**
     * @desc
     * @param {*} pr
     * @param {*} page
     */
    __requestGetWorklog: function (pr, page) {
        return $.ajax({
            type: 'POST',
            url: `${config.JIRA_URL}rest/hunger/1.0/project-worklogs-report/get-all?page=${page}`,
            headers: {
                'Content-Type': `application/json`,
            },
            data: JSON.stringify(pr),
        });
    },

    /**
     * @desc check user authentication
     * @param {*} cb
     */
    __checkAuthen: function (cb) {
        $.get({
            url: `${config.JIRA_URL}rest/api/2/user?username=trangvth7`,
        }).then(
            function (res, status, opt) {
                cb(opt.getResponseHeader('X-AUSERNAME') === config.USER);
            },
            function (res) {
                cb(res.getResponseHeader('X-AUSERNAME') === config.USER);
            }
        );
    },

    __getProjectComponents: function (key) {
        return $.get(`${config.JIRA_URL}rest/api/2/project/${key}/components`);
    },

    /**
     * @desc get project id
     * @param {*} cb
     */
    __getProjectId: function (cb) {
        var self = this;
        var projectId = JSON.parse(localStorage.getItem('project'));
        console.log('Util:', 'get project id from localStorage', projectId);
        if (!projectId || projectId.length == 0) {
            console.log('Util:', 'get project id from JIRA');
            $.get({
                url: `${config.JIRA_URL}rest/api/2/project`,
            }).then(function (projects) {
                var prjs = {
                        ids: [],
                        info: {},
                    },
                    components = [];

                for (var i in projects) {
                    for (var j in config.PROJECT) {
                        if (projects[i].key == config.PROJECT[j]) {
                            components.push(
                                self.__getProjectComponents(projects[i].key)
                            );
                            prjs.ids.push(projects[i].id);
                        }
                    }
                }

                Promise.all(components).then(function (res) {
                    for (var i of res) {
                        if (i.length == 0) {
                            continue;
                        }
                        prjs.info[i[0].project] = i;
                    }
                    localStorage.setItem('project', JSON.stringify(prjs));
                    cb && cb();
                });
            });
        } else {
            cb && cb();
        }
    },

    /**
     * @desc authenticate
     * @param {} cb
     */
    __authen: function (cb) {
        var self = this;
        console.log('Do Authen');
        self.__checkAuthen(function (data) {
            if (data) {
                console.log('Authenticated');
                self.__getProjectId(function () {
                    console.log('Authen callback');
                    cb && cb();
                });
            } else {
                $.post({
                    url: `${config.JIRA_URL}login.jsp`,
                    headers: {
                        Accept: `text/html, */*; q=0.01`,
                        'Content-Type': `application/x-www-form-urlencoded; charset=UTF-8`,
                    },
                    data: `os_username=${config.USER}&os_password=${config.PASSWORD}&os_destination=&user_role=&atl_token=&login=Log+In`,
                }).then(function (res) {
                    console.log('Authen successfull');
                    self.__getProjectId(function () {
                        console.log('Authen callback');
                        cb && cb();
                    });
                });
            }
        });
    },
    /**
     * @desc check task list to day and over due
     */
    checkTaskJIRA: function () {
        $.get({
            url: `${config.JIRA_URL}rest/api/2/search?jql=status in (Open, "In Progress", Reopened) AND due <= "0" AND assignee in (currentUser())&maxResults=500`,
        }).then(function (res) {
            if (res.total == 0) {
                AppNotification.show(
                    `checkTaskJIRA`,
                    {
                        title: `Tình trạng task JIRA.`,
                        message: `Hiện tại thì anh không có task nào.`,
                        buttons: [
                            {
                                title: `OK`,
                            },
                        ],
                    },
                    [
                        function (notifId) {
                            AppNotification.hide(notifId);
                        },
                    ]
                );
                return;
            }

            var list = [];
            var toDay = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate(),
                0,
                0,
                0
            ).getTime();
            for (var key in res.issues) {
                var due = new Date(
                    `${res.issues[key].fields.duedate} 00:00:00`
                ).getTime();
                list.push({
                    title: due == toDay ? 'To day:' : 'Over Due:',
                    message: res.issues[key].key,
                });
            }

            if (list.length != 0) {
                AppNotification.show(
                    `jiraOverDue`,
                    {
                        type: `list`,
                        title: `Task status`,
                        message: `Task status`,
                        items: list,
                        buttons: [
                            {
                                title: `Mở JIRA Dashboard`,
                            },
                            {
                                title: `Bỏ qua`,
                            },
                        ],
                    },
                    [
                        function (notifId) {
                            chrome.tabs.create({
                                url: `${config.JIRA_URL}secure/Dashboard.jspa`,
                            });
                            AppNotification.hide(notifId);
                        },
                        function (notifId) {
                            AppNotification.hide(notifId);
                        },
                    ]
                );
            }
        });
    },

    /**
     * @desc open logwork
     */
    logWorkRemine: function (args) {
        var self = this,
            currentWeek = args[0];

        self.getUserWorkLog.call(
            currentWeek.from,
            currentWeek.to,
            function (workLogs, userAbs, record) {
                if (record == 0) {
                    AppNotification.show(
                        'logWorkNow',
                        {
                            title: `Chưa log work nguyên tuần luôn.`,
                            message: `Log ngay đi không mất tiền giờ.`,
                            buttons: [
                                {
                                    title: `OK, để tôi xem.`,
                                },
                            ],
                        },
                        [
                            function (notifId) {
                                AppNotification.hide(notifId);
                            },
                        ]
                    );
                    return;
                }
                var needLogWorkMsg = self.__makeWorkLogMsg(
                    currentWeek,
                    userAbs,
                    workLogs
                );

                if (needLogWorkMsg.length !== 0) {
                    AppNotification.show(
                        `logWork`,
                        {
                            type: `list`,
                            title: `Timesheet status`,
                            message: `Timesheet status`,
                            items: needLogWorkMsg,
                            buttons: [
                                {
                                    title: `OK`,
                                },
                            ],
                        },
                        [
                            function (notifId) {
                                AppNotification.hide(notifId);
                            },
                        ]
                    );
                }
            }
        );
    },

    /**
     * @desc check task has due date = today and status open (support resolve)
     * @param {*} cb
     */
    checkTaskToday: function (args) {
        var cb = args[0];

        $.get({
            url: `${config.JIRA_URL}rest/api/2/search?jql=status in (Open, "In Progress", Reopened) AND due <= "0" AND assignee in (currentUser())&maxResults=500`,
        }).then(function (res) {
            if (res.total == 0) {
                return;
            }

            for (var key in res.issues) {
                AppNotification.show(
                    `updateTaskStatus:${res.issues[key].key}`,
                    {
                        message: `Task: "${res.issues[key].key}" cần phải update status.`,
                        buttons: [
                            {
                                title: `Xem trên JIRA.`,
                            },
                            {
                                title: `Bỏ qua`,
                            },
                        ],
                    },
                    [
                        function (notifId) {
                            chrome.tabs.create({
                                url: `${config.JIRA_URL}browse/${
                                    notifId.split(':')[1]
                                }`,
                            });
                            AppNotification.hide(notifId);
                        },
                        function (notifId) {
                            AppNotification.hide(notifId);
                        },
                    ]
                );
            }
            cb && cb(600000, 3);
        });
    },

    /* jshint ignore:start */
    multiLogwork: async function (args) {
        var tasks = args[0],
            date = moment(args[1]),
            cb = args[2],
            urls = `${config.JIRA_URL}rest/tempo-rest/1.0/worklogs/`,
            logWorkPromise = [];
        angular.forEach(tasks, function (task) {
            data =
                `user=${config.USER}&ansienddate=${date.format(
                    'YYYY-MM-DD'
                )}&ansidate=${date.format('YYYY-MM-DDThh:mm:ss')}&datefield=` +
                `${date.format('YYYY-MM-DD')}&time=${
                    task.actualEffort
                }&remainingEstimate=0&comment=${
                    task.fields.summary
                }&_TypeofWork_=${task.tow}`;
            logWorkPromise.push(
                $.post({
                    url: urls + task.key,
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded',
                    },
                    data: data,
                })
            );
        });

        Promise.all(logWorkPromise).then(function (res) {
            let logWorkSuccess = true;
            $.each(res, function (i, status) {
                let _status = $(status).find('submit-result').attr('valid');
                if (_status == 'false') {
                    logWorkSuccess = false;
                }
                tasks[i].logworkSuccess = _status;
            });
            cb && cb(logWorkSuccess);
        });
    },

    getTaskList: function (args) {
        var jql = args[0],
            cb = args[1],
            url = `${config.JIRA_URL}rest/api/2/search?jql=${jql}`;
        $.get(url).then(function (res) {
            cb && cb(res);
        });
    },
    /* jshint ignore:end */

    getUserWorkLog: function (args) {
        var self = this,
            from = args[0],
            to = args[1],
            cb = args[2],
            all = [],
            otherPage = [],
            workLogs = [],
            userAbs = [],
            record = 0,
            ids = JSON.parse(localStorage.getItem('project')).ids,
            startDate = Util
                ? Util.toJIRAFormatDate(from)
                : moment(from).format('DD/MMM/YY'),
            endDate = Util
                ? Util.toJIRAFormatDate(to)
                : moment(to).format('DD/MMM/YY');

        for (var i in ids) {
            all.push(
                new Promise(function (resolve, reject) {
                    var pr = {
                        pid: ids[i],
                        startDate: startDate,
                        endDate: endDate,
                        username: config.USER,
                    };
                    self.__requestGetWorklog(pr, 1).then(function (data) {
                        record += data.records;
                        workLogs = workLogs.concat(data.rows);
                        self.__getAbs(pr, function (abs) {
                            userAbs = userAbs.concat(abs);
                            resolve(data);
                        });
                        if (data.total > 1) {
                            for (var j = 2; j <= data.total; j++) {
                                otherPage.push(
                                    new Promise(function (resolve, reject) {
                                        self.__requestGetWorklog(pr, j).then(
                                            function (data) {
                                                record += data.records;
                                                workLogs = workLogs.concat(
                                                    data.rows
                                                );
                                                resolve(data);
                                            },
                                            reject
                                        );
                                    })
                                );
                            }
                        }
                    }, reject);
                })
            );
        }
        Promise.all(all).then(function () {
            Promise.all(otherPage).then(function () {
                cb && cb(workLogs, userAbs, record);
            });
        });
    },

    deleteWorklog: function (args) {
        var key = args[0],
            id = args[1],
            cb = args[2];

        $.ajax({
            url: `${config.JIRA_URL}rest/api/2/issue/${key}/worklog/${id}`,
            method: 'DELETE',
        }).then(function () {
            cb && cb();
        });
    },

    getTaskInfo: function (args) {
        var key = args[0],
            cb = args[1],
            url = `${config.JIRA_URL}rest/api/2/issue/${key}`;
        $.get(url).then(function (res) {
            cb && cb(res);
        });
    },

    logwork: function (args) {
        // console.log('logwork ', args);
        var task = args[0],
            date = moment(args[1]),
            cb = args[2];
        var reqData = {
            issueKey: task.key,
            period: false,
            time: ` ${date.format('hh:mm:ss')}`,
            remainingTime: 0,
            startDate: date.format('DD/MMM/YY'),
            endDate: date.format('DD/MMM/YY'),
            timeSpend: task.actualEffort * 3600,
            typeOfWork: task.tow,
            username: `${config.USER}`,
            description: task.fields.summary,
        };

        reqData = JSON.stringify(reqData);
        urls = `${config.JIRA_URL}rest/tempo/1.0/log-work/create-log-work`;
        // console.log('url ', urls);
        // console.log('data ', reqData);
        $.post({
            url: urls,
            headers: {
                'Content-type': 'application/json',
                dataType: 'json',
            },
            data: reqData,
        }).then(function () {
            cb && cb();
        });
    },

    updateWorklog: function (args) {
        var data = args[0],
            cb = args[1];
        var reqData = { id: data.id };
        if (data.worked) {
            reqData.worked = data.worked.toString();
        }

        if (data.description) {
            reqData.description = data.description;
        }

        if (data.attributeValue) {
            reqData.attributeValue = data.attributeValue;
        }

        urls = `${config.JIRA_URL}rest/tempo/1.0/issue-worklogs/351427/${data.id}`;
        console.log('url ', urls);
        console.log('data ', JSON.stringify(reqData));

        $.ajax({
            url: urls,
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
                dataType: 'json',
            },
            data: JSON.stringify(reqData),
        }).then(function () {
            cb && cb();
        });
    },
};

/* Register call function for do authen before get data */
console.log(`JIRA: Register call function: Start`);
for (method in JIRA) {
    if (method.slice(0, 2) == '__') {
        console.log(`JIRA: Private function: ${method}`);
        continue;
    }
    console.log(`JIRA: Register call for: ${method}`);
    (function (method) {
        JIRA[method].call = function () {
            var args = arguments;
            JIRA.__authen(function () {
                console.log(`JIRA:${method}:call`);
                return JIRA[method](args);
            });
        };
    })(method);
}

console.log(`JIRA: Register call function: End`);
window.JIRA = JIRA;
