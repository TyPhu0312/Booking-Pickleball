
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Search, DollarSign, CheckCircle2, AlertCircle, Clock, Eye, Banknote, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { format } from 'date-fns';
import RemainingPaymentModal from '@/components/payment/RemainingPaymentModal';
import CashPaymentModal from '@/components/payment/CashPaymentModal';
import PaymentModal from '@/components/payment/PaymentModal';
import ViewInforPaymentModal from '@/components/payment/ViewInforPaymentModal';

interface Booking {
  bookingID: string;
  parent_booking_id?: string | null;
  user?: { full_name: string; phone?: string } | null;
  booking_date: string;
  status: string;
  total_price: number;
  deposit_amount: number;
  court?: { name: string } | null;
  phone_user?: string | null;
  bookingSlots: {
    date: string;
    slot: {
      start_time: string;
      end_time: string;
    };
  }[];
}

interface Payment {
  paymentID: string;
  status: string;
  paid_amount: number;
  payment_method: string;
  createdAt: string;
}

interface PaymentInfo {
  hasPendingPayment: boolean;
  hasPartiallyPaid: boolean;
  totalPaid: number;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  payments: Payment[];
  isGroupBooking?: boolean;
  groupTotalPaid?: number;
  groupTotalPrice?: number;
  groupDepositAmount?: number;
  bookingShareOfTotal?: number;
}

