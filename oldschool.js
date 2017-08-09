var myVersion = "0.4.19", myProductName = "oldSchool";  

exports.init = init;
exports.publishBlog = publishBlog;

const rss = require ("daverss");

const s3 = require ("daves3");


const utils = require ("daveutils");
const request = require ("request");
const dateFormat = require ("dateformat");
const urlpack = require ("url");
const websocket = require ("nodejs-websocket"); 
const http = require ("http"); 
const emoji = require ("node-emoji"); 
const marked = require ("marked"); 
const fs = require ("fs");
const querystring = require ("querystring");
const opml = require ("daveopml");

var baseOutputPath = "/scripting.com/reboot/test/v2/", baseOutputUrl = "http:/" + baseOutputPath;
var urlDefaultTemplate = "http://fargo.io/code/shared/oldschool/daytemplate.html"
var dayTemplateText = undefined;
var flBackgroundBuilds = false;
var pingLog = [], pathPingLog = "/scripting.com/misc/pingLog.json", flPingLogChanged = false, flPingLogEnabled = true;
var fnameConfig = "config.json";

var config = { //defaults
	port: 1400,
	flHttpEnabled: true,
	rssFname: "rss.xml",
	rssJsonFname: "rss.json",
	indexHtmlFname: "index.html",
	indexJsonFname: "index.json",
	facebookRssFname: "fb/rss.xml",
	calendarFname: "calendar.json",
	pagesFolder: "data/pages/",
	daysFolder: "data/days/",
	itemsFolder: "data/items/",
	debugMessageCallback: undefined, //8/8/17 by DW
	blogs: {
		}
	};


function debugMessage (theMessage) { //8/8/17 by DW
	console.log (theMessage);
	if (config.debugMessageCallback !== undefined) {
		config.debugMessageCallback (theMessage);
		}
	}
function getPermalinkString (when) { //7/9/17 by DW
	var pattern = "hhMMss";
	if (new Date (when) < new Date ("Sun Jul 09 2017 17:53:55 GMT")) {
		pattern = "hhmmss";
		}
	return ("a" + dateFormat (when, pattern));
	}
function httpReadUrl (url, callback) {
	request (url, function (error, response, data) {
		if (!error && (response.statusCode == 200)) {
			callback (data) 
			}
		else {
			callback (undefined);
			}
		});
	}
function isDirectory (path) { //goes in utils
	return (fs.statSync (path).isDirectory ());
	}
function fsWriteFile (f, s) { //8/8/17 by DW
	utils.sureFilePath  (f, function () {
		fs.writeFile (f, s, function (err) {
			if (err) {
				debugMessage ("fsWriteFile: err.message == " + err.message);
				}
			});
		});
	}
function daysInMonth (theDay) { //goes in utils
	return (new Date (theDay.getYear (), theDay.getMonth () + 1, 0).getDate ());
	}
function emojiProcess (s) {
	function addSpan (code, name) {
		return ("<span class=\"spOldSchoolEmoji\">" + code + "</span>");
		}
	return (emoji.emojify (s, undefined, addSpan));
	}
function markdownProcess (s) {
	var renderer = new marked.Renderer ();
	renderer.paragraph = function (s) {
		return (s);
		};
	var options = {
		renderer: renderer
		};
	return (marked (s, options));
	}
function addDayToCalendar (blogConfig, theDay, url) {
	var d = new Date (theDay);
	var year = blogConfig.calendar [d.getFullYear ()];
	if (year === undefined) {
		blogConfig.calendar [d.getFullYear ()] = new Object ();
		year = blogConfig.calendar [d.getFullYear ()];
		blogConfig.flCalendarChanged = true;
		}
	var month = year [d.getMonth ()];
	if (month === undefined) {
		year [d.getMonth ()] = new Object ();
		month = year [d.getMonth ()];
		blogConfig.flCalendarChanged = true;
		}
	var day = month [d.getDate ()];
	if (day === undefined) {
		month [d.getDate ()] = new Object ();
		day = month [d.getDate ()];
		blogConfig.flCalendarChanged = true;
		}
	if (day.url != url) {
		day.url = url;
		blogConfig.flCalendarChanged = true;
		}
	}
function publishCalendarJson (blogConfig, callback) {
	var path = blogConfig.basePath + config.calendarFname;
	s3.newObject (path, utils.jsonStringify (blogConfig.calendar), "application/json", "public-read", function (err, data) {
		if (err) {
			debugMessage ("publishCalendarJson: path == " + path + ", err.message == " + err.message);
			}
		else {
			debugMessage ("published: " + blogConfig.baseUrl + config.calendarFname);
			}
		if (callback !== undefined) {
			callback ();
			}
		});
	}
