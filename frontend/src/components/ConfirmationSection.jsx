import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ConfirmationSection = ({ bookingDetails, onConfirm, onEdit }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Confirm Your Booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Personal Details</h3>
            <p><strong>Name:</strong> {bookingDetails.firstName} {bookingDetails.lastName}</p>
            <p><strong>Email:</strong> {bookingDetails.email}</p>
            <p><strong>Phone:</strong> {bookingDetails.phone || 'N/A'}</p>
            <p><strong>T-shirt Size:</strong> {bookingDetails.tshirtSize}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Event Details</h3>
            <p><strong>Event:</strong> {bookingDetails.eventName}</p>
            <p><strong>Date:</strong> {bookingDetails.eventDate}</p>
            <p><strong>Location:</strong> {bookingDetails.eventLocation}</p>
            <p><strong>Ticket Type:</strong> {bookingDetails.ticketType}</p>
            <p><strong>Quantity:</strong> {bookingDetails.quantity}</p>
            <p><strong>Total Amount:</strong> ₹{bookingDetails.totalAmount}</p>
          </div>
        </div>

        {bookingDetails.attendees && bookingDetails.attendees.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Attendee Details</h3>
            {bookingDetails.attendees.map((attendee, index) => (
              <div key={index} className="mb-4 p-3 border rounded-md">
                <p><strong>Attendee {index + 1} Name:</strong> {attendee.name}</p>
                <p><strong>Email:</strong> {attendee.email}</p>
                <p><strong>Phone:</strong> {attendee.phone || 'N/A'}</p>
                <p><strong>Dietary Restrictions:</strong> {attendee.dietaryRestrictions || 'None'}</p>
                {attendee.emergencyContact && (
                  <p><strong>Emergency Contact:</strong> {attendee.emergencyContact.name} ({attendee.emergencyContact.phone})</p>
                )}
              </div>
            ))}
          </div>
        )}

        {bookingDetails.specialRequests && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Special Requests</h3>
            <p>{bookingDetails.specialRequests}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={onEdit}>Edit Details</Button>
          <Button onClick={onConfirm}>Confirm and Proceed to Payment</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationSection;
