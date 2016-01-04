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
var image_fake = false;

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
        var $contactButtons = $("#contactButtons");
        var MPimg, MPname;
            
        inArray = representatives.indexOf(representative);
        MPimg = getMPimg(representative, inArray);
        MPname = getMPname(representative);
        
        $("#repColor").attr("class", representative.team);
        modal.find(".modal-header h2").text(MPname);
        $("#repImg").attr("src", MPimg)
                    .attr("style", "border-color: " + teams[representative.team].color + ";");
        $("#teamSign").text(teams[representative.team].name)
                      .attr("style", "background: " + teams[representative.team].color + ";");
        $("#introduction").text(jsonResolve(teams[representative.team].introduction, representative) + " ");
        $("#todo").text(jsonResolve(teams[representative.team].todo, representative))
                  .attr("style", "color: " + teams[representative.team].color + ";");
    })
}

function getMPimg (representative, inArray) {
    if (typeof image_fake !== 'undefined' && image_fake) {
        return imgPath + "none.gif";
    }
    else {
        return imgPath + 'small/' + inArray + ".jpg";    
    }
}

function getMPname (representative) {
    MPname = [
        (representative.honorific_prefix || ''),
        (representative.firstname || ''),
        (representative.lastname || '')
    ];
    MPname = MPname.join(' ').trim();
    if (representative.honorific_suffix) {
        MPname += ', ' + representative.honorific_suffix;
    }
    return MPname;
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
        representatives = passRepresentatives;
        blocked = false;
        $slideLeft.removeClass("disabled");
        $slideRight.removeClass("disabled");
        updateRepresentatives();
        slide(true);
    });
});

function updateRepresentatives() {
    filteredRepresentatives = [];
    
    for (var i = 0; i < representatives.length; i++) {
        if (matchSettings(representatives[i])) {
            filteredRepresentatives.push(representatives[i]);
        }
    }
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
    MPimg = getMPimg(representative, inArray);
    
    div = $("<div class='repBox'></div>");
    div.append($("<div class='colorBox " + representative.team + "'></div>"))
       .append($("<div class='detailsBox'></div>").append($("<p class='name'></p>").text(representative.lastname)).append($("<p class='party'></p>").text(parties[representative.party].short)))
       .append($("<img class='repImg' src='" + MPimg + "' alt='" + representative.lastname + "' />"))
       .append($("<button type='button' class='btn btn-default btn-md' data-representative='" + inArray + "' data-toggle='modal' data-target='#contactModal'>Kontakt</button>"));
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
