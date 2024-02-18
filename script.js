Array.prototype.inArray = function (needle) {
    return Array(this).join(",").indexOf(needle) > -1;
}

let redirectHost = "https://bnf.idm.oclc.org/login?url="
let host = window.location.host;
let path = window.location.pathname;

//let simpleRedirects = ["www.mediapart.fr", "www.arretsurimages.net"]

/*
    Previous method failed because autologin must occur before
    navigating to article.
    Otherwise, proxy thinks client hasn't logged in yet.

    Why a proxy isn't continuously logged in is beyond my
    area of expertise.

    We must first autologin, and only then we can navigate
    to the article.
*/

let simpleRedirects = [{
    host: "www.mediapart.fr",
    autologin: "/licence"
}, {
    host: "www.arretsurimages.net",
    autologin: "/autologin.php"
}]

let simpleRedirectHost = simpleRedirects.filter(element => element.host == host);

if (simpleRedirectHost.length == 1) {
    //window.location.replace(redirectHost + simpleRedirectHost.host + simpleRedirectHost.autologin);

    // Now we need to navigate to the URL using the Tabs API (so that we can tell when the user has logged in)
    browser.tabs.query({ currentWindow: true, active: true }).then((result)=>{ // We ask for the tab that is currently active in the window that is currently active
        let current_tab_id = result[0].id; // We get its ID
        browser.tabs.update(current_tab_id, {url: redirectHost + simpleRedirectHost.host + simpleRedirectHost.autologin}).then(()=>{ // We set the tab's url to the login page
            let listener = (listener_tab_id, changeInfo)=> // we define a listener that is executed when an event is triggered in a tab
                    {
                        if ((listener_tab_id == current_tab_id) && changeInfo.url) //if the tab in which the event was triggered is the current tab and the change to the tab was its url
                        {
                            browser.tabs.onUpdated.removeListener(this); //we stop listening for updates
                            browser.tabs.update(current_tab_id, {url: window.location.host + path}); //we redirect to the article
                        }
                    }
            );
            browser.tabs.onUpdated.addListener(listener); //we start listening for updates to tabs
        },(error)=>{console.log(error)}; 
    }, (error)=>{console.log(error)}); 

}

function removeQueryString(url) {
    return url.split('?')[0];
}

