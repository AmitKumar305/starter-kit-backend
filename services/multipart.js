/**
* This multipart service will merge the passed images in the body with the same
* name, add all fileds from req.body.data to req.body and will add AMQPConnection
* & AMQPChannel to req.body
* @author Abhinav Sharma
* @since 08 December, 2020
*/

export default (req, res, next) => {
	const {
		files, body: {
			data, id, AMQPConnection, AMQPChannel,
		},
	} = req;
	req.body = data ? (
		{ ...JSON.parse(data), AMQPConnection, AMQPChannel }) : { AMQPConnection, AMQPChannel };
	if (id) {
		req.body.id = id;
	}
	if (files && Object.keys(files).length) {
		req.body.images = files;
	}
	return next();
};
