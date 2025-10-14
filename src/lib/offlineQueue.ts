import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

interface QueuedAction {
  id: string;
  type: 'add_set' | 'complete_workout' | 'add_feedback';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

export const offlineQueue = {
  add: (type: QueuedAction['type'], payload: any) => {
    const queue = offlineQueue.getAll();
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0
    };
    queue.push(action);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  getAll: (): QueuedAction[] => {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  remove: (id: string) => {
    const queue = offlineQueue.getAll().filter(a => a.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async process() {
    if (!navigator.onLine) return;

    const queue = offlineQueue.getAll();
    
    for (const action of queue) {
      try {
        await offlineQueue.executeAction(action);
        offlineQueue.remove(action.id);
      } catch (error) {
        console.error('Error procesando acción offline:', error);
        
        if (action.retries >= MAX_RETRIES) {
          console.error('Max reintentos alcanzados, removiendo acción');
          offlineQueue.remove(action.id);
        } else {
          const queue = offlineQueue.getAll();
          const index = queue.findIndex(a => a.id === action.id);
          if (index !== -1) {
            queue[index].retries++;
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
          }
        }
      }
    }
  },

  async executeAction(action: QueuedAction) {
    switch (action.type) {
      case 'add_set':
        await addDoc(collection(db, 'sets'), action.payload);
        break;
      case 'complete_workout':
        // Implementar lógica
        break;
      case 'add_feedback':
        await addDoc(collection(db, 'exercise_feedback'), action.payload);
        break;
    }
  }
};

// Auto-procesar cuando se recupera conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Conexión recuperada, procesando cola offline');
    offlineQueue.process();
  });
}
