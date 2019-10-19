var productionData = {}
var consumptionData = {}
var key = "";
var userid = ""
var systemid = ""
var startdateUnix = 0
var enddateUnix = 0
var secondsInOneDay = 60*60*24;

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4) {
      if (xmlHttp.status == 200) {
        if (callback) {
          callback(xmlHttp.responseText);
        }
      }
    }
  };
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
  xmlHttp.onerror = function() {
    console.error("Error calling " + theUrl);
  };
  xmlHttp.send(null);
}

function getProductionData() {
  var url = "https://api.enphaseenergy.com/api/v2/systems/" + systemid + "/rgm_stats?start_at=" + startdateUnix + "&end_at=" + enddateUnix + "&key=" + key + "&user_id=" + userid;
  httpGetAsync(url, onProductionDataReceived);
}

function onProductionDataReceived(response) {
  productionData = JSON.parse(response);
  getConsumptionData();
}

function getConsumptionData() {
  var url = "https://api.enphaseenergy.com/api/v2/systems/" + systemid + "/consumption_stats?start_at=" + startdateUnix + "&end_at=" + enddateUnix + "&key=" + key + "&user_id=" + userid;
  httpGetAsync(url, onConsumptionDataReceived);
}

function onConsumptionDataReceived(response) {
  consumptionData = JSON.parse(response);
  processData();
}

function processData() {
  var dailyProductionWh = getDailyWhValues(productionData.intervals, getWhFromProductionInterval);
  var dailyConsumptionWh = getDailyWhValues(consumptionData.intervals, getWhFromConsumptionInterval);
  var dailyNetWh = [];
  for (var i = 0; i < dailyConsumptionWh.length; i++) {
    dailyNetWh.push(dailyConsumptionWh[i] -= dailyProductionWh[i]);
  }
  var averageDailyProductionWh = getAverage(dailyProductionWh);
  var averageDailyConsumptionWh = getAverage(dailyConsumptionWh);
  var averageDailyNetWh = getAverage(dailyNetWh);

  var dailyExportedWh = getDailyExportedWhValues(productionData.intervals, consumptionData.intervals);
  var dailyImportedWh = getDailyImportedWhValues(productionData.intervals, consumptionData.intervals);

  var averageDailyExportedWh = getAverage(dailyExportedWh);
  var averageDailyImportedWh = getAverage(dailyImportedWh);

  var resultsDiv = document.getElementsByClassName("results")[0];

  var html = "";
  html += "<p>Average daily production (wh): " + averageDailyProductionWh + "</p>";
  html += "<p>Average daily consumption (wh): " + averageDailyConsumptionWh + "</p>";
  html += "<p>Average daily exported (wh): " + averageDailyExportedWh + "</p>";
  html += "<p>Average daily imported (wh): " + averageDailyImportedWh + "</p>";

  resultsDiv.innerHTML = html;
}

function getAverage(list) {
  var total = 0;
  for (var i = 0; i < list.length; i++) {
    total += list[i];
  }
  return total / list.length;
}

function getWhFromProductionInterval(interval) {
  return interval.wh_del;
}

function getWhFromConsumptionInterval(interval) {
  return interval.enwh;
}

function getDailyWhValues(intervals, getWhFromIntervalFunction) {
  var dailyWhValues = [];
  var dayIndex = 0;
  var nextdayTimeStamp = startdateUnix + ((dayIndex + 1) * secondsInOneDay);
  var currentWh = 0;
  for (var i = 0; i < intervals.length; i++) {
    currentWh += getWhFromIntervalFunction(intervals[i]);
    if (intervals[i].end_at >= nextdayTimeStamp) {
      dayIndex++;
      nextdayTimeStamp = startdateUnix + ((dayIndex + 1) * secondsInOneDay);
      dailyWhValues.push(currentWh);
      currentWh = 0;
    }
  }
  return dailyWhValues;
}

function getDailyExportedWhValues(productionIntervals, consumptionIntervals) {
  var dailyWhValues = [];
  var dayIndex = 0;
  var nextdayTimeStamp = startdateUnix + ((dayIndex + 1) * secondsInOneDay);
  var currentWh = 0;
  for (var i = 0; i < productionIntervals.length; i++) {
    productionWh = getWhFromProductionInterval(productionIntervals[i]);
    consumptionWh = getWhFromConsumptionInterval(consumptionIntervals[i]);
    netWh = productionWh - consumptionWh;
    if (netWh > 0) {
      currentWh += netWh;
    }
    if (productionIntervals[i].end_at >= nextdayTimeStamp) {
      dayIndex++;
      nextdayTimeStamp = startdateUnix + ((dayIndex + 1) * secondsInOneDay);
      dailyWhValues.push(currentWh);
      currentWh = 0;
    }
  }
  return dailyWhValues;
}

function getDailyImportedWhValues(productionIntervals, consumptionIntervals) {
  var dailyWhValues = [];
  var dayIndex = 0;
  var nextdayTimeStamp = startdateUnix + ((dayIndex + 1) * secondsInOneDay);
  var currentWh = 0;
  for (var i = 0; i < productionIntervals.length; i++) {
    productionWh = getWhFromProductionInterval(productionIntervals[i]);
    consumptionWh = getWhFromConsumptionInterval(consumptionIntervals[i]);
    netWh = productionWh - consumptionWh;
    if (netWh < 0) {
      currentWh += -netWh;
    }
    if (productionIntervals[i].end_at >= nextdayTimeStamp) {
      dayIndex++;
      nextdayTimeStamp = startdateUnix + ((dayIndex + 1) * secondsInOneDay);
      dailyWhValues.push(currentWh);
      currentWh = 0;
    }
  }
  return dailyWhValues;
}

function getUnixTimestampAtLocalMidnight(dateText) {
  var date = new Date(dateText + " 00:00:00");
  return date.getTime()/1000|0;
}

function decide() {
  key = document.getElementsByClassName("key-field")[0].value;
  userid = document.getElementsByClassName("userid-field")[0].value;
  systemid = document.getElementsByClassName("systemid-field")[0].value;
  var startdate = document.getElementsByClassName("startdate-field")[0].value;
  var enddate = document.getElementsByClassName("enddate-field")[0].value;
  startdateUnix = getUnixTimestampAtLocalMidnight(startdate);
  enddateUnix = getUnixTimestampAtLocalMidnight(enddate);
  var resultsDiv = document.getElementsByClassName("results")[0];
  resultsDiv.innerHTML = "<p>Querying Enlighten system, please wait...";
  getProductionData();
}
