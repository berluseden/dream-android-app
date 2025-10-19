import { httpsCallable } from 'firebase/functions';
import { useMutation } from '@tanstack/react-query';
import { functions } from '../lib/firebase';

export function useAISuggestWorkoutTweaks() {
  return useMutation({
    mutationKey: ['ai', 'suggestWorkoutTweaks'],
    mutationFn: async (input: { workout: any; recentStats?: any; goal?: string }) => {
      const fn = httpsCallable<
        { workout: any; recentStats?: any; goal?: string },
        { suggestions: string }
      >(functions, 'aiSuggestWorkoutTweaks');
      const res = await fn(input);
      return res.data;
    },
  });
}

export function useAIGenerateProgram() {
  return useMutation({
    mutationKey: ['ai', 'generateProgram'],
    mutationFn: async (input: { goal: string; daysPerWeek: number; equipment?: string[]; experience?: string }) => {
      const fn = httpsCallable<
        { goal: string; daysPerWeek: number; equipment?: string[]; experience?: string },
        { program: any }
      >(functions, 'aiGenerateProgram');
      const res = await fn(input);
      return res.data;
    },
  });
}

export function useAISummarizeCheckIn() {
  return useMutation({
    mutationKey: ['ai', 'summarizeCheckIn'],
    mutationFn: async (input: { checkIn: any }) => {
      const fn = httpsCallable<
        { checkIn: any },
        { summary: string }
      >(functions, 'aiSummarizeCheckIn');
      const res = await fn(input);
      return res.data;
    },
  });
}
