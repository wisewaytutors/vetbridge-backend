import { Inbox, Search, Calendar, ShoppingBag, Stethoscope } from 'lucide-react';

export default function EmptyState({ type = 'default', message, actionText, onAction }) {
  const icons = {
    default: Inbox,
    search: Search,
    bookings: Calendar,
    marketplace: ShoppingBag,
    vets: Stethoscope,
  };

  const messages = {
    default: message || 'No data available',
    search: message || 'No results found',
    bookings: message || 'No bookings yet',
    marketplace: message || 'No products available',
    vets: message || 'No veterinarians found',
  };

  const Icon = icons[type] || Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 text-lg mb-2">{messages[type]}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
