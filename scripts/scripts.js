var SI_PREFIXES = ["", "k", "M", "B", "T", "P", "E"];

function abbreviateNumber(number){

    // what tier? (determines SI prefix)
    var tier = Math.log10(number) / 3 | 0;

    // if zero, we don't need a prefix
    if(tier == 0) return number;

    // get prefix and determine scale
    var prefix = SI_PREFIXES[tier];
    var scale = Math.pow(10, tier * 3);

    // scale the number
    var scaled = number / scale;

    // format number and add prefix as suffix
    return scaled.toFixed(1) + prefix;
}

function getPercentage(value, total) {
    return ((value/total) * 100).toFixed(2);
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
        },
        plots: plots,
        // Links allow you to connect plots between them
        links: links,
        areas: areas
    });
}
