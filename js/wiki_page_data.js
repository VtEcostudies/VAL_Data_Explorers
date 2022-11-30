//https://en.wikipedia.org/api/rest_v1/page/summary/ambystoma_jeffersonianum

const wikiApi = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

export async function getWikiPage(searchTerm=false) {

    if (!searchTerm) {return {};}

    let reqHost = wikiApi;
    let reqRoute = searchTerm;
    let url = reqHost+reqRoute;
    let enc = encodeURI(url);

    console.log(`getWikiPage(${searchTerm})`, enc);

    try {
        let res = await fetch(enc);
        let json = await res.json();
        json.query = enc;
        //console.log(`getWikiPage(${searchTerm}) RESULT:`, json);
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`getWikiPage(${searchTerm}) ERROR:`, err);
        throw new Error(err)
    }
}