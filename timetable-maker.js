const fs = require('fs');
const pdf = require('html-pdf');
const config = require('config');
const _ = require('lodash');

function createTimetable(data, toFile = false) {
    const source = fs.readFileSync(config.get('html-template-path'), 'utf8');
    const template = _.template(source);
    const html = template(data);

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
                    resolve({stream});
                }
            });
        }
    });
}

module.exports = {createTimetable};