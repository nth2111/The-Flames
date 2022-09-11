var config = JSON.parse(localStorage.getItem('config'));
if (!config) {
    config = {
        NATIVE: 'com.google.chrome.listener.message.host',
        USER: 'tranghus05',
        PASSWORD: '',
        PROJECT: ['THEFLAMES'],
        JIRA_URL: 'https://theflames.atlassian.net/jira/',
        DEPARTMENT: 'THEFLAMES',
        A_DAY: 86400000,
        WORKED_TIME: 8,
        HAFT_DAY: 4, 
        ISSUE: {
            productKey: 'customfield_12610',
            typeOfWork: [
                'Create',
                'Study',
                'Review',
                'Correct',
                'Test',
                'Translate',
            ],
            productMapping: {
                utCase: 'UT Case',
                itCase: 'IT Case',
                sourceCode: 'Source code',
                utReport: 'UT Report',
                itReport: 'IT Report',
                req: 'Requirement',
                projectRecord: 'Project Record',
                detailDesign: 'Detail Design',
                eviroment: 'Eviroment',
                reviewDD: 'ReviewDD',
                reviewCode: 'ReviewCode',
                reviewUT: 'ReviewUT',
                reviewSST: 'ReviewSST',
                trainingRecord: 'Training record',
                SRS: 'SRS',
                study: 'Study',
                cmReport: 'CM report',
            },
            productTowMapping: {
                review: 2,
                utCase: 0,
                itCase: 0,
                utReport: 4,
                itReport: 4,
                sourceCode: 0,
                projectRecord: 1,
                detailDesign: 0,
                eviroment: 0,
                reviewDD: 2,
                reviewCode: 2,
                reviewUT: 2,
                reviewSST: 2,
                trainingRecord: 1,
                SRS: 0,
                study: 1,
                cmReport: 0,
            },
        },
        DAILY_REPORT: {
            to: ['trangvth7'],
            cc: ['Group'],
            subject: 'Daily report',
            formatDate: 'MM/DD/YYYY',
            defaultIntroMsg:
                'Gửi nhóm, \nMình xin gửi lại báo cáo nhóm ngày {{date}}',
            defaultOuttroMsg: 'Thanks and best regards',
            defaultProject: 'THEFLAMES',
            domain: '@gmail.com',
            logwork: true,
        },
        REMIND: {
            remindAfter: 0.1,
        },
    };

    localStorage.setItem('config', JSON.stringify(config));
}

window.config = config;
