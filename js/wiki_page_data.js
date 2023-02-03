//https://en.wikipedia.org/api/rest_v1/page/summary/ambystoma_jeffersonianum

const wikiApi = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

export async function getWikiPage(searchTerm=false) {

    if (!searchTerm) {console.log(`getWikiPage(${searchTerm}). Search Term is empty.`); return {};}

    let reqHost = wikiApi;
    let reqRoute = searchTerm;
    let url = reqHost+reqRoute;
    let enc = encodeURI(url);

    //console.log(`getWikiPage(${searchTerm})`, enc);

    try {
        let res = await fetch(enc);
        //console.log(`getWikiPage(${searchTerm}) RAW RESULT:`, res);
        if (res.status < 300) {
            let json = await res.json();
            json.query = enc;
            //console.log(`getWikiPage(${searchTerm}) JSON RESULT:`, json);
            return json;
        } else {
            //console.log(`getWikiPage(${searchTerm}) BAD RESULT:`, res.status);
        }
    } catch (err) {
        err.query = enc;
        console.log(`getWikiPage(${searchTerm}) ERROR:`, err);
        throw new Error(err)
    }
}