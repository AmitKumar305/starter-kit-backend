/* eslint-disable import/named */
import {
	ResponseUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';
import {
	FaqModel,
} from '../../schemas';
/**
* @description service model function to handle the updation of a faq.
* @param {String} id the name of the user.
* @param {String} faqRef the _id of the faq.
* @param {String} question the question of the user.
* @param {String} answer the answer of the question.
* @author Abhinav Sharma
* @since 22 December, 2020
*/

export default ({
	id,
	faqRef,
	question,
	answer,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(faqRef && (question || answer))) {
			return reject(ResponseUtility.MISSING_PROPS({ message: `Missing Property ${faqRef ? 'question or answer' : 'faqRef'}!` }));
		}
		const update = await SchemaMapperUtility({
			question,
			answer,
		});
		const updatedFaqObject = await FaqModel.findOneAndUpdate({ _id: faqRef, deleted: false }, update, { new: true });
		return resolve(ResponseUtility.SUCCESS({ data: updatedFaqObject }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
