
/* 
	nodejs script to sync json files of Austiran MPs
	@Author: Thomas Lohninger
	@Licence: CC0
*/

Array.prototype.contains = function (el) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == el) {
			return true;
		}
	}
	return false;
}

var mpn = require('../data/representatives-new.json');
var mpo = require('../data/representatives-old.json');
var execmd = require('child_process').exec;

console.log('-->' + mpn.length + ' ' + mpo.length);

for (var i = 0; i < mpo.length; i++) {
	try {
		var n = matchMP(mpn, mpo[i].firstname, mpo[i].lastname, mpo[i].title);
		if (n) {
			for (var e in n) {
				mpo[i][e] = mpo[i][e] || n[e];
			}
			mpo[i].mail = n.email;
			delete mpo[i].email;
			//mpo[i].given_name = n.firstname;
			delete mpo[i].given_name;
			//mpo[i].family_name = n.lastname;
			delete mpo[i].family_name;
		}
	} catch (e) {
		console.error('couldn\'t update score of MEP # ' + i + ' because of ', e);
	}
}

function matchMP (mp, firstname, lastname, title) {
	for (var e in mp) {

		if (mp[e].family_name == lastname
			 && (mp[e].given_name == firstname || 
			 	 (mp[e].given_name || '').trim() == (firstname) || 
			 	 mp[e].given_name == (title + '. ' + firstname) || 
			 	 (mp[e].given_name || '').trim() == (title + ' ' + firstname)
				)
			) {

			return mp[e];
		}
	}
	console.log('could not find match for ' + firstname + ' ' + lastname + ' ' + title);
	return undefined;
}

//console.log(mpn); 

var fs = require('fs');
fs.writeFile("./data/representatives.json", JSON.stringify(mpo), function(err) {
		if(err) {
				console.log(err);
		} else {
			execmd("cat ./data/representatives.json | python -m json.tool > ./data/representatives.json.new && mv ./data/representatives.json.new ./data/representatives.json", function (error, stdout, stderr) {
				if (!error) {
					console.log("Scores updated. The file was saved!");
				}
			});
		}
});

