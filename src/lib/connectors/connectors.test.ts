import { describe, it, expect } from 'vitest';
import { PaymentConnector } from './payment-connector';
import { DocumentConnector } from './document-connector';
import { AppointmentConnector } from './appointment-connector';
import { McpBridgeConnector } from './mcp-bridge-connector';

describe('External Connectors Engine', () => {
  describe('PaymentConnector', () => {
    it('creates a dynamic payment link with UPI intent string', async () => {
      const connector = new PaymentConnector({ isTestMode: true });
      const result = await connector.createPaymentLink({
        orderId: 'ord_101',
        amount: 2499,
        currency: 'INR',
        customer: { name: 'Aakash Verma', phone: '919876543210' },
        description: 'T-Shirt Bulk Order Advance',
      });

      expect(result.status).toBe('created');
      expect(result.amount).toBe(2499);
      expect(result.shortUrl).toContain('rzp.io');
      expect(result.qrPayload).toContain('upi://pay');
      expect(result.qrPayload).toContain('am=2499.00');
    });

    it('rejects invalid amounts', async () => {
      const connector = new PaymentConnector({ isTestMode: true });
      await expect(
        connector.createPaymentLink({
          orderId: 'ord_bad',
          amount: 0,
          currency: 'INR',
          customer: { name: 'Test', phone: '919000000000' },
          description: 'Zero test',
        })
      ).rejects.toThrow('greater than zero');
    });
  });

  describe('DocumentConnector', () => {
    it('generates a quotation with proper GST calculation', () => {
      const docConnector = new DocumentConnector();
      const quote = docConnector.generateQuotation({
        customerName: 'Rohit Sharma',
        customerPhone: '919876543210',
        items: [
          { description: 'Premium Cotton Fabric', quantity: 10, unitPrice: 200, gstRatePercent: 18 },
          { description: 'Custom Stitching Service', quantity: 10, unitPrice: 150, gstRatePercent: 18 },
        ],
      });

      expect(quote.docType).toBe('quotation');
      expect(quote.subtotal).toBe(3500); // (10*200) + (10*150) = 2000 + 1500 = 3500
      expect(quote.totalGst).toBe(630); // 3500 * 0.18 = 630
      expect(quote.grandTotal).toBe(4130);
      expect(quote.pdfUrl).toBeDefined();

      const summary = docConnector.renderTextSummary(quote);
      expect(summary).toContain('ESTIMATE / QUOTATION');
      expect(summary).toContain('Grand Total: ₹4130.00');
    });
  });

  describe('AppointmentConnector', () => {
    it('manages slot reservation and prevents double-booking', () => {
      const apt = new AppointmentConnector();
      const slots = apt.getAvailableSlots('2026-10-25');
      expect(slots.length).toBeGreaterThan(0);
      const targetSlot = slots[0].slotId;

      const booking1 = apt.bookAppointment({
        slotId: targetSlot,
        customerName: 'Kunal Patel',
        customerPhone: '919111222333',
        serviceName: 'Solar Rooftop Site Inspection',
      });

      expect(booking1.success).toBe(true);
      expect(booking1.booking?.status).toBe('confirmed');

      // Attempting to book the same slot must fail
      const booking2 = apt.bookAppointment({
        slotId: targetSlot,
        customerName: 'Another User',
        customerPhone: '919444555666',
        serviceName: 'Consultation',
      });

      expect(booking2.success).toBe(false);
      expect(booking2.error).toContain('already booked');
    });
  });

  describe('McpBridgeConnector', () => {
    it('authorizes allowed server tools and blocks unauthorized ones', async () => {
      const mcp = new McpBridgeConnector({ allowedServers: ['erp-inventory'] });

      // Authorized call
      const allowedRes = await mcp.callMcpTool({
        server: 'erp-inventory',
        toolName: 'check_stock',
        arguments: { sku: 'SOLAR-PANEL-500W' },
      });
      expect(allowedRes.success).toBe(true);
      expect((allowedRes.content as { unitsAvailable: number }).unitsAvailable).toBe(42);

      // Unauthorized server call
      const blockedRes = await mcp.callMcpTool({
        server: 'unauthorized-admin-service',
        toolName: 'delete_database',
        arguments: {},
      });
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.error).toContain('Permission Denied');
    });
  });
});
