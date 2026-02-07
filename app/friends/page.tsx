'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import UserProfileButton from '../components/UserProfileButton';

// Mock friend requests data
const mockFriendRequests = [
  { id: '1', username: 'nia.porter', fullName: 'Nia Porter', avatar: null },
  { id: '2', username: 'cash.rosario', fullName: 'Cash Rosario', avatar: null },
  { id: '3', username: 'gianni.maynard', fullName: 'Gianni Maynard', avatar: null },
];

export default function FriendsPage() {
  const [friendRequests, setFriendRequests] = useState(mockFriendRequests);
  const [openRequestMenu, setOpenRequestMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAccept = (id: string) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== id));
    setOpenRequestMenu(null);
  };

  const handleDecline = (id: string) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== id));
    setOpenRequestMenu(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div />
          <UserProfileButton />
        </div>

        {/* Friend Requests Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Friend requests</h2>

          <div className="space-y-4 max-w-md">
            {friendRequests.map((request) => (
              <div key={request.id} className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {request.avatar ? (
                    <img src={request.avatar} alt={request.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-gray-400 fill-current">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[#8b6914] font-medium truncate">{request.username}</div>
                  <div className="text-gray-500 text-sm truncate">{request.fullName}</div>
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={() => setOpenRequestMenu(openRequestMenu === request.id ? null : request.id)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500 fill-current">
                      <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {openRequestMenu === request.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(request.id)}
                        className="w-full px-4 py-2 text-left text-[#ffa000] hover:bg-gray-100 transition-colors text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {friendRequests.length === 0 && (
              <p className="text-gray-500 text-sm">No pending friend requests</p>
            )}
          </div>
        </section>

        {/* Add New Friend Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add new friend</h2>

          <div className="max-w-md">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 fill-current"
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=""
                className="w-full border-b border-gray-300 py-2 pl-7 outline-none focus:border-[#ffa000] transition-colors"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
