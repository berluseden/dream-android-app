import { useMemo } from 'react';
import { PlatePreferences } from '@/types/strength.types';

const DEFAULT_PREFERENCES: PlatePreferences = {
  bar_type: 'olympic',
  bar_weight: 20,
  available_plates: [20, 15, 10, 5, 2.5, 1.25],
};

export function usePlateCalculator(preferences: PlatePreferences = DEFAULT_PREFERENCES) {
  const calculatePlates = useMemo(() => {
    return (targetLoad: number): { plates: { weight: number; count: number }[]; perSide: number; isExact: boolean } => {
      const { bar_weight, available_plates } = preferences;
      
      if (targetLoad <= bar_weight) {
        return { plates: [], perSide: 0, isExact: true };
      }

      const weightPerSide = (targetLoad - bar_weight) / 2;
      const sortedPlates = [...available_plates].sort((a, b) => b - a);
      
      let remaining = weightPerSide;
      const plateCount: { weight: number; count: number }[] = [];
      
      for (const plate of sortedPlates) {
        if (remaining >= plate) {
          const count = Math.floor(remaining / plate);
          plateCount.push({ weight: plate, count });
          remaining -= count * plate;
        }
      }

      const isExact = Math.abs(remaining) < 0.01;
      const actualPerSide = weightPerSide - remaining;

      return {
        plates: plateCount,
        perSide: parseFloat(actualPerSide.toFixed(2)),
        isExact,
      };
    };
  }, [preferences]);

  const formatPlateDisplay = (plates: { weight: number; count: number }[]) => {
    return plates
      .map(({ weight, count }) => `${count}×${weight}kg`)
      .join(' + ');
  };

  return { calculatePlates, formatPlateDisplay, preferences };
}
