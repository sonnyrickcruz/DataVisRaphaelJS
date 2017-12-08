var locations = (function () {
    var locations = new Map();
    $.ajax({
        type: "GET",
        url: "https://restcountries.eu/rest/v2/all?fields=name;alpha3Code;latlng;alpha2Code",
        success: function (result) {
            $.map(result, function (arr) {
                if (arr.latlng && arr.latlng[0] && arr.latlng[1]) {
                    locations[arr.alpha3Code] = arr;
                }
            })
        },
        async: false
    });
    return locations;
})();

function getLoc(code) {
    var locArray = locations[code];
    return locArray;
}

function parsePartnerCountries(result) {
    var parsedArray = [];
    $.map(result.dataset, function (data) {
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
    });
    return parsedArray;
}

function sortTrade(partnerCountriesList) {
    for (i = 0; i < partnerCountriesList.length; i++) {
        for (o = 1; o <= i; o++) {
            if (partnerCountriesList[o - 1].TradeValue < partnerCountriesList[o].TradeValue) {
                temp = partnerCountriesList[o];
                partnerCountriesList[o] = partnerCountriesList[o - 1];
                partnerCountriesList[o - 1] = temp;
            }
        }
    }
    if (partnerCountriesList.length > 6)
        //partnerCountriesList = partnerCountriesList.slice(0, 6);
        return partnerCountriesList;
}

function getTrades(data) {
    var trades = { imports: [], exports: [] };
    $.map(data.dataset, function (datum) {
        if (datum.rgDesc) {
            if (datum.rgDesc == "Import") {
                trades.imports.push(datum);
            } else (datum.rgDesc == "Export")
            trades.exports.push(datum)
        }
    })
    trades.imports = sortTrade(trades.imports);
    trades.exports = sortTrade(trades.exports);
    return trades;
}

function groupTrades(data) {
    var trades = [];
    $.map(data.dataset, function (datum) {
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
    });
    return trades;
}


$.ajax({
    //url: "https://comtrade.un.org/api/get?r=004&px=HS&ps=2015&type=C&freq=A", success: function (result) {
    url: "./scripts/mockdata.json", success: function (result) {
        var partnerCountriesMap = parsePartnerCountries(result);
        var trades = getTrades(result);
        var groupedTrades = groupTrades(result);
        console.log(groupedTrades)
        var partnerCountriesList = [];
        Object.entries(partnerCountriesMap).forEach(([key, value]) => {
            partnerCountriesList.push(value);
        })
        var sortedCountries = sortTrade(partnerCountriesList);
        var plots = new Map();
        var links = new Map();
        var areas = new Map();
        var count = 0;
        var orig = getLoc("AFG");
        for (let datum of sortedCountries) {
            if (datum.rt3ISO != "WLD" && datum.pt3ISO != "WLD") {
                if (datum.pt3ISO) {
                    var des = getLoc(datum.pt3ISO);
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
                        areas[des.alpha2Code] = {
                            "value": datum.TradeValue,
                            "tooltip": {
                                "content": "<span style=\"font-weight:bold;\">" + datum.ptTitle + "</span><br />Total Trade Value : " + datum.TradeValue
                            }
                        }

                        if (count <= 5) {
                            areas[des.alpha2Code].text = { content: datum.ptTitle, attrs: { "font-size": 10 }, className: "Besh" },
                                links[datum.pt3ISO + datum.rt3ISO] = {
                                    factor: -.4,
                                    between: [datum.rt3ISO, datum.pt3ISO],
                                    attrs: {
                                        stroke: "#a4e100",
                                        "stroke-width": (count + 3) / 2,
                                        "stroke-linecap": "round",
                                        "arrow-end": "block-wide-long",
                                        opacity: .9
                                    }, tooltip: { content: datum.rt3ISO + " to " + datum.pt3ISO }
                                }
                            count++;
                        }
                    }
                }
            }
        }

        processMapael(plots, links, areas)
    }
});

function processMapael(plots, links, areas) {
    $(".mapcontainer").mapael({
        map: {
            name: "world_countries",
            defaultArea: {
                attrs: {
                    fill: "#fff",
                    stroke: "#232323",
                    "stroke-width": 0.3
                }
            },defaultLink: {
                factor: 0.4
                , attrsHover: {
                    stroke: "#FFEB3B"
                }
            },
            defaultPlot: {
                text: {
                    attrs: {
                        fill: "#b4b4b4"
                    },
                    attrsHover: {
                        fill: "#fff",
                        "font-weight": "bold"
                    }
                }
            }
            , zoom: {
                enabled: true
                , step: 0.25
                , maxLevel: 20
            }
        },
        legend: {
            area: {
                mode: "horizontal",
                display: true,
                labelAttrs: {
                    "font-size": 12,
                },
                marginLeft: 5,
                marginLeftLabel: 5,
                title: "Country population",
                slices: [
                    {
                        max: 50000000,
                        attrs: {
                            fill: "#6aafe1"
                        },
                        label: "Less than 5M"
                    },
                    {
                        min: 50000000,
                        max: 100000000,
                        attrs: {
                            fill: "#459bd9"
                        },
                        label: "Between 5M and 10M"
                    },
                    {
                        min: 100000000,
                        max: 500000000,
                        attrs: {
                            fill: "#2579b5"
                        },
                        label: "Between 10M and 50M"
                    },
                    {
                        min: 500000000,
                        attrs: {
                            fill: "#1a527b"
                        },
                        label: "More than 50M"
                    }
                ]
            },
            plot: {
                mode: "horizontal",
                display: false,
                title: "City population",
                marginBottom: 6,
                slices: [
                    {
                        type: "circle",
                        max: 500000,
                        attrs: {
                            fill: "#FD4851",
                            "stroke-width": 1
                        },
                        attrsHover: {
                            transform: "s1.5",
                            "stroke-width": 1
                        },
                        label: "Less than 500 000",
                        size: 10
                    },
                    {
                        type: "circle",
                        min: 500000,
                        max: 1000000,
                        attrs: {
                            fill: "#FD4851",
                            "stroke-width": 1
                        },
                        attrsHover: {
                            transform: "s1.5",
                            "stroke-width": 1
                        },
                        label: "Between 500 000 and 1M",
                        size: 20
                    },
                    {
                        type: "circle",
                        min: 1000000,
                        attrs: {
                            fill: "#FD4851",
                            "stroke-width": 1
                        },
                        attrsHover: {
                            transform: "s1.5",
                            "stroke-width": 1
                        },
                        label: "More than 1M",
                        size: 30
                    }
                ]
            }
        },
        plots: plots,
        // Links allow you to connect plots between them
        links: links,
        areas: areas
    });
}
