var myVersion = "0.6.18";

const flLikesEnabled = false; //2/7/20 by DW -- I want to reclaim the space, they weren't being used, and the server needs a new interface

var mySnap, flSnapDrawerOpen = false;
var urlSidebarOpml = "http://scripting.com/misc/menubar.opml";
var drawerWidth = 300;

const rightCaret = "fa fa-caret-right darkCaretColor", downCaret = "fa fa-caret-down lightCaretColor";
var tweetSerialnum = 0;
var urlTwitterServer = "http://electricserver.scripting.com/";
const urlLinkblogPage = "http://scripting.com/?tab=links"; //9/13/17 by DW
var ctLikesInPage = 0; //11/10/18 by DW



//tabs -- 9/11/17 by DW
	var tabs = {
		blog: {
			enabled: true,
			path: "index.html",
			title: "Blog",
			icon: "book",
			urlHomeHtml: "http://scripting.com/homepage.html",
			click: viewBlogTab
			},
		linkblog: {
			enabled: true,
			path: "links.html",
			title: "Links",
			icon: "link",
			htmltext: "<div class=\"divLinkblogDays\" id=\"idLinkblogDays\" data-title=\"Linkblog\"></div><div class=\"divLinkblogSubscribeInfo\" id=\"idLinkblogSubscribeInfo\">Get the new links from this page <a href=\"https://groups.google.com/forum/?fromgroups#!forum/daves-linkblog\" target=\"_blank\">sent via email</a> every night.</div>",
			savedtext: undefined,
			urlLinkblogJson: "http://radio3.io/users/davewiner/linkblog.json",
			click: viewLinkblogTab
			},
		news: {
			enabled: true,
			path: "news.html",
			title: "News",
			icon: "newspaper-o",
			htmltext: "<div class=\"divRiverContainer\"><div class=\"divRiverDisplay\" id=\"idRiverDisplay\" data-title=\"River\"></div></div>",
			urlRiver: "http://radio3.io/rivers/iowa.js",
			click: viewNewsTab
			},
		river: {
			enabled: false,
			path: "river.html",
			title: "River",
			icon: "newspaper-o",
			htmltext: "<div class=\"divRiverContainer\"><div class=\"divRiverDisplay\" id=\"idRiverDisplay\" data-title=\"River\"></div></div>",
			urlRiver: "http://radio3.io/rivers/iowa.js",
			click: viewRiverTab
			},
		chat: {
			enabled: false, //10/27/19 by DW
			path: "chat.html",
			title: "Chat",
			icon: "comment-o",
			htmltext: "<div class=\"divChatArea\" id=\"idChatArea\" data-title=\"Chat\"></div>",
			click: viewChatTab
			},
		about: {
			enabled: true,
			path: "about.html",
			title: "About",
			icon: "info-circle",
			htmltext: "<div class=\"divAboutOutline\" id=\"idAboutOutline\"></div>",
			outlineTitle: "About Scripting News",
			urlAboutOpml: "http://scripting.com/publicfolder/scripting/aboutpage.opml", //2/22/23 by DW
			click: viewAboutTab
			}
		};
	
	var savedState = {
		currentTab: "blog",
		aboutTabExpansionState: undefined
		};
	
	function saveState () {
		localStorage.savedState = jsonStringify (savedState);
		}
	function setTabContent (htmltext) {
		$("#idTabContent").html (htmltext);
		}
	function initBlogTab (callback) {
		tabs.blog.savedtext = $("#idBodytext").html ();
		callback ();
		}
	function viewBlogTab (callback) {
		setTabContent (tabs.blog.savedtext);
		}
	
	function readFeed (feedUrl, callback) { //4/19/23 by DW
		var url = "http://feeder.scripting.com/returnjson?url=" + encodeURIComponent (feedUrl);
		readHttpFile (url, function (jsontext) {
			if (jsontext === undefined) {
				callback (undefined);
				}
			else {
				try {
					var jstruct = JSON.parse (jsontext);
					callback (jstruct); 
					}
				catch (err) {
					callback (undefined);
					}
				}
			});
		}
	
	
	function initLinkblog (callback) {
		console.log ("initLinkblog");
		const feedUrl = "http://data.feedland.org/feeds/davewiner.xml";
		const url = "http://feeder.scripting.com/returnlinkbloghtml?url=" + encodeURIComponent (feedUrl);
		readHttpFile (url, function (htmltext) {
			if (htmltext === undefined) {
				tabs.linkblog.savedtext = "Error connecting to <a href=\"" + url + "\">feeder.scripting.com</a> to get the linkblog rendering.";
				}
			else {
				tabs.linkblog.savedtext = htmltext;
				}
			callback ();
			});
		
		
		}
	function viewLinkblogTab (callback) {
		setTabContent (tabs.linkblog.htmltext);
		$("#idLinkblogDays").html (tabs.linkblog.savedtext);
		}
	function viewRiverTab (callback) {
		setTabContent (tabs.river.htmltext);
		httpGetRiver (tabs.river.urlRiver, "idRiverDisplay", function () {
			});
		}
	function viewDiscussTab (callback) {
		setTabContent (tabs.discuss.htmltext);
		viewDiscussPage ();
		}
	function viewChatTab (callback) { //4/24/19 by DW
		setTabContent (tabs.chat.htmltext);
		viewChatPage ();
		}
	function viewNewsTab (callback) {
		}
	function viewAboutTab (callback) {
		setTabContent (tabs.about.htmltext);
		outlineBrowserData.expandCollapseCallback = function (idnum) {
			savedState.aboutTabExpansionState = getExpansionState ();
			saveState ();
			}
		readOpmlFile (tabs.about.urlAboutOpml, "idAboutOutline", tabs.about.outlineTitle, function () {
			if (savedState.aboutTabExpansionState !== undefined) {
				applyExpansionState (savedState.aboutTabExpansionState);
				}
			});
		}
	function initTab (tabname) {
		let theTab = tabs [tabname];
		if (theTab.click !== undefined) {
			theTab.click ();
			}
		}
	function tabClick (tabname) {
		console.log ("tabClick: tabname == " + tabname);
		var redirectname = tabname;
		switch (tabname) {
			case "blog":
				break;
			case "linkblog":
				redirectname = "links";
				break;
			case "news": //10/18/22 by DW
				window.location.href = "http://news.scripting.com/";
				return;
			case "about":
				break;
			}
		window.location.href = "?tab=" + redirectname;
		}
	function startTabsIfHomePage (callback) { 
		if (config.flHomePage) {
			$("#idTabList").empty ();
			for (var x in tabs) { 
				var theTab = tabs [x];
				if (theTab.enabled) {
					var activetab = "";
					if (x == savedState.currentTab) {
						activetab = " class=\"active\""
						}
					var clickScript = "tabClick (\"" + x + "\")";
					var tabtitle = "<i class=\"iTabIcon fa fa-" + theTab.icon + "\"></i>" + theTab.title;
					$("#idTabList").append ("<li" + activetab + " id='" + x + "'><a data-toggle=\"tab\" onclick='" + clickScript + "'>"  + tabtitle + "</a></li>");
					$("#" + x).on ("click", function (event) {
						var id = $(this).attr ("id");
						console.log ("You clicked on the tab with id == " + id);
						});
					}
				}
			initBlogTab (function () {
				initLinkblog (function () {
					initTab (savedState.currentTab);
					if (callback !== undefined) {
						callback ();
						}
					});
				});
			}
		else {
			callback ();
			}
		}
	
