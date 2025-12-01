
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Search, DollarSign, CheckCircle2, AlertCircle, Clock, Eye, Calendar, RefreshCw, NotebookPen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import RemainingPaymentModal from '@/components/payment/RemainingPaymentModal';

interface Booking {
  bookingID: string;
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
  remainingAmount: number;
  payments: Payment[];
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
        b.status === 'PENDING' || b.status === 'CONFIRMED'
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

  const filteredBookings = bookings.filter(booking => {
    const matchSearch = 
      booking.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user?.phone?.includes(searchQuery) ||
      booking.phone_user?.includes(searchQuery) ||
      booking.court?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (!isBookingInDateRange(booking)) return false;

    if (filter === 'all') return true;
    return getPaymentStatus(booking.bookingID) === filter;
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

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
        <div 
          onClick={() => setFilter('all')}
          className={`bg-linear-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 ${filter === 'all' ? 'ring-4 ring-blue-300' : ''}`}
        >
          <div className='flex items-center justify-between mb-2'>
            <NotebookPen className='w-10 h-10 opacity-80' />
            <span className='text-3xl font-bold'>{stats.total}</span>
          </div>
          <p className='text-blue-100 text-sm font-medium'>Tổng Booking</p>
        </div>

        <div 
          onClick={() => setFilter('unpaid')}
          className={`bg-linear-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 ${filter === 'unpaid' ? 'ring-4 ring-red-300' : ''}`}
        >
          <div className='flex items-center justify-between mb-2'>
            <AlertCircle className='w-10 h-10 opacity-80' />
            <span className='text-3xl font-bold'>{stats.unpaid}</span>
          </div>
          <p className='text-red-100 text-sm font-medium'>Chưa Thanh Toán</p>
        </div>

        <div 
          onClick={() => setFilter('partial')}
          className={`bg-linear-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 ${filter === 'partial' ? 'ring-4 ring-orange-300' : ''}`}
        >
          <div className='flex items-center justify-between mb-2'>
            <Clock className='w-10 h-10 opacity-80' />
            <span className='text-3xl font-bold'>{stats.partial}</span>
          </div>
          <p className='text-orange-100 text-sm font-medium'>Đã Cọc</p>
        </div>

        <div 
          onClick={() => setFilter('paid')}
          className={`bg-linear-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 ${filter === 'paid' ? 'ring-4 ring-green-300' : ''}`}
        >
          <div className='flex items-center justify-between mb-2'>
            <CheckCircle2 className='w-10 h-10 opacity-80' />
            <span className='text-3xl font-bold'>{stats.paid}</span>
          </div>
          <p className='text-green-100 text-sm font-medium'>Đã Thanh Toán Đủ</p>
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
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Đã Trả</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Còn Lại</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Trạng Thái</th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Thao Tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className='px-4 py-8 text-center text-gray-500'>
                    Không tìm thấy booking nào
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const paymentInfo = bookingPayments[booking.bookingID];
                  const status = getPaymentStatus(booking.bookingID);
                  const firstSlot = booking.bookingSlots[0];

                  return (
                    <tr key={booking.bookingID} className='hover:bg-gray-50'>
                      
                      <td className='px-4 py-4'>
                        <div className='text-sm'>
                          <div className='font-medium text-gray-900'>
                            {booking.user?.full_name || 'N/A'}
                          </div>
                          <div className='text-gray-500'>
                            {booking.user?.phone || booking.phone_user || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {booking.court?.name || booking.phone_user || 'N/A'}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='text-sm'>
                          <div className='text-gray-900'>
                            {firstSlot ? format(new Date(firstSlot.date), 'dd/MM/yyyy') : 'N/A'}
                          </div>
                          <div className='text-gray-500'>
                            {firstSlot ? `${firstSlot.slot.start_time} - ${firstSlot.slot.end_time}` : ''}
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        {booking.total_price.toLocaleString()}đ
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm'>
                        <span className='font-semibold text-green-600'>
                          {(paymentInfo?.totalPaid ?? 0).toLocaleString()}đ
                        </span>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm'>
                        <span className='font-semibold text-orange-600'>
                          {(paymentInfo?.remainingAmount ?? booking.total_price).toLocaleString()}đ
                        </span>
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
                            <button
                              onClick={() => handleCollectPayment(booking)}
                              className='px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium'
                            >
                              Thu Tiền
                            </button>
                          )}
                          <button
                            onClick={() => {
                            }}
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
    </div>
  );
}

