var searchParties = {"spoe": false, "oevp": false, "fpoe": false, "gruene": false, "neos": false, "frank": false, "none": false};
var searchTeams = {"liberty": false, "spy": false, "unknown": false};
var representatives, format, parties, teams, genders;
var blocked = true;
var filteredRepresentatives = [], steps = [], currentStep = -1;
var jsonRepresentatives = "./data/representatives.json";
var jsonFormat = "./data/format.json";
var jsonParties = "./data/parties.json";
var jsonTeams = "./data/teams.json";
var jsonGenders = "./data/genders.json";
var imgPath = "./img/representatives/";
var packageSize, imgWidth = 137.15;
var image_fake = false;

function findElements() {
    $slideContent = $("#slideContent");
    $slideLeft = $("#slideLeft");
    $slideRight = $("#slideRight");
}

function calculatePackageSize() {
    var $virtual, columnWidth, rowSize, screenWidth;
    columnWidth = $slideContent.width();
    rowSize = Math.floor(columnWidth / imgWidth);
    screenWidth = $(window).width();
    
    if (screenWidth >= 992)
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

function adaptSearch() {
    changed = updateRepresentatives();
    if (changed) {
        currentStep = -1;
        slide(true);
    }
}

function setListeners() {
    $("#partyInput :checkbox").change(function () {
        searchParties[$(this).attr("id")] = !searchParties[$(this).attr("id")];
        adaptSearch();
    });
    $("#teamInput :checkbox").change(function () {
        searchTeams[$(this).attr("id")] = !searchTeams[$(this).attr("id")];
        adaptSearch();
    });
    $("#contactModal").on("show.bs.modal", build_modal_dialog);
}

function getMPimg (representative, inArray) {
    if (typeof image_fake !== 'undefined' && image_fake) {
        return imgPath + "none.gif";
    } else {
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
        currentStep = randomizeStep();
        slide(true);
    });
});

function updateRepresentatives() {
    changed = false;
    cachedRepresentatives = [];
    steps = [];

    for (var i = 0; i < representatives.length; i++) {
        if (matchSettings(representatives[i])) {
            cachedRepresentatives.push(representatives[i]);
            if (filteredRepresentatives.indexOf(representatives[i]) == -1) {
                changed = true;
            }
        } else if (filteredRepresentatives.indexOf(representatives[i]) != -1) {
            changed = true;
        }
    }
    
    for (var i = 0; i < cachedRepresentatives.length; i++) {
        if (i % packageSize == 0) {
            steps.push(i);
        }
    }
    
    filteredRepresentatives = cachedRepresentatives;
    console.log("There are", filteredRepresentatives.length, "representatives in the search result now.");
    console.log("Using steps", steps.join(", "));
    return changed;
}

function randomizeStep() {
    btw = Math.floor(Math.random() * steps.length);
    return btw;
}

function emptySearch(dict) {
    var r = true;
    for (entry in dict)
        r = r && ! dict[entry];
    return r;
}

function matchSettings(representative) {
    return (emptySearch(searchParties) || searchParties[representative.party]) &&
           (emptySearch(searchTeams) || searchTeams[representative.team]);
}

function checkBlocked() {
    var len = filteredRepresentatives.length;
    if (len <= 0) {
        $slideContent.text("Kein zutreffendes Suchergebnis gefunden.");
        setDisabled(true);
        return true;
    } else {
        setDisabled(false);
        return false;
    }
}

function setDisabled(value) {
    if (value) {
        $slideLeft.addClass("disabled");
        $slideRight.addClass("disabled");
    } else {
        $slideLeft.removeClass("disabled");
        $slideRight.removeClass("disabled");
    }
}

function updateSlider(direction) {
    var len = filteredRepresentatives.length;
    $slideContent.empty();
    
    if (direction) {
        currentStep = bend(currentStep + 1, steps.length);
    } else {
        currentStep = bend(currentStep - 1, steps.length);
    }
    
    left = len - steps[currentStep] + packageSize;
    goForward = Math.min(packageSize, left);
    
    for (var i = 0; i < goForward; i++) {
        var representative = filteredRepresentatives[steps[currentStep] + i];
        var builtRepresentative = buildRepresentative(representative);
        $slideContent.append(builtRepresentative);
    }
}

function bend(x, len) {
    if (x > len - 1)
        x = x % len;
    while (x < 0)
        x = x + len;
    return x;
}

function updateBullets() {
    $("#bullets").empty();
    
    for (var i = 0; i < steps.length; i++) {
        if (steps.indexOf(steps[i]) == currentStep) {
            $("#bullets").append($("<span></span>").html("&#9724;"));
        } else {
            $("#bullets").append($("<span></span>").html("&#9723;").click({ndx: i}, function (event) {
                if (currentStep < event.data.ndx) {
                    currentStep = event.data.ndx - 1;
                    slide(true);
                } else {
                    currentStep = event.data.ndx + 1;
                    slide(false);
                }
                
            }));
        }
    }
}