//like -- 11/8/18 by DW
	const urlLikeServer = "http://likes.scripting.com/";
	
	function ifConnected (confirmationPrompt, callback) { //12/15/18 by DW
		twStorageData.urlTwitterServer = urlLikeServer;
		if (twIsTwitterConnected ()) {
			callback ();
			}
		else {
			confirmDialog (confirmationPrompt, function () {
				twConnectToTwitter ();
				});
			}
		}
	function serverCall (verb, params, callback, server, method, data) {
		const timeoutInMilliseconds = 30000;
		if (method === undefined) {
			method = "GET";
			}
		if (params === undefined) {
			params = new Object ();
			}
		if (params.accessToken === undefined) { //10/29/18 by DW
			if (localStorage.twOauthToken !== undefined) {
				params.accessToken = localStorage.twOauthToken;
				}
			}
		if (server === undefined) { //9/25/18 by DW
			server = urlLikeServer;
			}
		var apiUrl = server + verb;
		var paramString = buildParamList (params);
		if (paramString.length > 0) {
			apiUrl += "?" + paramString;
			}
		var ajaxResult = $.ajax ({ 
			url: apiUrl,
			type: method,
			data: data,
			dataType: "text", 
			headers: undefined,
			timeout: timeoutInMilliseconds 
			}) 
		.success (function (data, status) { 
			callback (undefined, data);
			}) 
		.error (function (status) { 
			console.log ("serverCall: url == " + apiUrl + ", error == " + jsonStringify (status));
			callback ({message: "Error reading the file."});
			});
		}
	function likeClick (idLikes, urlForLike) {
		ifConnected ("Sign on to Twitter to enable Like/Unlike?", function () {
			var params = {
				oauth_token: localStorage.twOauthToken,
				oauth_token_secret: localStorage.twOauthTokenSecret,
				url: urlForLike
				};
			console.log ("likeClick:");
			$("#" + idLikes).blur ();
			serverCall ("toggle", params, function (err, jsontext) {
				if (err) {
					console.log ("likeClick: err == " + jsonStringify (err));
					}
				else {
					var jstruct = JSON.parse (jsontext);
					console.log ("likeClick: jstruct == " + jsonStringify (jstruct));
					viewLikes (idLikes, urlForLike, jstruct.likes);
					}
				});
			});
		}
	function getLikes (url, callback) {
		var params = {
			url: url
			};
		serverCall ("likes", params, function (err, jsontext) {
			if (err) {
				console.log ("getLikes: err == " + jsonStringify (err));
				callback (err);
				}
			else {
				var jstruct = JSON.parse (jsontext);
				callback (undefined, jstruct);
				}
			});
		}
	function getLikesArray (theArray, callback) { //2/7/20 by DW
		var params = {
			jsontext: jsonStringify (theArray)
			};
		serverCall ("getlikesarray", params, function (err, jsontext) {
			if (err) {
				console.log ("getLikesArray: err == " + jsonStringify (err));
				callback (err);
				}
			else {
				var jstruct = JSON.parse (jsontext);
				callback (undefined, jstruct);
				}
			});
		}
	function viewLikes (idLikes, myUrl, likes) { 
		function getThumbIcon (thumbDirection, flopen) {
			var open = "";
			if (flopen) {
				open = "o-";
				}
			return ("<span class=\"spThumb\"><i class=\"fa fa-thumbs-" + open + thumbDirection + "\"></i></span>&nbsp;");
			}
		var likesObject = $("#" + idLikes);
		var ct = 0, likenames = "", thumbDirection = "up", flOpenThumb = true, myScreenname = twGetScreenName ();
		if (likes !== undefined) {
			likes.forEach (function (name) {
				ct++;
				likenames += name + ", ";
				if (name == myScreenname) {
					thumbDirection = "down";
					flOpenThumb = false;
					}
				});
			}
		var theThumb = getThumbIcon ("up", flOpenThumb);
		
		var ctLikes = ct; //11/22/18 by DW
		
		if (ct > 0) {
			likenames = stringMid (likenames, 1, likenames.length - 2); //pop off comma and blank at end
			ctLikes = "<span rel=\"tooltip\" title=\"" + likenames + "\">" + ctLikes + "</span>";
			}
		var htmltext = "<span class=\"spLikes\"><a onclick=\"likeClick ('" + idLikes + "', '" + myUrl + "')\">" + theThumb + "</a>" + ctLikes + "</span>";
		likesObject.html (htmltext);
		$("[rel=\"tooltip\"]").tooltip ();
		}
	function getPostPermalink (theItem) { //12/15/18 by DW
		var href = undefined;
		if (theItem.className == "divTitledItem") {
			if (config.flHomePage) {
				$(theItem).children (".divTitle").each (function () {
					$(this).children ("a").each (function () {
						var myhref = $(this).attr ("href");
						if (myhref !== undefined) {
							href = myhref;
							}
						});
					});
				}
			else {
				href = window.location.href;
				}
			}
		else {
			$(theItem).children (".spPermaLink").each (function () {
				$(this).children ("a").each (function () {
					href = $(this).attr ("href");
					});
				});
			}
		return (href);
		}
	function getPostText (theItem) { //used in prompts, for example -- 12/16/18 by DW
		var theClass = $(theItem).attr ("class"), theText;
		switch (theClass) {
			case "divSingularItem":
				theText = $(theItem).text ();
				break;
			case "divTitledItem":
				$(theItem).children (".divTitle").each (function () {
					$(this).children ("a").each (function () {
						var myhref = $(this).attr ("href");
						if (myhref !== undefined) {
							theText = $(this).text ();
							}
						});
					});
				break;
			}
		return (theText);
		}
	function setupLikes () {
		if (flLikesEnabled) { //2/7/20 by DW
			$(".divTitledItem, .divSingularItem").each (function () {
				var theText = maxStringLength ($(this).text (), 25);
				var flLikeSetup = getBoolean ($(this).data ("likesetup"));
				var attval = $(this).data ("fllikeable"), flLikeable;
				if (dayGreaterThanOrEqual (config.now, "November 22, 2018")) {
					flLikeable = true; //default -- 11/22/18 by DW
					if (attval !== undefined) {
						flLikeable = getBoolean (attval);
						}
					}
				else {
					flLikeable = getBoolean (attval);
					}
				if ((flLikeable) && (!flLikeSetup)) {
					var id = "idLike" + ctLikesInPage++;
					$(this).attr ("data-likesetup", true);
					$(this).append ("<span id=\"" + id + "\"></span>");
					
					var href = getPostPermalink (this); //12/15/18 by DW
					getLikes (href, function (err, theLikes) {
						if (err) {
							console.log ("setupLikes: err.message == " + err.message);
							}
						else {
							viewLikes (id, href, theLikes);
							}
						});
					}
				});
			}
		}
