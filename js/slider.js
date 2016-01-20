var searchParties = {"spoe": false, "oevp": false, "fpoe": false, "gruene": false, "neos": false, "frank": false, "none": false};
var searchTeams = {"liberty": false, "spy": false, "unknown": false};
var representatives, format, parties, teams, genders;
var blocked = true, autocompleteSearchHovered = false;
var filteredRepresentatives = [], steps = [], currentStep = -1;
var jsonRepresentatives = "./data/representatives.json";
var jsonFormat = "./data/format.json";
var jsonParties = "./data/parties.json";
var jsonTeams = "./data/teams.json";
var jsonGenders = "./data/genders.json";
var imgPath = "./img/representatives/";
var packageSize, imgWidth = 137.15;
var image_fake = false;

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
        setupChart();
        $slideLeft.removeClass("disabled");
        $slideRight.removeClass("disabled");
        updateRepresentatives({
            "method": "settings"
        });
        currentStep = randomizeStep();
        slide(true);
    });
});

function findElements () {
    $slideContent = $("#slideContent");
    $slideLeft = $("#slideLeft");
    $slideRight = $("#slideRight");
}

function calculatePackageSize () {
    var $virtual, columnWidth, rowSize, screenWidth;
    columnWidth = $slideContent.width();
    rowSize = Math.floor(columnWidth / imgWidth);
    screenWidth = $(window).width();
    
    if (screenWidth >= 992)
        packageSize = 2 * rowSize;
    else
        packageSize = rowSize;
}

function setupChart () {
    var distributionTotal = [["liberty", 0], ["spy", 0], ["unknown", 0]];
    var distributionSpoe = [["liberty", 0], ["spy", 0], ["unknown", 0]];
    var distributionOevp = [["liberty", 0], ["spy", 0], ["unknown", 0]];
    
    for (var i = 0; i < representatives.length; i++) {
        var representative = representatives[i];
        if (representative.team == "liberty") {
            distributionTotal[0][1] = distributionTotal[0][1] + 1;
            if (representative.party == "spoe") {
                distributionSpoe[0][1] = distributionSpoe[0][1] + 1;
            } else if (representative.party == "oevp") {
                distributionOevp[0][1] = distributionOevp[0][1] + 1;
            }
        } else if (representative.team == "spy") {
            distributionTotal[1][1] = distributionTotal[1][1] + 1;
            if (representative.party == "spoe") {
                distributionSpoe[1][1] = distributionSpoe[1][1] + 1;
            } else if (representative.party == "oevp") {
                distributionOevp[1][1] = distributionOevp[1][1] + 1;
            }
        } else if (representative.team == "unknown") {
            distributionTotal[2][1] = distributionTotal[2][1] + 1;
            if (representative.party == "spoe") {
                distributionSpoe[2][1] = distributionSpoe[2][1] + 1;
            } else if (representative.party == "oevp") {
                distributionOevp[2][1] = distributionOevp[2][1] + 1;
            }
        }
    }
    
    var settings = {
        animate: false,
        seriesColors: ["#2CBC9B", "#E74B4C", "#4F4F8C"],
        seriesDefaults: {
            shadow: false,
            renderer: $.jqplot.PieRenderer, 
            rendererOptions: {
                diameter: 290,
                startAngle: 180, 
                sliceMargin: 5, 
                showDataLabels: true,
            	dataLabels: "value",
            }
        },
        title: {
            text: "",
            show: false,
        },
        grid: {
            drawGridLines: false,
            background: "transparent",
            borderWidth: 0,
            shadow: false
        },
        gridPadding: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        }
    };
    
    var plotTotal = $.jqplot ("chartTotal", [distributionTotal], settings);
    var plotSpoe = $.jqplot ("chartSpoe", [distributionSpoe], settings);
    var plotOevp = $.jqplot ("chartOevp", [distributionOevp], settings);
}

function jsonResolve (target, representative) {
    var str = target;
    for (var sub in representative) {
        str = str.replace(new RegExp("%" + sub.toUpperCase() + "%", "g"), representative[sub]);
    }
    for (var sub in genders) {
        str = str.replace(new RegExp("%" + sub + "%", "g"), genders[sub][representative.gender]);
    }
    return str;
}

function adaptSearch (method) {
    changed = updateRepresentatives(method);
    if (changed) {
        currentStep = -1;
        slide(true);
    }
}

function setListeners () {
    $("#partyInput :checkbox").change(function () {
        searchParties[$(this).attr("id")] = !searchParties[$(this).attr("id")];
        adaptSearch({
            "method": "settings"
        });
    });
    $("#teamInput :checkbox").change(function () {
        searchTeams[$(this).attr("id")] = !searchTeams[$(this).attr("id")];
        adaptSearch({
            "method": "settings"
        });
    });
    $("#searchInput").keyup(function (event) {
        if ($(this).val().length < 1) {
            $("#searchAutocomplete").addClass("hidden");
            $("#searchAutocomplete").find("table").empty();
        } else if (event.keyCode == 13) {
            $("#searchAutocomplete").addClass("hidden");
            adaptSearch({
                "method": "keyword",
                "keyword": $(this).val()
            });
        } else {
            $("#searchAutocomplete").removeClass("hidden");
            autocompleteSearch($(this).val());
        }
    });
    $("#searchInput").focusout(function () {
        if (!autocompleteSearchHovered) {
            $("#searchAutocomplete").addClass("hidden");
        }
    });
    $("#searchInput").focusin(function () {
        $("#searchAutocomplete").removeClass("hidden");
    });
    $("#searchInput").on("input", function (event) {
        if (!$(this).val().trim()) {
            adaptSearch({
                "method": "settings"
            });
        }
    });
    $("#searchAutocomplete").hover(
        function () {
            autocompleteSearchHovered = true;
        }, 
        function () {
            autocompleteSearchHovered = false;
        }
    );
    $("#searchButton").click(function () {
        adaptSearch({
            "method": "keyword",
            "keyword": $("#searchInput").val()
        });
    });
}

