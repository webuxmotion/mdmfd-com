'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeskItem } from '../data/desks';
import ItemCard from './ItemCard';

interface SortableItemCardProps {
  item: DeskItem;
  deskSlug: string;
  deskId: string;
}

export default function SortableItemCard({ item, deskSlug, deskId }: SortableItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      itemId: item.id,
      sourceDeskId: deskId,
      item: item,
      deskSlug: deskSlug,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <ItemCard item={item} deskSlug={deskSlug} deskId={deskId} />
    </div>
  );
}
