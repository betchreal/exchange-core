import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SerializeInterceptor } from './interceptors/serialize.interceptor';

@Global()
@Module({
	providers: [SerializeInterceptor],
	exports: [SerializeInterceptor]
})
export class SharedModule {}
