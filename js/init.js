var spoeTable, oevpTable, fpoeTable, grueneTable, neosTable, frankTable;
var mail, twitter, facebook;
var xmlRepresentatives = "./data/representatives.json";
var xmlFormat = "./data/format.json";

$(document).ready(function () {
    findTables();
    requestJSON(xmlFormat, function (format) {
        format = format.entries;
        setFormat(format);
    });
    requestJSON(xmlRepresentatives, function (representatives) {
        representatives = representatives.entries;
        setTables(representatives);
    });
});

function requestJSON(file, task) {
    return $.getJSON(file, task);
}

function findTables() {
    spoeTable = $("#spoeTable");
    oevpTable = $("#oevpTable");
    fpoeTable = $("#fpoeTable");
    grueneTable = $("#grueneTable");
    neosTable = $("#neosTable");
    frankTable = $("#frankTable");
}

function setFormat(format) {
    mail = format[0];
    twitter = format[1];
    facebook = format[2];
}

function setTables(representatives) {
    $.each(representatives, function(arrayID, representative) {
        if (representative.party === "SPÖ")
            assignRepresentative(representative, spoeTable);
        else if (representative.party === "ÖVP")
            assignRepresentative(representative, oevpTable);
        else if (representative.party === "FPÖ")
            assignRepresentative(representative, fpoeTable);
        else if (representative.party === "GRÜNE")
            assignRepresentative(representative, grueneTable);
        else if (representative.party === "NEOS")
            assignRepresentative(representative, neosTable);
        else if (representative.party === "STRONACH")
            assignRepresentative(representative, frankTable);
    });
}

function assignRepresentative(representative, table) {
    var newName, newMail, newTwitter, newFacebook, newTR;
    nameFormat = representative.title + " " + representative.firstname + " " + representative.lastname;
    newName = $("<th></th>").text(nameFormat);
    
    if (representative.mail != "") {
        var url, subject, salutation, message;
        
        url = representative.mail;
        subject = mail.subject;
        if (representative.gender === "male")
            salutation = mail.salutationM;
        else
            salutation = mail.salutationF;
        salutation = salutation.replace("%NAME%", nameFormat);
        message = salutation + "%0D%0A" + mail.message;
        
        var formattedURL = mail.url.replace("%MAIL%", url).replace("%SUBJECT%", subject).replace("%MESSAGE%", message);
        newMail = $("<th class='contactIcon'></th>").html("<a href='" + formattedURL + "'><img src='./img/share/mail.png' alt='" + "Contact via " + mail.name + "' /></a>");
    } else
        newMail = $("<th class='contactIcon'></th>").html("<img src='./img/share/mail-disabled.png' />");
    
    if (representative.twitter != "") {
        var url, salutation, message;
        
        url = representative.twitter;
        if (representative.gender === "male")
            salutation = twitter.salutationM;
        else
            salutation = twitter.salutationF;
        salutation = salutation.replace("%NAME%", nameFormat);
        message = salutation + " " + twitter.message;
        
        var formattedURL = twitter.url.replace("%TWITTER%", url).replace("%MESSAGE%", message);
        newTwitter = $("<th class='contactIcon'></th>").html("<a href='" + formattedURL + "'><img src='./img/share/twitter.png' alt='" + "Contact via " + twitter.name + "' /></a>");
    } else
        newTwitter = $("<th class='contactIcon'></th>").html("<img src='./img/share/twitter-disabled.png' />");
    
    if (representative.facebook != "") {
        var url, salutation, message;
        
        url = representative.facebook;
        if (representative.gender === "masculin")
            salutation = facebook.salutationM;
        else
            salutation = facebook.salutationF;
        salutation = salutation.replace("%NAME%", nameFormat);
        message = salutation + " " + facebook.message;
        
        var formattedURL = facebook.url.replace("%FACEBOOK%", url).replace("%MESSAGE%", message);
        newFacebook = $("<th class='contactIcon'></th>").html("<a href='" + formattedURL + "'><img src='./img/share/facebook.png' alt='" + "Contact via " + facebook.name + "' /></a>");
    } else
        newFacebook = $("<th class='contactIcon'></th>").html("<img src='./img/share/facebook-disabled.png' />");
    
    newTR = $("<tr></tr>").append(newName).append(newMail).append(newTwitter).append(newFacebook);
    table.append(newTR);
}
