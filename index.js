process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');
const callCalendar = require('./src/calendar').callCalendar;
const timetable = require('./src/timetable-maker');

const CronJob = require('cron').CronJob;

const token = getTelegramToken();

const JERUSALEM = 156;
const bot = new TelegramBot(token, { polling: true });

const GET_TODAY_TIMES_COMMAND = "today's times";
const TEFILOTH_TIMES = "tefiloth times pdf";
const TEFILOTH_TIMES_TXT = "tefiloth times simple text";

const config = require('config');

console.log(config.has('html-template-path'));

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
            "keyboard": [
                [GET_TODAY_TIMES_COMMAND],
                [TEFILOTH_TIMES],
                [TEFILOTH_TIMES_TXT]
            ], "resize_keyboard": true
        }
    });
});

bot.on('message', (msg) => {
    if (msg.text.indexOf(TEFILOTH_TIMES) === 0) {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'wait a minute...');

        const { day, month, year } = getCurrentDate();
        callCalendar(JERUSALEM, year, month, day)
            .then((data) => {
                timetable.createTimetable(data)
                    .then(res => {
                        bot.sendMessage(chatId, `Done!`);
                        bot.sendDocument(chatId, res.filename || res.stream, {}, { filename: 'timetable.pdf' });
                    });
            }).catch(err => bot.sendMessage(chatId, `error: ${JSON.stringify(err)}`))
    }

    if (msg.text.indexOf(TEFILOTH_TIMES_TXT) === 0) {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'wait a minute...');

        const { day, month, year } = getCurrentDate();
        callCalendar(JERUSALEM, year, month, day)
            .then((data) => {
                const fixedData = timetable.addSaturdayTimes(data);
                let res = '';
                fixedData.shabat.times.forEach(time => {
                    res += `${time.name}:\t\t${time.value}\n`;
                });
                bot.sendMessage(chatId, res);
            }).catch(err => bot.sendMessage(chatId, `error: ${JSON.stringify(err)}`))
    }

    if (msg.text.indexOf(GET_TODAY_TIMES_COMMAND) === 0) {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'wait a minute...');
        const { day, month, year } = getCurrentDate();
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
        bot.sendMessage(msg.from.id, "*Hello*  " + msg.from.first_name, { parse_mode: "Markdown" });
    }
});

bot.on('polling_error', (error) => {
    console.log('ERROR: ', error.code);  // => 'EFATAL'
});

function getTelegramToken() {
    const processEnv = process.env;
    return (processEnv.NODE_ENV === 'production') ?
        processEnv.TELEGRAM_TOKEN :
        require('./api-credentials.json').telegramToken;
}

function getCurrentDate() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; //January is 0!
    const year = today.getFullYear();
    return { day, month, year };
}