//twitter comments -- 12/14/18 by DW
	const flTwitterCommentsEnabled = false; //2/3/23 by DW
	const tweetCommentHashtag = "#scriptingnews";
	const ctUrlInTweetChars = 23;
	
	function startTweetDialog (thePrompt, callback) {
		var tweetEditorOptions = {
			ctHashTagChars: tweetCommentHashtag.length + 1 + ctUrlInTweetChars + 1, 
			prompt: thePrompt,
			placeholderText: "This text will appear in the body of your tweet.",
			savedTweetText: "",
			flCustomHtml: false,
			flCancelButton: true
			}
		startTweetEditor ("idMyTweetEditor", tweetEditorOptions, callback);
		$("#idTweetDialog").modal ("show");
		}
	function closeTweetDialog () {
		$("#idTweetDialog").modal ("hide");
		}
	function addItemToFeed (params, callback) {
		params.oauth_token = localStorage.twOauthToken;
		params.oauth_token_secret = localStorage.twOauthTokenSecret;
		serverCall ("addtofeed", params, function (err, jsontext) {
			if (err) {
				console.log ("addItemToFeed: err == " + jsonStringify (err));
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				var jstruct = JSON.parse (jsontext);
				if (callback !== undefined) {
					callback (undefined, jstruct);
					}
				}
			});
		}
	function postTweetComment (editedText, urlPermalink) {
		var tweetText = editedText + " " + tweetCommentHashtag + " " + urlPermalink;
		console.log ("postTweetComment: tweetText == " + tweetText);
		twStorageData.urlTwitterServer = urlLikeServer;
		twTweet (tweetText, "", function (data) {
			closeTweetDialog ();
			var urlTweet = "https://twitter.com/" + twGetScreenName () + "/status/" + data.id_str;
			window.open (urlTweet);
			var item = {
				link: urlTweet, 
				text: editedText,
				category: tweetCommentHashtag,
				permalink: urlTweet 
				};
			addItemToFeed (item, function (err, data) {
				console.log (jsonStringify (data));
				});
			});
		}
	function setupTwitterComments () {
		if (flTwitterCommentsEnabled) {
			const shareIcon = "<i class=\"fa fa-retweet\"></i>";
			const maxTextLengthForPrompt = 50;
			$(".divTitledItem, .divSingularItem").each (function () {
				var flCommentSetup = getBoolean ($(this).data ("commentsetup")); //10/17/19 by DW
				if (!flCommentSetup) { //10/17/19 by DW
					var urlPermalink = getPostPermalink (this); 
					var theText = getPostText (this);
					var theIcon = "<a title=\"Click here to RT in Twitter.\">" + shareIcon + "</a>";
					var htmltext = "<span class=\"spTwitterComment\">" + theIcon + "</span>";
					var theObject = $(htmltext);
					$(theObject).click (function () {
						ifConnected ("Sign on to Twitter to enable comments?", function () {
							var thePrompt = "RT: " + maxLengthString (theText, maxTextLengthForPrompt);
							startTweetDialog (thePrompt, function (tweetText) {
								if (tweetText === undefined) { //user clicked Cancel
									closeTweetDialog ();
									}
								else {
									postTweetComment (tweetText, urlPermalink);
									}
								});
							});
						});
					$(this).append (theObject);
					$(this).attr ("data-commentsetup", true); //indicate that we've been here -- 10/17/19 by DW
					}
				});
			}
		}
