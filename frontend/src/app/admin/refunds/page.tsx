/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Eye, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { se } from "date-fns/locale";

interface RefundRequest {
  paymentID: string;
  booking_id: string;
  refund_amount: number;
  refund_percentage: number;
  refund_reason: string;
  refund_status: string;
  refund_date: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_owner: string;
  admin_note?: string;
  processed_by?: string;
  booking: {
    bookingID: string;
    deposit_amount: number;
    total_price: number;
    user?: {
      full_name: string;
      phone: string;
    };
    phone_user?: string;
    court?: {
      name: string;
    } | null;
    bookingSlots?: Array<{
      slot: {
        slot_name: string;
        start_time: string;
        end_time: string;
      };
      date: string;
    }>;
  };
}

export default function RefundManagementPage() {
  const [filteredRefunds, setFilteredRefunds] = useState<RefundRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNote, setAdminNote] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchRefunds();
  }, [selectedStatus, startDate, endDate]);

  const fetchRefunds = async () => {
    try {
      let url = `${API_URL}/api/refunds/admin/requests?status=${selectedStatus}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        toast.error(`Lỗi tải dữ liệu: ${response.status}`);
        setFilteredRefunds([]);
        return;
      }

      const data = await response.json();
      const dataArray = Array.isArray(data) ? data : [];
      setFilteredRefunds(dataArray);

      if (dataArray.length === 0) {
        toast.info("Không có dữ liệu refund với bộ lọc này");
      }
    } catch (error) {
      console.error("Error fetching refunds:", error);
      toast.error("Lỗi khi tải dữ liệu refund");
      setFilteredRefunds([]);
    }
  };

  const handleComplete = async (paymentID: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/refunds/update-status/${paymentID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refund_status: "COMPLETED",
            admin_note: adminNote || "Đã chuyển khoản hoàn tiền thành công",
            processed_by: "admin-id",
          }),
        }
      );

      if (response.ok) {
        toast.success("Đã đánh dấu hoàn thành!");
        fetchRefunds();
        setSelectedRefund(null);
        setAdminNote("");
      }
    } catch (error) {
      console.error("Error completing refund:", error);
    }
  };

  const exportToExcel = async () => {
    try {
      let url = `${API_URL}/api/refunds/export-excel?status=${selectedStatus}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.length === 0) {
        toast("Không có dữ liệu để xuất");
        return;
      }
   
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Refunds");

      const maxWidth = data.reduce((w: any, r: any) => {
        return Object.keys(r).map((k, i) => {
          const cellLength = String(r[k]).length;
          return Math.max(w[i] || 10, cellLength + 2);
        });
      }, []);
      ws["!cols"] = maxWidth.map((w: number) => ({ width: w }));

      const statusText = selectedStatus === "PENDING" ? "ChoXuLy" : selectedStatus;
      const dateText = startDate && endDate ? `${startDate}_${endDate}` : new Date().toISOString().split('T')[0];
      const fileName = `Refund_${statusText}_${dateText}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Lỗi khi xuất Excel");
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/refunds/import-excel`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const { results } = result;
        toast.success(
          `Import hoàn tất! Thành công: ${results.success} | Thất bại: ${results.failed}`,
          {
            duration: 5000,
          }
        );
        
        fetchRefunds();
      } else {
        toast.error("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error("Error importing Excel:", error);
      toast.error("Lỗi khi import file Excel!");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Quản lý Refund & Hoàn tiền
          </CardTitle>
        </CardHeader>
        <CardContent>
      
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Trạng thái</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                  <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                  <SelectItem value="REJECTED">Từ chối</SelectItem>
                  <SelectItem value="COMPLETED">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Từ ngày</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Đến ngày</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={exportToExcel} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Xuất Excel
              </Button>
              <label className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={importing}
                  onClick={() => document.getElementById("import-file")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? "Đang import..." : "Import Excel"}
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sân & Ngày</TableHead>
                  <TableHead>Tiền cọc</TableHead>
                  <TableHead>% Hoàn</TableHead>
                  <TableHead>Tiền hoàn</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày YC</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.map((refund) => (
                  <TableRow key={refund.paymentID}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {refund.booking.user?.full_name || "Khách lẻ"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {refund.booking.user?.phone || refund.booking.phone_user}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{refund.booking.court?.name || "Chưa phân bổ"}</div>
                        {refund.booking.bookingSlots && refund.booking.bookingSlots[0] && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(refund.booking.bookingSlots[0].date).toLocaleDateString("vi-VN")} • 
                            {refund.booking.bookingSlots[0].slot.start_time.slice(0, 5)}-{refund.booking.bookingSlots[0].slot.end_time.slice(0, 5)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {refund.booking.deposit_amount.toLocaleString()}đ
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">
                        {refund.refund_percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {refund.refund_amount.toLocaleString()}đ
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{refund.bank_name}</div>
                        <div className="text-gray-500">{refund.bank_account_number}</div>
                        <div className="text-gray-500">{refund.bank_account_owner}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          refund.refund_status
                        )}`}
                      >
                        {refund.refund_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(refund.refund_date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRefund(refund);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {refund.refund_status === "APPROVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleComplete(refund.paymentID)}
                          >
                            Hoàn thành
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedRefund && (
            <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>Chi tiết yêu cầu Refund</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Khách hàng</Label>
                        <p className="font-medium">
                          {selectedRefund.booking.user?.full_name || "Khách lẻ"}
                        </p>
                      </div>
                      <div>
                        <Label>Số điện thoại</Label>
                        <p className="font-medium">
                          {selectedRefund.booking.user?.phone ||
                            selectedRefund.booking.phone_user}
                        </p>
                      </div>
                      <div>
                        <Label>Sân</Label>
                        <p className="font-medium">
                          {selectedRefund.booking.court?.name || "Chưa phân bổ"}
                        </p>
                      </div>
                      {selectedRefund.booking.bookingSlots && selectedRefund.booking.bookingSlots[0] && (
                        <div>
                          <Label>Ngày & Giờ</Label>
                          <p className="font-medium">
                            {new Date(selectedRefund.booking.bookingSlots[0].date).toLocaleDateString("vi-VN")}
                            <br />
                            <span className="text-sm text-gray-600">
                              {selectedRefund.booking.bookingSlots[0].slot.start_time.slice(0, 5)}-
                              {selectedRefund.booking.bookingSlots[0].slot.end_time.slice(0, 5)}
                            </span>
                          </p>
                        </div>
                      )}
                      <div>
                        <Label>Tiền cọc</Label>
                        <p className="font-medium">
                          {selectedRefund.booking.deposit_amount.toLocaleString()}đ
                        </p>
                      </div>
                      <div>
                        <Label>% Hoàn tiền</Label>
                        <p className="font-medium text-green-600">
                          {selectedRefund.refund_percentage}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Lý do hủy</Label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">
                        {selectedRefund.refund_reason}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Ngân hàng</Label>
                        <p className="font-medium">{selectedRefund.bank_name}</p>
                      </div>
                      <div>
                        <Label>Số tài khoản</Label>
                        <p className="font-medium">
                          {selectedRefund.bank_account_number}
                        </p>
                      </div>
                      <div>
                        <Label>Chủ tài khoản</Label>
                        <p className="font-medium">
                          {selectedRefund.bank_account_owner}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Số tiền hoàn</Label>
                      <p className="font-medium text-green-600">{selectedRefund.refund_amount.toLocaleString()}đ</p>
                    </div>

                    <div>
                      <Label>Ghi chú của Admin</Label>
                      <p>{selectedRefund.admin_note|| ""}</p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRefund(null);
                          setAdminNote("");
                        }}
                      >
                        Đóng
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
