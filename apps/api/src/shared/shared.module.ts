import { Global, Module } from '@nestjs/common';
import { SerializeInterceptor } from './interceptors/serialize.interceptor';
import { DecimalPipe } from './pipes/decimal.pipe';

@Global()
@Module({
	providers: [SerializeInterceptor, DecimalPipe],
	exports: [SerializeInterceptor, DecimalPipe]
})
export class SharedModule {}
