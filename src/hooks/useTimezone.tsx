import { useState, useEffect } from 'react';
import { 
  getUserTimezone, 
  formatTimezoneDisplay, 
  getTimezoneSuggestions,
  getNextCollectionTime,
  COMMON_TIMEZONES 
} from '@/lib/timezone';

export interface UseTimezoneReturn {
  userTimezone: string;
  timezoneOptions: typeof COMMON_TIMEZONES;
  selectedTimezone: string;
  setSelectedTimezone: (timezone: string) => void;
  formatTimezone: (timezone?: string) => string;
  getNextCollection: (frequency: 'daily' | 'weekly' | 'bi-weekly', timezone?: string) => Date;
  isLoading: boolean;
}

/**
 * Hook for managing timezone selection and display in research projects
 */
export function useTimezone(initialTimezone?: string): UseTimezoneReturn {
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [selectedTimezone, setSelectedTimezone] = useState<string>(initialTimezone || 'UTC');
  const [timezoneOptions, setTimezoneOptions] = useState(COMMON_TIMEZONES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect user's timezone on component mount
    const detectTimezone = () => {
      try {
        const detected = getUserTimezone();
        setUserTimezone(detected);
        
        // If no initial timezone provided, use detected one
        if (!initialTimezone) {
          setSelectedTimezone(detected);
        }
        
        // Update timezone options with user's timezone highlighted
        setTimezoneOptions(getTimezoneSuggestions());
      } catch (error) {
        console.warn('Failed to detect timezone:', error);
        // Fallback to UTC
        setUserTimezone('UTC');
        if (!initialTimezone) {
          setSelectedTimezone('UTC');
        }
      } finally {
        setIsLoading(false);
      }
    };

    detectTimezone();
  }, [initialTimezone]);

  const formatTimezone = (timezone?: string) => {
    return formatTimezoneDisplay(timezone || selectedTimezone);
  };

  const getNextCollection = (
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly', 
    timezone?: string
  ) => {
    return getNextCollectionTime(frequency, timezone || selectedTimezone);
  };

  return {
    userTimezone,
    timezoneOptions,
    selectedTimezone,
    setSelectedTimezone,
    formatTimezone,
    getNextCollection,
    isLoading,
  };
}

/**
 * Hook for displaying timezone-aware scheduling information
 */
export function useScheduleDisplay(
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly',
  timezone?: string
) {
  const [nextCollection, setNextCollection] = useState<Date | null>(null);
  const [scheduleText, setScheduleText] = useState<string>('');

  useEffect(() => {
    const updateScheduleInfo = () => {
      const tz = timezone || getUserTimezone();
      const next = getNextCollectionTime(frequency, tz);
      setNextCollection(next);

      // Generate human-readable schedule text
      let text = '';
      switch (frequency) {
        case 'daily':
          text = `Daily at 9:00 AM ${tz}`;
          break;
        case 'weekly':
          text = `Weekly on Mondays at 9:00 AM ${tz}`;
          break;
        case 'bi-weekly':
          text = `Every other Monday at 9:00 AM ${tz}`;
          break;
        case 'monthly':
          text = `Monthly on the 1st at 9:00 AM ${tz}`;
          break;
      }
      setScheduleText(text);
    };

    updateScheduleInfo();
  }, [frequency, timezone]);

  return {
    nextCollection,
    scheduleText,
    formattedNextCollection: nextCollection?.toLocaleString(undefined, {
      timeZone: timezone || getUserTimezone(),
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
