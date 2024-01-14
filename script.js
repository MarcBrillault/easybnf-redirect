Array.prototype.inArray = function (needle) {
    return Array(this).join(",").indexOf(needle) > -1;
}

let redirectHost = "https://bnf.idm.oclc.org/login?url="
let host = window.location.host;
let path = window.location.pathname;

let simpleRedirects = ["www.mediapart.fr", "www.arretsurimages.net"]
let isSimpleRedirect = simpleRedirects.inArray(host)

if (isSimpleRedirect) {
    window.location.replace(redirectHost + window.location)
}

