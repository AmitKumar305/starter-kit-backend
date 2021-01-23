/**
* This schema represents the app details.
* @author Abhinav Sharma
* @since 07 December, 2020
*/
import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const AppDetail = new Schema({
	aboutUs: String,
	aboutUsUpdatedOn: Date,
	privacyPolicy: String,
	privacyPolicyUpdatedOn: Date,
	termsAndConditions: String,
	termsAndConditionsUpdatedOn: Date,
	createdOn: Date,
});

applyMiddleware(AppDetail);
export default database.model('AppDetail', AppDetail);
