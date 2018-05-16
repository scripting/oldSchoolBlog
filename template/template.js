var myVersion = "0.6.10";
var mySnap, flSnapDrawerOpen = false;
var urlSidebarOpml = "http://scripting.com/misc/menubar.opml";
var drawerWidth = 300;

const rightCaret = "fa fa-caret-right darkCaretColor", downCaret = "fa fa-caret-down lightCaretColor";
var tweetSerialnum = 0;
var urlTwitterServer = "http://electricserver.scripting.com/";
const urlLinkblogPage = "http://scripting.com/?tab=links"; //9/13/17 by DW




//tabs -- 9/11/17 by DW
	const tabs = {
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
		river: {
			enabled: false,
			path: "river.html",
			title: "River",
			icon: "newspaper-o",
			htmltext: "<div class=\"divRiverContainer\"><div class=\"divRiverDisplay\" id=\"idRiverDisplay\" data-title=\"River\"></div></div>",
			urlRiver: "http://radio3.io/rivers/iowa.js",
			click: viewRiverTab
			},
		discuss: {
			enabled: true,
			path: "discuss.html",
			title: "Discuss",
			icon: "comment-o",
			htmltext: "<div class=\"divScriptingDiscuss\" id=\"idScriptingDiscuss\" data-title=\"Discuss\"></div>",
			click: viewDiscussTab
			},
		about: {
			enabled: true,
			path: "about.html",
			title: "About",
			icon: "info-circle",
			htmltext: "<div class=\"divAboutOutline\" id=\"idAboutOutline\"></div>",
			outlineTitle: "About Scripting News",
			urlAboutOpml: "http://scripting.com/aboutpage.opml",
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
	function initLinkblog (callback) {
		function appendDay (jstruct) {
			var daytext = "", indentlevel = 0;
			var dateFormat = "%A, %B %e, %Y";
			try {dateFormat = pagetable.homePageDateFormat} catch (err) {};
			var datestring = formatDate (jstruct.when, dateFormat);
			function add (s) {
				daytext += filledString ("\t", indentlevel) + s + "\n";
				}
			add ("<div class=\"divDayTitle\">" + datestring + "</div>");
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
			return (daytext)
			}
		readHttpFile (tabs.linkblog.urlLinkblogJson, function (jsontext) {
			if (jsontext !== undefined) { //11/19/17 by DW
				var htmltext = "", daysTable = JSON.parse (jsontext);
				for (var i = 0; i < daysTable.length; i++) { //10/8/16 by DW
					htmltext += appendDay (daysTable [i].jstruct);
					}
				tabs.linkblog.savedtext = htmltext
				}
			if (callback != undefined) {
				callback ();
				}
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
	function tabClick (tabname) {
		console.log ("tabClick: tabname == " + tabname);
		let theTab = tabs [tabname];
		if (theTab.click !== undefined) {
			theTab.click ();
			}
		savedState.currentTab = tabname;
		saveState ();
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
					tabClick (savedState.currentTab);
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
					$(theObject).slideDown (75, undefined, function () {
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
					$(theObject).slideUp (75);
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
			console.log ("setupTweets: urlTweet == " + urlTweet + ", theText == " + theText);
			initWedge (parentOfTweet, function (flExpand) {
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
						twViewTweet (idTweet, tweetObjectId, function () {
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
			var fname = "a" + stringDelete (stringNthField (xref, "#", 2), 1, 1) + ".json"
			var folder = replaceAll (stringNthField (xref, "#", 1),  ".html", "");
			var url = replaceAll (folder, "scripting.com/", "scripting.com/items/") + "/" + fname;
			
			console.log ("setupXrefs: theText == " + theText + ", url == " + url);
			
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
function viewInPopup (obj) {
	console.log ("viewInPopup: " + obj);
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
	
	console.log (htmltext);
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
function everyMinute () {
	viewLastUpdateString ();
	}
function everySecond () {
	}
function startup () {
	console.log ("startup");
	$("#idVersionNumber").text (myVersion);
	twStorageData.urlTwitterServer = urlTwitterServer; //7/24/17 AM by DW -- for displaying embedded tweets
	if (localStorage.savedState !== undefined) {
		savedState = JSON.parse (localStorage.savedState);
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
				}
			if (newloc !== undefined) {
				window.location.href = config.baseUrl + newloc;
				}
			}
	initSnap (urlSidebarOpml, "idSidebarOutline", "Scripting News menu", false, function () {
		if ($("#idAboutOutline").length !== 0) { //it's the about page
			viewAboutPage ();
			}
		if ($("#idRiverDisplay").length !== 0) { //it's the river page
			viewRiverPage ();
			}
		if ($("#idLinkblogDays").length !== 0) { //it's the linkblog page
			window.location.href = urlLinkblogPage;
			}
		if ($("#idScriptingDiscuss").length !== 0) { //it's the discussion page -- 12/19/17 by DW
			viewDiscussPage ();
			}
		startTabsIfHomePage (function () {
			viewLastUpdateString (); //9/28/17 by DW
			setupXrefs (); //7/13/17 by DW
			setupTweets (); //7/24/17 by DW
			setupExpandableImages (); //7/24/17 by DW
			setupExpandableVideo (); //10/9/17 by DW
			setupExpandableOutline (); //5/15/18 by DW
			hitCounter (); 
			if (config.flGoogleAnalytics) {
				initGoogleAnalytics (config.appDomain, config.idGoogleAccount); 
				}
			self.setInterval (everySecond, 1000); 
			self.setInterval (everyMinute, 60000); 
			});
		});
	
	}