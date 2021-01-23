/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	FaqModel,
} from '../../schemas';
/**
* @description service model function to handle the creation of a faq.
* @param {String} id the unique _id of the user.
* @param {String} question the question of the user.
* @param {String} answer the answer of the question.
* @author Abhinav Sharma
* @since 22 December, 2020
*/

export default ({
	id,
	question,
	answer,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(question && answer)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: `Missing Property ${question ? 'answer' : 'question'}!` }));
		}
		const faqObject = new FaqModel({
			question,
			answer,
		});
		await faqObject.save();
		return resolve(ResponseUtility.SUCCESS({ data: faqObject }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
