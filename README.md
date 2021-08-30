# oldSchoolBlog

Blogging in the ways of the old school.

### Blog post

I wrote a <a href="http://scripting.com/2019/06/02/150411.html">blog post</a> on June 2, 2019 about Old School. 

### Updates

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