function buildRepresentative(representative) {
    if (!representative)
        return;
    
    var div, img, inArray;
    
    inArray = representatives.indexOf(representative);
    MPimg = getMPimg(representative, inArray);
    
    div = $("<div></div>").attr("class", "repBox");
    div.html($("<a></a>").attr("href", "").attr("data-toggle", "modal").attr("data-target", "#contactModal").attr("data-representative", inArray)
            .append($("<div></div>").attr("class", "colorBox " + representative.team + "BG")));
    div.append($("<div></div>").attr("class", "detailsBox")
            .append($("<p></p>").attr("class", "name").text(representative.lastname))
            .append($("<p></p>").attr("class", "party").text(parties[representative.party].short)));
    div.append($("<img />").attr("class", "repImg").attr("src", MPimg).attr("alt", representative.lastname));
    div.append($("<button></button>").attr("type", "button").attr("class", "btn btn-default btn-md").attr("data-representative", inArray).attr("data-toggle", "modal").attr("data-target", "#contactModal").text("Kontakt"));
    return div;
}

function slide(direction) {
    if (blocked) {
        blocked = checkBlocked();
    }
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
            updateSlider(direction);
            updateBullets();
            blocked = checkBlocked();
        }, 300);
    }
}

function build_modal_dialog (event) {
    var button = $(event.relatedTarget);
    var representative = button.data("representative");
    representative = representatives[representative];
    var modal = $(this);
    var $contactButtons = $("#contactButtons");
    var MPimg, MPname;
        
    inArray = representatives.indexOf(representative);
    MPimg = getMPimg(representative, inArray);
    MPname = getMPname(representative);
    
    $("#repColor").attr("class", representative.team + "BG");
    modal.find(".modal-header h2").text(MPname);
    $("#repImg").attr("src", MPimg)
                .attr("style", "border-color: " + teams[representative.team].color + ";");
    $("#teamSign").text(teams[representative.team].name)
                  .attr("style", "background: " + teams[representative.team].color + ";");
    $("#introduction").text(jsonResolve(teams[representative.team].introduction, representative) + " ");
    $("#todo").text(jsonResolve(teams[representative.team].todo, representative))
              .attr("class", representative.team);
    
    $("#legalNotice").html("Portrait &copy; " + representative.copyright);
    
    $formMail = modal.find("#formMail").parent();
    if (representative.mail) {
        $formMail.removeClass("hidden");
        $formMail.attr("href", format.mail.url.replace("%MAIL%", representative.mail).replace("%SUBJECT%", encodeURIComponent(jsonResolve(format.mail.subject, representative))).replace("%MESSAGE%", encodeURIComponent(jsonResolve(format.mail.message, representative))));
        $formMail.find("span").text(representative.mail);
    } else if (parties[representative.party].mail) {
        $formMail.removeClass("hidden");
        $formMail.attr("href", "mailto:" + parties[representative.party].mail);
        $formMail.find("span").text(parties[representative.party].mail);
    } else {
        $formMail.addClass("hidden");
        $formMail.attr("href", "");
        $formMail.find("span").text("");
    }
    
    $formPhone = modal.find("#formPhone").parent();
    if (representative.phone) {
        $formPhone.removeClass("hidden");
        $formPhone.attr("href", "tel:" + representative.phone);
        $formPhone.find("span").text(representative.phone);
    } else if (parties[representative.party].phone) {
        $formPhone.removeClass("hidden");
        $formPhone.attr("href", "tel:" + parties[representative.party].phone);
        $formPhone.find("span").text(parties[representative.party].phone);
    } else {
        $formPhone.addClass("hidden");
        $formPhone.attr("href", "");
        $formPhone.find("span").text("");
    }
    
    $formMobile = modal.find("#formMobile").parent();
    if (representative.mobile) {
        $formMobile.removeClass("hidden");
        $formMobile.attr("href", "tel:" + representative.mobile);
        $formMobile.find("span").text(representative.mobile);
    } else {
        $formMobile.addClass("hidden");
        $formMobile.attr("href", "");
        $formMobile.find("span").text("");
    }
    
    $formFax = modal.find("#formFax").parent();
    if (representative.fax) {
        $formFax.removeClass("hidden");
        $formFax.attr("href", "fax:" + representative.fax);
        $formFax.find("span").text(representative.fax);
    } else if (parties[representative.party].fax) {
        $formFax.removeClass("hidden");
        $formFax.attr("href", "fax:" + parties[representative.party].fax);
        $formFax.find("span").text(parties[representative.party].fax);
    } else {
        $formFax.addClass("hidden");
        $formFax.attr("href", "");
        $formFax.find("span").text("");
    }
    
    $formTwitter = modal.find("#formTwitter").parent();
    if (representative.twitter) {
        $formTwitter.removeClass("hidden");
        $formTwitter.attr("href", format.twitter.url.replace("%MESSAGE%", encodeURIComponent(jsonResolve(format.twitter.message.replace("%TWITTER%", representative.twitter), representative))));
    } else {
        $formTwitter.addClass("hidden");
        $formTwitter.attr("href", "");
    }
    
    $formFacebook = modal.find("#formFacebook").parent();
    if (representative.facebook) {
        $formFacebook.removeClass("hidden");
        $formFacebook.attr("href", format.facebook.url.replace("%FACEBOOK%", representative.facebook));
    } else {
        $formFacebook.addClass("hidden");
        $formFacebook.attr("href", "");
    }
    
    $formWeb = modal.find("#formWeb").parent();
    if (representative.website) {
        $formWeb.removeClass("hidden");
        $formWeb.attr("href", representative.website);
    } else {
        $formWeb.addClass("hidden");
        $formWeb.attr("href", "");
    }

    $("#contactAnnotation").html(jsonResolve("Du hast von %002% %LASTNAME% eine Rückmeldung bekommen oder gar %060% Meinung geändert? <a href='mailto:office@akvorrat.at?subject=act.staatsschutz.at'>Teile uns das bitte mit</a>.", representative));
}