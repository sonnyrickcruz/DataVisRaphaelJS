function abbreviateNumber(number) {
    var SI_PREFIXES = ["", "k", "M", "B", "T", "P", "E"];
    // what tier? (determines SI prefix)
    var tier = Math.log10(number) / 3 | 0;

    // if zero, we don't need a prefix
    if (tier == 0) return number;

    // get prefix and determine scale
    var prefix = SI_PREFIXES[tier];
    var scale = Math.pow(10, tier * 3);

    // scale the number
    var scaled = number / scale;

    // format number and add prefix as suffix
    return scaled.toFixed(1) + prefix;
}

function getPercentage(value, total) {
    return ((value / total) * 100).toFixed(2);
}

function clearTable(table) {
    tableRows = $(table + " > tbody tr")
    tableRows.empty()
    tableRows = $(table + " > thead tr")
    tableRows.empty()
}

function setTableTitle(tableId, title) {
    let x = $(tableId).parent().children(".title").text(title)
    if (title == "Imports") {
        x.prepend('<i class="fas fa-arrow-left"></i> ')
    } else if (title == "Exports") {
        x.prepend('<i class="fas fa-arrow-right"></i> ')
    }
}

function insertTableHeader(table, headData) {
    let tableHeader = "<tr>";
    for (let head of headData) {
        tableHeader += "<th>" + head + "</th>"
    }
    tableHeader += "</tr>"
    $(table + " thead").append(tableHeader)
}

function insertTableRow(table, rowData) {
    let tableRows = "<tr>";
    for (let row of rowData) {
        tableRows += "<td>" + row + "</td>";
    }
    tableRows += "</tr>";
    $(table + " tbody").append(tableRows)
}

function clearProgress(table) {
    $(table).empty();
}

function insertProgressRow(table, rowData) {
    $(table).append('<div class="progress"><div class="progress-bar" role="progressbar" style="width: ' 
        + rowData[2] + '%;" aria-valuenow="' + rowData[2] + '" aria-valuemin="0" aria-valuemax="100"></div></div>');
    $(table).append('<div class="col-lg-12 row my-2">' +
        '<div class="col-1 top p-0 m-0 font-weight-bold">' + rowData[3] + '</div>' +
        '<div class="col-9 name p-0 m-0 text-left">' + rowData[0] + '</div>' +
        '<div class="col-2 value p-0 m-0">' + rowData[1] + '</div>' + '</div>')
}

function insertListRow(table, rowData) {
    $(table).append('<div class="col-lg-12 row my-2">' +
        '<div class="col-12 name p-0 m-0 text-left">' + rowData + '</div>' + '</div>')
}

function initMapael() {
    $(".mapcontainer").mapael({
        map: {
            name: "world_countries",
            defaultArea: {
                attrs: {
                    fill: "#fff",
                    stroke: "#232323",
                    "stroke-width": 0.3
                }
            }, defaultLink: {
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
                enabled: false
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
                slices: [
                    {
                        max: 50000000,
                        attrs: {
                            fill: "#6aafe1"
                        },
                        label: "Less than 50M"
                    },
                    {
                        min: 50000000,
                        max: 100000000,
                        attrs: {
                            fill: "#459bd9"
                        },
                        label: "Between 50M and 100M"
                    },
                    {
                        min: 100000000,
                        max: 500000000,
                        attrs: {
                            fill: "#2579b5"
                        },
                        label: "Between 100M and 500M"
                    },
                    {
                        min: 500000000,
                        attrs: {
                            fill: "#1a527b"
                        },
                        label: "More than 500M"
                    }
                ]
            }
        }
    });
}

function updateMapael(plots, links, areas) {
    $(".mapcontainer").trigger('update', [{
        mapOptions: {
            areas: areas
        },
        deletePlotKeys : "all",
        deleteLinkKeys : "all",
        newLinks: links,
        newPlots: plots,
        animDuration: 500
    }])
}
