process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');
const callCalendar = require('./calendar').callCalendar;
const timetable = require('./timetable-maker');
const moment = require('moment');

const CronJob = require('cron').CronJob;

const credentials = require('./api-credentials.json');

const token = credentials.telegramToken;

const JERUSALEM = 156;
const bot = new TelegramBot(token, {polling: true});

const GET_TODAY_TIMES_COMMAND = "today's times";
const TEFILOTH_TIMES = "tefiloth times pdf";

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

const testObj = {
    shabat: {
        shabat_name: "יתרו",
        hebDate: "י\"ח שבט  ה'תשע\"ח",
        loaziDate: "3/2/2018",
        times: [
            {
                "name": "כניסת שבת",
                "value": "17:02",
                "today": false
            },
            {
                "name": "צאת שבת",
                "value": "18:14",
                "today": false
            }]
    }
};

function addTimes(obj) {
    const kabalatShabat = {
        name: "כניסת שבת",
        value: moment(obj.shabat.times[0].value, 'HH:mm').add(20, 'm').format("HH:mm"),
    };

    const shaharit = {
        "name": "כניסת שבת",
        "value": "08:00",
    };

    const minha = {
        "name": "כניסת שבת",
        "value": "16:00",
    };

    const lesson = {
        "name": "כניסת שבת",
        "value": "12:30",
    };

    obj.shabat.times.push(kabalatShabat);
    obj.shabat.times.push(shaharit);
    obj.shabat.times.push(lesson);
    obj.shabat.times.push(minha);
    return obj;
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome", {
        "reply_markup": {
            "keyboard": [
                [GET_TODAY_TIMES_COMMAND],
                [TEFILOTH_TIMES]
            ], "resize_keyboard": true
        }
    });
});

bot.on('message', (msg) => {
    if (msg.text.indexOf(TEFILOTH_TIMES) === 0) {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'wait a minute...');
        timetable.createTimetable(addTimes(testObj)).then(res => {
            bot.sendMessage(chatId, `Done!`);
            bot.sendDocument(chatId, res.filename || res.stream, {}, {filename: 'timetable.pdf'});
        }).catch(err => bot.sendMessage(chatId, `error: ${JSON.stringify(err)}`))
    }

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