//chat -- 4/18/19 by DW
	const chatConsts = {
		urlChatServer: "http://chat.scripting.com/",
		urlChatSocket: "ws://chat.scripting.com:1413/",
		urlChatHtml: "http://fargo.io/code/shared/oldschool/chattemplate.html",
		leadingQuestion: "",
		editorPlaceholderText: "What's happening?"
		};
	
	function chatToggleConnect () { //xxx
		twStorageData.urlTwitterServer = urlLikeServer; //8/21/19 by DW
		twToggleConnectCommand ();
		updateTwitterButton ();
		}
	function updateTwitterButton () {
		const twitterIcon = "<i class=\"fab fa-twitter\" style=\"color: #4099FF;\"></i>"; //1/18/23 by DW
		var buttontext = twitterIcon + " Sign " + ((twIsTwitterConnected ()) ? "off" : "on");
		$("#idToggleConnect").html (buttontext);
		}
	function getChatUserInfo (callback) {
		if (twIsTwitterConnected ()) {
			var paramtable = {
				oauth_token: localStorage.twOauthToken,
				oauth_token_secret: localStorage.twOauthTokenSecret
				}
			var url = chatConsts.urlChatServer + "getuserinfo?" + twBuildParamList (paramtable, false);
			readHttpFile (url, function (jsontext) { 
				var userinfo;
				if (jsontext !== undefined) {
					userinfo = JSON.parse (jsontext);
					console.log ("getUserInfo: userinfo == " + jsonStringify (userinfo));
					}
				if (callback !== undefined) {
					callback (undefined, userinfo);
					}
				});
			}
		else {
			if (callback !== undefined) {
				callback ();
				}
			}
		}
	function viewChatPage () { //4/18/19 by DW
		$("#idDayContainer").css ("background-color", "whitesmoke"); //4/20/19 by DW
		readHttpFile (chatConsts.urlChatHtml, function (chatHtmltext) { 
			$("#idChatArea").html (chatHtmltext);
			getChatUserInfo (function (err, userinfo) {
				const chatOptions = {
					urlChatServer: chatConsts.urlChatServer,
					urlChatSocket: chatConsts.urlChatSocket,
					editorPlaceholderText: chatConsts.editorPlaceholderText,
					minSecsBetwAutoSave: 3,
					userInfoFromTwitter: userinfo,
					newMessageCallback: function (jstruct) {
						},
					updatedMessageCallback: function (jstruct) {
						},
					getConfigCallback: function () {
						return (chatConsts);
						},
					processTextCallback: function (s) {
						return (emojiProcess (s));
						}
					};
				myChatApp = new chatApp (chatOptions, function () {
					$("#idLeadingQuestion").text (chatConsts.leadingQuestion);
					$("#idMainColumn").css ("visibility", "visible");
					self.setInterval (everySecond, 1000); 
					});
				});
			});
		}
//how long running -- 8/9/19 by DW
	function howLongSinceStartAsString (whenStart) {
		var x = howLongSinceStart (whenStart);
		function getnum (num, units) {
			if (num != 1) {
				units += "s";
				}
			return (num + " " + units);
			}
		return (getnum (x.years, "year") + ", " + getnum (x.months, "month") + ", " + getnum (x.days, "day") + ", " + getnum (x.hours, "hour") + ", " + getnum (x.minutes, "minute") + ", " + getnum (x.seconds, "second") + ".");
		}
//infinite scrolling -- 10/17/19 by DW
	var whenLastMoreButtonClick = new Date (0);
	var currentOldestPageDate = undefined;
	
	function moreButtonClick () {
		if (currentOldestPageDate === undefined) {
			currentOldestPageDate = config.oldestDayOnHomePage;
			}
		var day = dateYesterday (currentOldestPageDate);
		var url = "http://montana.scripting.com:1400/day?blog=dave&day=" + day.toUTCString ();
		currentOldestPageDate = day;
		readHttpFileThruProxy (url, undefined, function (htmltext) {
			if (htmltext !== undefined) {
				$("#idTabContent").append ("<div class=\"divArchivePageDay\">" + htmltext + "</div>")
				setupJavaScriptFeatures ();
				}
			});
		}
	function infiniteScrollHandler () {
		}
//view Radio3 links rewrite -- 10/1/21 by DW
	function viewRadio3Links (callback) {
		console.log ("viewRadio3Links");
		
		var linkbloghtmltext = "";
		var pagetable = {
			homePageDateFormat: "%A, %B %e, %Y",
			whenLinkblogStart: new Date ("9/1/2014"),
			twitterScreenname: "davewiner"
			};
		
		var ctDaysOnPage = 25;
		var daysTable;
		
		function viewPagetable () {
			console.log (jsonStringify (pagetable));
			}
		function viewLastUpdate (when) {
			$("#idLastUdpate").html (formatDate (when, "%a %d %b %Y, %r"));
			}
		function appendDay (jstruct) {
			var htmltext = "", indentlevel = 0;
			var dateFormat = "%A, %B %e, %Y";
			try {dateFormat = pagetable.homePageDateFormat} catch (err) {};
			var datestring = formatDate (jstruct.when, dateFormat);
			function add (s) {
				htmltext += filledString ("\t", indentlevel) + s + "\n";
				}
			add ("<div class=\"divLinkblogDayTitle\">" + datestring + "</div>");
			add ("<div class=\"divLinkblogDay\">"); indentlevel++;
			for (var i = 0; i < jstruct.dayHistory.length; i++) {
				try {
					var item = jstruct.dayHistory [i], linktext = "", icon = "";
					//set linktext, icon
						if ((item.link != undefined) && (item.link.length > 0)) {
							var splitUrl = urlSplitter (trimLeading (item.link, " ")); //10/15/14 by DW -- remove leading blanks
							var host = splitUrl.host;
							if (beginsWith (host, "www.")) {
								host = stringDelete (host, 1, 4);
								}
							linktext = " <a class=\"aHost\" href=\"" + item.link + "\" target=\"blank\">" + host + "</a>";
							
							
							}
					add ("<p>" + icon + item.text + linktext + "</p>");
					}
				catch (error) {
					console.log ("appendDay: error == " + error + " while adding item == " + item.text);
					}
				}
			add ("</div>"); indentlevel--;
			linkbloghtmltext += htmltext;
			}
		function loadOneDay (theDay, callback) {
			var urlFolder = "http://radio3.io/users/" + pagetable.twitterScreenname + "/";
			var url = urlFolder + getDatePath (theDay) + "history.json", whenReadStart = new Date ();
			readHttpFile (url, function (jsontext) {
				var jstruct = undefined;
				try {
					jstruct = JSON.parse (jsontext);
					}
				catch (err) {
					console.log ("loadOneDay: err.message == " + err.message);
					}
				if (callback !== undefined) {
					callback (jstruct);
					}
				});
			}
		function loadDaysTable (callback) {
			var whenBlogStart = dateYesterday (pagetable.whenLinkblogStart), whenstart = new Date ();
			function loadOne (theDay) {
				loadOneDay (theDay, function (jstruct) {
					var yesterday = dateYesterday (theDay);
					if (jstruct != undefined) {
						appendDay (jstruct); //why is this here? -- 11/6/14 by DW
						daysTable.unshift ({
							when: theDay,
							jstruct: jstruct
							});
						}
					if ((daysTable.length < ctDaysOnPage) && (dayGreaterThanOrEqual (yesterday, whenBlogStart))) {
						loadOne (yesterday);
						}
					else {
						if (callback != undefined) { //10/24/14 by DW
							callback ();
							}
						console.log ("loadDaysTable: " + secondsSince (whenstart) + " secs.");
						}
					});
				}
			daysTable = new Array ();
			loadOne (new Date ());
			}
		function viewDays () {
			$("#idLinkblogDays").html ("");
			for (var i = daysTable.length - 1; i >= 0; i--) {
				appendDay (daysTable [i].jstruct);
				}
			}
		function reloadTodaysLinks () {
			var now = new Date (), flfound = false;
			loadOneDay (now, function (jstruct) {
				for (var i = 0; i < daysTable.length; i++) {
					if (daysTable [i] != undefined) {
						if (sameDay (daysTable [i].when, now)) {
							daysTable [i].jstruct = jstruct;
							flfound = true;
							}
						}
					}
				if (!flfound) {
					daysTable.push (jstruct);
					delete daysTable [0];
					}
				viewDays ();
				viewLastUpdate (jstruct.when);
				});
			}
		
		loadDaysTable (function () {
			viewDays ();
			callback (linkbloghtmltext);
			});
		}
