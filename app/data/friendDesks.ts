import { Desk } from './desks';

// Mock friend data - will be replaced with real data later
export interface Friend {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  status: 'accepted' | 'pending';
}

export const mockFriends: Friend[] = [
  { id: '1', username: 'nia.porter', fullName: 'Nia Porter', avatar: null, status: 'accepted' },
  { id: '2', username: 'cash.rosario', fullName: 'Cash Rosario', avatar: null, status: 'accepted' },
  { id: '3', username: 'gianni.maynard', fullName: 'Gianni Maynard', avatar: null, status: 'pending' },
];

// Mock friend desks data - will be replaced with API calls later
export const mockFriendDesks: Record<string, Desk[]> = {
  'nia.porter': [
    {
      id: 'np-1',
      slug: 'social-networks',
      label: 'Social networks',
      items: [
        {
          id: 'np-1-1',
          type: 'facebook',
          title: 'Facebook',
          link: 'https://www.facebook.com/nia.porter',
          description: '',
        },
        {
          id: 'np-1-2',
          type: 'linkedin',
          title: 'LinkedIn',
          link: 'https://www.linkedin.com/in/niaporter',
          description: '',
        },
        {
          id: 'np-1-3',
          type: 'instagram',
          title: 'Instagram',
          link: 'https://www.instagram.com/nia.porter',
          description: '',
        },
      ],
    },
    {
      id: 'np-2',
      slug: 'notes',
      label: 'Notes',
      items: [
        {
          id: 'np-2-1',
          type: 'note',
          title: 'Meeting notes',
          link: '',
          description: 'Notes from weekly meetings',
        },
      ],
    },
    {
      id: 'np-3',
      slug: 'books',
      label: 'Books',
      items: [
        {
          id: 'np-3-1',
          type: 'book',
          title: 'Clean Code',
          link: '',
          description: 'Robert C. Martin',
        },
      ],
    },
  ],
  'cash.rosario': [
    {
      id: 'cr-1',
      slug: 'social-networks',
      label: 'Social networks',
      items: [
        {
          id: 'cr-1-1',
          type: 'facebook',
          title: 'My Facebook',
          link: 'https://www.facebook.com/cash.rosario',
          description: '',
        },
        {
          id: 'cr-1-2',
          type: 'instagram',
          title: 'My Instagram',
          link: 'https://www.instagram.com/cash.rosario',
          description: '',
        },
      ],
    },
    {
      id: 'cr-2',
      slug: 'portfolio',
      label: 'Portfolio',
      items: [
        {
          id: 'cr-2-1',
          type: 'custom',
          title: 'My Website',
          link: 'https://cashrosario.com',
          description: 'Personal portfolio website',
        },
      ],
    },
  ],
  'gianni.maynard': [
    {
      id: 'gm-1',
      slug: 'social-networks',
      label: 'Social networks',
      items: [
        {
          id: 'gm-1-1',
          type: 'linkedin',
          title: 'LinkedIn Profile',
          link: 'https://www.linkedin.com/in/giannimaynard',
          description: '',
        },
      ],
    },
    {
      id: 'gm-2',
      slug: 'notes',
      label: 'Notes',
      items: [],
    },
  ],
};

export function getFriendByUsername(username: string): Friend | undefined {
  return mockFriends.find((f) => f.username === username);
}

export function getFriendDesks(username: string): Desk[] {
  return mockFriendDesks[username] || [];
}
