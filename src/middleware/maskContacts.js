/**
 * maskBookingDetails — hides owner's precise location and phone
 * until booking.status moves to CONFIRMED or beyond.
 * Applied at the API query layer, not just frontend.
 */
const maskPhone = (phone) => {
  if (!phone) return null;
  // +251 91 234 5678  →  +251 91 *** 5678
  return phone.replace(/(\+\d{3}\s?\d{2})\s?\d{3}/, '$1 ***');
};

const UNMASKED_STATUSES = ['CONFIRMED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'];

const maskBookingForUser = (booking, requestingUserId) => {
  const isUnmasked = UNMASKED_STATUSES.includes(booking.status);
  const isOwner    = booking.ownerId === requestingUserId;

  return {
    ...booking,
    // Owner's contact — visible to vet only after confirmed
    ownerPhone:   isUnmasked || isOwner ? booking.ownerPhone   : maskPhone(booking.ownerPhone),
    ownerLat:     isUnmasked || isOwner ? booking.ownerLat     : null,
    ownerLng:     isUnmasked || isOwner ? booking.ownerLng     : null,
    ownerAddress: isUnmasked || isOwner ? booking.ownerAddress : booking.ownerNeighbourhood,
  };
};

module.exports = { maskBookingForUser, maskPhone };
