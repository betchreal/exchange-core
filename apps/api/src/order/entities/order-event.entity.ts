import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm';
import { ActorType, OrderEventType, OrderStatus } from '@exchange-core/common';
import { Staff } from '../../staff/entities/staff.entity';
import { Order } from './order.entity';

@Entity('order_events')
@Check(
	`("type" = 'status_changed' AND "fromStatus" IS NOT NULL AND "toStatus" IS NOT NULL AND "fromStatus" <> "toStatus" AND "commentText" IS NULL) OR ("type" IN ('manager_assigned','manager_released') AND "fromStatus" IS NULL AND "toStatus" IS NULL AND "employeeId" IS NOT NULL AND "commentText" IS NULL) OR ("type" = 'comment_added' AND "fromStatus" IS NULL AND "toStatus" IS NULL AND "employeeId" IS NOT NULL AND "commentText" IS NOT NULL AND btrim("commentText") <> '')`
)
@Check(
	`("actorType" = 'employee' AND "employeeId" IS NOT NULL) OR ("actorType" = 'system' AND "employeeId" IS NULL)`
)
export class OrderEvent {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		type: 'enum',
		enum: OrderEventType,
		enumName: 'order_event_type_enum'
	})
	type: OrderEventType;

	@Column({
		type: 'text',
		nullable: true
	})
	commentText?: string | null;

	@Column({
		type: 'enum',
		enum: OrderStatus,
		enumName: 'order_status_enum',
		nullable: true
	})
	fromStatus?: OrderStatus | null;

	@Column({
		type: 'enum',
		enum: OrderStatus,
		enumName: 'order_status_enum',
		nullable: true
	})
	toStatus?: OrderStatus | null;

	@Column({
		type: 'enum',
		enum: ActorType,
		enumName: 'actor_type_enum'
	})
	actorType: ActorType;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@ManyToOne(() => Staff, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'employeeId' })
	staff?: Staff | null;

	@ManyToOne(() => Order, {
		nullable: false,
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'orderId' })
	order: Order;
}
