process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');
const callCalendar = require('./calendar').callCalendar;

const CronJob = require('cron').CronJob;

const credentials = require('./api-credentials.json');

const token = credentials.telegramToken;

const JERUSALEM = 156;
const placeId = JERUSALEM;
const bot = new TelegramBot(token, {polling: true});

const GET_TODAY_TIMES_COMMAND = "today's times";

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


bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome", {
        "reply_markup": {
            "keyboard": [[GET_TODAY_TIMES_COMMAND]],
            "resize_keyboard": true
        }
    });

});

bot.on('message', (msg) => {

    if (msg.text.indexOf(GET_TODAY_TIMES_COMMAND) === 0) {
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
    }
    const Hi = "hi";
    if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
        bot.sendMessage(msg.from.id, "*Hello*  " + msg.from.first_name, {parse_mode: "Markdown"});
    }
});

bot.on('polling_error', (error) => {
    console.log('ERROR: ', error.code);  // => 'EFATAL'
});
