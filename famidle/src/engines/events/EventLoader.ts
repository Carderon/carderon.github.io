import type { EventType } from '@/types/EventType'
import { age1Events } from '@/data/events/age1'
import { age2Events } from '@/data/events/age2'
import { globalEvents } from '@/data/events/global'

export class EventLoader {
  private static eventsByAge: Record<number, EventType[]> = {
    0: [...globalEvents],
    1: [...age1Events],
    2: [...age2Events],
    // 3-7 à implémenter quand les fichiers seront créés
  }

  static getEventsForAge(age: number): EventType[] {
    return this.eventsByAge[age] || []
  }

  static getAllEvents(): EventType[] {
    return Object.values(this.eventsByAge).flat()
  }
}
