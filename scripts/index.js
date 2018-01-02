
var locations;
var commodities;
var countrySelection;
var isMapInit;

$(document).ready(function () {
    var countriesVal;
    var yearVal;
    var commoditiesVal;
    init();
    $(document).on("submit", "#filterForm", function () {
        var val = locations[this.countries.value];
        if (val && ((countriesVal != this.countries.value) ||
            (yearVal != this.year.value) ||
            (commoditiesVal != this.commodities.value))) {
            commodityOnlyFlag = (countriesVal == this.countries.value) && (yearVal == this.year.value)
            countriesVal = this.countries.value;
            yearVal = this.year.value;
            commoditiesVal = this.commodities.value;
            processData(locations[countriesVal], yearVal, commoditiesVal, commodityOnlyFlag)
        } else if (!val) {
            alert("Please select a Country")
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
    $.getJSON("scripts/restCountries3.5.json", function (result) {
        countrySelection = result;
        for (let arr of countrySelection) {
            if (arr.latlng) {
                locations[arr.alpha3Code] = arr;
                if (comtradeLocs[arr.numericCode])
                    $("#countries").append($(new Option("value", arr.alpha3Code)).html(arr.name));
            }
        }
    })
    $.getJSON("scripts/CommodityHS.2.json", function (result) {
        commodities = result;
        $("#commodities").append($(new Option("value", null)).html("All"));
        for (let key of Object.keys(commodities)) {
            if (commodities[key]) {
                $("#commodities").append($(new Option("value", key)).html(commodities[key].desc));
            }
        }
    })
}
var ajaxResponse;

function processData(location, year, commodity, commodityOnlyFlag) {
    var ajaxLink = "./scripts/mockdata.json"
    if (location && year) {
        hidePage()
        //ajaxLink = "https://comtrade.un.org/api/get?r=" + location.numericCode + "&px=HS&ps=" + year + "&type=C&freq=A"
        location = locations["CHN"]
    }
    if (ajaxResponse && commodityOnlyFlag) {
        processResults(ajaxResponse, location, year, commodity)
    } else {
        $.ajax({
            url: ajaxLink,
            success: function (result) {
                ajaxResponse = result;
                processResults(result, location, year, commodity)
            }
        });
    }
}

function processResults(result, location, year, commodity) {
    var plots = new Map();
    var links = new Map();
    var areas = new Map();
    var partnerCountriesMap = parsePartnerCountries(result, commodity);
    if (partnerCountriesMap && Object.keys(partnerCountriesMap).length > 0) {
        $("#summaryTab").click();
        var partnerCountriesList = [];
        var sortedCountries;
        var count = 5;
        var countryTopTrade
        var content;
        var des;
        var noTrade = [];

        Object.entries(partnerCountriesMap).forEach(([key, value]) => {
            partnerCountriesList.push(value);
        })

        sortedCountries = sortTrade(partnerCountriesList);

        plots[location.alpha3Code] = {
            latitude: location.latlng[0],
            longitude: location.latlng[1],
            size: 8,
            tooltip: { content: location.name }
        }
        for (let datum of sortedCountries) {
            des = locations[datum.pt3ISO];
            if (des && datum.rt3ISO != "WLD" && datum.pt3ISO != "WLD") {
                countryTopTrade = getTopTradesPerCountry(datum.trades)
                content = "";
                plots[datum.pt3ISO] = {
                    latitude: des.latlng[0],
                    longitude: des.latlng[1],
                    size: 0,
                    text: { content: datum.ptTitle, attrs: { "font-size": 10 } }
                }
                if (countryTopTrade.imports.topTrade) {
                    content = "<div class='font-weight-bold'> Top Import </div>" + commodities[countryTopTrade.imports.topTrade.cmdCode].desc +
                        "</br> <span class='font-weight-bold'> Total Value: $ </span>" + abbreviateNumber(countryTopTrade.imports.total);
                }
                if (countryTopTrade.exports.topTrade) {
                    content += "<div class='font-weight-bold'> Top Export </div>" + commodities[countryTopTrade.exports.topTrade.cmdCode].desc +
                        "</br> <span class='font-weight-bold'> Total Value: $ </span>" + abbreviateNumber(countryTopTrade.exports.total)
                }
                links[datum.pt3ISO + datum.rt3ISO] = {
                    factor: -.4,
                    between: [datum.rt3ISO, datum.pt3ISO],
                    attrs: {
                        stroke: "#a4e100",
                        "stroke-width": (count + 3) / 2,
                        "stroke-linecap": "round",
                        "arrow-end": "block",
                        opacity: .9
                    }, tooltip: {
                        content: "<div class='font-weight-bold'> " + datum.rt3ISO + " To " + datum.pt3ISO + "</div>" + content
                    }
                }
                count--;
            }
            if (count == 0) {
                break;
            }
        }

        // for area
        for (let key of Object.keys(locations)) {
            var des = locations[key];
            if (partnerCountriesMap[key]) {
                areas[des.alpha2Code] = {
                    value: partnerCountriesMap[key].TradeValue,
                    tooltip: {
                        content: "<div class='font-weight-bold'>" + partnerCountriesMap[key].ptTitle +
                            "</div> <div class='font-weight-bold'>Top Commodity:</div> " + partnerCountriesMap[key].trades[0].cmdDescE +
                            " <div class='font-weight-bold'>Total Trade Value :</div> $" + abbreviateNumber(partnerCountriesMap[key].TradeValue)
                    }
                }
            } else if (location.alpha3Code == key) {
                areas[des.alpha2Code] = {
                    attrs: {
                        fill: "#f38a03"
                    }, attrsHover: {
                        fill: "#c43e00"
                    },
                    tooltip: {
                        content: des.name
                    }
                }
            } else {
                areas[des.alpha2Code] = {
                    tooltip: {
                        content: des.name
                    }
                }
                noTrade.push(des);
            }
        }

        processWorldTrades(partnerCountriesMap["WLD"], commodity)
        processCountryTrades(sortedCountries, noTrade)
        showPage()
        if (!isMapInit) {
            initMapael();
        }
        updateMapael(plots, links, areas)
    } else {
        $("#messaging > h1").text("No Results found. Please select another commodity or year then click filter.")
        document.getElementById("messaging").style.display = "block";
        document.getElementById("loader").style.display = "none";
    }
}

function showPage() {
    document.getElementById("loader").style.display = "none";
    $("#mainContent").removeClass("d-none")
    document.getElementById("mainContent").style.display = "block";
}

function hidePage() {
    document.getElementById("loader").style.display = "block";
    document.getElementById("messaging").style.display = "none";
    document.getElementById("mainContent").style.display = "none";
}

function setTotals(value) {
    $("#totalValue").text(abbreviateNumber(value.exportsTotal + value.importsTotal))
    $("#totalImports").text(abbreviateNumber(value.importsTotal))
    $("#totalExports").text(abbreviateNumber(value.exportsTotal))
}
function processCountryTrades(trade, noTrade) {
    // TODO: Top 5 imports and exports
    var title = "Top 5 Exports";
    var tableId = "#countryTradeExports";
    var limit = 1;
    var sortedWorldTrades = groupTradeFlows(trade)
    var commodityName;
    var topCommodity;
    setTotals(sortedWorldTrades);
    for (let partner of trade) {
        if (partner.pt3ISO != "WLD") {
            if (partner.pt3ISO) {
                $("#topTradeCountry").text(locations[partner.pt3ISO].name);
            } else {
                $("#topTradeCountry").text(partner.ptTitle);
            }
            break;
        }
    }

    clearProgress(tableId)
    setTableTitle(tableId, title)
    for (let trade of sortedWorldTrades.exports) {
        if (trade.pt3ISO != "WLD")
            if (limit <= 5) {
                if (locations[trade.pt3ISO]) {
                    commodityName = locations[trade.pt3ISO].name;
                } else {
                    commodityName = trade.ptTitle;
                }
                if (!topCommodity) {
                    topCommodity = trade;
                }
                insertProgressRow(tableId,
                    [commodityName,
                        abbreviateNumber(trade.TradeValue),
                        getPercentage(trade.TradeValue, topCommodity.TradeValue),
                        limit]);
                limit++;
            } else {
                break;
            }
    }

    title = "Top 5 Imports";
    tableId = "#countryTradeImports";
    limit = 1;
    commodityName;
    topCommodity = null;

    clearProgress(tableId)
    setTableTitle(tableId, title)
    for (let trade of sortedWorldTrades.imports) {
        if (trade.pt3ISO != "WLD")
            if (limit <= 5) {
                if (locations[trade.pt3ISO]) {
                    commodityName = locations[trade.pt3ISO].name;
                } else {
                    commodityName = trade.ptTitle;
                }
                if (!topCommodity) {
                    topCommodity = trade;
                }
                insertProgressRow(tableId,
                    [commodityName,
                        abbreviateNumber(trade.TradeValue),
                        getPercentage(trade.TradeValue, topCommodity.TradeValue),
                        limit]);
                limit++;
            } else {
                break;
            }
    }

    title = "Countries without trade";
    tableId = "#noTrade";
    commodityName;
    topCommodity = null;

    clearProgress(tableId)
    setTableTitle(tableId, title)
    for (let country of noTrade) {
        insertListRow(tableId, country.name)
    }
}
function processNoTrades(trades) {
    var noTradeCommodity = new Map();
    var tableId = "#noCommodityTrade";
    var title = "Commodities without trade"
    for (let key of Object.keys(commodities)) {
        noTradeCommodity.set(parseInt(key), commodities[key])
    }
    for (let tradeData of trades) {
        noTradeCommodity.delete(tradeData.cmdCode);
    }
    clearProgress(tableId)
    setTableTitle(tableId, title)
    if (noTradeCommodity.length > 1) {
        for (let trade of noTradeCommodity) {
            insertListRow(tableId, commodities[trade.cmdCode].desc);
        }
    } else {
        $(tableId).append("<h1 class='display-5'>Country has all commodity traded</h1>")
    }
}
function processWorldTrades(trade, commodity) {
    // TODO: Top 5 imports and exports
    var title = "Top 5 Imports";
    var tableId = "#worldTradeImports";
    var limit = 1;
    var worldTrades = groupTradeFlows(trade.trades)
    var sortedTrade = sortTrade(worldTrades.imports)
    var sortedAllTrades = sortTrade(trade.trades)

    processNoTrades(trade.trades)

    if (commodity != 'null') {
        $("#topTradeCommodity").parent().parent().find(".card-header").text("Trade Commodity")
        $("#topTradeCommodity").text(commodities[commodity].desc)
        $("#noCommodityTrade").parent().addClass("d-none")
        $("#commoditiesTab").addClass("disabled")
    } else {
        $("#commoditiesTab").removeClass("disabled")
        for (let trade of sortedAllTrades) {
            if (commodities[trade.cmdCode]) {
                $("#noCommodityTrade").parent().removeClass("d-none")
                $("#topTradeCommodity").parent().parent().find(".card-header").text("Top Trade Commodity")
                $("#topTradeCommodity").text(commodities[trade.cmdCode].desc)
                break;
            }
        }

        clearProgress(tableId)
        setTableTitle(tableId, title)
        for (let trade of sortedTrade) {
            if (limit <= 5) {
                insertProgressRow(tableId,
                    [commodities[parseInt(trade.cmdCode)].desc,
                    abbreviateNumber(trade.TradeValue),
                    getPercentage(trade.TradeValue, sortedTrade[0].TradeValue),
                        limit]);
            } else {
                break;
            }
            limit++;
        }

        title = "Top 5 Exports";
        tableId = "#worldTradeExports";
        limit = 1;
        sortedTrade = sortTrade(worldTrades.exports)

        clearProgress(tableId)
        setTableTitle(tableId, title)
        for (let trade of sortedTrade) {
            if (limit <= 5) {
                insertProgressRow(tableId,
                    [commodities[parseInt(trade.cmdCode)].desc,
                    abbreviateNumber(trade.TradeValue),
                    getPercentage(trade.TradeValue, sortedTrade[0].TradeValue),
                        limit]);
            } else {
                break;
            }
            limit++;
        }
    }
}

function groupTradeFlows(trades) {
    var result = {
        imports: [],
        exports: [],
        importsTotal: 0,
        exportsTotal: 0
    }

    for (let trade of trades) {
        if (trade)
            if (trade.rgDesc == 'Import') {
                result.imports.push(trade);
                result.importsTotal = trade.TradeValue + result.importsTotal;
            } else if (trade.rgDesc == 'Export') {
                result.exports.push(trade)
                result.exportsTotal = trade.TradeValue + result.exportsTotal;
            }
    }

    return result;
}


function getLoc(code) {
    var locArray = locations[code];
    return locArray;
}

function parsePartnerCountries(result, commodity) {
    var parsedArray = [];
    console.log(result.dataset)
    for (let data of result.dataset) {
        if (!commodity || commodity == 'null' || commodity == parseInt(data.cmdCode)) {
            if (!parsedArray[data.pt3ISO]) {
                parsedArray[data.pt3ISO] = {
                    rgDesc: data.rgDesc,
                    rtCode: data.rtCode,
                    rtTitle: data.rtTitle,
                    rt3ISO: data.rt3ISO,
                    ptCode: data.ptCode,
                    ptTitle: data.ptTitle,
                    pt3ISO: data.pt3ISO,
                    qtCode: data.qtCode,
                    TradeValue: 0,
                    trades: []
                };
            }
            if (data.cmdCode == "0") {
                console.log(data.cmdCode)
            }
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
                cmdCode: parseInt(data.cmdCode),
                cmdDescE: data.cmdDescE,
                NetWeight: data.NetWeight,
                GrossWeight: data.GrossWeight,
                TradeValue: data.TradeValue,
            })
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


function sortTradeDesc(partnerCountriesList) {
    for (i = 0; i < partnerCountriesList.length; i++) {
        for (o = 1; o < partnerCountriesList.length; o++) {
            if (partnerCountriesList[o - 1].TradeValue > partnerCountriesList[o].TradeValue) {
                temp = partnerCountriesList[o];
                partnerCountriesList[o] = partnerCountriesList[o - 1];
                partnerCountriesList[o - 1] = temp;
            }
        }
    }
    return partnerCountriesList;
}

function groupTrades(data) {
    var trades = [];
    for (let datum of data.dataset) {
        if (!trades[datum.cmdCode]) {
            trades[datum.cmdCode] = {
                period: datum.period,
                rgCode: datum.rgCode,
                rgDesc: datum.rgDesc,
                rtCode: datum.rtCode,
                rtTitle: datum.rtTitle,
                rt3ISO: datum.rt3ISO,
                cmdCode: datum.cmdCode,
                cmdDescE: datum.cmdDescE,
                NetWeight: datum.NetWeight,
                GrossWeight: datum.GrossWeight,
                TradeValue: datum.TradeValue
            };
        }
        trades[datum.cmdCode].TradeValue = trades[datum.cmdCode].TradeValue + datum.TradeValue
    }
    return trades;
}


function getTopTradesPerCountry(trades) {
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
    return { imports: imports, exports: exports }
}