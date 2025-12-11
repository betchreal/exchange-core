"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";
import {
  OrderStatus,
  OrderEventType,
  ActorType,
  OrderStateMachine,
  PrincipalType,
  FormValues,
} from "@exchange-core/common";
import { ArrowLeft, Copy, ChevronDown } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

type OrderDetails = {
  id: number;
  amountFrom: string;
  amountTo: string;
  profit: string;
  status: OrderStatus;
  rateFromTo: string;
  url: string | null;
  formValues: FormValues;
  fromCurrency: { name: string; ticker: string };
  toCurrency: { name: string; ticker: string };
  staff: { id: number; email: string } | null;
  client: {
    type: PrincipalType;
    ip: string;
    ua: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type OrderEvent = {
  id: number;
  type: OrderEventType;
  commentText: string | null;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  actorType: ActorType;
  staff: { id: number; email: string } | null;
  createdAt: string;
};

const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.NEW]: "New",
    [OrderStatus.NOT_PAID]: "Not paid",
    [OrderStatus.PROCESSING]: "Processing",
    [OrderStatus.IN_PAYOUT]: "In payout",
    [OrderStatus.HOLD]: "Hold",
    [OrderStatus.SUCCESS]: "Success",
    [OrderStatus.RETURNED]: "Returned",
    [OrderStatus.ERROR_PAID]: "Error (Paid)",
    [OrderStatus.ERROR_PAYOUT]: "Error (Payout)",
    [OrderStatus.DELETED]: "Deleted",
  };
  return labels[status] || status;
};

const getStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.NEW:
    case OrderStatus.NOT_PAID:
      return "bg-slate-100 text-slate-700 border-slate-200";
    case OrderStatus.PROCESSING:
    case OrderStatus.IN_PAYOUT:
      return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case OrderStatus.SUCCESS:
      return "bg-green-100 text-green-700 border-green-200";
    case OrderStatus.HOLD:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case OrderStatus.RETURNED:
      return "bg-orange-100 text-orange-700 border-orange-200";
    case OrderStatus.ERROR_PAID:
    case OrderStatus.ERROR_PAYOUT:
      return "bg-red-100 text-red-700 border-red-200";
    case OrderStatus.DELETED:
      return "bg-rose-100 text-rose-800 border-rose-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const { user } = useUser();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [comment, setComment] = useState("");

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");
      const [orderRes, eventsRes] = await Promise.all([
        api.get<OrderDetails>(`/order/${orderId}/staff`),
        api.get<OrderEvent[]>(`/order/${orderId}/events`),
      ]);
      setOrder(orderRes.data);
      setEvents(eventsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleSetManager = async () => {
    try {
      await api.patch(`/order/${orderId}`, { managerId: 1 });
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign manager");
    }
  };

  const handleRelease = async () => {
    try {
      await api.patch(`/order/${orderId}`, { managerId: null });
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to release manager");
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      await api.patch(`/order/${orderId}`, { status: newStatus });
      setShowStatusDropdown(false);
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to change status");
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.patch(`/order/${orderId}`, { comment: comment.trim() });
      setComment("");
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardHeader title="Order Details" description="Loading" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardHeader title="Order Details" description="Error loading order" />
        </div>
        <Card>
          <div className="p-6 text-center text-sm text-red-600">{error}</div>
        </Card>
      </div>
    );
  }

  const isManager = order.staff?.email === user?.email;
  const allowedStatuses = OrderStateMachine[order.status] || [];

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardHeader
          title={`Order #${order.id}`}
          description={`Created ${new Date(order.createdAt).toLocaleDateString()}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 space-y-4 h-full">
            <h3 className="text-sm font-semibold text-slate-900 uppercase">
              Deposit Info
            </h3>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 uppercase">
                Currency to receive
              </div>
              <div className="pl-2 text-sm font-semibold text-green-600">
                {order.amountFrom} {order.fromCurrency.name}{" "}
                {order.fromCurrency.ticker}
              </div>
            </div>

            {order.client && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-700 uppercase">
                  Client
                </div>
                <div className="pl-2 text-xs text-slate-600 space-y-0.5">
                  <div>
                    Type:{" "}
                    <span className="font-medium capitalize">
                      {order.client.type}
                    </span>
                  </div>
                  <div>
                    IP: <span className="font-mono">{order.client.ip}</span>
                  </div>
                  <div className="break-all">
                    UA:{" "}
                    <span className="font-mono text-[10px]">
                      {order.client.ua}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 uppercase">
                Date & Time
              </div>
              <div className="pl-2 text-sm text-slate-600">
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>

            {order.url && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-700 uppercase">
                  Order URL
                </div>
                <div className="pl-2 flex items-center gap-2">
                  <a
                    href={order.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate"
                  >
                    {order.url}
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-1.5 py-0.5 shrink-0"
                    onClick={() =>
                      navigator.clipboard.writeText(order.url || "")
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {order.formValues.deposit.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-700 uppercase">
                  Deposit Details
                </div>
                <div className="pl-2 space-y-1">
                  {order.formValues.deposit.map((field, idx) => (
                    <div key={idx} className="text-xs text-slate-600">
                      <span className="font-medium">{field.label}:</span>{" "}
                      {field.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-6 space-y-4 h-full">
            <h3 className="text-sm font-semibold text-slate-900 uppercase">
              Withdraw Info
            </h3>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 uppercase">
                Currency to send
              </div>
              <div className="pl-2 text-sm font-semibold text-red-600">
                {order.amountTo} {order.toCurrency.name}{" "}
                {order.toCurrency.ticker}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 uppercase">
                Your Profit
              </div>
              <div className="pl-2 text-lg font-semibold text-green-600">
                {order.profit} {order.toCurrency.ticker}
              </div>
            </div>

            {order.formValues.withdraw.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-700 uppercase">
                  Withdraw Details
                </div>
                <div className="pl-2 space-y-1">
                  {order.formValues.withdraw.map((field, idx) => (
                    <div key={idx} className="text-xs text-slate-600">
                      <span className="font-medium">{field.label}:</span>{" "}
                      {field.value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.formValues.extra.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-700 uppercase">
                  Additional Info
                </div>
                <div className="pl-2 space-y-1">
                  {order.formValues.extra.map((field, idx) => (
                    <div key={idx} className="text-xs text-slate-600">
                      <span className="font-medium">{field.label}:</span>{" "}
                      {field.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="py-6 space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs font-semibold text-slate-700 uppercase">
                STATUS:
              </span>
              <span
                className={[
                  "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border",
                  getStatusBadgeClass(order.status),
                ].join(" ")}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>

            {!order.staff ? (
              <Button
                onClick={handleSetManager}
                className="w-full px-2 py-1.5 text-xs"
              >
                SET ME AS MANAGER
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-medium uppercase shrink-0">
                    {order.staff.email[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-900 truncate">
                      {order.staff.email.split("@")[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {order.staff.email}
                    </div>
                  </div>
                </div>

                {isManager && (
                  <Button
                    onClick={handleRelease}
                    className="w-full px-2 py-1.5 text-xs"
                  >
                    RELEASE
                  </Button>
                )}

                {isManager && (
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium whitespace-nowrap"
                    >
                      CHANGE STATUS
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {showStatusDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {allowedStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {getStatusLabel(status)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isManager && (
              <div className="space-y-2 mt-auto">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className="w-full px-2 py-1.5 text-xs"
                >
                  ADD COMMENT
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 uppercase">
          Order History
        </h3>
        {events.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-sm text-slate-500">
              No events yet
            </div>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {event.type === OrderEventType.STATUS_CHANGED && (
                      <div className="text-sm">
                        <span className="font-medium">Status changed</span>
                        {" from "}
                        <span
                          className={[
                            "px-2 py-0.5 rounded text-xs",
                            event.fromStatus
                              ? getStatusBadgeClass(event.fromStatus)
                              : "",
                          ].join(" ")}
                        >
                          {event.fromStatus
                            ? getStatusLabel(event.fromStatus)
                            : "none"}
                        </span>
                        {" to "}
                        <span
                          className={[
                            "px-2 py-0.5 rounded text-xs",
                            event.toStatus
                              ? getStatusBadgeClass(event.toStatus)
                              : "",
                          ].join(" ")}
                        >
                          {event.toStatus
                            ? getStatusLabel(event.toStatus)
                            : "none"}
                        </span>
                      </div>
                    )}
                    {event.type === OrderEventType.MANAGER_ASSIGNED && (
                      <div className="text-sm">
                        <span className="font-medium">Manager assigned:</span>{" "}
                        <span className="text-slate-600">
                          {event.staff?.email}
                        </span>
                      </div>
                    )}
                    {event.type === OrderEventType.MANAGER_RELEASED && (
                      <div className="text-sm">
                        <span className="font-medium">Manager released:</span>{" "}
                        <span className="text-slate-600">
                          {event.staff?.email}
                        </span>
                      </div>
                    )}
                    {event.type === OrderEventType.COMMENT_ADDED && (
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">
                            {event.staff?.email}
                          </span>
                          <span className="text-slate-500">
                            {" "}
                            added a comment:
                          </span>
                        </div>
                        <div className="pl-3 border-l-2 border-slate-200 text-slate-600">
                          {event.commentText}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
