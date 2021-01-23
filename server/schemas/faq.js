/**
* This schema represents the faq.
* @author Abhinav Sharma
* @since 07 December, 2020
*/
import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Faq = new Schema({
	question: { type: String, required: true },
	answer: { type: String, required: true },
	deleted: { type: Boolean, default: false },
	deletedOn: Date,
	createdOn: Date,
	updatedOn: Date,
});

applyMiddleware(Faq);
export default database.model('Faq', Faq);
