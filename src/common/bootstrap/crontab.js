/**
 * Created at 15/12/7.
 * @Author Ling.
 * @Email i@zeroling.com
 */
import nodemailer from 'nodemailer';
import fs from 'fs';
const config = think.config();
let mail = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    auth: {
        user: config.mailAccount,
        pass: config.mailPassword
    }
});
function fsLogStat (file, infoObj) {
    if (infoObj === undefined) {
        return new Promise((resolve, reject) => {
            fs.readFile(__dirname + file, (err, content) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(content);
                }
            });
        });
    }
    let str = JSON.stringify(infoObj);
    return new Promise((resolve, reject) => {
        fs.appendFile(__dirname + file, str, (err, status) => {
            if (err) {
                resolve(false);
            } else {
                resolve(status);
            }
        })
    });
}
let modelCheck = think.model('cet', config.db);
setInterval(() => {
    modelCheck.count().catch(e => {
        fsLogStat('stat').then(stat => {
            if (stat && (+new Date) - stat.lastAlertTs < 120 * 1000) {
                //do nothing
            } else {
                let mailContent = {
                    from: 'CETB报警 ' + config.mailAccount, // sender address
                    to: 'i@zeroling.com', // list of receivers
                    subject: 'CETB报警,Mysql挂掉啦! o(>﹏<)o' + ((stat || '') && (stat.info || '')), // Subject line
                    html: '<b>Mysql挂掉了</b>' // html body
                };
                mail.sendMail(mailContent, cbHandler);
                fsLogStat('stat', {
                    lastAlertTs: +new Date
                });
            }
        });
    });
}, 120 * 1000);

function cbHandler (error, info) {
    if(error){
        return console.log(error);
    }
    console.log('Alert mail has been sent: ' + info.response);
}