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
import { Download, Check, X, Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { API_URL } from "@/lib/config";

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
  };
}

export default function RefundManagementPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<RefundRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNote, setAdminNote] = useState<string>("");
  const [actualRefund, setActualRefund] = useState<number>(0);

  useEffect(() => {
    fetchRefunds();
  }, [selectedStatus, startDate, endDate]);

  const fetchRefunds = async () => {
    try {
      let url = `${API_URL}/api/refunds/requests?status=${selectedStatus}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url);
      const data = await response.json();
      setRefunds(data);
      setFilteredRefunds(data);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    }
  };

  const handleApprove = async (paymentID: string, refundAmount: number) => {
    try {
      const response = await fetch(
        `${API_URL}/api/refunds/update-status/${paymentID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refund_status: "APPROVED",
            admin_note: adminNote,
            processed_by: "admin-id", 
            actual_refund: actualRefund || refundAmount,
          }),
        }
      );

      if (response.ok) {
        alert("Duyệt refund thành công!");
        fetchRefunds();
        setSelectedRefund(null);
        setAdminNote("");
      }
    } catch (error) {
      console.error("Error approving refund:", error);
    }
  };

  const handleReject = async (paymentID: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/refunds/update-status/${paymentID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refund_status: "REJECTED",
            admin_note: adminNote,
            processed_by: "admin-id",
          }),
        }
      );

      if (response.ok) {
        alert("Từ chối refund thành công!");
        fetchRefunds();
        setSelectedRefund(null);
        setAdminNote("");
      }
    } catch (error) {
      console.error("Error rejecting refund:", error);
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
        alert("Đã đánh dấu hoàn thành!");
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
      let url = `${API_URL}/api/refunds/export-excel?`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}`;

      const response = await fetch(url);
      const data = await response.json();

   
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

 
      const fileName = `Refund_${startDate || "all"}_${endDate || "all"}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
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
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
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

            <div className="flex items-end">
              <Button onClick={exportToExcel} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Xuất Excel
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sân</TableHead>
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
                    <TableCell>{refund.booking.court?.name || "Chưa phân bổ"}</TableCell>
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
                            setActualRefund(refund.refund_amount);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {refund.refund_status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() =>
                                handleApprove(refund.paymentID, refund.refund_amount)
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleReject(refund.paymentID)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                      <Label>Số tiền hoàn (có thể điều chỉnh)</Label>
                      <Input
                        type="number"
                        value={actualRefund}
                        onChange={(e) => setActualRefund(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label>Ghi chú của Admin</Label>
                      <Textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Nhập ghi chú (nếu có)..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleApprove(selectedRefund.paymentID, actualRefund)
                        }
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Duyệt Refund
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => handleReject(selectedRefund.paymentID)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Từ chối
                      </Button>
                      {selectedRefund.refund_status === "APPROVED" && (
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleComplete(selectedRefund.paymentID)}
                        >
                          Hoàn thành
                        </Button>
                      )}
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
