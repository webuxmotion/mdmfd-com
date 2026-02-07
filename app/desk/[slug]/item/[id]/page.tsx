'use client';

import { useState, use, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import { useDesks } from '../../../../context/DesksContext';
import { DeskItem } from '../../../../data/desks';

const typeIcons: Record<string, ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
};

const largeIcons: Record<string, ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" className="w-20 h-20 text-white fill-current">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="w-20 h-20 text-white fill-current">
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-20 h-20 text-white fill-current">
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" className="w-20 h-20 text-white fill-current">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className="w-20 h-20 text-white fill-current">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" className="w-20 h-20 text-white fill-current">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
};

const bgColors: Record<string, string> = {
  facebook: 'bg-[#3b5998]',
  linkedin: 'bg-[#4a9ab8]',
  instagram: 'bg-[#5b6ba8]',
  note: 'bg-[#4caf50]',
  book: 'bg-[#9c27b0]',
  custom: 'bg-[#607d8b]',
};

export default function ItemPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const router = useRouter();
  const { getDeskBySlug, getItem, updateItem } = useDesks();

  const desk = getDeskBySlug(slug);
  const item = desk ? getItem(desk.id, id) : undefined;

  const [formData, setFormData] = useState({
    title: '',
    link: '',
    description: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        link: item.link,
        description: item.description,
      });
    }
  }, [item]);

  if (!desk || !item) {
    return (
      <div className="flex min-h-screen">
        <Sidebar activeSlug={slug} />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-800">Item not found</h1>
          <Link href={`/desk/${slug}`} className="text-[#ffa000] hover:underline mt-4 inline-block">
            Go back
          </Link>
        </main>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateItem(desk.id, id, formData);
    router.push(`/desk/${slug}`);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeSlug={slug} />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{formData.title}</h1>
          <div className="w-10 h-10 rounded-full bg-[#ffa000] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
        </div>

        {/* Item tabs */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href={`/desk/${slug}`}
            className="w-12 h-12 rounded-lg bg-[#e8dcc8] flex items-center justify-center hover:bg-[#d4c4a8] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#b8a888] fill-current">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </Link>

          {desk.items.map((i) => (
            <Link
              key={i.id}
              href={`/desk/${slug}/item/${i.id}`}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-opacity ${bgColors[i.type] || bgColors.custom} ${
                item.id === i.id ? 'opacity-100 ring-2 ring-[#ffa000]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {typeIcons[i.type] || typeIcons.custom}
            </Link>
          ))}

          <Link
            href={`/desk/${slug}/item/new`}
            className="w-12 h-12 rounded-lg bg-[#e8dcc8] flex items-center justify-center hover:bg-[#d4c4a8] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#b8a888]">
              <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="border-2 border-[#ffa000] rounded-2xl p-8 max-w-3xl">
          <div className="flex gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <label className="w-24 text-gray-600 text-right">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#ffa000]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-24 text-gray-600 text-right">Link</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#ffa000]"
                  />
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-[#ffa000] transition-colors"
                    onClick={() => window.open(formData.link, '_blank')}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M10.586 6.343a2 2 0 0 1 2.828 0l4.243 4.243a2 2 0 0 1 0 2.828l-4.243 4.243a2 2 0 0 1-2.828 0l-4.243-4.243a2 2 0 0 1 0-2.828l4.243-4.243z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <label className="w-24 text-gray-600 text-right pt-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Write description here..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#ffa000] min-h-[120px] resize-none"
                />
              </div>
            </div>

            {/* Image section */}
            <div className="flex flex-col items-center">
              <span className="text-gray-600 mb-2">Image</span>
              <div className={`w-28 h-28 rounded-lg flex items-center justify-center mb-4 ${bgColors[item.type] || bgColors.custom}`}>
                {largeIcons[item.type] || largeIcons.custom}
              </div>
              <button
                type="button"
                className="px-6 py-1 border border-[#ffa000] text-[#ffa000] rounded-md text-sm hover:bg-[#ffa000] hover:text-white transition-colors mb-2"
              >
                Upload
              </button>
              <button
                type="button"
                className="px-6 py-1 border border-[#ffa000] text-[#ffa000] rounded-md text-sm hover:bg-[#ffa000] hover:text-white transition-colors"
              >
                Proposition
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="px-12 py-2 bg-[#ffa000] text-white rounded-md font-medium hover:bg-[#ff8f00] transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
