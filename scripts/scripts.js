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

function clearTable(table) {
    tableRows = $(table + " > tbody tr")
    tableRows.empty()
    tableRows = $(table + " > thead tr")
    tableRows.empty()
}

function setTableTitle(tableId, title) {
    $(tableId).parent().children(".title").replaceWith("<h2 class='display-5'>" + title + "</h2>")
}

function insertTableHeader(table, headData) {
    $(table + " thead").append("<tr><th>" + headData[0] + "</th><th>" + headData[1] + "</th></tr>")
}

function insertTableRow(table, rowData) {
    $(table + " tbody").append("<tr><td>" + rowData[0] + "</td><td>" + rowData[1] + "</td></tr>")
}