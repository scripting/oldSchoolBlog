* 11/11/20; 12:33:09 PM by DW
   * Standalone pages. If you want to do an About page for your blog, this is how you do it.
      * Create a new sub-outline, outside the calendar structure. A headline is in the calendar structure if it has a name att or it is contained within a node with a name att.
      * It must have a type attribute of page.
      * It must have a relpath attribute that says where the resulting file is to be written, relative to the top of the blog. 
   * Here's an <a href="https://gist.github.com/scripting/3c9bcf62123d20c6001d087b8722a6d5">example outline</a> that has an about page. 
* 11/6/20; 1:52:52 PM by DW
   * In generated RSS feed, allow for days with no subs, commented days, and commented items.
* 11/5/20; 12:35:26 PM by DW
   * Fixed bug where random top-level headline that's not part of the calendar structure would cause Old School to fail to process the blog.
   * Fixed bug where an empty day would cause a similar failure.
   * Don't include commented items at all levels. If you want a day to not appear, even if it has zero items, just comment out the node that represents the day.
* 11/4/20; 12:11:23 PM by DW
   * We now correctly set the value of generator in two places:
      * In the config struct available as a macro [%configJson%]. It used to copy the value from blogConfig, if it was available, and in the examples I've provided up till now it was hard-coded at a very old value. We now write over this value with the correct product name and version of the version of Old School that last built the page. 
      * As a value in the pagetable that can be substituted for [%generator%] in a template. 
* 10/6/20; 10:55:00 AM by DW
   * Previous versions attached data to the <i>config</i> structure, which made it impossible to read the structure periodically without causing havoc. This was a mistake. 
   * Now there is a new top level struct called <i>dataForBlogs,</i> with one sub-struct for each blog it's managing. Under each blog are several items including htmlArchive and calendar. They are recreated every time oldSchool starts up. 
   * Also includes a <a href="http://scripting.com/2020/09/02/154724.html?title=macrosInOldSchool">macroprocessor</a> with one verb: search. See <i>processText</i> in the source for an idea of how it works. 
* 5/26/20; 4:27:39 PM by DW
   * Add support for <a href="https://github.com/scripting/oldSchoolBlog/blob/master/worknotes/atts.md#imageLink">imageLink</a> attribute. 
* 2/4/20; 12:10:16 PM by DW
   * Mirror everything that goes to the data folder to S3
      * blogConfig.flMirrorDataToS3
      * blogConfig.basePathDataMirror
* 1/6/20; 12:02:02 PM by DW
   * when generating urls, add on a parameter with the title of the post, innercased
      * help human beings figure it out
         * example: <a href="http://scripting.com/2020/01/06/153015.html?title=sharingOnFacebook">http://scripting.com/2020/01/06/153015.html?title=sharingOnFacebook</a>
* 12/30/19; 12:09:56 PM by DW
   * A <a href="atts.md">cheat sheet</a> for current set of attributes. 
* 11/30/19; 9:43:05 AM by DW
   * publishThroughTemplate used to have a parameter pagedescription which is the description used in the Twitter and Facebook metadata. In most calls it's undefined. 
      * Changed it to a metadata object that includes a description element. This creates room for other metadata to be passed without adding more parameters to its already loaded parameter list. 
      * Add a title property to the metadata object, if present, use this instead of page title in the metadata. I want a shorter version here, without the "Scripting News: " prefix. 
      * Add metaImage property to set the image metadata for Twitter and Facebook. Can't call it image because that would cause the image to be displayed on the HTML page. Facebook says the image must be minimum 200 by 200.
* 2/11/19; 9:22:04 AM by DW
   * read config.json every minute
      * so you don't have to relaunch the app to change something in the config
   * in EO, support a new header element that says what the id for the blog is
      * that way when we send the build message to the old school server, it knows how to refer to the current blog
* 1/15/19; 5:54:30 PM by DW
   * Problem reported by Brent Simmons:
      * If I go to scripting.com, then click the Links tab, then click the Blog tab, I don't see like buttons or counts on the page. (Using Safari on latest MacOS.)
* 12/16/18; 11:48:42 AM by DW
   * More work on Twitter comments
      * The symbolic characters in the buttons are lower opacity
         * they're too strong visually
      * The title of the dialog is a function of the contents of the post
         * for titled items it's the title
         * for untitled items it's the first N characters
      * The character counter starts out with the right value
* 12/15/18; 9:47:29 AM by DW
   * Adding Twitter comments to Scripting News
      * Cancel button and close box on dialog
      * How many characters to reserve for a URL?
      * Each tweet has a #scriptingnews hashtag and the URL of the post it's in reply to.
      * If you're not logged on, clicking the Twitter icon takes you to the logon page on Twitter, as the Likes feature does. 
* 11/22/18; 1:36:48 PM by DW
   * all posts are by default likeable starting Nov 22, 2018.
      * you can still make one not likeable by adding an fllikeable attribute with the value false.
