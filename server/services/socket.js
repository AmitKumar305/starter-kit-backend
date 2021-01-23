import socketIO from 'socket.io';
import { Types } from 'mongoose';
import {
	FirebaseNotificationService,
} from '.';
import {
	BookingModel, UserModel, ChatModel, EventModel,
} from '../schemas';
import {
	NOTIFICATION_TYPE, BOOKING_STATUS,
} from '../constants';

let io;
let count = 0;

// Sends the message
const Messenger = ({
	ioObject,
	senderId,
	eventId,
	message,
	// socketsLive,
}) => new Promise(async (resolve, reject) => {
	try {
		const senderDetails = await UserModel.findOne({ _id: senderId }, {
			firstName: 1, lastName: 1, email: 1, profilePicture: 1,
		});
		if (!(senderDetails)) {
			return reject('Invalid user provided!');
		}
		const event = await EventModel.findOne({ _id: eventId, deleted: false });
		if (!(event)) {
			return reject('Invalid Event provided!');
		}
		const booking = await BookingModel.findOne(
			{
				userRef: Types.ObjectId(senderId),
				eventRef: Types.ObjectId(eventId),
				status: BOOKING_STATUS.ACCEPTED,
				deleted: false,
			},
		);
		if (!(String(event.userRef) === String(senderId) || booking)) {
			return reject('Invalid booking!');
		}

		const chat = await ChatModel({
			userRef: senderId,
			eventRef: eventId,
			message,
			createdOn: new Date(),
			updatedOn: new Date(),
		});

		const responsePacket = {
			// eslint-disable-next-line no-underscore-dangle
			_id: chat._id,
			eventRef: eventId,
			firstName: senderDetails.firstName,
			lastName: senderDetails.lastName,
			profilePicture: senderDetails.profilePicture,
			message: chat.message,
			createdOn: chat.createdOn,
		};

		await ioObject.sockets.in(eventId).emit('message', responsePacket);

		const allUsers = await BookingModel.aggregate([
			{
				$match: {
					eventRef: Types.ObjectId(eventId),
					status: BOOKING_STATUS.ACCEPTED,
					deleted: false,
				},
			},
			{
				$lookup: {
					from: 'users',
					let: { userRef: '$userRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$userRef'] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},
					],
					as: 'user',
				},
			},
			{
				$unwind: '$user',
			},
			{
				$project: {
					_id: '$user._id',
					fcmToken: '$user.fcmToken',
					device: '$user.device',
				},
			},
		]);

		if (allUsers) {
			for (let index = 0; index < allUsers.length; index += 1) {
				const element = allUsers[index];
				// eslint-disable-next-line no-underscore-dangle
				if (String(senderId) === String(element._id)) {
					// eslint-disable-next-line no-underscore-dangle
					ioObject.sockets.in(element._id).emit('message', { ...responsePacket, selfMessage: true });
				} else {
					// eslint-disable-next-line no-underscore-dangle
					ioObject.sockets.in(element._id).emit('message', responsePacket);
				}
			}
		}
		// eslint-disable-next-line no-underscore-dangle
		if (String(senderId) === String(event.userRef)) {
			ioObject.sockets.in(event.userRef).emit('message', { ...responsePacket, selfMessage: true });
		} else {
			ioObject.sockets.in(event.userRef).emit('message', { ...responsePacket });
		}

		const [notificationUsers] = await BookingModel.aggregate([
			{
				$match: {
					eventRef: Types.ObjectId(eventId),
					status: BOOKING_STATUS.ACCEPTED,
					deleted: false,
				},
			},
			{
				$lookup: {
					from: 'users',
					let: { userRef: '$userRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$userRef'] },
										{ $eq: ['$deleted', false] },
										{ $ne: ['$fcmToken', null] },
									],
								},
							},
						},
					],
					as: 'user',
				},
			},
			{
				$unwind: '$user',
			},
			{
				$project: {
					_id: '$user._id',
					fcmToken: '$user.fcmToken',
					device: '$user.device',
				},
			},
			{
				$group: {
					_id: null,
					android: { $push: { $cond: [{ $eq: ['$device', 'android'] }, '$fcmToken', '$$REMOVE'] } },
					ios: { $push: { $cond: [{ $eq: ['$device', 'ios'] }, '$fcmToken', '$$REMOVE'] } },
				},
			},
		]);

		const host = await UserModel.findOne({ _id: event.userRef });

		if (host.device === 'android' && notificationUsers) {
			notificationUsers.android.push(host.fcmToken);
		} else if (host.device === 'ios' && notificationUsers) {
			notificationUsers.ios.push(host.fcmToken);
		}

		const payload = {
			reference: [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
			type: NOTIFICATION_TYPE.MESSAGE,
			title: `${senderDetails.firstName} ${senderDetails.lastName}`,
			body: message.trim(),
		};
		if (notificationUsers && notificationUsers.android.length) {
			await FirebaseNotificationService({
				deviceTokens: notificationUsers.android,
				device: 'android',
				...payload,
			});
		}
		if (notificationUsers && notificationUsers.ios.length) {
			await FirebaseNotificationService({
				deviceTokens: notificationUsers.ios,
				device: 'ios',
				...payload,
			});
		}
		await chat.save();
		return resolve();
	} catch (err) {
		return reject(err);
	}
});


const StartServer = server => new Promise(async (resolve, reject) => {
	try {
		io = socketIO(server);

		global.logger.info('Socket Server Initiated');

		// Socket establishes connection
		io.on('connection', async (socket) => {
			const { handshake: { query: { id } } } = socket;
			if (id) {
				global.logger.info(`****************** USER CONNECTED @${id} ******************>> COUNT ${++count}`);
				socket.join(id);

				socket.on('subscribe', async (data) => {
					if (data && data.eventId) {
						socket.join(data.eventId);
					}
				});

				socket.on('messageRequest', async (data) => {
					if (data && data.message && data.eventId) {
						global.logger.info(`Message Request by ${id} on ${data.eventId}`);
						if (data.message.trim()) {
							await Messenger({
								ioObject: io,
								senderId: id,
								eventId: data.eventId,
								message: data.message.trim(),
								socketsLive: socket.adapter.rooms,
							});
						}
					}
				});

				// Socket on being disconnected
				socket.on('disconnect', async (data) => {
					global.logger.info(`****************** USER DISCONNECTED @${id} ******************>> COUNT ${--count}`);
				});
			}
		});
	} catch (err) {
		return reject(err);
	}
});


export default {
	StartServer,
};
