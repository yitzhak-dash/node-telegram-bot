const fs = require('fs');
const pdf = require('html-pdf');
const config = require('config');
const _ = require('lodash');
const moment = require('moment');


function addTimes(obj) {
    const kabalatShabat = {
        name: "קבלת שבת",
        value: moment(obj.shabat.times[0].value, 'HH:mm').add(20, 'm').format("HH:mm"),
    };

    const shaharit = {
        name: "תפילת שחרית",
        value: "08:00",
    };

    const minha = {
        "name": "תפילת מנחה",
        "value": "13:30"//moment(obj.shabat.times[0].value, 'HH:mm').add(-90, 'm').format("HH:mm"),
    };

    const lesson = {
        "name": "שיעור",
        "value": "12:20",
    };

    obj.shabat.times[1].name += ", תפילת ערבית";

    obj.shabat.times = [
        obj.shabat.times[0],
        kabalatShabat,
        shaharit,
        lesson,
        minha,
        obj.shabat.times[1]
    ];
    return obj;
}

function createTimetable(data, toFile = false) {
    const source = fs.readFileSync(config.get('html-template-path'), 'utf8');
    const template = _.template(source);
    const html = template(addTimes(data));

    return new Promise((resolve, reject) => {
        const created = pdf.create(html);
        if (toFile) {
            created.toFile('./output/timetable.pdf', function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        } else {
            created.toStream(function (err, stream) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ stream });
                }
            });
        }
    });
}

module.exports = { createTimetable };