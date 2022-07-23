var myVersion = "0.7.21", myProductName = "oldSchool";     

exports.init = init;
exports.publishBlog = publishBlog;
exports.getConfig = getConfig; //8/10/21 by DW
exports.initBlog = initBlog; //8/10/21 by DW
exports.getVersionInfo = getVersionInfo; //10/28/21 by DW

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
const opml = require ("opml");
const xmlrpc = require ("davexmlrpc"); //10/14/19 by DW
const macroprocess = require ("macroprocess"); //9/2/20 by DW

var baseOutputPath = "/scripting.com/reboot/test/v2/", baseOutputUrl = "http:/" + baseOutputPath;
var urlDefaultTemplate = "http://scripting.com/code/oldschool/daytemplate.html"
var dayTemplateText = undefined;
var flBackgroundBuilds = false;
var pingLog = [], pathPingLog = "/scripting.com/misc/pingLog.json", flPingLogChanged = false, flPingLogEnabled = false;
var fnameConfig = "config.json";
var lastConfigJsontext = undefined; //10/8/20 by DW -- so we can put out a message if it changed

var config = { //defaults
	port: process.env.PORT || 1400, //11/22/19 by DW
	flHttpEnabled: true,
	rssFname: "rss.xml",
	rssJsonFname: "rss.json",
	indexHtmlFname: "index.html",
	indexJsonFname: "index.json",
	facebookRssFname: "fb/rss.xml",
	calendarFname: "calendar.json",
	homeHtmlFname: "homepage.html", //9/9/17 by DW
	pagesFolder: "data/pages/",
	daysFolder: "data/days/",
	itemsFolder: "data/items/",
	debugMessageCallback: undefined, //8/8/17 by DW
	flXmlRpcPing: false, //11/22/19 by DW
	urlPingEndpoint: "http://githubstorypage.scripting.com/rpc2", //11/22/19 by DW
	flSaveRssDebuggingInfo: true, //1/13/20 by DW
	debugFolder: "data/debug/", //1/13/20 by DW
	blogs: {
		}
	};
var dataForBlogs = { //10/6/20 by DW -- one for each blog
	};

function typeIsStory (theType) { //types that are recognized as blog items
	switch (theType) {
		case "outline": case "tweet": case "link": case "markdown":
			return (true);
		default:
			return (false);
		}
	}
function dateGreater (d1, d2) { //8/30/21 by DW
	return (new Date (d1) > new Date (d2));
	}
function getConfig () { //8/10/21 by DW
	return (config);
	}
function pingForStoryPage () { //10/14/19 by DW
	if (config.flXmlRpcPing) {
		xmlrpc.client (config.urlPingEndpoint, "ping", {}, "xml", function (err, data) {
			if (err) {
				console.log ("sendPing: err.message == " + err.message);
				}
			});
		}
	}
function getDayHtml (blogName, theDay, callback) { //10/17/19 by DW
	var blogConfig = config.blogs [blogName]
	var relpath = utils.getDatePath (new Date (theDay), false) + ".html";
	var f = config.pagesFolder + blogName + "/" + relpath;
	console.log ("getDayHtml: f == " + f);
	fs.readFile (f, function (err, data) {
		const type = "text/html";
		if (err) {
			callback (404, type, "Not found.")
			}
		else {
			callback (200, type, data.toString ())
			}
		});
	}
function publishFile (path, data, type, acl, callback, metadata) { //8/14/17 by DW
	s3.newObject (path, data, type, acl, callback, metadata);
	}