//feedland rivers -- 11/15/23 by DW
	function viewRiver (screenname, catname, whereToAppend, callback) {
		displayTraditionalRiver ({screenname, catname}, whereToAppend, function (err) {
			if (err) {
				alertDialog (err.message);
				}
			});
		}

function setTextSize (amount) {
	
	function getFontSize (x) {
		var att = $(x).css ("font-size");
		att = stringMid (att, 1, att.length - 2); //pop off px
		var size = Number (att);
		console.log ("getFontSize: size == " + size);
		return (size);
		}
	function bumpFontSize (x) {
		var newsize = getFontSize (x) + amount;
		if (newsize > 0) {
			$(x).css ("font-size", newsize);
			}
		}
	
	$(".divSingularItem").each (function () {
		bumpFontSize (this);
		});
	$(".spTitleLink").each (function () {
		bumpFontSize (this);
		});
	$(".divTitledItem li").each (function () {
		bumpFontSize (this);
		});
	$(".divDayTitle a").each (function () {
		bumpFontSize (this);
		});
	}
function increaseTextSize () { //5/19/18 by DW
	$("#idTextSizePlus").blur (); 
	setTextSize (1);
	}
function decreaseTextSize () { //5/19/18 by DW
	$("#idTextSizeMinus").blur (); 
	setTextSize (-1);
	}
function initWedge (domObject, clickCallback) { //the caret goes to the left of the object -- 7/24/17 by DW
	var theIcon = $("<i class=\"" + rightCaret + "\"></i>");
	var theWedge = $("<span class=\"spScriptingNewsWedge\"></span>");
	$(theWedge).append (theIcon);
	$(domObject).prepend (theWedge);
	theWedge.click (function () {
		var className = $(theIcon).attr ("class");
		if (className == rightCaret) {
			clickCallback (true); //expand
			$(theIcon).attr ("class", downCaret);
			}
		else {
			clickCallback (false); //collapse
			$(theIcon).attr ("class", rightCaret);
			}
		});
	return (theWedge);
	}
function setupExpandableType (attname, htmlTemplate) {
	function fixYoutubeUrl (url) { //3/18/18; by DW
		const prefix = "https://www.youtube.com/watch?v=";
		if (beginsWith (url, prefix)) {
			url = "https://www.youtube.com/embed/" + stringDelete (url, 1, prefix.length);
			}
		return (url);
		}
	$(".divPageBody li, .divSingularItem").each (function () {
		var parentOfTweet = this, theObject = undefined;
		var theText = $(this).text ();
		var attval = $(this).data (attname.toLowerCase ());
		if (attval !== undefined) {
			if (attname == "urlvideo") { //3/18/18; by DW
				attval = fixYoutubeUrl (attval);
				}
			initWedge (parentOfTweet, function (flExpand) {
				function exposetheObject () {
					$(theObject).slideDown (0, 0, function () {
						$(theObject).css ("visibility", "visible");
						});
					}
				if (flExpand) {
					if (theObject === undefined) {
						let htmltext = replaceAll (htmlTemplate, "[%attval%]", attval);
						theObject = $(htmltext);
						$(parentOfTweet).append (theObject);
						exposetheObject ();
						}
					else {
						exposetheObject ();
						}
					}
				else {
					$(theObject).slideUp (0, 0, function () {
						});
					}
				});
			}
		});
	}
function setupExpandableImages () {
	setupExpandableType ("urlexpandableimage", "<img class=\"imgExpandable\" src=\"[%attval%]\">");
	}
function setupExpandableVideo () {
	setupExpandableType ("urlvideo", "<iframe width=\"560\" height=\"315\" src=\"[%attval%]\" frameborder=\"0\" allowfullscreen></iframe>");
	}
function setupExpandableDisqusThreads () {
	const myDisqusGroup = "scripting";
	
	function getDisqusCommentsText (thispageurl, disqusGroup) {
		var s = "";
		if (disqusGroup === undefined) {
			disqusGroup = myDisqusGroup;
			}
		if (thispageurl === undefined) {
			thispageurl = window.location.href;
			}
		var disqusTextArray = [
			"\n<div class=\"divDisqusComments\">\n",
				"\t<div id=\"disqus_thread\"></div>\n",
				"\t<script>\n",
					"\t\tvar disqus_config = function () {\n",
						"\t\t\tthis.page.url = \"" + thispageurl + "\"; \n",
						"\t\t\t};\n",
					"\t\t(function () {  \n",
						"\t\t\tvar d = document, s = d.createElement ('script');\n",
						"\t\t\ts.src = '//" + disqusGroup + ".disqus.com/embed.js';  \n",
						"\t\t\ts.setAttribute ('data-timestamp', +new Date());\n",
						"\t\t\t(d.head || d.body).appendChild(s);\n",
						"\t\t\t})();\n",
					"\t\t</script>\n",
				"\t</div>\n"
			];
		for (var i = 0; i < disqusTextArray.length; i++) {
			s += disqusTextArray [i];
			}
		console.log ("getDisqusCommentsText: " + s);
		
		return (s)
		}
	
	function startDisqus (disqusGroup) {
		(function() {
			var dsq = document.createElement ('script'); dsq.type = 'text/javascript'; dsq.async = true;
			dsq.src = '//' + disqusGroup + '.disqus.com/embed.js';
			$("body").appendChild (dsq);
			})();
		}
		
	setupExpandableType ("flExpandableDisqusThread", "<div class=\"divDisqusThread\"><div id=\"disqus_thread\"></div></div>");
	startDisqus (myDisqusGroup);
	}
