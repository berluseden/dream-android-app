import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useEffect, useState } from 'react';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message: string;
  last_message_at: Date;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('last_message_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        last_message_at: doc.data().last_message_at?.toDate() || new Date(),
      })) as Conversation[];
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return { data: conversations, isLoading: false };
}

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, 'messages'),
      where('conversation_id', '==', conversationId),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return { data: messages, isLoading: false };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ conversationId, content, recipientId }: { 
      conversationId: string; 
      content: string;
      recipientId: string;
    }) => {
      const messageRef = doc(collection(db, 'messages'));
      await setDoc(messageRef, {
        conversation_id: conversationId,
        sender_id: user?.uid,
        sender_name: user?.displayName || 'Usuario',
        content,
        created_at: serverTimestamp(),
        read: false,
      });

      // Update conversation
      const convRef = doc(db, 'conversations', conversationId);
      await setDoc(convRef, {
        participants: [user?.uid, recipientId],
        last_message: content,
        last_message_at: serverTimestamp(),
      }, { merge: true });

      return { id: messageRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      toast({
        title: "Error al enviar mensaje",
        variant: "destructive",
      });
    },
  });
}
