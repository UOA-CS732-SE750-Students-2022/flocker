import React from 'react';
import styles from './CalendarList.module.css';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';

type CalendarListProps = {
  calendars: Calendar[];
  initialSelectedCalendars: Calendar[];
  onUpdate: (calendars: Calendar[]) => void;
};

type Calendar = {
  name: string;
  id: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

const CalendarList: React.FC<CalendarListProps> = ({ calendars, onUpdate }) => {
  let selectedCalendars = calendars.filter((calendar) => {
    return calendar.enabled === true;
  });
  const [checked, setChecked] = React.useState<Calendar[]>();

  const handleToggle = (calendar: Calendar) => () => {
    selectedCalendars = [...(checked as Calendar[])];
    const currentIndex = checked?.indexOf(calendar);

    if (currentIndex === -1) {
      calendar.enabled = true;
      selectedCalendars.push(calendar);
    } else {
      calendar.enabled = false;
      selectedCalendars.splice(currentIndex as number, 1);
    }

    setChecked(selectedCalendars);
    onUpdate(calendars);
  };

  return (
    <List className={styles.calendarList}>
      {calendars.map((calendar) => {
        return (
          <ListItem key={calendar.id} disablePadding>
            <ListItemButton onClick={handleToggle(calendar)} dense>
              <ListItemIcon>
                <Checkbox
                  className={styles.checkbox}
                  edge="start"
                  checked={checked?.indexOf(calendar) !== -1}
                  tabIndex={-1}
                  disableRipple={true}
                  sx={{
                    '&.Mui-checked': {
                      color: 'white',
                    },
                  }}
                />
              </ListItemIcon>
              <ListItemText className={styles.calendarName} id={calendar.id + calendar.name} primary={calendar.name} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default CalendarList;
