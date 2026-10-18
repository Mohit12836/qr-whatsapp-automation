import { AppointmentBooking, AppointmentSlot } from './types';

export class AppointmentConnector {
  private bookings: Map<string, AppointmentBooking> = new Map();

  public getAvailableSlots(date: string): AppointmentSlot[] {
    // Generate default hourly business slots (10:00 to 18:00)
    const hours = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    
    return hours.map((startTime, idx) => {
      const slotId = `slot_${date}_${startTime.replace(':', '')}`;
      const endHour = parseInt(startTime.split(':')[0], 10) + 1;
      const endTime = `${endHour}:00`;
      
      const isTaken = Array.from(this.bookings.values()).some(
        b => b.slotId === slotId && b.status === 'confirmed'
      );

      return {
        slotId,
        date,
        startTime,
        endTime,
        isAvailable: !isTaken,
      };
    });
  }

  public bookAppointment(params: {
    slotId: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
  }): { success: boolean; booking?: AppointmentBooking; error?: string } {
    // Collision check
    const isAlreadyBooked = Array.from(this.bookings.values()).some(
      b => b.slotId === params.slotId && b.status === 'confirmed'
    );

    if (isAlreadyBooked) {
      return { success: false, error: 'This time slot is already booked. Please choose another slot.' };
    }

    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const booking: AppointmentBooking = {
      bookingId,
      slotId: params.slotId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      serviceName: params.serviceName,
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
    };

    this.bookings.set(bookingId, booking);
    return { success: true, booking };
  }

  public cancelAppointment(bookingId: string): boolean {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;
    booking.status = 'cancelled';
    return true;
  }

  public getBookingsForCustomer(phone: string): AppointmentBooking[] {
    return Array.from(this.bookings.values()).filter(
      b => b.customerPhone === phone && b.status === 'confirmed'
    );
  }
}
