if (!window.config) {
  var config = window.config = JSON.parse(localStorage.getItem('config'));
}

var Util = {
  parseParams: function (str) {
    str = str.slice(1);
    var list = str.split('&');
    var params = {};
    for (var item of list) {
      item = item.split('=');
      params[item[0]] = item[1];
    }

    return params;
  },

  toUrlParams: function (obj) {
    var str = [];
    for (key in obj) {
      str.push(`${key}=${obj[key]}`);
    }

    return `?${str.join('&')}`;
  },
  /**
   * @desc set hours, minuties, seconds, miliseconds to zero
   * @param {*} date javascript object date
   */
  setTimeToZero: function (date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return new Date(date);
  },

  /**
   * @desc format DD/MMM/YY
   * @param {dateObject} date 
   */
  toJIRAFormatDate: function (date) {
    return date.toLocaleDateString("en-au", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).replace(/\s/g, '/').replace('.', '');
  },

  /**
   * @desc get start, end date of current week
   * @returns {Object}
   */
  getWeek: function (date) {
    var curr = date ? new Date(date) : new Date();
    return {
      from: this.setTimeToZero(new Date(curr.setDate(curr.getDate() - curr.getDay() + 1))),
      to: this.setTimeToZero(new Date(curr.setDate(curr.getDate() - curr.getDay() + 5)))
    };
  }
};

window.Util = Util;