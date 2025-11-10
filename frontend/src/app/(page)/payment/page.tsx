"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentPage() {
  const params = useSearchParams();
  const field = params.get("field");
  const total = Number(params.get("total"));
  const deposit = Number(params.get("deposit"));
  const slots = params.get("slots");

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-b from-green-50 to-white p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-green-700 text-center">
            Thanh toán tiền cọc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700">
            <span className="font-medium">Sân:</span> {field}
          </p>
          <p><strong>Ca chơi:</strong> {slots}</p>
          <p className="text-gray-700">
            <span className="font-medium">Tổng tiền:</span> {total.toLocaleString()}₫
          </p>
          <p className="text-gray-700">
            <span>QR thanh toán</span>
          </p>
          <p className="text-green-700 font-semibold text-lg">
            Tiền cọc cần thanh toán: {deposit.toLocaleString()}₫
          </p>

          <Button
            className="bg-green-600 hover:bg-green-700 text-white w-full mt-4"
            onClick={() => alert("Thanh toán thành công (demo)!")}
          >
            Thanh toán ngay
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
