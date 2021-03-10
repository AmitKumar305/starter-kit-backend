/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const commonFunction = async function (next) {
	let data = this;
	if (data.save) {
		data.createdOn = new Date();
	}
	if (data._update) {
		data = data._update;
	}
	if (data.deleted) {
		data.deletedOn = new Date();
	}
	data.updatedOn = new Date();
	next();
};

// eslint-disable-next-line import/prefer-default-export
export const applyMiddleware = (Model, customFunction = false) => {
	const applyFuntion = customFunction || commonFunction;
	Model.pre('save', applyFuntion);
	Model.pre('findOneAndUpdate', applyFuntion);
	Model.pre('update', applyFuntion);
	Model.pre('updateOne', applyFuntion);
	Model.pre('updateMany', applyFuntion);
};