function readCalendarJson (blogConfig, callback) {
	var url = blogConfig.baseUrl + config.calendarFname;
	blogConfig.flCalendarChanged = false; //6/12/17 by DW
	httpReadUrl (url, function (jsontext) {
		if (jsontext !== undefined) {
			try {
				blogConfig.calendar = JSON.parse (jsontext);
				}
			catch (err) {
				debugMessage ("readCalendarJson: err.message == " + err.message);
				blogConfig.calendar = new Object ();
				}
			}
		else {
			blogConfig.calendar = new Object ();
			}
		if (callback !== undefined) {
			callback (jsontext);
			}
		});
	}
function readPingLog (callback) {
	httpReadUrl ("http:/" + pathPingLog, function (jsontext) {
		if (jsontext !== undefined) {
			pingLog = JSON.parse (jsontext);
			}
		if (callback !== undefined) {
			callback ();
			}
		});
	}
function writePingLog (callback) {
	s3.newObject (pathPingLog, utils.jsonStringify (pingLog), "application/json", "public-read", function (err, data) {
		if (err) {
			debugMessage ("writePingLog: err.message == " + err.message);
			}
		if (callback !== undefined) {
			callback ();
			}
		});
	}
function publishBlog (jstruct, blogName, callback) {
	var blogConfig = config.blogs [blogName];
	var daysArray = new Array (), now = new Date ();
	function savePublishedPage (relpath, pagetext) {
		var f = config.pagesFolder + blogName + "/" + relpath;
		fsWriteFile (f, pagetext);
		}
	function findPublishedPage (relpath, callback) {
		var f = config.pagesFolder + blogName + "/" + relpath;
		fs.readFile (f, function (err, data) {
			if (err) {
				callback (undefined);
				}
			else {
				callback (data);
				}
			});
		}
	function saveItemToS3 (relpath, item, callback) { //7/12/17 by DW
		if (blogConfig.flUploadItemsToS3) {
			var path = blogConfig.basePathItems + relpath;
			s3.newObject (path, utils.jsonStringify (item), "application/json", "public-read", function (err, data) {
				if (err) {
					debugMessage ("saveItemToS3: path == " + path + ", err.message == " + err.message);
					}
				if (callback !== undefined) {
					callback ();
					}
				});
			}
		}
	function saveItem (item) { //6/4/17 by DW
		var relpath = utils.getDatePath (new Date (item.created), true) + getPermalinkString (item.created) + ".json"
		
		var f = config.itemsFolder + blogName + "/" + relpath;
		fsWriteFile (f, utils.jsonStringify (item));
		saveItemToS3 (relpath, item); //7/12/17 by DW
		}
	function saveDay (day) { //6/10/17 by DW
		var relpath = utils.getDatePath (new Date (day.created), false) + ".json"
		var f = config.daysFolder + blogName + "/" + relpath;
		fsWriteFile (f, utils.jsonStringify (day));
		}
	function glossaryProcess (s) {
		return (utils.multipleReplaceAll (s, blogConfig.glossary));
		}
	function publishThroughTemplate (relpath, pagetitle, htmltext, callback) {
		function getSocialMediaLinks () {
			var htmltext = "", indentlevel = 0, head = blogConfig.jstruct.head;
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			function haveString (name) {
				if (head [name] !== undefined) {
					if (head [name].length !== undefined) {
						return (true);
						}
					}
				return (false);
				}
			function addlink (id, url, icon, color) {
				add ("<a class=\"aSocialMediaLink\" id=\"" + id + "\" href=\"" + url + "\" target=\"_blank\"><i class=\"fa fa-" + icon + "\" style=\"color: " + color + "; font-weight: bold;\"></i></a>");
				}
			add ("<div class=\"divSocialMediaLinks\">"); indentlevel++;
			addlink ("idTwitterLink", "http://twitter.com/" + head.ownerTwitterScreenName, "twitter", "#4099FF");
			if (haveString ("ownerFacebookAccount")) {
				addlink ("idFacebookLink", "http://facebook.com/" + head.ownerFacebookAccount, "facebook", "#4C66A4");
				}
			if (haveString ("ownerGithubAccount")) { 
				addlink ("idGithubLink", "http://github.com/" + head.ownerGithubAccount, "github", "black");
				}
			if (haveString ("ownerLinkedinAccount")) { 
				addlink ("idLinkedInLink", "http://www.linkedin.com/in/" + head.ownerLinkedinAccount, "linkedin", "#069");
				}
			addlink ("idRssLink", blogConfig.baseUrl + config.rssFname, "rss", "orange");
			add ("</div>"); indentlevel--;
			return (htmltext);
			}
		function getConfigJson () { //don't copy socket and other big hairy system data
			var myConfig = new Object ();
			utils.copyScalars (blogConfig, myConfig);
			
			delete myConfig.mySocket;
			delete myConfig.templatetext;
			
			if (myConfig.lastSocketJsontext !== undefined) { //6/17/17 by DW
				delete myConfig.lastSocketJsontext;
				}
			
			myConfig.urlCalendar = blogConfig.baseUrl + config.calendarFname;
			
			
			return (utils.jsonStringify (myConfig));
			}
		function getOpmlHeadInJson () {
			return (utils.jsonStringify (blogConfig.jstruct.head));
			}
		function getRssLink () {
			return ("<link rel=\"alternate\" type=\"application/rss+xml\" href=\"" + blogConfig.baseUrl + config.rssFname + "\">");
			}
		function getHeaderImage () {
			var htmltext = "", indentlevel = 0;
			var titleLink = "<a href=\"" + blogConfig.baseUrl + "\">" + utils.stringUpper (blogConfig.title) + "</a>";
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			add ("<div class=\"divPagetopImage\" id=\"idPagetopImage\" style=\"background-image: url(" + blogConfig.urlHeaderImage + ")\"></div>");
			add ("<div class=\"divPagetopTextBackground\"></div>");
			add ("<div class=\"divPagetopText\" id=\"idPageTopText\">"); indentlevel++;
			add ("<div class=\"divPagetopTitle\" id=\"idMessageTitle\">" + titleLink + "</div>");
			add ("<div class=\"divPagetopDescription\" id=\"idMessageDescription\">" + blogConfig.description + "</div>");
			add ("</div>"); indentlevel--;
			return (htmltext);
			}
		function getTwitterMetadata (pagetitle) {
			var htmltext = "", indentlevel = 0;
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			add ("<!-- Twitter metadata -->"); indentlevel++;
			add ("<meta name=\"twitter:card\" content=\"summary_large_image\">");
			add ("<meta name=\"twitter:site\" content=\"@" + blogConfig.twitterScreenName + "\">");
			add ("<meta name=\"twitter:title\" content=\"" + pagetitle + "\">");
			add ("<meta name=\"twitter:description\" content=\"" + blogConfig.description + "\">");
			if (blogConfig.flIncludeImageInMetadata) { //6/27/17 by DW
				add ("<meta name=\"twitter:image:src\" content=\"" + blogConfig.urlHeaderImage + "\">");
				}
			return (htmltext);
			}
		function getFacebookMetadata (pagetitle, relpath) {
			var htmltext = "", indentlevel = 0;
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			add ("<!-- Facebook metadata -->"); indentlevel++;
			add ("<meta property=\"og:type\" content=\"website\" />");
			add ("<meta property=\"og:site_name\" content=\"" + blogConfig.title + "\" />");
			add ("<meta property=\"og:title\" content=\"" + pagetitle + "\" />");
			add ("<meta property=\"og:url\" content=\"" + blogConfig.baseUrl + relpath + "\" />");
			add ("<meta property=\"og:description\" content=\"" + blogConfig.description + "\" />");
			if (blogConfig.flIncludeImageInMetadata) { //6/27/17 by DW
				add ("<meta property=\"og:image\" content=\"" + blogConfig.urlHeaderImage + "\" />");
				}
			return (htmltext);
			}
		var pagetable = {
			pagetitle: pagetitle,
			bodytext: htmltext,
			pagetop: getHeaderImage (),
			twittermetadata: getTwitterMetadata (pagetitle),
			facebookmetadata: getFacebookMetadata (pagetitle, relpath),
			socialMediaLinks: getSocialMediaLinks (),
			rssLink: getRssLink (),
			now: dateFormat (now, "dddd mmmm d, yyyy; h:mm TT Z"),
			configJson: getConfigJson (),
			opmlHead: getOpmlHeadInJson (),
			};
		utils.copyScalars (blogConfig.jstruct.head, pagetable);
		var pagetext = utils.multipleReplaceAll (blogConfig.templatetext, pagetable, false, "[%", "%]");
		findPublishedPage (relpath, function (savedtext) {
			if (savedtext != pagetable.bodytext) {
				savePublishedPage (relpath, pagetable.bodytext);
				s3.newObject (blogConfig.basePath + relpath, pagetext, "text/html", "public-read", function (err, data) {
					if (err) {
						debugMessage ("publishThroughTemplate: relpath == " + relpath + ", err.message == " + err.message);
						}
					else {
						debugMessage ("published: " + blogConfig.baseUrl + relpath);
						}
					if (callback !== undefined) {
						callback ();
						}
					});
				}
			else {
				if (callback !== undefined) {
					callback ();
					}
				}
			});
		}
	function publishDay (day, blogConfig, callback) {
		var htmltext = "", indentlevel = 0, daypath = utils.getDatePath (new Date (day.created), false), relpath = daypath + ".html", path = blogConfig.basePath + relpath;
		var urlpage = blogConfig.baseUrl + relpath;
		var daystring = dateFormat (day.created, "mmmm d, yyyy");
		var pagetitle = blogConfig.title + ": " + daystring;
		
		function add (s) {
			htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
			}
		function getRenderedText (item, flTextIsTitle) {
			var s = emojiProcess (glossaryProcess (item.text));
			
			
			switch (item.type) {
				case "link":
					var parsedUrl = urlpack.parse (item.url, true), host = parsedUrl.host;
					if (utils.beginsWith (host, "www.")) {
						host = utils.stringDelete (host, 1, 4);
						}
					s += "<span class=\"spLink\"><a href=\"" + item.url + "\" target=\"_blank\">" + host + "</a></span>";
					break;
				case "markdown": //5/26/17 by DW
					s = "<span class=\"spRenderedMarkdown\">" + markdownProcess (s) + "</span>";
					break;
				}
			
			var ourLink = getPermalinkString (item.created); //7/9/17 by DW
			var title = "Direct link to this item.";
			item.permalink = urlpage + "#" + ourLink;
			
			var imgHtml = "";
			if (item.image !== undefined) {
				imgHtml = "<img src=\"" + item.image + "\" border=\"0\" style=\"float: right; padding-left: 25px; padding-bottom: 10px; padding-top: 10px; padding-right: 15px;\">";
				}
			
			if (flTextIsTitle) {
				s = "<a href=\"" + item.permalink + "\"><span class=\"spTitleLink\">" + s + "</a></a>";
				}
			
			s = "<a name=\"" + ourLink + "\"></a>" + imgHtml + s + "<span class=\"spPermaLink\"><a href=\"" + item.permalink + "\" title=\"" + title + "\">#</a></span>";
			
			
			return (s);
			}
		function getDataAtts (item) { //7/12/17 by DW
			var atts = "";
			for (var x in item) {
				switch (x) {
					case "text": case "created": case "permalink":
						break;
					default:
						atts += " data-" + x + "=\"" + item [x] + "\"";
						break;
					}
				}
			return (atts);
			}
		function addItemSubs (parent, ulLevel) {
			var ulAddedClass = "";
			if (utils.getBoolean (parent.flNumberedSubs)) { //6/15/17 by DW
				ulAddedClass = " ulNumberedSubs";
				}
			add ("<ul class=\"ulLevel" + ulLevel + ulAddedClass + "\">"); indentlevel++;
			for (var i = 0; i < parent.subs.length; i++) {
				var item = parent.subs [i];
				add ("<li" + getDataAtts (item) + ">" + getRenderedText (item) + "</li>");
				if (item.subs !== undefined) {
					addItemSubs (item, ulLevel + 1);
					}
				}
			add ("</ul>"); indentlevel--;
			}
		
		addDayToCalendar (blogConfig, day.created, urlpage); //5/13/17 by DW
		
		add ("<div class=\"divDayTitle\"><a href=\"" + urlpage + "\">" + daystring + "</a></div>");
		
		for (var i = 0; i < day.subs.length; i++) { //loop over all top level subs
			var item = day.subs [i];
			saveItem (item); //6/4/17 by DW
			if (item.subs === undefined) {
				add ("<div class=\"divSingularItem\"" + getDataAtts (item) + ">" + getRenderedText (item) + "</div>");
				}
			else {
				add ("<div class=\"divTitledItem\">"); indentlevel++;
				add ("<div class=\"divTitle\">" + getRenderedText (item, true) + "</div>");
				addItemSubs (item, 0);
				add ("</div>"); indentlevel--;
				}
			}
		
		day.htmltext = htmltext; //so the home page and month archive can access it
		
		blogConfig.htmlArchive [daypath] = { //save the text in blogConfig.htmlArchive -- 6/10/17 by DW
			htmltext: htmltext
			}
		
		publishThroughTemplate (relpath, pagetitle, htmltext, function () {
			if (callback !== undefined) {
				callback ();
				}
			});
		}
	function publishNextDay (ixday, callback) {
		if (ixday < daysArray.length) {
			publishDay (daysArray [ixday], blogConfig, function () {
				publishNextDay (ixday + 1, callback);
				});
			}
		else {
			if (callback !== undefined) {
				callback ();
				}
			}
		}
	function publishHomePage (callback) {
		var htmltext = "", pagetitle = blogConfig.title, ctDays = blogConfig.maxDaysOnHomePage;
		
		var theDay = new Date ();
		for (var i = 0; i < ctDays; i++) {
			var dayInArchive = blogConfig.htmlArchive [utils.getDatePath (theDay, false)];
			if (dayInArchive !== undefined) {
				htmltext += "<div class=\"divArchivePageDay\">" + dayInArchive.htmltext + "</div>";
				}
			theDay = utils.dateYesterday (theDay);
			}
		publishThroughTemplate (config.indexHtmlFname, pagetitle, htmltext, function () {
			if (callback !== undefined) {
				callback ();
				}
			});
		}
	function publishMonthArchivePage (callback) {
		var now = new Date (), relpath = now.getFullYear () + "/" + utils.padWithZeros (now.getMonth () + 1, 2) + "/" + config.indexHtmlFname;
		var pagetitle = blogConfig.title + ": " + dateFormat (now, "mmmm yyyy");
		function getMonthlyHtml () {
			var htmltext = "";
			var ctDays = daysInMonth (now), year = now.getFullYear (), month = now.getMonth ();
			for (var i = ctDays; i > 0; i--) {
				var dayInArchive = blogConfig.htmlArchive [utils.getDatePath (new Date (year, month, i), false)];
				if (dayInArchive !== undefined) {
					htmltext += "<div class=\"divArchivePageDay\">" + dayInArchive.htmltext + "</div>";
					}
				}
			return (htmltext);
			}
		publishThroughTemplate (relpath, pagetitle, getMonthlyHtml (), function () {
			if (callback !== undefined) {
				callback ();
				}
			});
		}
	function publishRssFeed (callback) {
		var rssHistory = new Array (), headElements, now = new Date ();
		function getSubsText (parent) {
			var htmltext = "", indentlevel = 0;
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			function visit (parent) {
				for (var i = 0; i < parent.subs.length; i++) {
					var item = parent.subs [i], text = emojiProcess (glossaryProcess (item.text));
					
					if (indentlevel == 0) {
						add ("<p>" + text + "</p>");
						}
					else {
						add ("<li>" + text + "</li>");
						}
					
					if (item.subs !== undefined) {
						add ("<ul>"); indentlevel++;
						visit (item);
						add ("</ul>"); indentlevel--;
						}
					}
				}
			visit (parent);
			return (htmltext)
			}
		
		function ping (urlFeed) {
			if (blogConfig.flRssCloudEnabled && (blogConfig.rssCloudProtocol == "http-post")) {
				var urlServer = "http://" + blogConfig.rssCloudDomain + ":" + blogConfig.rssCloudPort + blogConfig.rssPingPath;
				debugMessage ("ping: urlServer == " + urlServer + ", urlFeed == " + urlFeed);
				rss.cloudPing (urlServer, urlFeed, function (err, res, body) {
					if (flPingLogEnabled) {
						var message = undefined;
						if (err) {
							message = err.message;
							}
						pingLog.unshift ({
							urlFeed: urlFeed,
							urlServer: urlServer,
							when: new Date ().toGMTString (),
							code: res.statusCode,
							body: body,
							message: message
							});
						flPingLogChanged = true;
						}
					});
				}
			}
		
		function pubFacebookRss (headElements, rssHistory) { //7/4/17 by DW
			var myHeadElements = new Object ();
			utils.copyScalars (headElements, myHeadElements);
			
			myHeadElements.flUseContentEncoded = true;
			myHeadElements.flTitledItemsOnly = true;
			myHeadElements.flFacebookEncodeContent = true;
			
			var xmltext = rss.buildRssFeed (myHeadElements, rssHistory);
			
			var path = blogConfig.basePath + config.facebookRssFname;
			s3.newObject (path, xmltext, "text/xml", "public-read", function (err, data) {
				if (err) {
					debugMessage ("pubFacebookRss: path == " + path + ", err.message == " + err.message);
					}
				else {
					debugMessage ("published: " + path);
					ping (blogConfig.baseUrl + config.facebookRssFname);
					}
				if (callback !== undefined) {
					callback ();
					}
				});
			
			
			
			}
		function pubRss (headElements, historyArray) {
			var xmltext = rss.buildRssFeed (headElements, rssHistory);
			var path = path = blogConfig.basePath + config.rssFname;
			s3.newObject (path, xmltext, "text/xml", "public-read", function (err, data) {
				if (err) {
					debugMessage ("publishRssFeed: path == " + path + ", err.message == " + err.message);
					}
				else {
					debugMessage ("published: " + path);
					ping (blogConfig.baseUrl + config.rssFname);
					}
				if (callback !== undefined) {
					callback ();
					}
				});
			}
		function pubJson (headElements, historyArray) {
			var jsontext = rss.buildJsonFeed (headElements, historyArray);
			var path = blogConfig.basePath + config.rssJsonFname;
			s3.newObject (path, jsontext, "application/json", "public-read", function (err, data) {
				if (err) {
					debugMessage ("publishJsonFeed: path == " + path + ", err.message == " + err.message);
					}
				else {
					debugMessage ("published: " + path);
					ping (blogConfig.baseUrl + config.rssJsonFname);
					}
				});
			}
		
		//set up headElements 
			headElements = new Object ();
			utils.copyScalars (blogConfig, headElements);
			utils.copyScalars (blogConfig.jstruct.head, headElements);
		for (var i = 0; i < daysArray.length; i++) {
			var day = daysArray [i];
			for (var j = 0; j < day.subs.length; j++) {
				var item = day.subs [j], obj = new Object ();
				if (item.subs === undefined) {
					obj.text = emojiProcess (glossaryProcess (item.text));
					}
				else {
					obj.title = item.text;
					obj.text = getSubsText (item);
					}
				obj.outline = item; //5/12/17 by DW
				obj.link = item.permalink;
				obj.pubDate = item.created;
				obj.guid = {flPermalink: true, value: item.permalink};
				obj.when = item.created;
				if ((item.enclosure !== undefined) && (item.enclosureType !== undefined) && (item.enclosureLength !== undefined)) { //6/9/17 by DW
					obj.enclosure = {
						url: item.enclosure,
						type: item.enclosureType,
						length: item.enclosureLength
						}
					}
				rssHistory [rssHistory.length] = obj;
				}
			}
		
		pubRss (headElements, rssHistory); 
		pubJson (headElements, rssHistory); 
		pubFacebookRss (headElements, rssHistory); //7/4/17 by DW
		}
	function publishHomeJson (callback) { //7/18/17 by DW
		var path = blogConfig.basePath + config.indexJsonFname;
		function copyOutlineWithoutExtras (theOutline) {
			function copyOutlineStruct (theOutline) {
				var newstruct = new Object ();
				utils.copyScalars (theOutline, newstruct);
				if (newstruct.htmltext !== undefined) {
					delete newstruct.htmltext;
					}
				if (theOutline.subs !== undefined) {
					newstruct.subs = new Array ();
					for (var i = 0; i < theOutline.subs.length; i++) {
						newstruct.subs.push (copyOutlineStruct (theOutline.subs [i]));
						}
					}
				return (newstruct);
				}
			var smallerStruct = new Object ();
			smallerStruct.head = new Object ();
			utils.copyScalars (theOutline.head, smallerStruct.head);
			smallerStruct.body = copyOutlineStruct (theOutline.body);
			return (smallerStruct);
			}
		var smallerStruct = copyOutlineWithoutExtras (jstruct);
		s3.newObject (path, utils.jsonStringify (smallerStruct), "application/json", "public-read", function (err, data) {
			if (err) {
				debugMessage ("publishHomeJson: path == " + path + ", err.message == " + err.message);
				}
			else {
				debugMessage ("published: " + path);
				}
			if (callback !== undefined) {
				callback ();
				}
			});
		}
	function publishCustomPages (callback) {
		function pubOnePage (path, pagetitle, htmltext, callback) {
			publishThroughTemplate (path, pagetitle, htmltext, function () {
				if (callback !== undefined) {
					callback ();
					}
				});
			}
		for (var i = 0; i < blogConfig.customPages.length; i++) {
			var thePage = blogConfig.customPages [i];
			pubOnePage (thePage.fname, thePage.title, thePage.htmltext);
			}
		if (callback !== undefined) {
			callback ();
			}
		}
	function getBlogTemplate (callback) {
		var urlTemplate = (blogConfig.urlTemplate === undefined) ? urlDefaultTemplate : blogConfig.urlTemplate; 
		httpReadUrl (urlTemplate, function (templatetext) {
			blogConfig.templatetext = templatetext;
			if (callback !== undefined) {
				callback ();
				}
			});
		}
	function getBlogGlossary (callback) {
		opml.readOpmlUrl (blogConfig.urlGlossaryOpml, function (theOutline) {
			blogConfig.glossary = new Object ();
			for (i = 0; i < theOutline.subs.length; i++) {
				var item = theOutline.subs [i];
				blogConfig.glossary [item.text] = item.subs [0].text;
				}
			if (callback !== undefined) {
				callback ();
				}
			});
		}
	
	for (var i = 0; i < jstruct.body.subs.length; i++) {
		var month = jstruct.body.subs [i];
		for (var j = 0; j < month.subs.length; j++) {
			var day = month.subs [j];
			daysArray [daysArray.length] = day;
			saveDay (day); ///6/10/17 by DW
			}
		}
	
	blogConfig.jstruct = jstruct; //8/8/17 by DW
	blogConfig.ownerFacebookAccount = jstruct.head.ownerFacebookAccount; //5/26/17 by DW
	blogConfig.ownerGithubAccount = jstruct.head.ownerGithubAccount; //5/26/17 by DW
	blogConfig.ownerLinkedinAccount = jstruct.head.ownerLinkedinAccount; //5/26/17 by DW
	
	getBlogGlossary (function () {
		getBlogTemplate (function () {
			publishNextDay (0, function () { //callback runs when all daily pages have been built
				publishHomePage ();
				publishMonthArchivePage ();
				publishRssFeed ();
				publishCustomPages ();
				publishHomeJson (); //7/18/17 by DW
				debugMessage ("publishBlog: ctsecs == " + utils.secondsSince (now));
				if (callback !== undefined) {
					callback (blogConfig);
					}
				});
			});
		});
	}
