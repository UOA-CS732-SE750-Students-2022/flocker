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
  intialSelectedCalendars: Calendar[];
  getSelectedCalendars: (calendars: Calendar[]) => void;
};

type Calendar = {
  name: string;
  id: string;
};

const CalendarList: React.FC<CalendarListProps> = ({ calendars, intialSelectedCalendars, getSelectedCalendars }) => {
  const [checked, setChecked] = React.useState<Calendar[]>(intialSelectedCalendars);
  let selectedCalendars = intialSelectedCalendars;

  const handleToggle = (calendar: Calendar) => () => {
    selectedCalendars = [...checked];
    const currentIndex = checked.indexOf(calendar);

    if (currentIndex === -1) {
      selectedCalendars.push(calendar);
    } else {
      selectedCalendars.splice(currentIndex, 1);
    }

    setChecked(selectedCalendars);
    getSelectedCalendars(selectedCalendars);
  };

  return (
    <List>
      {calendars.map((calendar) => {
        return (
          <ListItem key={calendar.id} disablePadding>
            <ListItemButton onClick={handleToggle(calendar)} dense>
              <ListItemIcon>
                <Checkbox
                  className={styles.checkbox}
                  edge="start"
                  checked={checked.indexOf(calendar) !== -1}
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