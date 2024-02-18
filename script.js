/*
    Previous method failed because autologin must occur before
    navigating to article.
    Otherwise, proxy thinks client hasn't logged in yet.

    Why a proxy isn't continuously logged in is beyond my
    area of expertise.

    We must first autologin, and only then we can navigate
    to the article.
    */

let redirectHost = "https://bnf.idm.oclc.org/login?url=http://"

/*

This list of domains corresponds to domains that are part of the authentification process
on the BNF side. There are back and forths between these domains while the client is getting
logged in - this list is used so that we don't kill the listener inside our loginAndRedirect
prematurely.

*/

let listOfAuthHosts = ["bnf.idm.oclc.org", "login.bnf.idm.oclc.org", "idppub.bnf.fr", "authentification.bnf.fr"];

let simpleRedirects = [{
    host: "www.mediapart.fr",
    autologin: "/licence"
}, {
    host: "www.arretsurimages.net",
    autologin: "/autologin.php"
}]

browser.tabs.onUpdated.addListener(
    (tab_id, changeInfo, tab) => { // we listen for all updates to our tab
        if (changeInfo.url != undefined) { // if the current tab's its url was changed
            let url = new URL(changeInfo.url); // we get the tab's url
            let website = simpleRedirects.filter(element => element.host == url.host)[0]; // we see if the tab's url corresponds to the urls on our list
            if (website != undefined) loginAndRedirect(website, url.pathname); // if that's the case we send it to our function
        }
    }
);

function loginAndRedirect(srh, path){
    let simpleRedirectHost = srh;
    let loginUrl = redirectHost + simpleRedirectHost.host + simpleRedirectHost.autologin;
    let originalPath = path;

    // Now we need to navigate to the URLS using the Tabs API (so that we can tell when the user has logged in)
    browser.tabs.update( // We let the user login
        {
            url: loginUrl
        }
    ).then(
        (current_tab) => {
            let listener = (listener_tab_id, changeInfo, listener_tab) => // we define a listener that is executed when an event is triggered in our tab
            {
                if ((listener_tab_id == current_tab.id) && changeInfo.url != undefined) //if the change to the tab was its url (and if we're still in the same tab - you never know)
                {
                    if (!(urlPartOfAuthProcess(changeInfo.url)) && !(urlAutologin(changeInfo.url, simpleRedirectHost.autologin))) //if the tab's url is not part of the authentification process and is not the autologin page
			// Note: that means that the URL host is the proxy domain to the news article (i.e www-mediapart-fr.bnf.idm.oclc.org) AND that the autologin has been done
                    {
                        browser.tabs.onUpdated.removeListener(listener); //we stop listening for updates
                        //console.log("NOT AUTH PROCESS: " + "https://" + new URL(changeInfo.url).host + originalPath);
                        browser.tabs.update( // we redirect to the article
                            {
                                url: "https://" + new URL(changeInfo.url).host + originalPath
                            }
                        )
                    }
                }
            }
            browser.tabs.onUpdated.addListener(listener); //we start listening for updates to tabs
        },
        error => console.log(error)
    )
} 

function urlAutologin(url, pathname) // function that checks if the current URL goes to the autologin page
{
    let parsedUrl = new URL(url);
    return parsedUrl.pathname == pathname;
}

function urlPartOfAuthProcess(url) // function that checks if the current URL is part of the urls in the auth process
{
    let parsedUrl = new URL(url);
    //console.log(parsedUrl);
    return listOfAuthHosts.includes(parsedUrl.hostname);
}
