#### v0.8.5 --12/2/23 by DW

Added debugging code for pings in publishRssFeed.

#### v0.8.4 -- 6/29/23 by DW

Breakage fix

* Fixed a bug where a change in the new WordPress support broke the RSS feed for Scripting News.

* I tried to make the purple pound signs on WordPress renderings point into the WP site instead of the main site, but didn't realize it was recording the permalink to use in the RSS feed later in the build process. I could have worked around this error by doing the WP rendering first, but that was too fragile for my taste. So I just made the PPS point to the scripting.com version of the permalink. It makes sense. Not a hugely important feature, I considered not supporting it at all in the WP version. But this is better. 

* Moral of the story -- Old School was built over time, with features being added to an existing process, and the dependencies aren't always obvious in the code. Why should rendering a page in HTML have any effect on the building of the RSS feed. Well, it does. :smile:

* PS: It's good to have the glue to WP working again. Long story, but I thought they had turned off MetaWeblog API support, but they didn't. Somehow the wires got crossed. Hats off to Automattic for keeping things running. 

#### v0.8.0 -- 6/28/23 by DW

Cross-posting to WordPress.

* If you include a "wordpress" object in the config for a blog, we will try to cross-post the item to that blog.

* It only attempts to cross-post titled posts.

* We don't depend on the user modifying CSS for now.

* See the helloworld example's <a href="https://github.com/scripting/oldSchoolBlog/blob/master/examples/helloworld/config.json">config.json file</a> for an example of how to set it up.

Believe it or not node-emoji of all things introduced a breaking change, so we have to hold at v1.11.0.

#### v0.7.23 -- 11/7/22 by DW

We were generating item guids with the title of the post as part of the URL. This means when you change the title, you create a new item in the flow. Commented the code out that does this. 

We added the info back to the &lt;link> element. 

Here's an example of a corrected feed item. 

&lt;link>http://data.feedland.org/changenotes/2022/11/07/231800.html?title=yourFeedInFeedland &lt;/link>

&lt;guid>http://data.feedland.org/changenotes/2022/11/07/231800.html &lt;/guid>

#### v0.7.21 -- 10/31/22 by DW

If we're using urlOpml instead of urlJson, we were using an outline that was the incorrect format for Old School. We fix it so it's the right format.

#### v0.7.21 -- 7/23/22 by DW

We weren't generating inlineImages in the RSS feed if the image was part of a titled item, and in my use of inlineImages they always are. 

#### v0.7.20 -- 11/23/21 by DW

When processing Markdown nodes, the normal thing is double-spacing, but there is a way get parts of the text to go out single-spaced. 

Documented <a href="http://scripting.com/2021/11/23/192342.html?title=nextIterationOnMarkdowninanoutline">here</a>. 

#### v0.7.16 --11/21/21 by DW

Fixed a bug where we would generate an HTML &lt;p> for a singular post that had type markdown. This would cause the purple pound sign to appear below the headline, instead of to the right of the headline, in the rendering.

For titled posts of type markdown, enclose the generated markdown text in a div not a span, because that's what it is. The type is divMarkdownText.

#### v0.7.14 --11/19/21 by DW

When proccessing titled posts with type markdown, only emit one newline per headline. We were emitting two. 

This <a href="https://github.com/scripting/drummerRFC/issues/14#issuecomment-974157255">seems</a> more compatible with the Markdown philosophy. 

#### v0.7.12 --11/10/21 by DW

We no longer require a type att on top level posts. <a href="http://scripting.com/drummer/blog/2021/11/12/161023.html?title=nodesWoTypesInBlogs">Details</a>.

RSS feeds now include the image attached to a headline, if present. 

#### v0.7.10 --11/10/21 by DW

twitter:body was an <a href="http://scripting.com/2019/12/17/151033.html">experiment</a>, as far as I know nothing is using it. And it's putting random garbage in pages. I don't have time to figure out what's going wrong, so I've commented out the feature. 

#### v0.6.30 --10/22/21 by DW

Two time zone fixes. Had to implement new versions of utils.sameDay and utils.getDatePath that take UTC and the user's local time into account. Full details <a href="https://github.com/scripting/drummerSupport/issues/88">here</a>. Thanks to Amit Gawande for his patience in dealing with these problems from India. 

#### v0.6.29 --10/18/21 by DW

Add support for urlAboutOpml.

We were using daveopml, an old package, that has some advantages, ie it expands includes.

But I prefer using the new opml package, it's what we're using going forward. And unlike daveopml, it returns the full opml structure, not just the top level subs. 

At some point we're going to want the actual head values in the about outline, for example, and if we continue this way, we won't have them.

The expanding includes code can be pulled out of daveopml and added to opml. 

#### v0.6.26 --10/14/21 by DW

Support for new timeZoneOffset head-level attribute. 

#### v0.6.25 --8/30/21 by DW

Old School was counting days on the home page incorrectly. 

There's a max of 25 days (default), it was counting every day as it worked its way back, whether or not anything had been posted that day. 

So with 25 as the max, it ran out of days on Sept 4. And thus it didn't look at anything earlier than that.

I had to rewrite the loop so it only counted days that there were actual posts on, and now it works.

#### v0.6.20 --8/30/21 by DW

Drummer users reported that if they delete a day in the outline, it doesn't get deleted from the rendered blog.

But this feature is necessary for Scripting News, when I do the monthly rollover and empty the outline

Struck a compromise. If a day has been deleted and it's before the last item in the outline, by date, then we do not include it on the home page. If it's after the last date in the outline, we do include it. 

We'll get a test of this on Sept 1, in two days. 

#### v0.6.17 -- 8/23/21 by DW

New config setting, blogConfig.flAlwaysBuildHomePage -- if true -- we rebuild the home page and all pages prefixed with its date (the archive page, story pages). 

Without this, you'd have to make a change to the text to force it to rebuild. That was ok when I was the only user, but now we're asking others to use it, this is not acceptable. ;-)

The assumption is that the user wouldn't cause a rebuild if there wasn't anything to rebuild.

It defaults true. 

#### v0.6.16 -- 8/22/21 by DW

We weren't checking for blogConfig.urlGlossaryOpml being undefined. Now we do.

