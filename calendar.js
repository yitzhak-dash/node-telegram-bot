const Client = require('node-rest-client').Client;
const client = new Client();

function generateApiKey(placeId, year, month, day, r = "heb", u = true, f = false) {
    const op = u === !0 ? "dj" : "d";
    return getX(op.slice(-1), (month % 10).toString(), (year % 10).toString(), placeId % 10, day % 10, r.slice(-1));
}

function getX(n, t, i, r, u, f) {
    return "r" + n + t + "h" + i + "d" + r + u + "k" + f
}

function generateUrl(placeId, year, month, day, apiKey, r = "heb", u = true, f = false) {
    const prefix = '/Calendar/calaj.aspx?v=1&';
    const op = u === !0 ? "dj" : "d";
    f = f === undefined ? !1 : f;
    const postfix = "op=" + op + "&pl=" + placeId + "&yr=" + year + "&mn=" + month + "&dy=" + day + "&sv=" + f + "&lng=" + r + "&x=" + apiKey;
    return prefix + postfix;
}

function callCalendar(placeId, year, month, day, r = "heb", u = true, f = false) {
    const apiKey = generateApiKey(placeId, year, month, day, r, u, f);
    const url = generateUrl(placeId, year, month, day, apiKey);

    const args = {
        headers: {
            "Content-Type": "application/json",
            "Referer": "https://www.yeshiva.org.il/Calendar/timesday"
        },
        responseConfig: {
            timeout: 3000 //response timeout
        }
    };

    return new Promise((resolve, reject) => {
        client.get("https://www.yeshiva.org.il" + url, args, function (buffer, response) {
            const json = JSON.parse(buffer.toString());
            resolve(json)
        });
    });
}

module.exports = {callCalendar};