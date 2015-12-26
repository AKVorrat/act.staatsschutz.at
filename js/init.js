var firstnames = [], lastnames = [], titles = [], parties = [], mails = [], twitters = [], facebooks = [];
var spoeTable, oevpTable, fpoeTable, grueneTable, frankTable, neosTable;
var mail, twitter, facebook;
var xmlRepresentatives = "./data/representatives.xml";
var xmlFormat = "./data/format.xml";

$(document).ready(function () {
    findTables();
    requestXML(xmlFormat, function (xhttp) {
        var format = loadXML(xhttp);
        setFormat(format);
    });
    requestXML(xmlRepresentatives, function (xhttp) {
        var representatives = loadXML(xhttp);
        setTables(representatives);
    });
});

function findTables() {
    spoeTable = $("#spoeTable");
    oevpTable = $("#oevpTable");
    fpoeTable = $("#fpoeTable");
    grueneTable = $("#grueneTable");
    frankTable = $("#frankTable");
    neosTable = $("#neosTable");
}

function requestXML(file, task) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState === 4 && xhttp.status === 200)
            task(xhttp);
    };
    xhttp.open("GET", file, true);
    xhttp.send();
}

function loadXML(xml) {
    var i, entries, xmlDoc, xmlArray = [];
    xmlDoc = xml.responseXML;
    entries = xmlDoc.activeElement.children;
    for (i = 0; i < entries.length; i++) {
        var children = entries[i].children, entry = {}, j;
        for (j = 0; j < children.length; j++) {
            entry[children[j].nodeName] = children[j].innerHTML;
        }
        xmlArray = xmlArray.concat([entry]);
    }
    return xmlArray;
}

function setFormat(nodeArray) {
    mail = nodeArray[0];
    twitter = nodeArray[1];
    facebook = nodeArray[2];
}

function setTables(representatives) {
    var i;
    for (i = 0; i < representatives.length; i++) {
        if (representatives[i].party === "SPÖ")
            assignRepresentative(representatives[i], spoeTable);
        else if (representatives[i].party === "ÖVP")
            assignRepresentative(representatives[i], oevpTable);
        else if (representatives[i].party === "FPÖ")
            assignRepresentative(representatives[i], fpoeTable);
        else if (representatives[i].party === "GRÜNE")
            assignRepresentative(representatives[i], grueneTable);
        else if (representatives[i].party === "STRONACH")
            assignRepresentative(representatives[i], frankTable);
        else if (representatives[i].party === "NEOS")
            assignRepresentative(representatives[i], neosTable);
    }
}

function assignRepresentative(representative, table) {
    var newName, newMail, newTwitter, newFacebook, newTR;
    nameFormat = representative.title + " " + representative.firstname + " " + representative.lastname;
    newName = $("<th></th>").text(nameFormat);
    
    if (representative.mail != "") {
        var url, subject, salutation, message;
        
        url = representative.mail;
        subject = mail.subject;
        if (representative.gender === "masculin")
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