type FilterType = 'all' | 'unpaid' | 'partial' | 'paid';
type DateFilterType = 'all' | 'today' | 'week';

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingPayments, setBookingPayments] = useState<{ [key: string]: PaymentInfo }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings`);
      const data = await res.json();
      
      const activeBookings = data.filter((b: Booking) => 
        b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
      );
      
      setBookings(activeBookings);

      const paymentsData: { [key: string]: PaymentInfo } = {};
      for (const booking of activeBookings) {
        try {
          const paymentRes = await fetch(`${API_URL}/api/payos/booking/${booking.bookingID}`);
          const paymentInfo = await paymentRes.json();
          paymentsData[booking.bookingID] = paymentInfo;
        } catch (error) {
          console.error(`Lỗi khi lấy payment info cho booking ${booking.bookingID}:`, error);
          paymentsData[booking.bookingID] = {
            hasPendingPayment: false,
            hasPartiallyPaid: false,
            totalPaid: 0,
            totalPrice: booking.total_price,
            depositAmount: booking.deposit_amount,
            remainingAmount: booking.total_price,
            payments: []
          };
        }
      }
      setBookingPayments(paymentsData);
    } catch (error) {
      console.error('Lỗi khi lấy bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (bookingId: string) => {
    const info = bookingPayments[bookingId];
    if (!info) return 'unpaid';
    
    if (info.isGroupBooking) {
      if (info.totalPaid >= info.totalPrice) return 'paid';
      if (info.totalPaid > 0) return 'partial';
      return 'unpaid';
    }
    
    if (info.totalPaid >= info.totalPrice) return 'paid';
    if (info.totalPaid > 0) return 'partial';
    return 'unpaid';
  };

  const isBookingInDateRange = (booking: Booking) => {
    if (dateFilter === 'all') return true;
    
    const firstSlot = booking.bookingSlots[0];
    if (!firstSlot) return false;

    const bookingDate = new Date(firstSlot.date);
    const now = new Date();

    if (dateFilter === 'today') {
      return format(bookingDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    }

    if (dateFilter === 'week') {
      const weekStart = new Date(now);
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }

    return true;
  };

  const filteredBookings = bookings
    .filter(booking => {
      const matchSearch = 
        booking.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user?.phone?.includes(searchQuery) ||
        booking.phone_user?.includes(searchQuery) ||
        booking.court?.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (!isBookingInDateRange(booking)) return false;

      if (filter === 'all') return true;
      return getPaymentStatus(booking.bookingID) === filter;
    })
    .sort((a, b) => {
      if (a.parent_booking_id && b.parent_booking_id) {
        if (a.parent_booking_id === b.parent_booking_id) {
          return new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
        }
        return a.parent_booking_id.localeCompare(b.parent_booking_id);
      }
      if (a.parent_booking_id && !b.parent_booking_id) return -1;
      if (!a.parent_booking_id && b.parent_booking_id) return 1;
      return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime();
    });

  const stats = {
    total: filteredBookings.length,
    unpaid: filteredBookings.filter(b => getPaymentStatus(b.bookingID) === 'unpaid').length,
    partial: filteredBookings.filter(b => getPaymentStatus(b.bookingID) === 'partial').length,
    paid: filteredBookings.filter(b => getPaymentStatus(b.bookingID) === 'paid').length,
    totalRevenue: filteredBookings.reduce((sum, b) => {
      const info = bookingPayments[b.bookingID];
      return sum + (info?.totalPaid || 0);
    }, 0),
    totalRemaining: filteredBookings.reduce((sum, b) => {
      const info = bookingPayments[b.bookingID];
      return sum + (info?.remainingAmount || b.total_price);
    }, 0),
  };

  const handleCollectPayment = (booking: Booking) => {
    setSelectedBookingId(booking.bookingID);
    setShowPaymentModal(true);
  };

  const handleCashPayment = (booking: Booking) => {
    setSelectedBookingId(booking.bookingID);
    setShowCashPaymentModal(true);
  };

  const handleDepositPayment = (booking: Booking) => {
    setSelectedBookingId(booking.bookingID);
    setShowDepositModal(true);
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBookingId(booking.bookingID);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className='p-6 flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>Quản Lý Thanh Toán & Cọc</h1>
        <p className='text-gray-600'>Theo dõi và quản lý thanh toán đặt sân</p>
      </div>

      <div className='bg-white rounded-lg shadow-sm p-4 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
            <input
              type="text"
              placeholder="Tìm mã booking, tên khách, SĐT, tên sân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className='flex gap-2'>
            <button
              onClick={() => setDateFilter('all')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                dateFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                dateFilter === 'today' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                dateFilter === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tuần này
            </button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div className='bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-600 text-sm mb-1'>Tổng Đã Thu</p>
              <p className='text-3xl font-bold text-green-600'>{stats.totalRevenue.toLocaleString()}đ</p>
            </div>
            <div className='bg-green-100 p-4 rounded-full'>
              <CheckCircle2 className='w-8 h-8 text-green-600' />
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-600 text-sm mb-1'>Tổng Còn Phải Thu</p>
              <p className='text-3xl font-bold text-orange-600'>{stats.totalRemaining.toLocaleString()}đ</p>
            </div>
            <div className='bg-orange-100 p-4 rounded-full'>
              <Clock className='w-8 h-8 text-orange-600' />
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Khách Hàng</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Sân</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Ngày & Giờ</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Tổng Tiền</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Tiền Cọc</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Đã Trả</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Còn Lại</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Trạng Thái</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Thao Tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className='px-4 py-8 text-center text-gray-500'>
                    Không tìm thấy booking nào
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking, index) => {
                  const paymentInfo = bookingPayments[booking.bookingID];
                  const status = getPaymentStatus(booking.bookingID);
                  const firstSlot = booking.bookingSlots[0];
                  
                  const isInGroup = !!booking.parent_booking_id;
                  const prevBooking = index > 0 ? filteredBookings[index - 1] : null;
                  const isFirstInGroup = isInGroup && (!prevBooking || prevBooking.parent_booking_id !== booking.parent_booking_id);
                  
                  const groupCount = isInGroup 
                    ? filteredBookings.filter(b => b.parent_booking_id === booking.parent_booking_id).length 
                    : 0;

                  return (
                    <tr key={booking.bookingID} className={`hover:bg-gray-50 ${isInGroup ? 'bg-blue-50/30' : ''}`}>
                      
                      <td className='px-4 py-4'>
                        <div className='text-sm'>
                          <div className='flex items-center gap-2'>
                           
                            <div>
                              <div className='font-medium text-gray-900 flex items-center gap-2'>
                                {booking.user?.full_name || 'N/A'}
                              </div>
                              <div className='text-gray-500'>
                                {booking.user?.phone || booking.phone_user || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {booking.court?.name || 'Chưa phân bổ'}
                      </td>
                      <td className='px-4 py-4'>
                        <div className='text-sm space-y-1'>
                          {booking.bookingSlots && booking.bookingSlots.length > 0 ? (
                            booking.bookingSlots.map((slot, idx) => (
                              <div key={idx} className='flex items-center gap-2'>
                                <span className='text-gray-900 font-medium'>
                                  {format(new Date(slot.date), 'dd/MM/yyyy')}
                                </span>
                                <span className='text-gray-500'>
                                  {slot.slot.start_time.slice(0, 5)} - {slot.slot.end_time.slice(0, 5)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className='text-gray-500'>N/A</span>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        <div className='flex flex-col'>
                          <span>{booking.total_price.toLocaleString()}đ</span>
                          {isInGroup && paymentInfo?.isGroupBooking && (
                            <span className='text-xs text-gray-500'>
                              (Nhóm: {(paymentInfo?.groupTotalPrice ?? 0).toLocaleString()}đ)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-purple-600'>
                            {booking.deposit_amount.toLocaleString()}đ
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-green-600'>
                            {(paymentInfo?.totalPaid ?? 0).toLocaleString()}đ
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-orange-600'>
                            {(paymentInfo?.remainingAmount ?? booking.total_price).toLocaleString()}đ
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        {status === 'paid' && (
                          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            <CheckCircle2 className='w-3 h-3' />
                            Đã Thanh Toán
                          </span>
                        )}
                        {status === 'partial' && (
                          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800'>
                            <Clock className='w-3 h-3' />
                            Đã Cọc
                          </span>
                        )}
                        {status === 'unpaid' && (
                          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                            <AlertCircle className='w-3 h-3' />
                            Chưa Trả
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm'>
                        <div className='flex items-center gap-2'>
                          {status !== 'paid' && (
                            <>
                              {(() => {
                                const totalPaidToCheck = paymentInfo?.isGroupBooking 
                                  ? (paymentInfo?.groupTotalPaid ?? 0)
                                  : (paymentInfo?.totalPaid ?? 0);
                                
                                if (totalPaidToCheck === 0) {
                                  return (
                                    <button
                                      onClick={() => handleDepositPayment(booking)}
                                      className='px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs font-medium flex items-center gap-1'
                                      title='Tạo QR cọc - Thanh toán tiền cọc qua PayOS'
                                    >
                                      <QrCode className='w-3 h-3' />
                                      QR Cọc
                                    </button>
                                  );
                                } else {
                                  return (
                                    <button
                                      onClick={() => handleCollectPayment(booking)}
                                      className='px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1'
                                      title='Thu phần còn lại qua PayOS'
                                    >
                                      <DollarSign className='w-3 h-3' />
                                      PayOS
                                    </button>
                                  );
                                }
                              })()}
                              <button
                                onClick={() => handleCashPayment(booking)}
                                className='px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium flex items-center gap-1'
                                title='Thu tiền mặt'
                              >
                                <Banknote className='w-3 h-3' />
                                Tiền mặt
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className='p-1.5 text-gray-600 hover:text-blue-600 transition-colors'
                            title='Xem chi tiết'
                          >
                            <Eye className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && selectedBookingId && (
        <RemainingPaymentModal
          bookingId={selectedBookingId}
          remainingAmount={bookingPayments[selectedBookingId]?.remainingAmount || 0}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBookingId(null);
          }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setSelectedBookingId(null);
            fetchBookings();
          }}
        />
      )}

      {showCashPaymentModal && selectedBookingId && (
        <CashPaymentModal
          bookingId={selectedBookingId}
          totalPrice={bookings.find(b => b.bookingID === selectedBookingId)?.total_price || 0}
          depositAmount={bookings.find(b => b.bookingID === selectedBookingId)?.deposit_amount || 0}
          totalPaid={bookingPayments[selectedBookingId]?.totalPaid || 0}
          remainingAmount={bookingPayments[selectedBookingId]?.remainingAmount || 0}
          onClose={() => {
            setShowCashPaymentModal(false);
            setSelectedBookingId(null);
          }}
          onPaymentSuccess={() => {
            setShowCashPaymentModal(false);
            setSelectedBookingId(null);
            fetchBookings();
          }}
        />
      )}

      {showDepositModal && selectedBookingId && (
        <PaymentModal
          bookingId={selectedBookingId}
          onClose={() => {
            setShowDepositModal(false);
            setSelectedBookingId(null);
          }}
          onPaymentSuccess={() => {
            setShowDepositModal(false);
            setSelectedBookingId(null);
            fetchBookings();
          }}
        />
      )}

      {showViewModal && selectedBookingId && (
        <ViewInforPaymentModal
          bookingId={selectedBookingId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedBookingId(null);
          }}
        />
      )}
    </div>
  );
}

