"use client";
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Tile from './Tile';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface CalendarProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
  label?: string;
}

const CalendarTile: React.FC<CalendarProps> = ({ size = '2x3', accent = 'secondary', opacity = 65, label = 'Calendar' }) => {
  const [value, onChange] = useState<Value>(new Date());

  return (
    <Tile size={size} accentType={accent} opacity={opacity} label={label}>
      <div className="w-full h-full flex flex-col items-center justify-center p-0 overflow-hidden calendar-container">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-tile-text opacity-80">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <Calendar 
          onChange={onChange} 
          value={value} 
          className="custom-calendar"
          locale="en-US"
          showNavigation={false}
        />
      </div>
      <style>{`
        .calendar-container .react-calendar {
          background: transparent;
          border: none;
          font-family: inherit;
          width: 100%;
          max-width: 180px;
          color: var(--tile-text);
        }
        .calendar-container .react-calendar__navigation {
          margin-bottom: 2px;
          display: flex;
          height: 20px;
        }
        .calendar-container .react-calendar__navigation button {
          color: var(--tile-text);
          min-width: 18px;
          background: none;
          font-size: 8px;
          padding: 0;
        }
        .calendar-container .react-calendar__navigation button:enabled:hover,
        .calendar-container .react-calendar__navigation button:enabled:focus {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .calendar-container .react-calendar__month-view__weekdays {
          font-size: 7px;
          text-transform: uppercase;
          font-weight: bold;
          color: var(--tile-text-muted);
          padding-bottom: 2px;
        }
        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 1px 0;
          display: flex;
          justify-content: center;
        }
        .calendar-container .react-calendar__month-view__days__day {
          color: var(--tile-text);
          font-size: 8px;
        }
        .calendar-container .react-calendar__tile {
          background: none;
          border-radius: 0px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .calendar-container .react-calendar__tile:enabled:hover,
        .calendar-container .react-calendar__tile:enabled:focus {
          background-color: rgba(0, 0, 0, 0.1);
        }
        .calendar-container .react-calendar__tile--now {
          background: rgba(0, 0, 0, 0.05);
          font-weight: bold;
        }
        .calendar-container .react-calendar__tile--active {
          background: var(--tile-text) !important;
          color: var(--background) !important;
          font-weight: bold;
        }
        .calendar-container .react-calendar__month-view__days__day--neighboringMonth {
          color: var(--tile-text-muted);
          opacity: 0.5;
        }
        .calendar-container .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
      `}</style>
    </Tile>
  );
};

export default CalendarTile;
