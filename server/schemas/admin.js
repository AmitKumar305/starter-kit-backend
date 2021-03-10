/**
 * This schema represents the admin schema
 * @author {{app_author}}
 * @since {{app_date}}
 */
import { Schema } from 'mongoose';
import { HashUtility } from 'appknit-backend-bundle';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Admin = new Schema({
	email: { type: String, required: true },
	password: { type: String, required: true },
	createdOn: Date,
	updatedOn: Date,
});

applyMiddleware(Admin);
applyMiddleware(Admin, async function (next) {
	const data = this;
	if (data.password) {
		data.password = await HashUtility.generate({ text: data.password });
	}
	next();
});
export default database.model('Admin', Admin);
