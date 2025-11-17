import { PluginType } from '@exchange-core/common';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

export function pluginUploadFactory(prefix: PluginType) {
	return (cfg: ConfigService) => ({
		storage: diskStorage({
			destination: cfg.getOrThrow('PLUGINS_TMP_PATH'),
			filename: (
				req: Request,
				file: Express.Multer.File,
				callback: (error: Error | null, filename: string) => void
			) => callback(null, `${prefix}-${Date.now()}-${file.originalname}`)
		}),
		fileFilter: (
			req: Request,
			file: Express.Multer.File,
			callback: (error: Error | null, acceptFile: boolean) => void
		) => {
			const mimes = [
				'application/gzip',
				'application/x-gzip',
				'application/x-tgz',
				'application/x-gtar'
			];
			if (
				mimes.includes(file.mimetype) &&
				file.originalname.endsWith('.tgz')
			)
				return callback(null, true);
			return callback(
				new BadRequestException('Only .tgz plugin archives allowed.'),
				false
			);
		},
		limits: {
			fileSize: Number(cfg.getOrThrow('MAX_UPLOAD_SIZE'))
		}
	});
}