function debugMessage (theMessage) { //8/8/17 by DW
	console.log (theMessage);
	if (config.debugMessageCallback !== undefined) {
		config.debugMessageCallback (theMessage);
		}
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
function markdownProcess (s, flGenerateHtmlParagraphs=false) {
	var renderer = new marked.Renderer ();
	var options = {
		renderer: renderer
		};
	if (flGenerateHtmlParagraphs) {
		return (marked (s, options));
		}
	else {
		renderer.paragraph = function (s) {
			return (s);
			};
		return (marked (s, options));
		}
	}
function debugMarkdownText (theText) { //for debugging -- 10/30/21 by DW
	theText = utils.replaceAll (theText, "\n", "\\n");
	theText = utils.replaceAll (theText, "\t", "\\t");
	theText = utils.replaceAll (theText, "\r", "\\r");
	return (theText);
	}
function addDayToCalendar (blogData, theDay, url) {
	var d = new Date (theDay);
	var year = blogData.calendar [d.getFullYear ()];
	if (year === undefined) {
		blogData.calendar [d.getFullYear ()] = new Object ();
		year = blogData.calendar [d.getFullYear ()];
		blogData.flCalendarChanged = true;
		}
	var month = year [d.getMonth ()];
	if (month === undefined) {
		year [d.getMonth ()] = new Object ();
		month = year [d.getMonth ()];
		blogData.flCalendarChanged = true;
		}
	var day = month [d.getDate ()];
	if (day === undefined) {
		month [d.getDate ()] = new Object ();
		day = month [d.getDate ()];
		blogData.flCalendarChanged = true;
		}
	if (day.url != url) {
		day.url = url;
		blogData.flCalendarChanged = true;
		}
	}
function publishCalendarJson (blogConfig, blogData, callback) {
	var path = blogConfig.basePath + config.calendarFname;
	publishFile (path, utils.jsonStringify (blogData.calendar), "application/json", "public-read", function (err, data) {
		if (err) {
			debugMessage ("publishCalendarJson: path == " + path + ", err.message == " + err.message);
			}
		else {
			}
		if (callback !== undefined) {
			callback ();
			}
		});
	}
function readCalendarJson (blogConfig, blogData, callback) {
	var url = blogConfig.baseUrl + config.calendarFname;
	blogData.flCalendarChanged = false; //6/12/17 by DW
	httpReadUrl (url, function (jsontext) {
		if (jsontext !== undefined) {
			try {
				blogData.calendar = JSON.parse (jsontext);
				}
			catch (err) {
				debugMessage ("readCalendarJson: err.message == " + err.message);
				blogData.calendar = new Object ();
				}
			}
		else {
			blogData.calendar = new Object ();
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
function notComment (item) { //11/5/20 by DW
	return (!utils.getBoolean (item.isComment));
	}
function isComment (item) { //11/5/20 by DW
	return (utils.getBoolean (item.isComment));
	}
function httpReadOutline (url, callback) { //10/18/21 by DW
	httpReadUrl (url, function (opmltext) {
		if (opmltext === undefined) {
			callback ({message: "Can't read the outline."});
			}
		else {
			opml.parse (opmltext, function (err, theOutline) {
				if (err) {
					callback (err);
					}
				else {
					callback (undefined, theOutline);
					}
				});
			}
		});
	}
function sameDayUTC (d1, d2) { //10/22/21 by DW 
	//returns true if the two dates are on the same day, in UTC
	d1 = new Date (d1);
	d2 = new Date (d2);
	return ((d1.getUTCFullYear () == d2.getUTCFullYear ()) && (d1.getUTCMonth () == d2.getUTCMonth ()) && (d1.getUTCDate () == d2.getUTCDate ()));
	}
function getVersionInfo () { //10/28/21 by DW
	return ({
		myProductName, 
		myVersion
		});
	}
function getNodeType (theNode) { //10/29/21 by DW
	if (theNode.type === undefined) {
		return (undefined);
		}
	else {
		return (theNode.type);
		}
	}

function publishBlog (jstruct, options, callback) {
	var blogName = options.blogName; //8/14/17 by DW
	var blogConfig = config.blogs [blogName];
	var blogData = dataForBlogs [blogName]; //10/6/20 by DW
	var daysArray = new Array ();
	var eventLog = { 
		pagesPublished: new Array (),
		pingsSent: new Array ()
		};
	var whenstart = new Date ();
	
	function addToPagesPublished (path) {
		debugMessage ("published: " + path);
		eventLog.pagesPublished.push (path);
		}
	function addToPingsSent (jstruct) {
		eventLog.pingsSent.push (jstruct);
		}
	
	function getTimeZoneOffset () {
		if (blogConfig.timeZoneOffset === undefined) {
			return (0);
			}
		else {
			return (blogConfig.timeZoneOffset);
			}
		}
	function getBlogTime (when) {  //10/26/21 by DW
		function processTimeZoneString (s) { //convert someting like 5:30 to 5.5
			var splits = s.split (":");
			if (splits.length == 2) {
				var ctsecs = Number (splits [1]);
				var hourFraction = ctsecs / 60;
				if (s [0] == "-") {
					hourFraction = -hourFraction;
					}
				s = Number (splits [0]) + hourFraction;
				}
			return (s);
			}
		try {
			var offset = Number (processTimeZoneString (getTimeZoneOffset ()));
			var d = new Date (when);
			var localTime = d.getTime ();
			var localOffset = d.getTimezoneOffset () *  60000;
			var utc = localTime + localOffset;
			var blogTime = utc + (3600000 * offset);
			return (blogTime);
			}
		catch (tryerror) {
			return (new Date (when).getTime ());
			}
		}
	function getBlogLocalDate (when=new Date ()) { //10/26/21 by DW
		var millisecsSince1970 = getBlogTime (when, getTimeZoneOffset ()); //in local time
		var jsBlogDate = new Date (millisecsSince1970);
		return (jsBlogDate);
		}
	function getBlogDateInfo (when) { //10/26/21 by DW
		var jsBlogDate = getBlogLocalDate (when, getTimeZoneOffset ());
		var dateInfo = {
			day: jsBlogDate.getDate (),
			month: jsBlogDate.getMonth () + 1,
			year: jsBlogDate.getFullYear (),
			hour: jsBlogDate.getHours (),
			minute: jsBlogDate.getMinutes (),
			second: jsBlogDate.getSeconds ()
			};
		return (dateInfo);
		}
	
	function outlineToDaysArray (theOutline) { //10/26/21 by DW
		var theStories = new Object ();
		function pad (num) {
			return (utils.padWithZeros (num, 2));
			}
		function visitStories (theNode, visit) {
			function visitSubs (theNode) {
				if (notComment (theNode)) {
					if (theNode.subs !== undefined) {
						theNode.subs.forEach (function (theSub) {
							if (notComment (theSub)) {
								if (typeIsStory (theSub.type)) {
									visit (theSub);
									}
								else {
									if (theNode.type == "calendarDay") { //11/12/21 by DW -- the sub's parent is a calendarDay type
										visit (theSub);
										}
									else {
										visitSubs (theSub);
										}
									}
								}
							});
						}
					}
				}
			visitSubs (theNode);
			}
		visitStories (theOutline.body, function (theStory) {
			var dateInfo = getBlogDateInfo (theStory.created, theOutline.head.timeZoneOffset);
			var datestring = dateInfo.year + "/" + pad (dateInfo.month) + "/" + pad (dateInfo.day);
			if (theStories [datestring] === undefined) {
				theStories [datestring] = new Array ();
				}
			theStories [datestring].push (theStory);
			});
		
		//convert it to an array
			var daysArray = new Array ();
			function monthToString (theMonthNum) {
				var names = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
				return (names [theMonthNum]);
				}
			for (var x in theStories) {
				let splits = x.split ("/");
				daysArray.push ({
					created: new Date (x),
					flInCalendar: true,
					name: splits [2],
					path: x, //something like 2021/07/31
					text: monthToString (Number (splits [1])) + " " + splits [2],
					type: "calendarDay",
					subs: theStories [x]
					});
				}
		return (daysArray);
		}
	
	function cmsDateFormat (when, pattern) { //10/13/21 by DW
		return (dateFormat (when, pattern));
		}
	function cmsGetDatePath (theDate, flLastSeparator) { //10/22/21 by DW
		if (theDate === undefined) {
			theDate = new Date ();
			}
		else {
			theDate = new Date (theDate); //8/12/14 by DW -- make sure it's a date type
			}
		if (flLastSeparator === undefined) {
			flLastSeparator = true;
			}
		var blogDate = new Date (getBlogTime (theDate));
		var month = utils.padWithZeros (blogDate.getMonth () + 1, 2);
		var day = utils.padWithZeros (blogDate.getDate (), 2);
		var year = blogDate.getFullYear ();
		
		if (flLastSeparator) {
			return (year + "/" + month + "/" + day + "/");
			}
		else {
			return (year + "/" + month + "/" + day);
			}
		}
	
	function getPermalinkString (when) { //7/9/17 by DW
		var pattern = "HHMMss", flUseDateFormat = false;
		if (new Date (when) < new Date ("Sun Jul 09 2017 17:53:55 GMT")) {
			pattern = "hhmmss";
			flUseDateFormat = true;
			}
		else {
			if (new Date (when) < new Date ("Mon, 13 Nov 2017 03:56:28 GMT")) {
				pattern = "hhMMss";
				flUseDateFormat = true;
				}
			}
		if (flUseDateFormat) {
			return ("a" + cmsDateFormat (when, pattern));
			}
		else {
			function pad (num) {
				return (utils.padWithZeros (num, 2));
				}
			var d = new Date (when);
			return ("a" + pad (d.getUTCHours ()) + pad (d.getUTCMinutes ()) + pad (d.getUTCSeconds ()));
			}
		}
	function writeAndMirrorFile (localpath, s3relpath, s, type, callback) { //2/4/20 by DW
		function doCallback (flWroteToPublicFile, urlPublicFile) {
			if (callback !== undefined) {
				callback (flWroteToPublicFile, urlPublicFile);
				}
			}
		utils.sureFilePath  (localpath, function () {
			fs.readFile (localpath, function (err, data) {
				var flwrite = true;
				if (!err) {
					if (data.toString () == s.toString ()) {
						flwrite = false;
						doCallback (flwrite);
						}
					}
				if (flwrite) {
					fs.writeFile (localpath, s, function (err) {
						if (err) {
							debugMessage ("writeAndMirrorFile: localpath == " + localpath + ", err.message == " + err.message);
							}
						});
					if (blogConfig.flMirrorDataToS3) {
						var s3path = blogConfig.basePathMirror + s3relpath;
						s3.newObject (s3path, s, type, undefined, function (err, data) {
							if (err) {
								debugMessage ("writeAndMirrorFile: s3path == " + s3path + ", err.message == " + err.message);
								doCallback (false); 
								}
							else {
								doCallback (true, blogConfig.baseUrlMirror + s3relpath); //we wrote to a public file
								}
							});
						}
					else {
						doCallback (false); //we didn't write to a public file
						}
					}
				});
			});
		}
	function savePublishedPage (relpath, pagetext) {
		var f = config.pagesFolder + blogName + "/" + relpath;
		writeAndMirrorFile (f, "pages/" + relpath, pagetext, "text/html");
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
			publishFile (path, utils.jsonStringify (item), "application/json", "public-read", function (err, data) {
				if (err) {
					debugMessage ("saveItemToS3: path == " + path + ", err.message == " + err.message);
					}
				if (callback !== undefined) {
					callback ();
					}
				});
			}
		}
	function getDayTitle (when) {
		return (cmsDateFormat (when, "dddd, mmmm d, yyyy"));
		}
	function saveItem (item) { //6/4/17 by DW
		var relpath = utils.getDatePath (new Date (item.created), true) + getPermalinkString (item.created) + ".json"
		
		var f = config.itemsFolder + blogName + "/" + relpath;
		writeAndMirrorFile (f, "items/" + relpath, utils.jsonStringify (item), "application/json");
		}
	function saveDayInOpml (day) { //1/16/21 by DW
		function jsonCalendarToOpml (jstruct) { //1/16/21 by DW
			var opmltext = "", indentlevel = 0;
			function encode (s) {
				return (utils.encodeXml (s));
				}
			function add (s) {
				opmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			function addval (name, val) {
				add ("<" + name + ">" + encode (val) + "</" + name + ">");
				}
			function addlist (theList) {
				if (theList !== undefined) { //9/28/21 by DW -- this happens, let it not crash the server
					theList.forEach (function (item) {
						var attstring = "";
						for (var x in item) {
							if ((x != "flInCalendar") && (x != "subs")) {
								attstring += x + "=\"" + encode (item [x]) + "\" ";
								}
							}
						if (item.subs === undefined) {
							add ("<outline " + attstring + "/>");
							}
						else {
							add ("<outline " + attstring + ">"); indentlevel++;
							addlist (item.subs);
							add ("</outline>"); indentlevel--;
							}
						});
					}
				}
			add ("<?xml version=\"1.0\"?>");
			add ("<opml version=\"2.0\">"); indentlevel++;
			
			add ("<head>"); indentlevel++;
			addval ("title", blogConfig.title);
			addval ("description", blogConfig.description);
			addval ("dateCreated", jstruct.created);
			addval ("dateModified", jstruct.created);
			add ("</head>"); indentlevel--;
			
			add ("<body>"); indentlevel++;
			add ("<outline text=\"" + blogConfig.title + ": " + getDayTitle (day.created) + "\">"); indentlevel++;
			addlist (jstruct.subs);
			add ("</outline>"); indentlevel--;
			add ("</body>"); indentlevel--;
			
			add ("</opml>"); indentlevel--;
			return (opmltext);
			}
		var relpath = utils.getDatePath (new Date (day.created), false) + ".opml"
		var f = config.daysFolder + blogName + "/" + relpath;
		var opmltext = jsonCalendarToOpml (day);
		writeAndMirrorFile (f, "days/" + relpath, opmltext, "text/xml", function (flWroteToPublicFile, urlOpmlFile) {
			if (flWroteToPublicFile) {
				pingTagServer (urlOpmlFile); //1/17/21 by DW
				}
			});
		}
	function saveDay (day) { //6/10/17 by DW
		var relpath = utils.getDatePath (new Date (day.created), false) + ".json"
		var f = config.daysFolder + blogName + "/" + relpath;
		var jsontext = utils.jsonStringify (day);
		writeAndMirrorFile (f, "days/" + relpath, jsontext, "application/json");
		}
	function glossaryProcess (s) {
		return (utils.multipleReplaceAll (s, blogConfig.glossary));
		}
	function pingTagServer (urlOpmlFile, callback) { //1/13/21 by DW
		if (blogConfig.urlTagServerPing !== undefined) {
			var url = utils.replaceAll (blogConfig.urlTagServerPing, "[%url%]", encodeURIComponent (urlOpmlFile));
			httpReadUrl (url, function (s) {
				if (callback !== undefined) {
					callback ();
					}
				});
			}
		}
	function tagProcess (s) { //1/13/21; 11:08:44 AM by DW
		const options = {
			startChars: "[" + "[",
			endChars: "]]",
			}
		var i = 0;
		while (i < (s.length - 1)) {
			if (s [i] == options.startChars [0]) {
				if (s [i+1] == options.startChars [1]) {
					var j, flfound = false;
					for (var j = i + 2; j <= s.length - 2; j++) {
						if ((s [j] == options.endChars [0]) && (s [j+1] == options.endChars [1])) {
							var macrotext = utils.stringMid (s, i + 3, j - i - 2);
							s = utils.stringDelete (s, i + 1, j - i + 2);
							
							macrotext = "<span class=\"spTagref\">"  + macrotext + "</span>"; //7/17/21 by DW
							
							s = utils.stringInsert (macrotext, s, i);
							i += macrotext.length;
							flfound = true;
							break;
							}
						}
					if (!flfound) {
						break;
						}
					}
				else {
					i += 2;
					}
				}
			else {
				i++;
				}
			}
		return (s);
		}
	function getImageHtml (item) { //11/12/21 by DW
		var imgHtml = "";
		if (item.image !== undefined) {
			imgHtml = "<img class=\"imgRightMargin\" src=\"" + item.image + "\" border=\"0\" style=\"float: right; padding-left: 25px; padding-bottom: 10px; padding-top: 10px; padding-right: 15px;\">";
			if (item.imageLink !== undefined) { //5/26/20 by DW
				imgHtml = "<a class=\"anchorRightMargin\" href=\"" + item.imageLink + "\">" + imgHtml + "</a>";
				}
			}
		return (imgHtml);
		}
	function processText (s) { //9/2/20 by DW -- all text processing code in one call
		const macroOptions = {
			startChars: "[%",
			endChars: "%]",
			delimiter: ":",
			handlers: {
				search: function (macrotext) {
					var url, link;
					macrotext = utils.trimWhitespace (macrotext);
					url = "https://duckduckgo.com/?q=site%3Ascripting.com+%22" + macrotext + "%22&t=h_&ia=web";
					link = "<a href=\"" + url + "\">" + macrotext + "</a>";
					return (link);
					}
				}
			};
		s = glossaryProcess (s);
		s = emojiProcess (s);
		s = macroprocess (s, macroOptions);
		s = tagProcess (s);
		return (s);
		}
	function addInlineImageTo (s, urlImage) { //1/13/20 by DW
		return ("<center><img class=\"imgInline\" src=\"" + urlImage + "\"></center>" + s);
		}
	function addInlineVideoTo (s, urlVideo) { //10/11/20 by DW
		function fixYoutubeUrl (url) { //cribbed from oldSchoolTemplate
			const prefix = "https://www.youtube.com/watch?v=";
			if (utils.beginsWith (url, prefix)) {
				url = "https://www.youtube.com/embed/" + utils.stringDelete (url, 1, prefix.length);
				}
			return (url);
			}
		var url = fixYoutubeUrl (urlVideo);
		var videotext = "<iframe width=\"560\" height=\"315\" src=\"" + url + "\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>";
		return ("<center>" + videotext + "</center>" + s);
		}
	function getRenderedText (item, flTextIsTitle, urlStoryPage) {
		var s = processText (item.text), flInlineImage = false;
		if (item.inlineImage !== undefined) { //1/2/20 by DW
			s = addInlineImageTo (s, item.inlineImage);
			flInlineImage = true;
			}
		else {
			if (item.inlineVideo !== undefined) { //10/11/20 by DW
				s = addInlineVideoTo (s, item.inlineVideo);
				flInlineImage = true;
				}
			}
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
		
		if (urlStoryPage !== undefined) { //12/30/17 by DW
			item.permalink = urlStoryPage + "#" + ourLink;
			}
		else {
			if (item.subs !== undefined) { //12/29/17 by DW
				item.permalink = blogConfig.baseUrl + utils.getDatePath (new Date (item.created), true) + utils.stringDelete (ourLink, 1, 1) + ".html";
				item.permalink += "?title=" + utils.innerCaseName (item.text); //1/7/20 by DW
				}
			else {
				item.permalink = urlpage + "#" + ourLink;
				}
			}
		
		var imgHtml = getImageHtml (item); //11/12/21 by DW
		
		if (flTextIsTitle) {
			s = "<a href=\"" + item.permalink + "\"><span class=\"spTitleLink\">" + s + "</span></a>";
			}
		
		var title = "Direct link to this item.";
		s = "<a name=\"" + ourLink + "\"></a>" + imgHtml + s + "<span class=\"spPermaLink\"><a href=\"" + item.permalink + "\" title=\"" + title + "\">#</a></span>";
		
		if (flInlineImage) { //1/3/20 by DW
			s = "<div class=\"divInlineImage\">" + s + "</div>";
			}
		
		return (s);
		}
	function formatTimeLine (when) { //2/11/18 by DW
		return (cmsDateFormat (when, "dddd mmmm d, yyyy; h:MM TT Z"));
		}
	function getDataAtts (item) { //7/12/17 by DW
		var atts = "";
		for (var x in item) {
			switch (x) {
				case "text": case "created": case "permalink": case "subs": //5/16/18 by DW -- added subs
					break;
				default:
					atts += " data-" + x + "=\"" + item [x] + "\"";
					break;
				}
			}
		return (atts);
		}
	
	function subsToMarkdown (parent) { //10/30/21 by DW
		let markdowntext = "", indentlevel = 0;
		function addlevel (theNode, flSinglespace=false) {
			var flAddExtraReturn = false;
			function add (s) {
				markdowntext += s + ((flSinglespace) ? "\n" : "\n\n");
				}
			if (theNode.flSinglespaceMarkdown !== undefined) {
				var newSingleVal = utils.getBoolean (theNode.flSinglespaceMarkdown);
				if (newSingleVal && (!flSinglespace)) {
					flAddExtraReturn = true;
					}
				flSinglespace = newSingleVal;
				}
			if (theNode.subs !== undefined) {
				theNode.subs.forEach (function (sub) {
					add (sub.text);
					indentlevel++;
					addlevel (sub, flSinglespace);
					indentlevel--;
					});
				if (flAddExtraReturn) {
					markdowntext += "\n";
					}
				}
			}
		addlevel (parent);
		markdowntext = processText (markdowntext); //convert glossary references, emoji shortcodes, etc
		var processedtext = markdownProcess (markdowntext, true); 
		return ("<div class=\"divMarkdownText\">" + processedtext + "</div>");
		}
	
	function getItemSubs (parent, ulLevel, urlStoryPage) {
		if (getNodeType (parent) == "markdown") {
			return (subsToMarkdown (parent));
			}
		else {
			let htmltext = "", indentlevel = 0;
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			var ulAddedClass = "", ulCollapsedClass = "";
			if (utils.getBoolean (parent.flNumberedSubs)) { //6/15/17 by DW
				ulAddedClass = " ulNumberedSubs";
				}
			else {
				if (utils.getBoolean (parent.flBulletedSubs)) { //5/15/18 by DW
					ulAddedClass = " ulBulletedSubs";
					}
				else {
					if (utils.getBoolean (parent.flCodeSubs)) { //4/24/20 by DW
						ulAddedClass = " ulCodeSubs";
						}
					}
				}
			if (utils.getBoolean (parent.collapse)) { //5/15/18 by DW
				ulCollapsedClass = " ulCollapsed";
				}
			add ("<ul class=\"ulLevel" + ulLevel + ulAddedClass + ulCollapsedClass + "\">"); indentlevel++;
			for (var i = 0; i < parent.subs.length; i++) {
				var item = parent.subs [i];
				if (notComment (item)) { //11/5/20 by DW
					add ("<li" + getDataAtts (item) + ">" + getRenderedText (item, undefined, urlStoryPage) + "</li>");
					if (item.subs !== undefined) {
						add (getItemSubs (item, ulLevel + 1, urlStoryPage));
						}
					}
				}
			add ("</ul>"); indentlevel--;
			return (htmltext);
			}
		}
	function dayNotDeleted (whenDayCreated) { //8/30/21 by DW 
		if (blogConfig.flOldSchoolUseCache) {
			return (true);
			}
		else {
			for (var i = 0; i < daysArray.length; i++) {
				var item = daysArray [i];
				if (item.created !== undefined) {
					if (sameDayUTC (item.created, whenDayCreated)) { //it's in the days array ==> has not been deleted
						return (true);
						}
					}
				}
			return (false);
			}
		}
	function publishThroughTemplate (relpath, pagetitle, metadata, htmltext, templatetext, addToConfig, callback) {
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
			if (addToConfig !== undefined) { //9/12/17 by DW
				utils.copyScalars (addToConfig, myConfig);
				}
			
			delete myConfig.mySocket;
			delete myConfig.templatetext;
			delete myConfig.homePageTemplatetext; //9/12/17 by DW
			
			if (myConfig.lastSocketJsontext !== undefined) { //6/17/17 by DW
				delete myConfig.lastSocketJsontext;
				}
			
			myConfig.urlCalendar = blogConfig.baseUrl + config.calendarFname;
			myConfig.now = new Date (); //9/28/17 by DW
			myConfig.metadata = metadata; //5/4/20 by DW
			myConfig.generator = myProductName + " v" + myVersion; //11/4/20 by DW -- write over any generator provided in blogConfig
			
			return (utils.jsonStringify (myConfig));
			}
		function getOpmlHeadInJson () {
			return (utils.jsonStringify (blogConfig.jstruct.head));
			}
		function getAboutOutlineInJson () { //10/18/21 by DW
			if ((blogConfig.aboutOutline !== undefined) && (relpath == config.indexHtmlFname)) {
				return (utils.jsonStringify (blogConfig.aboutOutline));
				}
			else {
				return (undefined);
				}
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
			function addImage (urlImage) {
				add ("<meta name=\"twitter:image:src\" content=\"" + urlImage + "\">");
				}
			add ("<!-- Twitter metadata -->"); indentlevel++;
			add ("<meta name=\"twitter:card\" content=\"summary_large_image\">");
			add ("<meta name=\"twitter:site\" content=\"@" + blogConfig.twitterScreenName + "\">");
			add ("<meta name=\"twitter:title\" content=\"" + metadata.title + "\">");
			add ("<meta name=\"twitter:description\" content=\"" + metadata.description + "\">");
			if (metadata.image !== undefined) { //11/30/19 by DW
				addImage (metadata.image);
				}
			else {
				if (blogConfig.flIncludeImageInMetadata) { //6/27/17 by DW
					addImage (blogConfig.urlHeaderImage);
					}
				}
			return (htmltext);
			}
		function getFacebookMetadata (pagetitle, relpath) {
			var htmltext = "", indentlevel = 0;
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			function addImage (urlImage) {
				add ("<meta property=\"og:image\" content=\"" + urlImage + "\" />");
				}
			add ("<!-- Facebook metadata -->"); indentlevel++;
			add ("<meta property=\"og:type\" content=\"website\" />");
			add ("<meta property=\"og:site_name\" content=\"" + blogConfig.title + "\" />");
			add ("<meta property=\"og:title\" content=\"" + metadata.title + "\" />");
			add ("<meta property=\"og:url\" content=\"" + blogConfig.baseUrl + relpath + "\" />");
			add ("<meta property=\"og:description\" content=\"" + metadata.description + "\" />");
			if (metadata.image !== undefined) { //11/30/19 by DW
				addImage (metadata.image);
				}
			else {
				if (blogConfig.flIncludeImageInMetadata) { //6/27/17 by DW
					addImage (blogConfig.urlHeaderImage);
					}
				}
			return (htmltext);
			}
		
		if (metadata === undefined) { //11/30/19 by DW
			metadata = new Object ();
			}
		if (metadata.title === undefined) { //11/30/19 by DW
			metadata.title = pagetitle;
			}
		if (metadata.description === undefined) { //1/6/18 by DW
			metadata.description = blogConfig.description;
			}
		var pagetable = {
			pagetitle: pagetitle,
			bodytext: htmltext,
			pagetop: getHeaderImage (),
			twittermetadata: getTwitterMetadata (pagetitle),
			facebookmetadata: getFacebookMetadata (pagetitle, relpath),
			socialMediaLinks: getSocialMediaLinks (),
			rssLink: getRssLink (),
			now: cmsDateFormat (new Date (), "dddd mmmm d, yyyy; h:MM TT Z"),
			generator: myProductName + " v" + myVersion, //11/4/20 by DW
			configJson: getConfigJson (),
			opmlHead: getOpmlHeadInJson (),
			aboutOutline: getAboutOutlineInJson () //10/18/21 by DW
			};
		utils.copyScalars (blogConfig.jstruct.head, pagetable);
		
		if (pagetable.copyright === undefined) { //it's used in the default template
			pagetable.copyright = "";
			}
		
		if (templatetext === undefined) { //9/12/17 by DW
			templatetext = blogConfig.templatetext; 
			}
		var pagetext = utils.multipleReplaceAll (templatetext, pagetable, false, "[%", "%]");
		findPublishedPage (relpath, function (savedtext) {
			function mustRebuildPage () { //8/23/21 by DW
				if (savedtext != pagetable.bodytext) {
					return (true);
					}
				if (blogConfig.flAlwaysBuildHomePage) {
					if (relpath == config.indexHtmlFname) {
						return (true);
						}
					else {
						if (daysArray.length > 0) {
							var homePathPrefix = utils.getDatePath (daysArray [0].created, false);
							if (utils.beginsWith (relpath, homePathPrefix)) {
								return (true);
								}
							}
						}
					}
				return (false);
				}
			if (mustRebuildPage ()) { //8/23/21 by DW
				savePublishedPage (relpath, pagetable.bodytext);
				publishFile (blogConfig.basePath + relpath, pagetext, "text/html", "public-read", function (err, data) {
					if (err) {
						debugMessage ("publishThroughTemplate: relpath == " + relpath + ", err.message == " + err.message);
						}
					else {
						addToPagesPublished (relpath);
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
		if (isComment (day)) {
			if (callback !== undefined) {
				callback ();
				}
			}
		else {
			var htmltext = "", indentlevel = 0;
			var daypath = day.path, relpath = daypath + ".html", path = blogConfig.basePath + relpath;
			var urlpage = blogConfig.baseUrl + relpath;
			var daystring = getDayTitle (day.created); 
			var pagetitle = blogConfig.title + ": " + daystring;
			
			function add (s) {
				htmltext += utils.filledString ("\t", indentlevel) + s + "\n";
				}
			function getItemSubsMarkdown (storystruct) { //12/22/19 by DW
				var markdowntext = "", indentlevel = 0;
				function add (s) {
					markdowntext += utils.filledString ("\t", indentlevel) + s + "\n";
					}
				function getItemText (item) {
					var img = "";
					if (item.image !== undefined) {
						img = "<img src=\"" + item.image + "\" border=\"0\" align=\"right\">";
						}
					return (img + item.text);
					}
				if (storystruct.subs === undefined) { //it's an untitled story
					add (getItemText (storystruct));
					console.log (markdowntext);
					}
				else { //it's a titled story
					add ("# " + storystruct.text);
					storystruct.subs.forEach (function (sub, ix) {
						if (sub.subs !== undefined) {
							var flNumberedSubs = utils.getBoolean (sub.flNumberedSubs);
							var flBulletedSubs = utils.getBoolean (sub.flBulletedSubs);
							add (getItemText (sub));
							sub.subs.forEach (function (listitem, ixitem) {
								if (flNumberedSubs) {
									add ((ixitem + 1) + ". " + getItemText (listitem));
									}
								else {
									add ("* " + getItemText (listitem));
									}
								});
							add ("");
							}
						else {
							add (getItemText (sub));
							add ("");
							}
						});
					}
				return (markdowntext);
				}
			function buildStoryPage (item, itemsubtext, itemsubmarkdown, callback) { //12/28/17 by DW
				var daypath = utils.getDatePath (new Date (item.created), true);
				var relpath = daypath + utils.stringDelete (getPermalinkString (item.created), 1, 1) + ".html";
				var pagetitle = blogConfig.title + ": " + item.text;
				var metadata = {
					title: item.text,
					description: item.description,
					image: item.metaImage,
					body: itemsubmarkdown //12/22/19 by DW
					};
				
				
				var titleline = "<div class=\"divStoryPageTitle\">" + getRenderedText (item, true) + "</div>";
				var posttimeline = "<div class=\"divStoryPagePostTime\">" + formatTimeLine (item.created) + "</div>";
				var htmltext = "<div class=\"divTitledItem\">" + posttimeline + titleline + itemsubtext + "</div>";
				
				
				publishThroughTemplate (relpath, pagetitle, metadata, htmltext, undefined, undefined, function () {
					if (callback !== undefined) {
						callback ();
						}
					pingForStoryPage (); //10/14/19 by DW
					});
				}
			
			addDayToCalendar (blogData, day.created, urlpage); //5/13/17 by DW
			
			add ("<div class=\"divDayTitle\"><a href=\"" + urlpage + "\">" + daystring + "</a></div>");
			if (day.subs !== undefined) { //11/5/20 by DW
				for (var i = 0; i < day.subs.length; i++) { //loop over all top level subs
					var item = day.subs [i];
					saveItem (item); //6/4/17 by DW
					if (notComment (item)) { //11/5/20 by DW
						if (item.subs === undefined) {
							add ("<div class=\"divSingularItem\"" + getDataAtts (item) + ">" + getRenderedText (item, false, urlpage) + "</div>");
							}
						else {
							add ("<div class=\"divTitledItem\">"); indentlevel++;
							add ("<div class=\"divTitle\">" + getRenderedText (item, true) + "</div>");
							var itemsubtext = getItemSubs (item, 0, item.permalink);
							var itemsubmarkdown = getItemSubsMarkdown (item, 0);
							add (itemsubtext);
							add ("</div>"); indentlevel--;
							
							buildStoryPage (item, itemsubtext, itemsubmarkdown); //12/28/17 by DW
							}
						}
					}
				}
			
			day.htmltext = htmltext; //so the home page and month archive can access it
			
			blogData.htmlArchive [daypath] = { //save the text in blogData.htmlArchive -- 6/10/17 by DW
				htmltext: htmltext
				}
			
			publishThroughTemplate (relpath, pagetitle, undefined, htmltext, undefined, undefined, function () {
				if (callback !== undefined) {
					callback ();
					}
				});
			}
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
	
	function publishHomePage (callback) { //10/26/21 by DW
		var htmltext = "", ctDaysOnHomePage = 0;
		var newestDayOnHomePage = undefined, oldestDayOnHomePage = undefined;
		var earliestDayInHtmlArchive = getEarliestDayInHtmlArchive ();
		function getEarliestDayInHtmlArchive () { //9/29/21 by DW
			var earliestday = new Date ();
			for (var x in blogData.htmlArchive) {
				var splits = x.split ("/"); //x is something like 2021/08/09
				if (splits.length == 3) {
					var thisday = new Date (x);
					if (thisday < earliestday) {
						earliestday = thisday;
						}
					}
				}
			return (earliestday);
			}
		
		for (var i = 0; i < daysArray.length; i++) {
			let day = daysArray [i], dayInArchive = blogData.htmlArchive [day.path];
			htmltext += "<div class=\"divArchivePageDay\">" + dayInArchive.htmltext + "</div>\n";
			if (newestDayOnHomePage === undefined) {
				newestDayOnHomePage = day.created;
				}
			oldestDayOnHomePage = day.created;
			if (++ctDaysOnHomePage > blogConfig.maxDaysOnHomePage) {
				break;
				}
			}
		
		if (ctDaysOnHomePage < blogConfig.maxDaysOnHomePage) { //there's room for more stuff, check the htmlcache
			let theDay = (oldestDayOnHomePage === undefined) ? getBlogLocalDate () : utils.dateYesterday (oldestDayOnHomePage);
			function pad (n) {
				return (utils.padWithZeros (n, 2));
				}
			while (true) {
				if (theDay < earliestDayInHtmlArchive) {
					break;
					}
				let path = theDay.getFullYear () + "/" + pad (theDay.getMonth () + 1) + "/" + pad (theDay.getDate ());
				let dayInArchive = blogData.htmlArchive [path];
				if (dayInArchive !== undefined) {
					htmltext += "<div class=\"divArchivePageDay\">" + dayInArchive.htmltext + "</div>\n";
					oldestDayOnHomePage = theDay;
					if (++ctDaysOnHomePage > blogConfig.maxDaysOnHomePage) {
						break;
						}
					}
				theDay = utils.dateYesterday (theDay);
				}
			}
		
		var addToConfig = {
			flHomePage: true, //so JS code can tell that it should add the tabs
			newestDayOnHomePage, oldestDayOnHomePage //10/17/19 by DW
			};
		publishThroughTemplate (config.indexHtmlFname, blogConfig.title, undefined, htmltext, blogConfig.homePageTemplatetext, addToConfig, function () {
			var path = blogConfig.basePath + config.homeHtmlFname;
			publishFile (path, htmltext, "text/html", "public-read", function (err, data) {
				if (err) {
					debugMessage ("publishHomePage: path == " + path + ", err.message == " + err.message);
					}
				else {
					addToPagesPublished (config.homeHtmlFname);
					}
				if (callback !== undefined) {
					callback ();
					}
				});
			});
		}
	
	function publishMonthArchivePage (callback) {
		var now = new Date (), relpath = now.getFullYear () + "/" + utils.padWithZeros (now.getMonth () + 1, 2) + "/" + config.indexHtmlFname;
		var pagetitle = blogConfig.title + ": " + cmsDateFormat (now, "mmmm yyyy");
		function getMonthlyHtml () {
			var htmltext = "";
			var ctDays = daysInMonth (now), year = now.getFullYear (), month = now.getMonth ();
			for (var i = ctDays; i > 0; i--) {
				var dayInArchive = blogData.htmlArchive [utils.getDatePath (new Date (year, month, i), false)];
				if (dayInArchive !== undefined) {
					htmltext += "<div class=\"divArchivePageDay\">" + dayInArchive.htmltext + "</div>";
					}
				}
			return (htmltext);
			}
		publishThroughTemplate (relpath, pagetitle, undefined, getMonthlyHtml (), undefined, undefined, function () {
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
					var item = parent.subs [i], text = processText (item.text);
					var imgHtml = getImageHtml (item); //11/12/21 by DW
					
					var objtext = imgHtml + text; //7/23/22 by DW
					if (item.inlineImage !== undefined) { //7/23/22 by DW
						objtext = "<div class=\"divInlineImage\">" + addInlineImageTo (text, item.inlineImage) + "</div>";
						}
					
					if (indentlevel == 0) {
						add ("<p>" + objtext + "</p>");
						}
					else {
						add ("<li>" + objtext + "</li>");
						}
					
					if (item.subs !== undefined) {
						if (utils.getBoolean (item.flNumberedSubs)) { //5/16/18 by DW
							add ("<ol>"); indentlevel++;
							visit (item);
							add ("</ol>"); indentlevel--;
							}
						else {
							add ("<ul>"); indentlevel++;
							visit (item);
							add ("</ul>"); indentlevel--;
							}
						}
					}
				}
			visit (parent);
			return (htmltext)
			}
		function pingForUser (callback) { //8/17/17 by DW
			function doPing () {
				httpReadUrl (options.urlToPing, function (s) {
					debugMessage ("pingForUser: options.urlToPing == " + options.urlToPing + ", s == " + s);
					if (callback !== undefined) {
						callback ();
						}
					});
				}
			try {
				if (options.urlToPing !== undefined) {
					if (options.urlToPing.length > 0) {
						setTimeout (doPing, 100);
						}
					}
				}
			catch (err) {
				}
			}
		function ping (urlFeed) {
			if (blogConfig.flRssCloudEnabled && (blogConfig.rssCloudProtocol == "http-post")) {
				var urlServer = "http://" + blogConfig.rssCloudDomain + ":" + blogConfig.rssCloudPort + blogConfig.rssPingPath;
				addToPingsSent ({urlServer, urlFeed});
				rss.cloudPing (urlServer, urlFeed, function (err, res, body) {
					if (flPingLogEnabled) {
						var message = undefined, statusCode = undefined;
						if (res !== undefined) { //protect against failure below -- 9/3/17 by DW
							statusCode = res.statusCode;
							}
						if (err) {
							message = err.message;
							}
						pingLog.unshift ({
							urlFeed: urlFeed,
							urlServer: urlServer,
							when: new Date ().toGMTString (),
							code: statusCode,
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
			publishFile (path, xmltext, "text/xml", "public-read", function (err, data) {
				if (err) {
					debugMessage ("pubFacebookRss: path == " + path + ", err.message == " + err.message);
					}
				else {
					addToPagesPublished (config.facebookRssFname);
					ping (blogConfig.baseUrl + config.facebookRssFname);
					}
				if (callback !== undefined) {
					callback ();
					}
				});
			}
		
		function processOutline (theOutline) { //8/24/17 by DW
			var theCopy = JSON.parse (JSON.stringify (theOutline));
			function visit (parent) {
				if (parent.text !== undefined) {
					parent.text = processText (parent.text);
					}
				if (parent.subs !== undefined) {
					for (var i = 0; i < parent.subs.length; i++) {
						visit (parent.subs [i]);
						}
					}
				}
			visit (theCopy);
			return (theCopy);
			}
		
		function pubRss (headElements, historyArray) {
			var xmltext = rss.buildRssFeed (headElements, rssHistory);
			var path = path = blogConfig.basePath + config.rssFname;
			publishFile (path, xmltext, "text/xml", "public-read", function (err, data) {
				if (err) {
					debugMessage ("publishRssFeed: path == " + path + ", err.message == " + err.message);
					}
				else {
					addToPagesPublished (config.rssFname);
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
			publishFile (path, jsontext, "application/json", "public-read", function (err, data) {
				if (err) {
					debugMessage ("publishJsonFeed: path == " + path + ", err.message == " + err.message);
					}
				else {
					addToPagesPublished (config.rssJsonFname);
					ping (blogConfig.baseUrl + config.rssJsonFname);
					pingForUser (); //8/17/17 by DW
					}
				});
			}
		
		//set up headElements 
			headElements = new Object ();
			utils.copyScalars (blogConfig, headElements);
			utils.copyScalars (blogConfig.jstruct.head, headElements);
			headElements.generator = myProductName + " v" + myVersion; //8/24/17 by DW
		for (var i = 0; i < daysArray.length; i++) {
			var day = daysArray [i];
			if ((day.subs !== undefined) && notComment (day)) { //11/6/20 by DW
				for (var j = 0; j < day.subs.length; j++) {
					var item = day.subs [j], obj = new Object ();
					if (notComment (item)) { //11/6/20 by DW
						if (item.subs === undefined) {
							obj.text = getImageHtml (item) + processText (item.text); //11/12/21 by DW
							if (item.inlineImage !== undefined) { //1/13/20 by DW
								obj.text = "<div class=\"divInlineImage\">" + addInlineImageTo (obj.text, item.inlineImage) + "</div>";
								}
							}
						else {
							obj.title = item.text;
							obj.text = getSubsText (item);
							}
						obj.outline = processOutline (item); //5/12/17 by DW
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
				}
			}
		
		pubRss (headElements, rssHistory); 
		pubJson (headElements, rssHistory); 
		pubFacebookRss (headElements, rssHistory); //7/4/17 by DW
		if (config.flSaveRssDebuggingInfo) { //1/13/20 by DW
			fsWriteFile (config.debugFolder + "headElements.json", utils.jsonStringify (headElements));
			fsWriteFile (config.debugFolder + "rssHistory.json", utils.jsonStringify (rssHistory));
			}
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
		publishFile (path, utils.jsonStringify (smallerStruct), "application/json", "public-read", function (err, data) {
			if (err) {
				debugMessage ("publishHomeJson: path == " + path + ", err.message == " + err.message);
				}
			else {
				addToPagesPublished (config.indexJsonFname);
				}
			if (callback !== undefined) {
				callback ();
				}
			});
		}
	function publishCustomPages (callback) {
		if (blogConfig.customPages !== undefined) {
			function pubOnePage (path, pagetitle, htmltext, callback) {
				publishThroughTemplate (path, pagetitle, undefined, htmltext, undefined, undefined, function () {
					if (callback !== undefined) {
						callback ();
						}
					});
				}
			for (var i = 0; i < blogConfig.customPages.length; i++) {
				var thePage = blogConfig.customPages [i];
				pubOnePage (thePage.fname, thePage.title, thePage.htmltext);
				}
			}
		if (callback !== undefined) {
			callback ();
			}
		}
	function setCalendarFlags () { //11/9/20 by DW
		function addflags (parent, flInCalendar) {
			if (parent.name !== undefined) {
				flInCalendar = true;
				}
			parent.flInCalendar = flInCalendar;
			if (parent.subs !== undefined) {
				parent.subs.forEach (function (item) {
					item.flInCalendar = flInCalendar;
					addflags (item, flInCalendar);
					});
				}
			}
		addflags (jstruct.body, false);
		}
	function publishStandalonePages (callback) { //11/9/20 by DW
		var pages = new Array ();
		function findStandalonePages (parent) {
			if (parent.subs !== undefined) {
				parent.subs.forEach (function (item) {
					if (!item.flInCalendar) {
						if (item.type == "page") {
							pages.push (item);
							}
						else {
							findStandalonePages (item);
							}
						}
					});
				}
			}
		function publish (item, callback) {
			console.log ("publishStandalonePages/publish: item.title == " + item.title);
			if (item.relpath === undefined) {
				console.log ("publishStandalonePages: can't render the standalone page because it doesn't have a relpath attribute.");
				}
			else {
				var metadata = new Object ();
				var titleline = "<div class=\"divStoryPageTitle\">" + getRenderedText (item, true) + "</div>";
				var posttimeline = "<div class=\"divStoryPagePostTime\">" + formatTimeLine (item.created) + "</div>";
				var itemsubtext = getItemSubs (item, 0, item.permalink);
				var htmltext = "<div class=\"divTitledItem\">" + posttimeline + titleline + itemsubtext + "</div>";
				publishThroughTemplate (item.relpath, item.text, metadata, htmltext, undefined, undefined, function () {
					if (callback !== undefined) {
						callback ();
						}
					});
				}
			}
		function publishNextStandalonePage (ix) {
			if (ix < pages.length) {
				publish (pages [ix], function () {
					publishNextStandalonePage (ix + 1);
					});
				}
			else {
				if (callback !== undefined) {
					callback ();
					}
				}
			}
		findStandalonePages (jstruct.body);
		publishNextStandalonePage (0);
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
	function getHomePageTemplate (callback) { //9/12/17 by DW
		if (blogConfig.urlHomePageTemplate !== undefined) {
			httpReadUrl (blogConfig.urlHomePageTemplate, function (templatetext) {
				blogConfig.homePageTemplatetext = templatetext;
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
		}
	function getBlogGlossary (callback) {
		blogConfig.glossary = new Object ();
		if (blogConfig.urlGlossaryOpml !== undefined) {
			httpReadOutline (blogConfig.urlGlossaryOpml, function (err, theOutline) {
				if (!err) {
					for (i = 0; i < theOutline.opml.body.subs.length; i++) {
						var item = theOutline.opml.body.subs [i];
						if (item.text.length > 0) { //10/31/21 by DW
							if (item.subs !== undefined) {
								if (item.subs.length > 0) {
									blogConfig.glossary [item.text] = item.subs [0].text;
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
		else {
			if (callback !== undefined) {
				callback ();
				}
			}
		}
	function getAboutOutline (callback) { //10/18/21 by DW
		if (blogConfig.urlAboutOpml !== undefined) {
			httpReadOutline (blogConfig.urlAboutOpml, function (err, theOutline) {
				if (err) {
					blogConfig.aboutOutline = undefined;
					}
				else {
					blogConfig.aboutOutline = theOutline;
					}
				if (callback !== undefined) {
					callback ();
					}
				});
			}
		else {
			blogConfig.aboutOutline = undefined;
			if (callback !== undefined) {
				callback ();
				}
			}
		}
	
	if (blogConfig === undefined) { //8/21/17 by DW
		debugMessage ("publishBlog: can't publish because there is no blog named \"" + blogName + ".\"");
		}
	else {
		setCalendarFlags (); //11/9/20 by DW
		daysArray = outlineToDaysArray (jstruct); //10/26/21 by DW
		daysArray.forEach (function (day) {
			saveDay (day); ///6/10/17 by DW
			saveDayInOpml (day); //1/16/21 by DW
			});
		
		blogConfig.jstruct = jstruct; //8/8/17 by DW
		blogConfig.ownerFacebookAccount = jstruct.head.ownerFacebookAccount; //5/26/17 by DW
		blogConfig.ownerGithubAccount = jstruct.head.ownerGithubAccount; //5/26/17 by DW
		blogConfig.ownerLinkedinAccount = jstruct.head.ownerLinkedinAccount; //5/26/17 by DW
		
		if (blogConfig.flAlwaysBuildHomePage === undefined) { //8/23/21; 1:07:01 PM by DW
			blogConfig.flAlwaysBuildHomePage = true;
			}
		if (blogConfig.flOldSchoolUseCache === undefined) { //8/30/21 by DW
			blogConfig.flOldSchoolUseCache = false;
			}
		
		if (blogData.calendar === undefined) { //1/9/20 by DW
			blogData.calendar = new Object ();
			}
		if (blogData.htmlArchive === undefined) { //1/9/20 by DW
			blogData.htmlArchive = new Object ();
			}
		
		getAboutOutline (function () {
			getBlogGlossary (function () {
				getHomePageTemplate (function () {
					getBlogTemplate (function () {
						publishNextDay (0, function () { //callback runs when all daily pages have been built
							publishHomePage (function () {
								publishMonthArchivePage (function () {
									publishRssFeed (function () {
										publishCustomPages (function () {
											publishHomeJson (function () { //7/18/17 by DW
												publishStandalonePages (function () { //11/9/20 by DW
													debugMessage ("publishBlog: ctsecs == " + utils.secondsSince (whenstart));
													if (callback !== undefined) {
														callback (blogConfig, eventLog);
														}
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		}
	}

function readConfig (callback) { 
	fs.readFile (fnameConfig, function (err, jsontext) {
		if (!err) {
			try {
				jsontext = jsontext.toString ();
				if (jsontext != lastConfigJsontext) {
					var jstruct = JSON.parse (jsontext);
					for (var x in jstruct) {
						config [x] = jstruct [x];
						}
					console.log ("readConfig: updated " + fnameConfig);
					lastConfigJsontext = jsontext;
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
function writeConfig () { //10/6/20 by DW -- for debugging
	fs.writeFile ("configDebug.json", utils.jsonStringify (config), function (err) {
		if (err) {
			console.log ("writeConfig: err.message == " + err.message);
			}
		else {
			console.log ("writeConfig: configDebug.json written.");
			}
		});
	}
function initBlog (blogName, callback) {
	var blogConfig = config.blogs [blogName];
	dataForBlogs [blogName] = {
		htmlArchive: new Object (),
		calendar: new Object (),
		flCalendarChanged: false
		};
	var blogData = dataForBlogs [blogName];
	function getBlogHtmlArchive (callback) {
		var pagesfolder = config.pagesFolder + blogName + "/", whenstart = new Date ();
		utils.sureFilePath  (pagesfolder + "x", function () {
			var yearlist = fs.readdirSync (pagesfolder);
			blogData.htmlArchive = new Object ();
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
									blogData.htmlArchive [objname] = {
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
	readCalendarJson (blogConfig, blogData, function () {
		getBlogHtmlArchive (function () {
			if (callback !== undefined) { //8/10/21 by DW
				callback ();
				}
			});
		});
	}
function init (configParam, callback) {
	if (configParam !== undefined) {
		for (x in configParam) {
			config [x] = configParam [x];
			}
		}
	readConfig (function () {
		var portMessage = "";
		if (config.flHttpEnabled) {
			portMessage =  " running on port " + config.port;
			}
		debugMessage ("\n" + myProductName + " v" + myVersion + portMessage + "\n");
		readPingLog (function () {
			var whenLastSocketUpdate = undefined, lastSocketJsontext = undefined;
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
						if (blogConfig.urlJson === undefined) { //1/9/20 by DW
							httpReadOutline (blogConfig.urlOpml, function (err, theOutline) {
								if (err) {
									callback (undefined);
									}
								else {
									callback (utils.jsonStringify (theOutline));
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
											debugMessage ("/build: blogName == " + blogName);
											getBlogJsontext (blogConfig, function (jsontext) {
												try {
													var jstruct = JSON.parse (jsontext);
													blogConfig.lastSocketJsontext = undefined; //consume it
													blogConfig.jstruct = jstruct; //5/15/17 by DW
													publishBlog (jstruct, {blogName: blogName}, function () {
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
									case "/day": //10/17/19 by DW -- used for infinite scroll on scripting.com
										getDayHtml (parsedUrl.query.blog, parsedUrl.query.day, doHttpReturn);
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
			function everyMinute () {
				var now = new Date ();
				var portpart = "";
				if (config.flHttpEnabled) { //8/14/17 by DW
					portpart =  ", running on port " + config.port;
					}
				if (now.getMinutes () == 0) { //1/6/20 by DW
					debugMessage ("\n" + now.toLocaleTimeString () + ": " + myProductName + " v" + myVersion + portpart);
					}
				readConfig (); //10/8/20 by DW
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
									publishBlog (jstruct, {blogName: x});
									}
								catch (err) {
									debugMessage ("everySecond: err.message == " + err.message);
									blogConfig.lastSocketJsontext = undefined;
									}
								}
							}
						}
					}
				for (var x in config.blogs) {
					initSocket (config.blogs [x]);
					}
				for (var x in config.blogs) {
					var blogConfig = config.blogs [x];
					var blogData = dataForBlogs [x];
					if (blogData.flCalendarChanged) {
						publishCalendarJson (blogConfig, blogData);
						blogData.flCalendarChanged = false;
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
			utils.runEveryMinute (everyMinute); //2/11/19 by DW
			
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}
