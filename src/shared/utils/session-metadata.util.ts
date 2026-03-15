import { Request } from 'express';
import { lookup } from 'geoip-lite';
import countries from 'i18n-iso-countries';

import { SessionMetadata } from '../types/session-metadata.types';

import { IS_DEV_ENV } from './is-dev.util';

import DeviceDetector = require('device-detector-js');

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

export function getSessionMetadata(
	req: Request,
	userAgent: string,
): SessionMetadata {
	const ip = IS_DEV_ENV
		? '173.166.164.121' // Example IP for development
		: Array.isArray(req.headers['cf-connecting-ip'])
			? req.headers['cf-connecting-ip'][0]
			: req.headers['cf-connecting-ip'] ||
				((typeof req.headers['x-forwarded-for'] === 'string'
					? req.headers['x-forwarded-for'].split(',')[0]
					: req.ip) as string);

	const location = lookup(ip);
	const device = new DeviceDetector().parse(userAgent);

	return {
		ip,
		location: {
			country: countries.getName(location?.country ?? '', 'en') ?? '',
			city: location?.city ?? '',
			latitude: location?.ll[0] ?? 0,
			longitude: location?.ll[1] ?? 0,
		},
		device: {
			browser: device?.client?.name ?? '',
			os: device?.os?.name ?? '',
			type: device?.device?.type ?? '',
		},
	};
}