function readConfig (callback) { 
	fs.readFile (fnameConfig, function (err, data) {
		if (!err) {
			try {
				var jstruct = JSON.parse (data.toString ());
				for (var x in jstruct) {
					config [x] = jstruct [x];
					}
				}
			catch (err) {
				debugMessage ("readConfig: err.message == " + err.message);
				}
			}
		if (callback !== undefined) {
			callback ();
			}
		});
	}
function init (configParam, callback) {
	if (configParam !== undefined) {
		for (x in configParam) {
			config [x] = configParam [x];
			}
		}
	readConfig (function () {
		let portMessage = "";
		if (config.flHttpEnabled) {
			portMessage =  " running on port " + config.port;
			}
		debugMessage ("\n" + myProductName + " v" + myVersion + portMessage + "\n");
		readPingLog (function () {
			var whenLastSocketUpdate = undefined, lastSocketJsontext = undefined;
			var flScheduledEveryMinute = false;
			var mySocket = undefined, urlUpdateSocket = undefined;
			
			function getBlogJsontext (blogConfig, callback) {
				if (blogConfig.lastSocketJsontext !== undefined) {
					callback (blogConfig.lastSocketJsontext);
					}
				else {
					if (blogConfig.flReadLocalJsonFile) {
						fs.readFile (blogConfig.localJsonFilePath, function (err, jsontext) {
							if (err) {
								debugMessage ("getBlogJsontext: err.message == " + err.message);
								callback (undefined);
								}
							else {
								callback (jsontext.toString ());
								}
							});
						}
					else {
						httpReadUrl (blogConfig.urlJson, function (jsontext) {
							callback (jsontext);
							});
						}
					}
				}
			function startHttpServer () {
				function httpServer (httpRequest, httpResponse) {
					function doHttpReturn (code, type, s) { 
						httpResponse.writeHead (code, {"Content-Type": type});
						httpResponse.end (s);    
						}
					try {
						var parsedUrl = urlpack.parse (httpRequest.url, true), now = new Date ();
						var lowerpath = parsedUrl.pathname.toLowerCase ();
						
						debugMessage ("httpServer: " + lowerpath);
						
						switch (httpRequest.method) {
							case "GET":
								switch (lowerpath) {
									case "/version":
										doHttpReturn (200, "text/plain", myVersion);
										break;
									case "/now":
										doHttpReturn (200, "text/plain", new Date ().toString ());
										break;
									case "/build":
										try {
											var blogName = parsedUrl.query.blog, blogConfig = config.blogs [blogName];
											getBlogJsontext (blogConfig, function (jsontext) {
												try {
													var jstruct = JSON.parse (jsontext);
													blogConfig.lastSocketJsontext = undefined; //consume it
													blogConfig.jstruct = jstruct; //5/15/17 by DW
													publishBlog (jstruct, blogName, function () {
														doHttpReturn (200, "text/plain", blogConfig.baseUrl);
														});
													}
												catch (err) {
													blogConfig.lastSocketJsontext = undefined;
													doHttpReturn (503, "text/plain", err.message);
													}
												});
											}
										catch (err) {
											doHttpReturn (503, "text/plain", err.message);
											}
										break;
									default: 
										doHttpReturn (404, "text/plain", "Not found.");
										break;
									}
								break;
							}
						}
					catch (err) {
						doHttpReturn (503, "text/plain", err.message);
						debugMessage ("handleRequest: tryError.message == " + err.message);
						}
					}
				debugMessage ("startHttpServer: config.port == " + config.port);
				http.createServer (httpServer).listen (config.port);
				}
			function initSocket (blogConfig) {
				if (blogConfig.urlUpdateSocket !== undefined) {
					function startSocket (callback) {
						blogConfig.mySocket = websocket.connect (blogConfig.urlUpdateSocket); 
						blogConfig.mySocket.on ("connect", function () {
							var msg = "watch " + blogConfig.urlJson;
							debugMessage ("startSocket: \"" + msg + "\"");
							blogConfig.mySocket.send (msg);
							});
						blogConfig.mySocket.on ("text", function (s) {
							if (s !== undefined) { //no error
								var updatekey = "update\r";
								if (utils.beginsWith (s, updatekey)) { //it's an update
									s = utils.stringDelete (s, 1, updatekey.length);
									callback (s);
									}
								}
							});
						blogConfig.mySocket.on ("close", function (code, reason) {
							debugMessage ("startSocket: blogConfig.mySocket was closed.");
							blogConfig.mySocket = undefined;
							});
						blogConfig.mySocket.on ("error", function (err) {
							debugMessage ("blogConfig.mySocket received an error");
							});
						}
					if (blogConfig.mySocket === undefined) {
						startSocket (function (jsontext) {
							debugMessage ("\n" + new Date ().toLocaleTimeString () + ": blog \"" + blogConfig.title + "\" updated, " + jsontext.length + " chars.");
							blogConfig.whenLastSocketUpdate = new Date ();
							blogConfig.lastSocketJsontext = jsontext;
							});
						}
					}
				}
			function initBlog (blogName) {
				var blogConfig = config.blogs [x];
				function getBlogHtmlArchive (callback) {
					var pagesfolder = config.pagesFolder + blogName + "/";
					utils.sureFilePath  (pagesfolder + "x", function () {
						var yearlist = fs.readdirSync (pagesfolder);
						blogConfig.htmlArchive = new Object ();
						for (var i = 0; i < yearlist.length; i++) {
							var yearname = yearlist [i], yearfolder = pagesfolder + yearname;
							if (isDirectory (yearfolder)) {
								var monthlist = fs.readdirSync (yearfolder);
								for (var j = 0; j < monthlist.length; j++) {
									var monthname = monthlist [j]; var monthfolder = yearfolder + "/" + monthname;
									if (isDirectory (monthfolder)) {
										var daylist = fs.readdirSync (monthfolder);
										for (var k = 0; k < daylist.length; k++) {
											var dayname = daylist [k];
											if (utils.endsWith (dayname, ".html")) {
												var f = monthfolder + "/" + dayname;
												var objname = yearname + "/" + monthname + "/" + dayname;
												objname = utils.stringMid (objname, 1, objname.length - 5); //pop off .html at end
												blogConfig.htmlArchive [objname] = {
													htmltext: fs.readFileSync (f).toString ()
													}
												}
											}
										}
									}
								}
							}
						if (callback !== undefined) {
							callback ();
							}
						});
					}
				readCalendarJson (blogConfig, function () {
					getBlogHtmlArchive (function () {
						});
					});
				}
			function everyMinute () {
				var now = new Date ();
				debugMessage ("\n" + now.toLocaleTimeString () + ": " + myProductName + " v" + myVersion + ", running on port " + config.port);
				}
			function everySecond () {
				if (flBackgroundBuilds) {
					for (var x in config.blogs) {
						var blogConfig = config.blogs [x];
						if ((blogConfig.whenLastSocketUpdate !== undefined) && (blogConfig.lastSocketJsontext !== undefined)) {
							var secs = utils.secondsSince (blogConfig.whenLastSocketUpdate);
							if (secs >= 30) {
								debugMessage ("everySecond: It has been " + secs + " since we received the last update.");
								blogConfig.whenLastSocketUpdate = undefined; //consume the update
								try {
									var jstruct = JSON.parse (lastSocketJsontext);
									blogConfig.lastSocketJsontext = undefined;
									blogConfig.jstruct = jstruct; //5/15/17 by DW
									publishBlog (jstruct, x);
									}
								catch (err) {
									debugMessage ("everySecond: err.message == " + err.message);
									blogConfig.lastSocketJsontext = undefined;
									}
								}
							}
						}
					}
				if (!flScheduledEveryMinute) { 
					if (new Date ().getSeconds () == 0) {
						setInterval (everyMinute, 60000); 
						flScheduledEveryMinute = true;
						everyMinute (); //it's the top of the minute, we have to do one now
						}
					}
				for (var x in config.blogs) {
					initSocket (config.blogs [x]);
					}
				for (var x in config.blogs) {
					var blogConfig = config.blogs [x];
					if (blogConfig.flCalendarChanged) {
						publishCalendarJson (blogConfig);
						blogConfig.flCalendarChanged = false;
						}
					}
				if (flPingLogEnabled && flPingLogChanged) {
					flPingLogChanged = false;
					writePingLog ();
					}
				}
			
			for (var x in config.blogs) {
				initBlog (x);
				}
			
			if (config.flHttpEnabled) {
				startHttpServer ();
				}
			setInterval (everySecond, 1000); 
			
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}
