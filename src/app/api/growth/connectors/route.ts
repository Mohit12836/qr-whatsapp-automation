import { NextRequest, NextResponse } from 'next/server';
import { PaymentConnector } from '@/lib/connectors/payment-connector';
import { DocumentConnector } from '@/lib/connectors/document-connector';
import { AppointmentConnector } from '@/lib/connectors/appointment-connector';
import { McpBridgeConnector } from '@/lib/connectors/mcp-bridge-connector';

const payment = new PaymentConnector();
const document = new DocumentConnector();
const appointment = new AppointmentConnector();
const mcp = new McpBridgeConnector();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { connector, method, params } = body;

    if (connector === 'payment') {
      if (method === 'create_link') {
        const result = await payment.createPaymentLink(params);
        return NextResponse.json({ success: true, data: result });
      }
      if (method === 'status') {
        const status = await payment.getPaymentStatus(params.paymentId);
        return NextResponse.json({ success: true, data: status });
      }
    }

    if (connector === 'document') {
      if (method === 'generate_quotation') {
        const quote = document.generateQuotation(params);
        const textSummary = document.renderTextSummary(quote);
        return NextResponse.json({ success: true, data: { ...quote, textSummary } });
      }
      if (method === 'generate_invoice') {
        const inv = document.generateInvoice(params);
        const textSummary = document.renderTextSummary(inv);
        return NextResponse.json({ success: true, data: { ...inv, textSummary } });
      }
    }

    if (connector === 'appointment') {
      if (method === 'get_slots') {
        const slots = appointment.getAvailableSlots(params.date);
        return NextResponse.json({ success: true, data: slots });
      }
      if (method === 'book') {
        const bookingRes = appointment.bookAppointment(params);
        return NextResponse.json({ success: bookingRes.success, data: bookingRes.booking, error: bookingRes.error });
      }
    }

    if (connector === 'mcp') {
      const response = await mcp.callMcpTool(params);
      return NextResponse.json(response);
    }

    return NextResponse.json({ success: false, error: 'Unknown connector or method' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
