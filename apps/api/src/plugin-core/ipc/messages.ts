export type CallMsg = { id: string; cmd: 'call'; method: string; args: any };
export type RespMsg = {
	id: string;
	success: boolean;
	data?: any;
	error?: string;
};
