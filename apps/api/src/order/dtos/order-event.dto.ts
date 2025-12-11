import { Expose, Transform, Type } from 'class-transformer';
import { OrderEventType, OrderStatus, ActorType } from '@exchange-core/common';

class EventStaffDto {
	@Expose()
	id: number;

	@Expose()
	email: string;
}

export class OrderEventDto {
	@Expose()
	id: number;

	@Expose()
	type: OrderEventType;

	@Expose()
	commentText: string | null;

	@Expose()
	fromStatus: OrderStatus | null;

	@Expose()
	toStatus: OrderStatus | null;

	@Expose()
	actorType: ActorType;

	@Expose()
	@Type(() => EventStaffDto)
	@Transform(({ obj }) =>
		obj.staff ? { id: obj.staff.id, email: obj.staff.email } : null
	)
	staff: EventStaffDto | null;

	@Expose()
	createdAt: Date;
}
