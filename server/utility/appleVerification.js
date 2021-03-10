/* eslint-disable prefer-promise-reject-errors */

import jwt from 'jsonwebtoken';

import {
	ResponseUtility,
} from 'appknit-backend-bundle';

export default ({ accessToken }) => new Promise(async (resolve, reject) => {
	if (!accessToken) {
		return reject({ message: 'Missing required props accessToken.' });
	}
	const decodedToken = jwt.decode(accessToken, { complete: true });
	if (decodedToken) {
		return resolve(ResponseUtility.SUCCESS({ data: { ...decodedToken } }));
	}
	return reject({ message: 'Invalid Access Token' });
});
