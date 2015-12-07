/**
 * Created at 15/12/7.
 * @Author Ling.
 * @Email i@zeroling.com
 */
import nodemailer from 'nodemailer';
const config = think.config();
let mail = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    auth: {
        user: config.mailAccount,
        pass: config.mailPassword
    }
});
let modelCheck = think.model('check', config.db);
setInterval(() => {
    modelCheck.add({ts: +new Date()}).catch(e => {
        let mailContent = {
            from: 'CETB报警 ' + config.mailAccount, // sender address
            to: 'i@zeroling.com', // list of receivers
            subject: 'CETB报警,Mysql挂掉啦! o(>﹏<)o', // Subject line
            html: '<b>Mysql挂掉了</b>' // html body
        };
        mail.sendMail(mailContent, cbHandler);
    });
}, 120 * 1000);

function cbHandler (error, info) {
    if(error){
        return console.log(error);
    }
    console.log('Alert mail has been sent: ' + info.response);
}