function autocompleteSearch (keyword) {
    $table = $("#searchAutocomplete").find("table");
    $tr = $("<tbody></tbody>");
    
    for (var i = 0, j = 0; i < representatives.length && j < 5; i++) {
        representative = representatives[i];
        name = representative.firstname + " " + representative.lastname;
        if (name.search(new RegExp(keyword, "i")) >= 0) {
            text = $("<div></div>").html(name.replace(new RegExp(keyword, "ig"), function (match) {
                return "<strong>" + match + "</strong>";
            })).html();
            $tr.append($("<tr></tr>").html(text)
                .attr("data-representative", i)
                .click({ndx: i}, function (event) {
                    buildModal($("#contactModal"), event.data.ndx);
                    $("#contactModal").modal("show");
                    $("#searchAutocomplete").addClass("hidden");
                }));
            j++;
        }
    }
    
    $table.html($tr);
}

function getMPimg (representative, index) {
    if (typeof image_fake !== 'undefined' && image_fake) {
        return imgPath + "none.gif";
    } else {
        return imgPath + 'small/' + index + ".jpg";    
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

function requestJSON (file, task) {
    return $.getJSON(file, task);
}

function updateRepresentatives (method) {
    changed = false;
    cachedRepresentatives = [];
    steps = [];

    for (var i = 0; i < representatives.length; i++) {
        if (matchSearch(representatives[i], method)) {
            cachedRepresentatives.push(representatives[i]);
            if (filteredRepresentatives.indexOf(representatives[i]) < 0) {
                changed = true;
            }
        } else if (filteredRepresentatives.indexOf(representatives[i]) >= 0) {
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

function randomizeStep () {
    btw = Math.floor(Math.random() * steps.length);
    return btw;
}

function emptySearch (dict) {
    var r = true;
    for (entry in dict)
        r = r && ! dict[entry];
    return r;
}

function matchSearch (representative, method) {
    rtrn = false;
    if (method.method == "settings") {
        rtrn = (emptySearch(searchParties) || searchParties[representative.party]) &&
           (emptySearch(searchTeams) || searchTeams[representative.team]);
    } else if (method.method == "keyword") {
        if ((representative.firstname + " " + representative.lastname).toLowerCase().indexOf(method.keyword.toLowerCase()) >= 0) {
            rtrn = true;
        } else if ((representative.lastname + " " + representative.firstname).toLowerCase().indexOf(method.keyword.toLowerCase()) >= 0) {
            rtrn = true;
        }
    }
    return rtrn;
}

function checkBlocked () {
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

function setDisabled (value) {
    if (value) {
        $slideLeft.addClass("disabled");
        $slideRight.addClass("disabled");
    } else {
        $slideLeft.removeClass("disabled");
        $slideRight.removeClass("disabled");
    }
}

function updateSlider (direction) {
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
        if (representative) {
            var builtRepresentative = buildRepresentative(representative);
            $slideContent.append(builtRepresentative);
        }
    }
}

function bend (x, len) {
    if (x > len - 1)
        x = x % len;
    while (x < 0)
        x = x + len;
    return x;
}

function updateBullets () {
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

function slide (direction) {
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

function buildRepresentative (representative) {
    index = representatives.indexOf(representative);
    MPimg = getMPimg(representative, index);
    
    div = $("<div></div>").attr("class", "repBox");
    div.html($("<div></div>")
        .attr("class", "colorBox " + representative.team + "BG")
        .click({ndx: index}, function (event) {
            buildModal($("#contactModal"), event.data.ndx);
            $("#contactModal").modal("show");
        }));
    div.append($("<div></div>")
        .attr("class", "detailsBox")
        .append($("<p></p>").attr("class", "name")
            .text(representative.lastname))
        .append($("<p></p>").attr("class", "party")
            .text(parties[representative.party].short)));
    div.append($("<img />")
        .attr("class", "repImg")
        .attr("src", MPimg)
        .attr("alt", representative.lastname));
    div.append($("<button></button>")
        .attr("type", "button")
        .attr("class", "btn btn-default btn-md")
        .text("Kontakt")
        .click({ndx: index}, function (event) {
            buildModal($("#contactModal"), event.data.ndx);
            $("#contactModal").modal("show");
        }));
    
    return div;
}

function buildModal (modal, index) {
    representative = representatives[index];
    var $contactButtons = $("#contactButtons");
    var MPimg, MPname;
    
    MPimg = getMPimg(representative, index);
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
        $formMail.attr("href", format.mail.url.replace("%MAIL%", parties[representative.party].mail).replace("%SUBJECT%", encodeURIComponent(jsonResolve(format.mail.subject, representative))).replace("%MESSAGE%", encodeURIComponent(jsonResolve(format.mail.message, representative))));
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