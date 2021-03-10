
/**
* This Schema is for Notifications
* @author Abhinav Sharma
* @since 10 March 2021
*/

import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Notification = new Schema({
	userRef: { type: Schema.Types.ObjectId, required: true },
	text: String,
	type: { type: Number, required: true },
	sourceRef: { type: Schema.Types.ObjectId },
	seen: { type: Boolean, default: false },
	createdOn: Date,
	updatedOn: Date,
});

applyMiddleware(Notification);
export default database.model('Notification', Notification);
