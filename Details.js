require('babel-core/register')({presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';


// Notes on use of JSX (embedded HTML) for when converting HTML to JSX
// Anything that is to be parameterised gets {} and code between is javascript executed in context (this has the expected meaning)
// By implication an embedded object is {{foo: bar}}
// All comments have to be quoted <!--foo--> becomes {/*--foo--*}
// The "ReactFake code is a little more tolerant than React, specifically
// React requires style={{display: none}} ReactFake can also handle quoted style="display: none"
// React requires className= rather than class=, ReactFake supports both

import Util from './Util';
import ArchiveBase from './ArchiveBase'
import ArchiveFile from "./ArchiveFile";


export default class Details extends ArchiveBase {
    constructor(id, item = undefined) {
        super(id);
        this.item = item;
        this._listLoad();
    }

    wrap() {
        /* Wrap the content up checked on mbid (Red Shift)
        context: body wrap(
        content: (on image)  wrap( TODO-DONATEBANNER | nav-wrap | maincontent | theatre-ia-wrap | item-details-about | TODO-ACTIONBUTTONS | TODO-ALSOFOUND  | TODO-ANALYTICS )
        returns: elements tree suitable for adding into another render
         */
        return (
            <div id="wrap" itemscope itemtype={this.itemtype}>
                {/* Missing donate-banner and scripts & css before it */}
                { new Nav().navwrap() }
                {/*--Begin page content --*/}
                <div class="container container-ia">
                    <a name="maincontent" id="maincontent"></a>
                </div>{/*--//.container-ia--*/}
                {this.theatreIaWrap()} {/*This is the main-content*/}
                {this.itemDetailsAboutJSX()}
                {this.itemDetailsAlsoFound()}
                {/* should have: alsoFound here (look at end of commute.html) - but not on Directory (and maybe some other types ?collection?) */}
                {/* should have: analytics here (look at end of commute.html) - but not on Directory (and maybe some other types ?collection?)*/}
            {/*--wrap--*/}</div>
        );
    }


    archive_setup_push() {
        archive_setup.push(function(){  // This is common to Text, AV and image - though some have stuff before this and some a
            AJS.tilebars(); // page load
            $(window).on('resize  orientationchange', function(evt){
                clearTimeout(AJS.also_found_throttler)
                AJS.also_found_throttler = setTimeout(AJS.tilebars, 250)
            });
        });
    }
    browserAfter() {
        // initialize_flag
        // overlay related
        $(".toggle-flag-overlay").click(function (e) {
            e.preventDefault();
            $("#theatre-ia-wrap").removeClass("flagged");
        });
        // overlay - checkboxes
        $("#flag-checkboxes a").on("click", function (e) {
            e.preventDefault();
            $(this).children(".my-checkbox").toggleClass("checked");
            $.get($(this).attr("href"))
        });
        super.browserAfter(); // runs archive_setup_push and Util.AJS_on_dom_loaded(); Do this after the scripts above - which means put this browserAfter AFTER superclasses
    }

    embedWordpress() {
        // THis appeared on image and movie examples
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        return (
            <div>
                <form className="form" role="form">
                    <div className="form-group">
                        <label>EMBED (for wordpress.com hosted blogs)</label>
                        <textarea id="embedcodehereWP" className="form-control textarea-invert-readonly"
                                  rows="3" readOnly="readonly">{`[archiveorg ${itemid} width=560 height=384 frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]`}</textarea>
                    </div>
                </form>
            </div>
        );
    }
    embedAdvanced(type) {
        // From text, video, image
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        return(
            <div>
                Want more?
                <a href={`https://archive.org/help/${type}.php?identifier=${itemid}`}>Advanced embedding details, examples, and
                    help</a>!
            </div>
        );
    }
    embed() {
        // Same on text, video, image
        // Note this shortEmbedURL is just displayed in a form used to explain how to embed, its not actually called from dweb code.
        let shortEmbedURL = `https://archive.org/stream/${this.itemid}?ui=embed`;    //Note on archive.org/details this is different from iframeURL and not clear if that is intentional
        return(
            <div>
                <form class="form" role="form">
                    <div class="form-group">
                        <label>EMBED</label>
                        <textarea id="embedcodehere" class="form-control textarea-invert-readonly"
                                  rows="3" readonly="readonly">{`<iframe 
                                src=${shortEmbedURL}
                                width="480" height="430" frameborder="0"
                                webkitallowfullscreen="true" mozallowfullscreen="true"
                                allowfullscreen></iframe>`}</textarea>
                    </div>
                </form>
            </div>
        );
    }

    itemDetailsAboutJSX() {
        /* This builds a JSX tht sits underneth theatre-ia-wrap DIV that is built by theatreIaWrap */
        let itemid = this.itemid;
        let item = this.item;
        let metadata = item.metadata;
        let title = metadata.title;
        let creator = metadata.creator;
        let datePublished = metadata.date;
        let publisher=metadata.publisher;
        let keywords = metadata.subject ? Array.isArray(metadata.subject) ? metadata.subject : metadata.subject.split(';') : undefined ;
        let licence = metadata.licenseurl; //TODO - handle other licenses - hardwired for CC currently
        let languageAbbrev = metadata.language;
        let languageLong = {eng: "English", dut: "Dutch"}[languageAbbrev]; //TODO-other languages
        let description = this.preprocessDescription(metadata.description); // Contains HTML (supposedly safe) inserted via innerHTML thing
        let metadataListPossible = { color: "Color", coverage: "Location", director: "Director", identifier: "Identifier",
            "identifier-ark": "Identifier-ark", ocr: "Ocr", runtime: "Run time", ppi: "Ppi", sound: "Sound", year: "Year" }; /*TODO expand to longer list*/
        let metadataListFound = Object.keys(metadataListPossible).filter((k) => metadata[k]);    // List of keys in the metadata

        let downloadableFilesDict = this._list.reduce( (res, af) => {
                let metadata = af.metadata;
                if (af.downloadable()) {  // Note on image it EXCLUDED JPEG Thumb, but included JPEG*Thumb
                    let format = metadata.format;
                    if (!res[format]) { res[format] = []; }
                    res[format].push(af);
                }
                return res;
            }, {}
        );


            //TODO  Replace "a" with onclicks to download function on f
        let filesCount = item.files_count;
        let originalFilesCount = item.files.filter((f)=>f.source === "original").length+1; // Adds in Archive Bittorrent
        let downloadURL = `https://dweb.archive.org/download/${itemid}`;
        let compressURL = `https://archive.org/compress/${itemid}`; // leave as direct link, else need to zip and store each item in IPFS
        let compressAllURL = `https://archive.org/compress/${itemid}/formats=JSON,METADATA,JPEG,ARCHIVE BITTORRENT,MUSICBRAINZ METADATA`; // As above leave as direct
        let collections = Array.isArray(metadata.collection) ? metadata.collection : [ metadata.collection ];
        let collectionTitles = item.collection_titles;   // Dictionary mapping collection itemid to title
        let mediatype = metadata.mediatype;
        let iconochiveIcon="iconochive-"+mediatype; //obscure mediatypes are supported
        let contributor = metadata.contributor;
        let reviews = item.reviews;
        let writeReviewsURL = `https://archive.org/write-review.php?identifier=${itemid}`;  //TODO need an indirect way to submit a review
        let loginURL = "https://archive.org/account/login.php"; //TODO - its a Direct link as dont support authentication in DWeb version
        let bookmarksAddURL = `https://archive.org/bookmarks.php?add_bookmark=1&amp;mediatype=image&amp;identifier=${itemid}&amp;title=${title}`; //TODO find way to submit distributed
        let credits = metadata.credits;
        //TODO-DETAILS much of below doesn't work (yet)
        //TODO-DETAILS note the structure of this has changed - see the difference in originals between multitrackaudio and mbid for example
        return (
            <div class="container container-ia item-details-about">
                <div class="relative-row row">
                    <div class="thats-right" style="text-align:right;">
                    <div class="action-buttons">
                        <div class="topinblock">
                            <a class="button " href={bookmarksAddURL} id="favorite-button" aria-haspopup="true"
                               onclick="return AJS.modal_go(this,{{favorite:1}})" data-target="#confirm-modal" data-toggle="tooltip"
                               data-container="body" data-placement="bottom" title="Favorite this item">
                                <span class="iconochive-favorite" aria-hidden="true"></span><span class="sr-only">favorite</span>
                            </a>
                        </div>
                        <div class="topinblock">
                            <button id="share-button" class="button" type="button" aria-haspopup="true"
                                    onclick="return AJS.modal_go(this,{{ignore_lnk:1,shown:AJS.embed_codes_adjust}})"
                                    data-target="#cher-modal" data-toggle="tooltip" data-container="body" data-placement="bottom"
                                    title="Share this item">
                                <span class="iconochive-share" aria-hidden="true"></span><span class="sr-only">share</span></button>
                        </div>
                        <div
                                id="flag-button-container" class="topinblock" data-toggle="tooltip" data-placement="bottom"
                                data-container="body" title="Flag this item">
                            <div class="dropup">
                                <button id="flag-button" class=" button" type="button" data-toggle="dropdown" aria-haspopup="true"
                                        aria-expanded="false"><span class="iconochive-Flag" aria-hidden="true"></span><span
                                        class="sr-only">flag</span></button>
                                <div id="flag-popover" class="dropdown-menu" aria-labelledby="flag-button">
                                    <h3 class="dropdown-title">Flag this item for</h3>
                                    <ul role="menu">
                                        <li class="">
                                            <a href={loginURL} role="menuitem">
                                                Graphic Violence </a>
                                        </li>
                                        <li class="">
                                            <a href={loginURL} role="menuitem">
                                                Graphic Sexual Content </a>
                                        </li>
                                        <li class="">
                                            <a href={loginURL} role="menuitem">
                                                Spam, Scam or Fraud </a>
                                        </li>
                                        <li class="">
                                            <a href={loginURL} role="menuitem" >
                                            Broken or Empty Data                </a>
                                        </li>
                                    </ul>
                                </div> {/*-- /#flag-popover --*/}
                            </div> {/*--/.dropdown --*/}
                        </div>
                    </div>{/*--/.action-buttons--*/}
                    </div>
                    {/*-- flag initialization moved to browserAfter() --*/}
                    <div class="col-sm-8 thats-left item-details-metadata">
                        <h1 style={{fontSize:"30px", "marginBottom":0}}>
                            <div class="left-icon"><span className={`${iconochiveIcon} ${mediatype}`} aria-hidden="true"></span><span
                                    class="sr-only">{mediatype}</span></div>
                            <span itemprop="name">{title}</span>
                        </h1>

                        <div class="actions-ia">

                        </div>


                        <div class="key-val-big">
                            <div>
                                <span class="key">by</span>{' '}
                                <span class="value"><span><a href={`/search.php?query=creator%3A%22${creator}%22`} onclick={Nav.onclick_search({query: {creator: creator}})}>{creator}</a></span></span>
                            </div>
                        </div>

                        <br/>
                        <div class="key-val-big">
                            Publication date <a href={`/search.php?query=date%3A{datePublished}`} onclick={Nav.onclick_search({query: {date: datePublished}})}>{' '}
                            <span itemprop="datePublished">{datePublished}</span></a>
                        </div>

                        {licence ? (
                        <div class="key-val-big">
                            Usage <a rel="license" title="http://creativecommons.org/licenses/by-nc-nd/2.0/"
                                     href="http://creativecommons.org/licenses/by-nc-nd/2.0/" target="_blank">http://creativecommons.org/licenses/by-nc-nd/2.0/<img
                                class="cclic" src="./images/cc/cc.png"/><img class="cclic" src="./images/cc/by.png"/><img
                                class="cclic" src="./images/cc/nc.png"/><img class="cclic" src="./images/cc/nd.png"/></a></div>
                        ) : ( undefined ) }
                        {/*TODO-Only show if keywords non-blank*/}
                        {keywords ? (
                        <div class="key-val-big">
                            Topics <span itemprop="keywords">
                          {keywords.map((keyword)=> (
                                <a href={`/search.php?query=subject%3A%22${keyword}%22`} onclick={Nav.onclick_search({query: {subject: keyword}})}>{keyword}</a> ))}
                      </span> {/*TODO should really have , between each but join() not easy in JSX*/}
                        </div>
                        ) : ( undefined ) }
                        { publisher ? (
                        <div><span class="key">Publisher</span>{' '}

                            <span
                                    class="value"
                            ><a href={`/search.php?query=publisher%3A%22${publisher}%22`} onclick={Nav.onclick_search({query: {publisher: publisher}})}><span
                                    itemprop="publisher">{publisher}</span></a></span>
                        </div>
                        ) : ( undefined ) }
                        {/*-- sponsor (also does usage rights, if specified for the sponsor) --*/}

                        {/*-- contributor (also does usage rights, if specified for the contributor) --*/}
                        { contributor ? ( <div><span class="key">Contributor</span>{' '}<span class="value">{contributor}</span></div> ) : ( undefined ) }
                        { languageAbbrev ? (
                            <div class="key-val-big">
                                <div>
                                    <span class="key">Language</span>{' '}

                                    <span class="value"><span><a href={`/search.php?query=%28language%3A{languageAbbrev}+OR+language%3A%22${languageLong}%22%29`}
                                        onclick={Nav.onclick_search({query: `(language:${languageAbbrev} OR language:"{languageLong}")`})}>{languageLong}</a></span></span>
                                </div>
                            </div>
                        ) : ( undefined ) }

                        <div class="clearfix"></div>
                        { description ? ( <div id="descript" itemprop="description" dangerouslySetInnerHTML={{__html: description}}></div> ) : ( undefined ) }

                        { credits ? ( <h2 style="font-size:18px">Credits</h2> ) : ( undefined ) }
                        { credits ? ( <p class="content">{credits}</p>        ) : ( undefined ) }

                        <div class="metadata-expandable-list" role="list">
                            { metadataListFound.map((k) =>
                                <div role="listitem">
                                    <span class="key">{metadataListPossible[k]}</span>{' '}
                                    <span class="value">{metadata[k]}</span>
                                </div>
                            ) }
                        </div>

                        {/*TODO "See also" section drawing from some of metadata.externalidentifier note two adjacent divs present
                        on mbid-b105f712-d75e-4d0a-a9c5-bf1948461e2b not in commute will need to retrieve those to do so.*/}
                        <div id="reviews">
                            <h2 style="font-size:36px;font-weight:200;border-bottom:1px solid #979797; padding-bottom:5px; margin-top:50px;">
                                <div class="pull-right" style="font-size:14px;font-weight:500;padding-top:14px;">
                                    <a class="stealth" href={writeReviewsURL}><span class="iconochive-plus-circle"
                                                                                    aria-hidden="true"></span><span class="sr-only">plus-circle</span>
                                        Add Review</a><br/>
                                </div>
                                <div class="left-icon" style="margin-top:3px"><span class="iconochive-comment"
                                                                                    aria-hidden="true"></span><span class="sr-only">comment</span>
                                </div>
                                Reviews
                            </h2>
                            { reviews && reviews.length ? reviews.map((review) => (
                                <div class="aReview">
                                    <b>Reviewer:</b>{' '}
                                    <a onClick={`Nav.nav_details('@${review.reviewer}')`}
                                       data-event-click-tracking="ItemReviews|ReviewerLink">{review.reviewer}</a>
                                    -
                                    <span alt={`${review.stars} out of 5 stars`} title={`${review.stars} out of 5 stars`}>
                                        { ['*','*','*','*','*'].slice(0,review.stars).map(x =>
                                            <span class="iconochive-favorite size-75-percent" aria-hidden="true"></span> , <span class="sr-only">favorite</span>
                                        ) }
                                    </span>
                                    - {review.reviewdate}{/*TODO reviewdate needs pretty printing*/}<br/>
                                    <b>Subject:</b>{' '}{review.reviewtitle}
                                    <div class="breaker-breaker">{review.reviewbody}</div>
                                </div>
                            )) : (
                                <div class="small-label">
                                    There are no reviews yet. Be the first one to <a href={writeReviewsURL}>write a review</a>.
                                </div>
                            )}
                        </div>

                    </div>{/*--/.col-md-10--*/}
                    <div class="col-sm-4 thats-right item-details-archive-info">
                        {/*TODO need section class=boxy item-stats-summary- not obvious where data from, its not in metadata */}
                        <section class="boxy item-download-options">
                            <div class="download-button" role="heading" aria-level="5">DOWNLOAD OPTIONS</div>
                            {Object.keys(downloadableFilesDict).map(k => (
                                <div class="format-group">
                                    <div class="summary-rite">
                                        <a class="stealth" source={downloadableFilesDict[k]} onclick="Nav.nav_download(this)"
                                           title={k}>
                                            <span class="hover-badge-stealth"><span class="iconochive-download" aria-hidden="true"></span><span class="sr-only">download</span>{downloadableFilesDict[k].length} files</span>
                                        </a>
                                    </div>
                                    <a class="format-summary download-pill"
                                        source={downloadableFilesDict[k]}
                                        onclick="Nav.nav_download(this)"
                                        title={k}
                                        data-toggle="tooltip" data-placement="auto left" data-container="body" target="_blank">{/*--new window to persist dweb--*/}
                                        {Util.formats("format", k).downloadable} <span class="iconochive-download" aria-hidden="true"></span><span class="sr-only">download</span>
                                    </a>
                                </div>

                            ))}
            
                            <div class="show-all">
                                <div class="pull-right">
                                    <a class="boxy-ttl hover-badge" href={compressURL}><span class="iconochive-download"
                                                                                             aria-hidden="true"></span><span
                                            class="sr-only">download</span> {filesCount} Files</a><br/>
                                    <a class="boxy-ttl hover-badge" href={compressAllURL}><span class="iconochive-download"
                                                                                                aria-hidden="true"></span><span
                                            class="sr-only">download</span> {originalFilesCount} Original</a><br/>
                                </div>
                                <a class="boxy-ttl" href={downloadURL}>SHOW ALL</a>{/*Link absolute, but will be captured by onclick*/}
                                <br clear="all" class="clearfix"/>
                            </div>
                        </section>
            
                        <div class="boxy collection-list">
                            <section class="quick-down collection-list">
                                <h5 class="collection-title">IN COLLECTIONS</h5>
                                { collections.map((collection) => (
                                    <div class="collection-item">
                                        <a
                                                onClick={`Nav.nav_details("${collection}")`}
                                                data-event-click-tracking={`CollectionList|${collection}`}
                                        >{collectionTitles[collection]}</a>
                                    </div>
                                ) ) }
                            </section>
                        </div>
                        {/*TODO need boxy item-upload-info - its not obvious, on commute its the adder field, on mbid its derivation
                        of uploader which is email, on text its ___ */}
                    </div>{/*--/.col-md-2--*/}
                </div>{/*--/.row--*/}
            {/*--//.container-ia--*/} </div>
        );
    }

    itemDetailsAlsoFound() {
        if (!this.itemid) return undefined; // No related to home page, TODO maybe other places dont have also found = e.g. collections
        let el = (
            <div id="also-found" className="container container-ia width-max" data-identifier={this.itemid} ></div>
            );
        Util.fetch_json(Util.gateway.url_related+this.itemid)
            .then(data => this.loadDetailsAlsoFound(el, this.itemid, data.hits.hits)); // Asynchronous TODO move to gateway ?
        return el;
    }
    loadDetailsAlsoFound(el, itemid, results) {
        el.appendChild( (
            <div className="row">
                <div className="col-xs-12 tilebars" style="display: block;">
                    <h5 className="small-label">SIMILAR ITEMS (based on metadata){/*<span id="playplayset">
                        *<a data-reactroot="" className="stealth" href="#play-items" data-event-click-tracking="Playset|PlayAllLink"><span
                        className="iconochive-play" aria-hidden="true"></span><span className="sr-only">play</span><span
                        className="hidden-xs-span"> Play All</span><br></a></span>*/}</h5>
                    <div id="also-found-result">
                        <section data-reactroot="" aria-label="Related Items">
                            { results.map(i => this.alsoFoundTile(i)) }
                        </section>
                    </div>
                </div>
            </div>
        ) )
    }
    alsoFoundTile(i) { //TODO catch the /details and /serices urls in ReactFake
        let foo = (
            <div className="results" style="visibility: visible;">
                <div className="item-ia" data-id={i._id} data-mediatype={i._source.mediatype[0]} data-year=""><a
                        className="stealth" tabIndex="-1" href={`/details/${i._id}`}>
                    </a>
                    <div className="C234">
                        <div className="item-ttl C C2"><a href={`/details/${i._id}`}
                                                           title={i._source.title}
                                                           data-event-click-tracking="GenericNonCollection|ItemTile">
                            <div className="tile-img"><img className="item-img" alt=""
                                                           src={`/services/img/${i._id}`}/></div>
                            <div className="ttl">{i._source.title}</div>
                        </a></div>
                        {/*NEEDS METADATA <div className="by C C4">
                                    <div><span className="hidden-lists">by </span><span className="byv"
                                                                                        title="Terebilov K.a ">Terebilov K.a </span>
                                    </div>
                                </div>*/}
                    </div>
                    <div className="statbar ">
                        <div className="mt-icon C C5"><span className={`iconochive-{i._source.mediatype[0]}`}
                                                            aria-hidden="true">&nbsp;</span><span
                            className="sr-only">{i._source.mediatype[0]}</span></div>
                        {i._source.downloads ? (
                            <h6 className="stat"><span className="iconochive-eye"
                                                       aria-hidden="true">&nbsp;</span><span
                                className="sr-only">eye</span><span>{i._source.downloads[0]}</span></h6>
                        ) : undefined }
                        {i._source.collection ? (
                            <h6 className="stat"><span className="iconochive-favorite"
                                                            aria-hidden="true">&nbsp;</span><span
                            className="sr-only">favorite</span>{i._source.collection.filter(c => c.startsWith('fav-')).length}</h6>
                        ) : undefined }
                        {/*<h6
                        className="stat"><span className="iconochive-comment"
                                               aria-hidden="true">&nbsp;</span><span
                        className="sr-only">comment</span><!-- react-text: 38 -->1<!-- /react-text --></h6>*/}
                    </div>
                </div>
            </div>
        );
        return foo;
    }

}