function setupTweets () {
	function getEmbedCode (id, callback) {
		var url = "http://twitterembed.scripting.com/getembedcode?id=" + encodeURIComponent (id);
		$.ajax ({
			type: "GET",
			url: url,
			success: function (data) {
				callback (data);
				},
			error: function (status) { 
				console.log ("getEmbedCode: error == " + JSON.stringify (status, undefined, 4));
				callback (undefined); 
				},
			dataType: "json"
			});
		}
	function viewTweet (idTweet, idDiv, callback) { //12/22/19 by DW
		var idViewer = "#" + idDiv, now = new Date ();
		if (idTweet == undefined) {
			$(idViewer).html ("");
			}
		else {
			getEmbedCode (idTweet, function (struct) {
				$(idViewer).css ("visibility", "hidden");
				$(idViewer).html (struct.html);
				if (callback != undefined) {
					callback (struct);
					}
				});
			}
		$(idViewer).on ("load", function () {
			$(idViewer).css ("visibility", "visible");
			});
		}
	$(".divPageBody li, .divSingularItem").each (function () {
		var parentOfTweet = this, tweetObject = undefined;
		var theText = $(this).text ();
		var urlTweet = $(this).data ("urltweet");
		
		var tweetId = $(this).data ("tweetid"), tweetUserName = $(this).data ("tweetusername"); //11/16/17 by DW
		if ((tweetId !== undefined) && (tweetUserName !== undefined) && (urlTweet === undefined)) {
			urlTweet = "https://twitter.com/" + tweetUserName + "/status/" + tweetId;
			}
		
		if (urlTweet !== undefined) {
			let idTweet = stringLastField (urlTweet, "/");
			initWedge (parentOfTweet, function (flExpand) {
				$(this).blur (); //12/22/19 by DW
				function exposeTweetObject () {
					$(tweetObject).slideDown (75, undefined, function () {
						$(tweetObject).on ("load", function () {
							$(tweetObject).css ("visibility", "visible");
							});
						});
					}
				if (flExpand) {
					if (tweetObject === undefined) {
						let tweetObjectId = "tweet" + idTweet;
						let htmltext = "<div class=\"divEmbeddedTweet\" id=\"" + tweetObjectId + "\"></div>";
						tweetObject = $(htmltext);
						$(parentOfTweet).append (tweetObject);
						if (twStorageData.urlTwitterServer === undefined) { //11/15/18 by DW
							console.log ("setupTweets: twStorageData.urlTwitterServer == undefined");
							twStorageData.urlTwitterServer = urlLikeServer; //whack the bug -- 11/23/18 by DW
							}
						viewTweet (idTweet, tweetObjectId, function () {
							exposeTweetObject ();
							});
						}
					else {
						exposeTweetObject ();
						}
					}
				else {
					$(tweetObject).slideUp (75);
					}
				});
			}
		});
	}

function setupMastodonToots () { //4/9/23 by DW
	$(".divPageBody li, .divSingularItem").each (function () {
		const urltoot = $(this).data ("urltoot");
		var parentOfToot = this, tootObject = undefined;
		if (urltoot !== undefined) {
			console.log ("setupMastodonToots: urltoot == " + urltoot); 
			initWedge (parentOfToot, function (flExpand) {
				if (flExpand) {
					function exposeTootObject () {
						$(tootObject).slideDown (75, undefined, function () {
							$(tootObject).css ("visibility", "visible");
							});
						}
					if (tootObject === undefined) {
						const domain = urltoot.split ("/") [2];
						const urlembed = "https://" + domain + "/api/oembed?url=" + encodeURIComponent (urltoot);
						readHttpFile (urlembed, function (jsontext) {
							if (jsontext !== undefined) {
								const jstruct = JSON.parse (jsontext);
								console.log ("setupMastodonToots: jsontext == " + jsonStringify (jstruct));
								tootObject = $("<div class=\"divEmbeddedToot\"></div>");
								const embeddedObject = $(jstruct.html);
								embeddedObject.attr ("width", 500);
								$(tootObject).append (embeddedObject);
								$(parentOfToot).append (tootObject);
								exposeTootObject ();
								}
							});
						}
					else {
						exposeTootObject ();
						}
					}
				else {
					$(tootObject).slideUp (75);
					}
				});
			}
		});
	}

function setupExpandableOutline () {
	$(".divPageBody li").each (function () {
		var ul = $(this).next ();
		var parentOfTweet = this, tweetObject = undefined;
		var theText = $(this).text ();
		var collapse = $(this).data ("collapse");
		if (getBoolean (collapse)) {
			initWedge (this, function (flExpand) {
				if (flExpand) {
					$(ul).slideDown (75, undefined, function () {
						$(ul).css ("display", "block");
						});
					}
				else {
					$(ul).slideUp (75);
					}
				});
			}
		});
	}
