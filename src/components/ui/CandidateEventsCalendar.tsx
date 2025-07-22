import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { InterviewStatus } from '@/types';

export interface CandidateEvent {
  date: string; // ISO date string
  type: string;
  label: InterviewStatus;
}

const eventTypeStyle: Record<string, string> = {
  interview: 'bg-blue-100 text-blue-700 border-blue-200',
  review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  task: 'bg-green-100 text-green-700 border-green-200',
  other: 'bg-gray-100 text-gray-500 border-gray-200',
};

const eventTypeDot: Record<string, string> = {
  interview: 'bg-blue-500',
  review: 'bg-yellow-500',
  task: 'bg-green-500',
  other: 'bg-gray-400',
};

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function getMonthMatrix(year: number, month: number) {
  // month: 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekDay = (firstDay.getDay() + 6) % 7; // Make Monday=0
  const daysInMonth = lastDay.getDate();
  const matrix: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(firstWeekDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

interface CandidateEventsCalendarProps {
  events: CandidateEvent[];
  onDateClick?: (date: Date, events: CandidateEvent[]) => void;
}

const CandidateEventsCalendar: React.FC<CandidateEventsCalendarProps> = ({
  events,
  onDateClick,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Group events by date for quick lookup
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, CandidateEvent[]> = {};
    events.forEach((event) => {
      map[event.date] = map[event.date] || [];
      map[event.date].push(event);
    });
    return map;
  }, [events]);

  const monthMatrix = getMonthMatrix(currentYear, currentMonth);
  const monthName = today.toLocaleString('default', { month: 'long' });
  const displayMonth = new Date(currentYear, currentMonth).toLocaleString('default', {
    month: 'long',
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isToday = (date: Date) => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Previous Month"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
        </button>
        <div className="font-semibold text-gray-900 text-base">
          {displayMonth} {currentYear}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Next Month"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 border-b border-gray-100 pb-1 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center tracking-wide">
            {wd}
          </div>
        ))}
      </div>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px">
        {monthMatrix.flat().map((date, idx) => {
          if (!date) {
            return <div key={idx} className="h-16 bg-gray-50" />;
          }
          const iso = date.toISOString().split('T')[0];
          const dayEvents = eventsByDate[iso] || [];
          return (
            <div
              key={idx}
              className={`relative h-20 p-1 border border-gray-100 bg-white flex flex-col items-start rounded-md cursor-pointer hover:bg-primary-50 transition ${isToday(date) ? 'border-primary-500 bg-primary-50' : ''}`}
              onClick={() => onDateClick && onDateClick(date, dayEvents)}
            >
              <div
                className={`text-xs font-semibold mb-1 ${isToday(date) ? 'text-primary-700' : 'text-gray-700'}`}
              >
                {date.getDate()}
              </div>
              <div className="flex flex-col gap-1 w-full">
                {dayEvents.map((event, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${eventTypeStyle[event.type]} mb-0.5`}
                    title={event.label}
                  >
                    <span className={`w-2 h-2 rounded-full mr-1 ${eventTypeDot[event.type]}`} />
                    {event.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CandidateEventsCalendar;
