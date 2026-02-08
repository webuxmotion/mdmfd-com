'use client';

import { useState, ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useDesks } from './DesksContext';
import { DeskItem } from '../data/desks';
import ItemCard from '../components/ItemCard';

interface DragData {
  type?: string;
  itemId: string;
  sourceDeskId: string;
  item: DeskItem;
  deskSlug: string;
}

interface DndProviderProps {
  children: ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const { moveItem, reorderItems, desks } = useDesks();
  const [activeItem, setActiveItem] = useState<DragData | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Custom collision detection that prefers sidebar desks when dragging over them
  const collisionDetection: CollisionDetection = (args) => {
    // First check for pointer within (good for sidebar drop targets)
    const pointerCollisions = pointerWithin(args);

    // Check if any collision is with a sidebar desk (desk IDs)
    const deskIds = desks.map(d => d.id);
    const sidebarCollision = pointerCollisions.find(c => deskIds.includes(c.id as string));

    if (sidebarCollision) {
      return [sidebarCollision];
    }

    // Fall back to closest center for item sorting
    return closestCenter(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragData;
    if (data) {
      setActiveItem(data);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active.data.current) {
      setActiveItem(null);
      return;
    }

    const activeData = active.data.current as DragData;
    const { itemId, sourceDeskId } = activeData;
    const overId = over.id as string;

    // Check if dropping on a sidebar desk (moving between desks)
    const targetDesk = desks.find(d => d.id === overId);
    if (targetDesk && sourceDeskId !== overId) {
      moveItem(sourceDeskId, overId, itemId);
      setActiveItem(null);
      return;
    }

    // Check if dropping on another item (reordering within desk)
    const sourceDesk = desks.find(d => d.id === sourceDeskId);
    if (sourceDesk) {
      const oldIndex = sourceDesk.items.findIndex(item => item.id === itemId);
      const newIndex = sourceDesk.items.findIndex(item => item.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(
          sourceDesk.items.map(item => item.id),
          oldIndex,
          newIndex
        );
        reorderItems(sourceDeskId, newOrder);
      }
    }

    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {activeItem ? (
          <ItemCard
            item={activeItem.item}
            deskSlug={activeItem.deskSlug}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
