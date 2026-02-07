export interface DeskItem {
  id: string;
  type: 'facebook' | 'linkedin' | 'instagram' | 'note' | 'book' | 'custom';
  title: string;
  link: string;
  description: string;
  image?: string;
  readme?: string;
  cardViewType?: 'title' | 'image' | 'emoji';
  emoji?: string;
}

export interface Desk {
  id: string;
  slug: string;
  label: string;
  items: DeskItem[];
}

export const initialDesks: Desk[] = [
  {
    id: '1',
    slug: 'social-networks',
    label: 'Social networks',
    items: [
      {
        id: '1',
        type: 'facebook',
        title: 'My facebook',
        link: 'https://www.facebook.com/hitthesun',
        description: '',
      },
      {
        id: '2',
        type: 'linkedin',
        title: 'My LinkedIn',
        link: 'https://www.linkedin.com/in/username',
        description: '',
      },
      {
        id: '3',
        type: 'instagram',
        title: 'My Instagram',
        link: 'https://www.instagram.com/username',
        description: '',
      },
    ],
  },
  {
    id: '2',
    slug: 'notes',
    label: 'Notes',
    items: [],
  },
  {
    id: '3',
    slug: 'books',
    label: 'Books',
    items: [],
  },
];
