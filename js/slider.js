var searchParties = {"spoe": true, "oevp": true, "fpoe": false, "gruene": false, "neos": false, "frank": false, "none": false};
var searchTeams = {"liberty": false, "spy": true, "unknown": false};
var representatives, format, parties, teams, genders;
var blocked = true;
var filteredRepresentatives;
var jsonRepresentatives = "./data/representatives.json";
var jsonFormat = "./data/format.json";
var jsonParties = "./data/parties.json";
var jsonTeams = "./data/teams.json";
var jsonGenders = "./data/genders.json";
var imgPath = "./img/representatives/";
var packageSize, index = 0;

function findElements() {
    $slideContent = $("#slideContent");
    $slideLeft = $("#slideLeft");
    $slideRight = $("#slideRight");
}

function calculatePackageSize() {
    var $virtual, imgWidth, columnWidth, rowSize, $screenWidth;
    $virtual = $("<div class='repImg'></div>");
    imgWidth = $virtual.width();
    columnWidth = $slideContent.width();
    rowSize = Math.floor(columnWidth / imgWidth);
    
    $screenWidth = $(window).width();
    
    if ($screenWidth >= 992)
        packageSize = 2 * rowSize;
    else
        packageSize = rowSize;
}

function jsonResolve(target, representative) {
    var str = target;
    for (var sub in representative) {
        str = str.replace(new RegExp("%" + sub.toUpperCase() + "%", 'g'), representative[sub]);
    }
    for (var sub in genders) {
        str = str.replace(new RegExp("%" + sub + "%", 'g'), genders[sub][representative.gender]);
    }
    return str;
}

function setListeners() {
    $("#partyInput :checkbox").change(function () {
        searchParties[$(this).attr("id")] = !searchParties[$(this).attr("id")];
        updateRepresentatives();
        index = 0;
        slide(true);
    });
    $("#teamInput :checkbox").change(function () {
        searchTeams[$(this).attr("id")] = !searchTeams[$(this).attr("id")];
        updateRepresentatives();
        index = 0;
        slide(true);
    });
    $("#contactModal").on("show.bs.modal", function (event) {
        var button = $(event.relatedTarget);
        var representative = button.data("representative");
        representative = representatives[representative];
        var modal = $(this);
        var $modalTitle = modal.find(".modal-title");
        var $modalContent = modal.find(".modal-body");
        
        var name = representative.firstname + " " + representative.lastname;
        if (representative.title != "")
            name = representative.title + " " + name;
        
        $modalTitle.text(name);
        
        inArray = representatives.indexOf(representative);
        img = imgPath + inArray + ".jpg";
        $.get(img).fail(function () {
            img = imgPath + "none.gif";
        })
        
        $modalContent.html($("<div class='row' style='position: relative;'></div>")
            .append($("<img class='img-responsive center-block' src='" + img + "' />"))
            .append($("<div class='teamSign " + representative.team + "' style='background: " + teams[representative.team].color + ";'>" + teams[representative.team].name + "</div>")));
        $modalContent.append($("<p></p>").append(jsonResolve(teams[representative.team].introduction, representative) + " ")
            .append($("<span style='color: " + teams[representative.team].color + ";'></span>").text(jsonResolve(teams[representative.team].todo, representative))));
    })
}

function requestJSON(file, task) {
    return $.getJSON(file, task);
}

$(document).ready(function () {
    findElements();
    calculatePackageSize();
    setListeners();
    requestJSON(jsonFormat, function (passFormat) {
        format = passFormat.entries;
    });
    requestJSON(jsonParties, function (passParties) {
        parties = passParties.entries;
    });
    requestJSON(jsonTeams, function (passTeams) {
        teams = passTeams.entries;
    });
    requestJSON(jsonGenders, function (passGenders) {
        genders = passGenders.entries;
    });
    requestJSON(jsonRepresentatives, function (passRepresentatives) {
        representatives = passRepresentatives.entries;
        blocked = false;
        $slideLeft.removeClass("disabled");
        $slideRight.removeClass("disabled");
        updateRepresentatives();
        slide(true);
    });
});

function updateRepresentatives() {
    filteredRepresentatives = [];
    
    $.each(representatives, function (arrayID, representative) {
        if (matchSettings(representative))
            filteredRepresentatives.push(representative);
    });
}

function matchSettings(representative) {
    return searchParties[representative.party] && searchTeams[representative.team];
}

function updateSlider(direction) {
    $slideContent.empty();
    
    if (!direction) {
        index = bend(index - 2 * packageSize);
    }
    
    var i, pointer, representative;
    for (i = 0; i < packageSize; i++) {
        pointer = bend(index + i);
        representative = filteredRepresentatives[pointer];
        var builtRepresentative = buildRepresentative(representative);
        $slideContent.append(builtRepresentative);
    }
    
    index = index + i;
}

function bend(x) {
    var len = filteredRepresentatives.length;
    if (x > len - 1)
        x = x % len;
    while (x < 0)
        x = x + len;
    return x;
}

function buildRepresentative(representative) {
    if (!representative)
        return;
    
    var div, img, inArray;
    
    inArray = representatives.indexOf(representative);
    img = imgPath + inArray + ".jpg";
    $.get(img).fail(function () {
        img = imgPath + "none.gif";
    })
    
    div = $("<div class='repBox'></div>");
    
    div.append($("<div class='colorBox " + representative.team + "'></div>"));
    div.append($("<div class='detailsBox'></div>").append($("<p class='name'></p>").text(representative.lastname)).append($("<p class='party'></p>").text(parties[representative.party].short)));
    div.append($("<img class='repImg' src='" + img + "' alt='" + representative.lastname + "' />"));
    div.append($("<button type='button' class='btn btn-default btn-md' data-representative='" + inArray + "' data-toggle='modal' data-target='#contactModal'>Kontakt</button>"));
    
    return div;
}

function slide(direction) {
    if (!blocked) {
        blocked = true;
        
        $slideContent.removeClass("slideBackwards");
        $slideContent.removeClass("slideForwards");
        $slideContent.offset($slideContent.offset());
        
        if (direction)
            $slideContent.addClass("slideForwards");
        else
            $slideContent.addClass("slideBackwards");

        setTimeout(function () {
            updateSlider(direction)
            blocked = false;
        }, 300);
    }
}
