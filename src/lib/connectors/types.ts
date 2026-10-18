export interface PaymentLinkRequest {
  orderId: string;
  amount: number;
  currency: 'INR' | 'USD';
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  description: string;
  expiryMinutes?: number;
}

export interface PaymentLinkResult {
  linkId: string;
  shortUrl: string;
  qrPayload?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'expired';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstRatePercent: number; // e.g. 18 for 18% GST
}

export interface InvoiceDocument {
  docNumber: string;
  docType: 'quotation' | 'invoice';
  customerName: string;
  customerPhone: string;
  customerGstin?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  pdfUrl?: string;
  issuedAt: string;
  validUntil?: string;
}

export interface AppointmentSlot {
  slotId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export interface AppointmentBooking {
  bookingId: string;
  slotId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  confirmedAt: string;
}

export interface McpToolRequest {
  server: string;
  toolName: string;
  arguments: Record<string, unknown>;
  authScope?: string;
}

export interface McpToolResponse {
  success: boolean;
  content: unknown;
  error?: string;
}
