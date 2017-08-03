require('dotenv').config();
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport(process.env.MAILER_SMTP);

let mailOptions = {
  from: 'FR Scheduler',
  to: process.env.MAILER_TO,
  subject: 'FR Scheduler error',
};

const createMailOptions = (textContent) => {
  let options = mailOptions;
  // text is 'plan text' for the email, as apposed to HTML body
  options.text = textContent;
  return options;
}

const sendMail = (mailContent) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(createMailOptions(mailContent), (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export default sendMail;
