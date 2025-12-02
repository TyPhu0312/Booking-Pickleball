import { PayOS } from "@payos/node";

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!
});

interface CreatePaymentLinkParams {
  amount: number;
  description: string;
  bookingId: string;
  buyerName?: string;
  buyerPhone?: string;
}

export const createPaymentLink = async (params: CreatePaymentLinkParams) => {
  const orderCode = Number(String(Date.now()).slice(-9));

  const paymentData = {
    orderCode,
    amount: params.amount,
    description: params.description,
    items: [
      {
        name: params.description,
        quantity: 1,
        price: params.amount,
      }
    ],
    returnUrl: `${process.env.FRONTEND_URL}/payment/success?bookingId=${params.bookingId}`,
    cancelUrl: `${process.env.FRONTEND_URL}/payment/cancelled?bookingId=${params.bookingId}`,
    buyerName: params.buyerName || "Khách hàng",
    buyerPhone: params.buyerPhone || "0000000000",
    buyerAddress: "TP.HCM",
    expiredAt: Math.floor(Date.now() / 1000) + 30 * 60, 
  };
  const paymentLinkResponse = await payos.paymentRequests.create(paymentData);
  return {
    orderCode,
    checkoutUrl: paymentLinkResponse.checkoutUrl,
    qrCode: paymentLinkResponse.qrCode,
    paymentLinkId: paymentLinkResponse.paymentLinkId,
  }
}

export const getPaymentInfo = async (orderCode: number) => {
  return await payos.paymentRequests.get(orderCode);
}

export const cancelPaymentLink = async (
  orderCode: number,
  cancellationReason?: string
) => {
  return await payos.paymentRequests.cancel(orderCode, cancellationReason);
}

// export const refundPayment = async (orderCode: number, amount: number, reason: string) => {
//   return await payos.paymentRequests.refund(orderCode, { amount, reason });
// }


export default payos;
