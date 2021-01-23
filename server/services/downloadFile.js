const request = require('request-promise');

export default url => new Promise((resolve, reject) => {
	const options = {
		url,
		encoding: null,
	};
	request(options)
		.then(response => resolve(response))
		.catch(err => reject(err));
});