function setupXrefs () {
	$(".divPageBody li, .divSingularItem").each (function () {
		var theText = $(this).text ();
		var xref = $(this).data ("xref");
		if (xref !== undefined) {
			var theListItem = this, outlineObject = undefined;
			var fname, folder, url;
			if (stringContains (xref, "#")) {
				fname = "a" + stringDelete (stringNthField (xref, "#", 2), 1, 1) + ".json"
				folder = replaceAll (stringNthField (xref, "#", 1),  ".html", "");
				}
			else { //handle xrefs that point to story pages -- 7/13/18 by DW
				fname = "a" + stringPopExtension (stringLastField (xref, "/")) + ".json";
				folder = stringPopLastField (xref, "/");
				}
			url = replaceAll (folder, "scripting.com/", "scripting.com/data/items/") + "/" + fname; //2/6/20 by DW
			
			console.log ("setupXrefs: url == " + url);
			
			initWedge (theListItem, function (flExpand) {
				if (flExpand) {
					function exposeOutlineObject () {
						$(outlineObject).slideDown (75, undefined, function () {
							$(outlineObject).css ("display", "block");
							
							});
						}
					if (outlineObject === undefined) {
						readHttpFile (url, function (jsontext) {
							if (jsontext !== undefined) {
								var jstruct = JSON.parse (jsontext), permalinkString = "", htmltext;
								
								if (jstruct.created !== undefined) {
									permalinkString = "<div class=\"divXrefPermalink\"><a href=\"" + xref + "\">" + formatDate (jstruct.created, "%b %e, %Y") + "</a></div>";
									}
								
								if (jstruct.subs !== undefined) {
									htmltext = renderOutlineBrowser (jstruct, false, undefined, undefined, true);
									}
								else {
									htmltext = jstruct.text;
									}
								
								htmltext = "<div class=\"divXrefOutline\">" + permalinkString + htmltext + "</div>";
								
								outlineObject = $(htmltext);
								
								$(theListItem).append (outlineObject);
								
								exposeOutlineObject ();
								
								}
							});
						}
					else {
						exposeOutlineObject ();
						}
					}
				else {
					$(outlineObject).slideUp (75);
					}
				});
			}
		});
	}
function setupSpoilers () {
	$(".spSpoiler").each (function () {
		var spoilertext = $(this).html ();
		console.log ("setupSpoilers: spoilertext == " + spoilertext);
		console.log ("setupSpoilers");
		$(this).text ("[Spoilers.]");
		$(this).css ("display", "inline");
		$(this).mousedown (function () {
			console.log ("setupSpoilers: spoilertext == " + spoilertext);
			$(this).text (spoilertext);
			});
		});
	}
function setupTagrefs () { //7/17/21 by DW
	tagrefDialogStartup ();
	}
function viewInPopup (obj) {
	var htmltext = "", indentlevel = 0;
	function add (s) {
		htmltext +=  filledString ("\t", indentlevel) + s + "\n";
		}
	add ("<div class=\"divPopupWindow\">"); indentlevel++;
	add ("<div id=\"idPopupWindow\" class=\"modal hide fade\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"attPopupWindow\" aria-hidden=\"true\">"); indentlevel++;
	add ("<div class=\"modal-body\">"); indentlevel++;
	add ("<a href=\"#\" class=\"close\" data-dismiss=\"modal\">&times;</a>")
	add ("<div id=\"idStoryHtml\"></div>");
	add ("</div>"); indentlevel--;
	add ("</div>"); indentlevel--;
	add ("</div>"); indentlevel--;
	
	}
function initSnap (urlOpmlFile, idOutlineObject, outlineTitle, flSnapOpenInitially, callback) { 
	callback ();
	}
function viewAboutPage () {
	var urlAbout = "http://scripting.com/aboutpage.opml";
	var title = $("#idAboutOutline").data ("title");
	readOpmlFile (urlAbout, "idAboutOutline", title, function () {
		});
	}
var disqus_config = function () {
	this.page.url = "http://scripting.com/";
	this.page.identifier = "scriptingNewsHomePageComments1";
	};
function viewDiscussPage () { //12/19/17 by DW
	var intro = "<div class=\"divDiscussIntro\">Welcome to the <i>Discuss</i> tab on Scripting News. The comments here are moderated, according to <a href=\"http://guidelines.scripting.com/\" target=\"_blank\">published guidelines</a>. Please read them, remember the rules and all will be good. Dave</div>";
	$("#idScriptingDiscuss").html (intro + "<div class=\"divComments\" id=\"disqus_thread\"></div>");
	(function() { 
		var d = document, s = d.createElement('script');
		
		s.src = 'https://scripting.disqus.com/embed.js';
		
		s.setAttribute('data-timestamp', +new Date());
		(d.head || d.body).appendChild(s);
		})();
	}
function viewRiverPage () {
	var urlRiver = "http://radio3.io/rivers/iowa.js"; 
	var title = $("#idRiverDisplay").data ("title");
	httpGetRiver (urlRiver, "idRiverDisplay", function () {
		});
	}
function viewLinksPage (callback) {
	var urlRiver = "http://radio3.io/rivers/iowa.js"; 
	var title = $("#idRiverDisplay").data ("title");
	readHttpFile ("http://radio3.io/users/davewiner/linkblog.json", function (jsontext) {
		var daysTable = JSON.parse (jsontext);
		$("#idLinkblogDays").html ("");
		for (var i = 0; i < daysTable.length; i++) { //10/8/16 by DW
			appendDay (daysTable [i].jstruct);
			}
		if (callback != undefined) {
			callback ();
			}
		});
	}
function viewLastUpdateString () { //9/28/17 by DW
	if (config.flHomePage) {
		var whenstring = getFacebookTimeString (config.now, true); //2/25/18 by DW
		if (beginsWith (whenstring, "Yesterday")) {
			whenstring = "Yesterday";
			}
		$("#idLastScriptingUpdate").html ("Updated: " + whenstring + ".");
		}
	}
function updateSnarkySlogan () { //1/23/19 by DW
	$("#idSnarkySlogan").html (getRandomSnarkySlogan ());
	}
function everyMinute () {
	viewLastUpdateString ();
	updateSnarkySlogan (); //1/23/19 by DW
	}
