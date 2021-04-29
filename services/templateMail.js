/**
* This service module deals with the sending of template emails
* @author Abhinav Sharma
* @since Saturday, October 17, 2020
*/
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { ResponseUtility } from 'appknit-backend-bundle';
import { APP_LOGO_URL, APP_NAME } from '../constants';

const { BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD, HOST } = process.env;

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: BUSINESS_EMAIL,
		pass: BUSINESS_EMAIL_PASSWORD,
	},
});

/**
* function to send mail
* @param {String} to		-> send email to
* @param {String} text		-> email content
* @param {String} subject	-> subject of email
*/
const sendMail = ({ to, subject = 'Mail from Collection-App', html }) => new Promise((resolve, reject) => {
	transporter.sendMail({
		from: BUSINESS_EMAIL,
		to,
		html,
		subject,
	}, (err) => {
		if (err) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: err }));
		}
		return resolve(ResponseUtility.SUCCESS());
	});
});


/**
 * send this email template for now account registering
 * @param {String} to, email of the user to send email
 * @param {Number} link to send the verification link
 */
const VerificationMail = ({
	to, name, verificationLink, text, emailSubject, button, senderName = '', senderEmail = '',
}) => new Promise((resolve, reject) => {
	const html = fs.readFileSync(path.resolve(__dirname, 'templates', 'commonEmail.html'), { encoding: 'utf-8' });
	const template = handlebars.compile(html);
	const props = {
		name, verificationLink, text, button, logoURL: APP_LOGO_URL, appName: APP_NAME, senderName, senderEmail,
	};
	const compiled = template(props);
	sendMail({ to, subject: emailSubject, html: compiled })
		.then(success => resolve(success))
		.catch(err => reject(err));
});

export default {
	VerificationMail,
};
