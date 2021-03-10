/**
 * This schema represents the users profile schema
 * @author {{app_author}}
 * @since {{app_date}}
 */
import { Schema } from 'mongoose';
import { HashUtility } from 'appknit-backend-bundle';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const User = new Schema({
	name: String,
	email: String,
	password: String,
	phoneCode: String,
	phoneNumber: String,
	dob: Date,
	verified: { type: Boolean, default: false },
	blocked: { type: Boolean, default: false },
	deleted: { type: Boolean, default: false },
	gender: Number,
	nationality: String,
	about: String,
	picture: String,
	socialId: String,
	socialToken: String,
	socialIdentifier: String,
	emailToken: Number,
	emailTokenDate: Date,
	changePassToken: String,
	changePassTokenDate: Date,
	fcmToken: String,
	device: String,
	deletedOn: Date,
	createdOn: Date,
	updatedOn: Date,
});

applyMiddleware(User);
applyMiddleware(User, async function (next) {
	const data = this;
	if (data.password) {
		data.password = await HashUtility.generate({ text: data.password });
	}
	next();
});
export default database.model('User', User);
