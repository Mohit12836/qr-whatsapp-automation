import { InvoiceDocument, InvoiceItem } from './types';

export class DocumentConnector {
  public generateQuotation(input: {
    customerName: string;
    customerPhone: string;
    customerGstin?: string;
    items: Omit<InvoiceItem, 'id'>[];
    validDays?: number;
  }): InvoiceDocument {
    return this.createDocument({
      ...input,
      docType: 'quotation',
      validDays: input.validDays ?? 15,
    });
  }

  public generateInvoice(input: {
    customerName: string;
    customerPhone: string;
    customerGstin?: string;
    items: Omit<InvoiceItem, 'id'>[];
  }): InvoiceDocument {
    return this.createDocument({
      ...input,
      docType: 'invoice',
    });
  }

  private createDocument(params: {
    docType: 'quotation' | 'invoice';
    customerName: string;
    customerPhone: string;
    customerGstin?: string;
    items: Omit<InvoiceItem, 'id'>[];
    validDays?: number;
  }): InvoiceDocument {
    const docPrefix = params.docType === 'quotation' ? 'QT' : 'INV';
    const docNumber = `${docPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    let totalGst = 0;

    const fullItems: InvoiceItem[] = params.items.map((item, index) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineGst = lineSubtotal * (item.gstRatePercent / 100);
      subtotal += lineSubtotal;
      totalGst += lineGst;

      return {
        id: `item_${index + 1}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstRatePercent: item.gstRatePercent,
      };
    });

    const grandTotal = Math.round((subtotal + totalGst) * 100) / 100;
    const now = new Date();
    const validUntilDate = params.validDays 
      ? new Date(now.getTime() + params.validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    return {
      docNumber,
      docType: params.docType,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerGstin: params.customerGstin,
      items: fullItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      grandTotal,
      pdfUrl: `/api/growth/documents/${docNumber}.pdf`,
      issuedAt: now.toISOString(),
      validUntil: validUntilDate,
    };
  }

  public renderTextSummary(doc: InvoiceDocument): string {
    const header = doc.docType === 'quotation' ? '📋 *ESTIMATE / QUOTATION*' : '🧾 *TAX INVOICE*';
    const lines = doc.items.map(
      (it, i) => `${i + 1}. ${it.description} x ${it.quantity} @ ₹${it.unitPrice} = ₹${it.quantity * it.unitPrice}`
    );

    return [
      header,
      `Doc No: ${doc.docNumber}`,
      `Customer: ${doc.customerName} (${doc.customerPhone})`,
      '--------------------------------',
      ...lines,
      '--------------------------------',
      `Subtotal: ₹${doc.subtotal.toFixed(2)}`,
      `GST: ₹${doc.totalGst.toFixed(2)}`,
      `*Grand Total: ₹${doc.grandTotal.toFixed(2)}*`,
      doc.validUntil ? `_Valid until: ${doc.validUntil}_` : '',
    ].filter(Boolean).join('\n');
  }
}