function everySecond () {
	$(".spHowLongUntilBidenStarts").each (function () { //1/18/21 by DW
		function getTrumpTimeRemaining () {
			var whenInaugration = new Date ("Wed Jan 20 2021 11:59:59 GMT-0500 (Eastern Standard Time)");
			var now = new Date ();
			var ctsecs = (whenInaugration - now) / 1000;
			
			const ctsecsinday = 60 * 60 * 24;
			const ctsecsinhour = 60 * 60;
			var ctdays = Math.floor (ctsecs / ctsecsinday);
			ctsecs -= ctdays * ctsecsinday;
			
			var cthours = Math.floor (ctsecs / ctsecsinhour);
			ctsecs -= cthours * ctsecsinhour;
			
			var ctminutes = Math.floor (ctsecs / 60);
			ctsecs -= ctminutes * 60;
			ctsecs = Math.floor (ctsecs);
			
			var s = "";
			function addnum (num, label, fllast) {
				if (num > 0) {
					if (num == 1) {
						label = stringDelete (label, label.length, 1);
						}
					s += num + " " + label;
					if (!fllast) {
						s += ", ";
						}
					}
				}
			addnum (ctdays, "days");
			addnum (cthours, "hours");
			addnum (ctminutes, "minutes");
			addnum (ctsecs, "seconds", true);
			return (s);
			}
		$(this).text (getTrumpTimeRemaining ());
		});
	$(".spRandomMotto").each (function () { //8/7/19 by DW
		$(this).text (getRandomSnarkySlogan ());
		});
	$(".spHowLongRunning").each (function () { //8/9/19 by DW
		$(this).text ("This blog has been running for: " + howLongSinceStartAsString (new Date ("10/7/1994, 12:00 PDT")));
		});
	}
function setupJavaScriptFeatures () { //1/15/19 by DW
	setupXrefs (); //7/13/17 by DW
	setupTweets (); //7/24/17 by DW
	setupExpandableImages (); //7/24/17 by DW
	setupExpandableVideo (); //10/9/17 by DW
	setupExpandableOutline (); //5/15/18 by DW
	setupTwitterComments (); //12/14/18 by DW
	setupLikes (); //11/8/18 by DW
	setupSpoilers (); //3/3/20 by DW
	setupTagrefs (); //7/17/21 by DW
	setupMastodonToots (); //4/9/23 by DW
	try { //9/21/19 by DW
		if (modalImageViewStartup !== undefined) { //6/25/18 by DW
			modalImageViewStartup (); 
			}
		}
	catch (err) {
		}
	}
function setPageTopImageFromMetadata () { //5/4/20 by DW
	if (config.metadata !== undefined) {
		if (config.metadata.image !== undefined) {
			$("#idPagetopImage").css ("background-image", "url(" + config.metadata.image + ")");
			}
		}
	}
function movePageDownForOldArchivePages () { //9/21/19 by DW
	var fladjust = !dayGreaterThanOrEqual (opmlHead.dateModified, "21 Apr 2019")
	if (fladjust) {
		$(".divPageBody").css ("margin-top", "270px")
		}
	}
function setDescription () { //4/10/21; 11:49:17 AM by DW
	}
function startup () {
	console.log ("startup");
	
	if (location.host == "scripting.com.s3-website-us-east-1.amazonaws.com") { //8/22/23 by DW
		let newhref = replaceAll (location.href, location.host, "scripting.com");
		console.log ("newhref = " + newhref);
		location.href = newhref;
		}
	
	setDescription (); //4/10/21 by DW
	$("#idVersionNumber").text (myVersion);
	updateTwitterButton (); //4/23/19 by DW
	movePageDownForOldArchivePages (); //9/21/19 by DW
	twStorageData.urlTwitterServer = urlLikeServer;
	console.log ("startup: twStorageData.urlTwitterServer == " + twStorageData.urlTwitterServer);
	twGetOauthParams (); //11/10/18 by DW
	if (localStorage.savedState !== undefined) {
		savedState = JSON.parse (localStorage.savedState);
		savedState.currentTab = "blog"; //4/6/20 AM by DW
		}
	//get tab param, if present, redirect to appropriate page
		var theParam = getURLParameter ("tab");
		if (theParam == "null") {
			theParam = getURLParameter ("panel");
			}
		if (theParam != "null") {
			var newloc = undefined;
			switch (theParam) {
				case "about":
					savedState.currentTab ="about"; //9/11/17 by DW
					break;
				case "river":
					newloc = "river.html"
					break;
				case "links":
					savedState.currentTab ="linkblog"; //9/11/17 by DW
					break;
				case "blog": //9/11/17 by DW
					savedState.currentTab ="blog"; //9/11/17 by DW
					break;
				case "discuss":
					savedState.currentTab ="discuss";
					break;
				case "chat": //4/29/19 by DW
					savedState.currentTab ="chat";
					break;
				}
			if (newloc !== undefined) {
				window.location.href = config.baseUrl + newloc;
				}
			}
	
	//get tag param, if present popup the tag display in front of the blog -- 7/26/21 by DW
		var tagParam = getURLParameter ("tag");
		if (tagParam != "null") {
			openTagrefDialogExternally (tagParam);
			}
	
	
	if (savedState.currentTab == "blog") { //4/7/20 by DW -- More button only visible for the blog tab
		$("#idMoreButton").css ("display", "block"); 
		}
	initSnap (urlSidebarOpml, "idSidebarOutline", "Scripting News menu", false, function () {
		if ($("#idAboutOutline").length !== 0) { //it's the about page
			viewAboutPage ();
			}
		if ($("#idRiverDisplay").length !== 0) { //it's the river page
			viewRiverPage ();
			}
		if ($("#idChatArea").length !== 0) { //it's the chat page
			viewChatPage ();
			}
		if ($("#idLinkblogDays").length !== 0) { //it's the linkblog page
			window.location.href = urlLinkblogPage;
			}
		if ($("#idScriptingDiscuss").length !== 0) { //it's the discussion page -- 12/19/17 by DW
			viewDiscussPage ();
			}
		startTabsIfHomePage (function () {
			viewLastUpdateString (); //9/28/17 by DW
			updateSnarkySlogan (); //1/23/19 by DW
			setupJavaScriptFeatures ();
			setPageTopImageFromMetadata (); //5/4/20 by DW
			hitCounter (); 
			if (config.flGoogleAnalytics) {
				initGoogleAnalytics (config.appDomain, config.idGoogleAccount); 
				}
			self.setInterval (everySecond, 1000); 
			runEveryMinute (everyMinute);
			infiniteScrollHandler (); //10/17/19 by DW
			});
		});
	}
