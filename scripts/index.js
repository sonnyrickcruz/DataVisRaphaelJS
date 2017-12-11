
var locations;

$(document).ready(function () {
    init();
    $(document).on("submit", "#filterForm", function () {
        var val = locations[this.countries.value];
        if (val) {
            processData(locations[this.countries.value], this.year.value)
        } else {
            alert ("Please select a Country")
        }
        return false;
    })
});
function init() {
    maxYear = 2016;
    startYear = 2010;

    for (i = maxYear; i > startYear; i--) {
        $("#year").append($(new Option("value", i)).html(i));
    }

    comtradeLocs = new Map();
    locations = new Map();
    $("#countries").append($(new Option("value", null)).html("Select Country"));
    $.getJSON("scripts/reporterAreas.json", function (result) {
        for (let arr of result.results) {
            comtradeLocs[("00" + arr.id).slice(-3)] = arr;
        }
    })
    $.getJSON("scripts/restCountries3.json", function (result) {
        for (let arr of result) {
            if (arr.latlng && arr.latlng[0] && arr.latlng[1]) {
                locations[arr.alpha3Code] = arr;
                if (comtradeLocs[arr.numericCode])
                    $("#countries").append($(new Option("value", arr.alpha3Code)).html(arr.name));
            }
        }
    })
}

function processData(location, year) {
    var ajaxLink = "./scripts/mockdata.json"
    if (location && year) {
        hidePage()
        ajaxLink = "https://comtrade.un.org/api/get?r=" + location.numericCode + "&px=HS&ps=" + year + "&type=C&freq=A"
    }
    $.ajax({
        url: ajaxLink, success: function (result) {
            var partnerCountriesMap = parsePartnerCountries(result);
            var trades = getTrades(result);
            var groupedTrades = groupTrades(result);
            var partnerCountriesList = [];
            Object.entries(partnerCountriesMap).forEach(([key, value]) => {
                partnerCountriesList.push(value);
            })
            var sortedCountries = sortTrade(partnerCountriesList);
            var plots = new Map();
            var links = new Map();
            var areas = new Map();
            var count = 5;
            var orig = location;
            processWorldTrades(partnerCountriesMap["WLD"])
            processCountryTrades(sortedCountries)
            for (let datum of sortedCountries) {
                if (datum.pt3ISO && locations[datum.pt3ISO] && datum.rt3ISO != "WLD" && datum.pt3ISO != "WLD") {
                    var des = locations[datum.pt3ISO];
                    var polyline2;
                    if (!plots[datum.rt3ISO]) {
                        areas[orig.alpha2Code] = {
                            attrs: {
                                fill: "#f38a03"
                            }
                            , attrsHover: {
                                fill: "#a4e100"
                            }
                        }
                        plots[datum.rt3ISO] = {
                            latitude: orig.latlng[0],
                            longitude: orig.latlng[1],
                            size: 8,
                            tooltip: { content: datum.rtTitle }
                        }
                    }
                    if (!isNaN(des.latlng[0]) && !isNaN(des.latlng[1])) {
                        plots[datum.pt3ISO] = {
                            latitude: des.latlng[0],
                            longitude: des.latlng[1],
                            tooltip: { content: datum.ptTitle },
                            size: 0
                        }
                        var topTrade = datum.trades[0]
                        areas[des.alpha2Code] = {
                            "value": datum.TradeValue,
                            "tooltip": {
                                "content": "<div class='font-weight-bold'>" + datum.ptTitle + "</div> <div class='font-weight-bold'>Top Commodity:</div> " + topTrade.cmdDescE + " <div class='font-weight-bold'>Total Trade Value :</div> $" + abbreviateNumber(datum.TradeValue)
                            }
                        }

                        if (count > 0) {
                            var countryTopTrade = getTopTradesPerCountry(datum.trades)
                            if (des.alpha3Code != "USA" && des.alpha3Code != "FRA")
                                areas[des.alpha2Code].text = { content: datum.ptTitle, attrs: { "font-size": 10 } };
                            links[datum.pt3ISO + datum.rt3ISO] = {
                                factor: -.4,
                                between: [datum.rt3ISO, datum.pt3ISO],
                                attrs: {
                                    stroke: "#a4e100",
                                    "stroke-width": (count + 3) / 2,
                                    "stroke-linecap": "round",
                                    "arrow-end": "block",
                                    opacity: .9
                                }, tooltip: { content: "<div class='font-weight-bold'> Top Import </div>" +  countryTopTrade.imports.topTrade.cmdDescE + 
                                                        "</br> <span class='font-weight-bold'> Total Value: </span>" + abbreviateNumber(countryTopTrade.imports.total) +
                                                        "<div class='font-weight-bold'> Top Export </div>" +  countryTopTrade.exports.topTrade.cmdDescE + 
                                                        "</br> <span class='font-weight-bold'> Total Value: </span>" + abbreviateNumber(countryTopTrade.exports.total)}
                            }
                            console.log(countryTopTrade)
                            count--;
                        }
                    }
                }
            }
            showPage()
            processMapael(plots, links, areas)
        }
    });
}

function getTopTradesPerCountry(trades) {
    console.log(trades)
    imports = {
        total: 0,
        topTrade: null
    }
    exports = {
        total: 0,
        topTrade: null
    }
    for (let trade of trades) {
        if (trade.rgDesc) {
            if (trade.rgDesc == "Import") {
                if (imports.topTrade) {
                    if (trade.TradeValue > imports.topTrade.TradeValue) {
                        imports.topTrade = trade;
                    }
                } else {
                    imports.topTrade = trade;
                }
                imports.total = imports.total + trade.TradeValue
            } else if (trade.rgDesc == "Export") {
                if (exports.topTrade) {
                    if (trade.TradeValue > exports.topTrade.TradeValue) {
                        exports.topTrade = trade;
                    }
                } else {
                    exports.topTrade = trade;
                }
                exports.total = exports.total + trade.TradeValue
            }
        }
    }
    return {imports: imports, exports: exports}
}

