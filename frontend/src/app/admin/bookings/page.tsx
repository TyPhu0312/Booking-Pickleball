"use client";

import { useEffect, useState } from "react";
import { Eye, Check } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface Booking {
  id: number;
  user: { full_name: string };
  booking_date: string;
  slot: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  total_price: number;
  deposit_amount: number;
  booking_type: string;
  discount: number;
  court?: { name: string } | null;
  bookingSlots: {
    slot: {
      start_time: string;
      end_time: string
    };
    is_recurring: boolean;
    recurring_day: number | null;
    num_weeks: number | null;
  }[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/bookings");
        const data = await res.json();
        setBookings(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-500">Đang tải dữ liệu...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Quản Lý Đặt Sân</h1>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Người Dùng</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Ngày</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Giờ chơi</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tổng Tiền</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên sân</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hành Động</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">Không có dữ liệu đặt sân</td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{booking.user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(booking.booking_date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.bookingSlots && booking.bookingSlots.length > 0 ? (() => {
                      const startTimes = booking.bookingSlots.map(bs => bs.slot.start_time);
                      const endTimes = booking.bookingSlots.map(bs => bs.slot.end_time);
                      const earliest = startTimes.sort()[0];
                      const latest = endTimes.sort().reverse()[0];
                      return `${earliest} - ${latest}`;
                    })() : "Chưa có slot"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.total_price.toLocaleString()}đ</td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.court?.name || "Chưa chọn"}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Check className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog hiển thị thông tin */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 " />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 mb-4">
                    Chi tiết đặt sân
                  </Dialog.Title>

                  {selectedBooking && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-800">
                      <div>
                        <span className="font-semibold text-gray-600">Người dùng:</span>
                        <p className="mt-1">{selectedBooking.user.full_name}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">Ngày đặt:</span>
                        <p className="mt-1">{new Date(selectedBooking.booking_date).toLocaleDateString("vi-VN")}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">Giờ chơi:</span>
                        <p className="mt-1">
                          {selectedBooking.bookingSlots && selectedBooking.bookingSlots.length > 0 ? (() => {
                            const startTimes = selectedBooking.bookingSlots.map(bs => bs.slot.start_time);
                            const endTimes = selectedBooking.bookingSlots.map(bs => bs.slot.end_time);
                            const earliest = startTimes.sort()[0];
                            const latest = endTimes.sort().reverse()[0];
                            return `${earliest} - ${latest}`;
                          })() : "Chưa có slot"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">Trạng thái:</span>
                        <p
                          className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedBooking.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800"
                            : selectedBooking.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : selectedBooking.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : selectedBooking.status === "COMPLETED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                        >
                          {selectedBooking.status === "CONFIRMED"
                            ? "Đã xác nhận"
                            : selectedBooking.status === "PENDING"
                              ? "Chờ xác nhận"
                              : selectedBooking.status === "CHECKED_IN"
                                ? "Đã check-in"
                                : selectedBooking.status === "COMPLETED"
                                  ? "Hoàn thành"
                                  : "Đã hủy"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">Tên sân:</span>
                        <p className="mt-1">{selectedBooking.court?.name || "Chưa chọn"}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">Loại đặt sân:</span>
                        <p className="mt-1">{selectedBooking.booking_type}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">Giảm giá / Phụ thu:</span>
                        <p className="mt-1">{selectedBooking.discount}%</p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">Tiền cọc:</span>
                        <p className="mt-1 text-blue-700 font-medium">{selectedBooking.deposit_amount.toLocaleString()}đ</p>
                      </div>

                      <div className="col-span-2 border-t border-gray-200 pt-3">
                        <span className="font-semibold text-gray-600">Tổng tiền:</span>
                        <p className="mt-1 text-lg font-bold text-green-700">
                          {selectedBooking.total_price.toLocaleString()}đ
                        </p>
                      </div>
                      {/* Hiển thị lặp lại hàng tuần nếu có */}
                      {selectedBooking.booking_type === "WEEKLY" &&
                      selectedBooking.bookingSlots.some(bs => bs.is_recurring) && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-600">Đặt lặp lại hàng tuần:</span>
                          <p className="mt-1">
                            {selectedBooking.bookingSlots
                              .filter(bs => bs.is_recurring)
                              .map(bs => {
                                // Chuyển số thứ sang tên thứ
                                const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                                return `${days[bs.recurring_day || 0]} - ${bs.num_weeks} tuần`;
                              })
                              .join(", ")}
                          </p>
                        </div>
                      )}
                    </div>

                  )}

                  <div className="mt-6 text-right">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Đóng
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
