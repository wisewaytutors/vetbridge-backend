/**
 * Mask contact details based on booking status.
 * Phone and precise lat/lng are hidden until booking is CONFIRMED.
 */
function maskBookingDetails(booking, requestingUserId) {
  const isOwner     = booking.ownerId === requestingUserId;
  const isConfirmed = !['PENDING'].includes(booking.status);

  return {
    ...booking,
    ownerPhone:   isOwner || isConfirmed ? booking.ownerPhone : maskPhone(booking.ownerPhone),
    ownerLat:     isOwner || isConfirmed ? booking.ownerLat   : null,
    ownerLng:     isOwner || isConfirmed ? booking.ownerLng   : null,
    ownerAddress: isOwner || isConfirmed ? booking.ownerAddress : booking.ownerNeighbourhood,
  };
}

function maskPhone(phone) {
  if (!phone) return null;
  return phone.slice(0, 7) + '*** ' + phone.slice(-4);
}

module.exports = { maskBookingDetails, maskPhone };
