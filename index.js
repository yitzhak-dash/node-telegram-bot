process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');
const CronJob = require('cron').CronJob;
const Client = require('node-rest-client').Client;
const client = new Client();
const credentials = require('./api-credentials.json');

const token = credentials.telegramToken;
console.log(token);


const JERUSALEM = 156;
const placeId = JERUSALEM;
const bot = new TelegramBot(token, {polling: true});

const job = new CronJob('00 30 11 * * 1-5', function () {
        /*
         * Runs every weekday (Monday through Friday)
         * at 11:30:00 AM. It does not run on Saturday
         * or Sunday.
         */
    }, function () {
        /* This function is executed when the job stops */
    },
    true /* Start the job right now */
);

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


bot.onText(/\/today-times/, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'wait a minute...');
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; //January is 0!
    const year = today.getFullYear();
    callCalendar(JERUSALEM, year, month, day)
        .then((data) => {
            let res = '';
            const date = `${data.date.heb.hebdate} ${data.date.weekday}\t\t\t${data.date.eng.ldate}`;
            res += date + '\n-----------------------------\n';
            data.times.forEach(time => {
                res += `${time.name}:\t\t${time.value}\n`;
            });
            bot.sendMessage(chatId, res);
        });
});

bot.on('polling_error', (error) => {
    console.log('ERROR: ', error.code);  // => 'EFATAL'
});