function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
}

function hidePage() {
    document.getElementById("loader").style.display = "block";
    document.getElementById("mainContent").style.display = "none";
}

function processCountryTrades(trade) {
    var title = "Top 5 Country Trades";
    var tableId = "#countryTrade";
    var limit = 0;
    var sortedWorldTrades = sortTrade(trade)

    clearTable(tableId)
    setTableTitle(tableId, title)
    insertTableHeader(tableId, ["Commodity", "Value ($)"])
    for (let trade of sortedWorldTrades) {
        if (trade.pt3ISO != "WLD")
        if (limit < 5) {
            insertTableRow(tableId, [trade.ptTitle, abbreviateNumber(trade.TradeValue)]);
            limit++;
        } else {
            break;
        }
    }
}

function processWorldTrades(trade) {
    var title = "Top 5 World Trades";
    var tableId = "#worldTrade";
    var limit = 0;
    var sortedWorldTrades = sortTrade(trade.trades)

    clearTable(tableId)
    setTableTitle(tableId, title)
    insertTableHeader(tableId, ["Commodity", "Value ($)"])
    for (let trade of sortedWorldTrades) {
        if (limit < 5) {
            insertTableRow(tableId, [trade.cmdDescE, abbreviateNumber(trade.TradeValue)]);
        } else {
            break;
        }
        limit++;
    }
}

function getLoc(code) {
    var locArray = locations[code];
    return locArray;
}

function parsePartnerCountries(result) {
    var parsedArray = [];
    for (let data of result.dataset) {
        if (parsedArray[data.pt3ISO]) {
            parsedArray[data.pt3ISO].TradeValue = parsedArray[data.pt3ISO].TradeValue + data.TradeValue;
            parsedArray[data.pt3ISO].trades.push({
                yr: data.yr,
                period: data.period,
                rgDesc: data.rgDesc,
                rtTitle: data.rtTitle,
                rt3ISO: data.rt3ISO,
                ptCode: data.ptCode,
                ptTitle: data.ptTitle,
                pt3ISO: data.pt3ISO,
                cmdCode: data.cmdCode,
                cmdDescE: data.cmdDescE,
                NetWeight: data.NetWeight,
                GrossWeight: data.GrossWeight,
                TradeValue: data.TradeValue,
            })
        } else {
            parsedArray[data.pt3ISO] = {
                rgDesc: data.rgDesc,
                rtCode: data.rtCode,
                rtTitle: data.rtTitle,
                rt3ISO: data.rt3ISO,
                ptCode: data.ptCode,
                ptTitle: data.ptTitle,
                pt3ISO: data.pt3ISO,
                qtCode: data.qtCode,
                TradeValue: data.TradeValue,
                trades: [{
                    yr: data.yr,
                    period: data.period,
                    rgDesc: data.rgDesc,
                    rtTitle: data.rtTitle,
                    rt3ISO: data.rt3ISO,
                    ptCode: data.ptCode,
                    ptTitle: data.ptTitle,
                    pt3ISO: data.pt3ISO,
                    cmdCode: data.cmdCode,
                    cmdDescE: data.cmdDescE,
                    NetWeight: data.NetWeight,
                    GrossWeight: data.GrossWeight,
                    TradeValue: data.TradeValue,
                }]
            };
        }
    }
    return parsedArray;
}

function sortTrade(partnerCountriesList) {
    for (i = 0; i < partnerCountriesList.length; i++) {
        for (o = 1; o < partnerCountriesList.length; o++) {
            if (partnerCountriesList[o - 1].TradeValue < partnerCountriesList[o].TradeValue) {
                temp = partnerCountriesList[o];
                partnerCountriesList[o] = partnerCountriesList[o - 1];
                partnerCountriesList[o - 1] = temp;
            }
        }
    }
    return partnerCountriesList;
}

function getTrades(data) {
    var trades = new Map();
    for (let datum of data.dataset) {
        if (datum.rgDesc) {
            if (!trades[datum.pt3ISO]) {
                trades[datum.pt3ISO] = {
                    imports: [],
                    exports: []
                };
            }
            if (datum.rgDesc == "Import") {
                trades[datum.pt3ISO].imports.push(datum)
            } else if (datum.rgDesc == "Export") {
                trades[datum.pt3ISO].exports.push(datum)
            }
        }
    }
    return trades;
}

function groupTrades(data) {
    var trades = [];
    for (let datum of data.dataset) {
        if (!trades[datum.cmdCode]) {
            trades[datum.cmdCode] = {
                "period": datum.period,
                "rgCode": datum.rgCode,
                "rgDesc": datum.rgDesc,
                "rtCode": datum.rtCode,
                "rtTitle": datum.rtTitle,
                "rt3ISO": datum.rt3ISO,
                "cmdCode": datum.cmdCode,
                "cmdDescE": datum.cmdDescE,
                "NetWeight": datum.NetWeight,
                "GrossWeight": datum.GrossWeight,
                "TradeValue": datum.TradeValue
            };
        }
        trades[datum.cmdCode].TradeValue = trades[datum.cmdCode].TradeValue + datum.TradeValue
    }
    return trades;
}