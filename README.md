# oldSchoolBlog 

Blogging in the ways of the old school.

### Blog post

I wrote a <a href="http://scripting.com/2019/06/02/150411.html">blog post</a> on June 2, 2019 about Old School. 

### Updates

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

