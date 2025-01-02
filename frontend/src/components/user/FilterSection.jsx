import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Box 
} from '@mui/material';

export const FilterSection = ({ filters, onFilterChange, environments }) => {
  // Color mapping for environments
  const environmentColors = {
    1: '#4CAF50',
    2: '#2196F3',
    3: '#9C27B0',
    4: '#FF9800',
    5: '#E91E63',
    6: '#00BCD4',
    7: '#FF5722',
    8: '#8BC34A'
  };

  return (
    <FormControl 
      size="small" 
      sx={{ 
        minWidth: 200,
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }
        }
      }}
    >
      <InputLabel>Select Environment</InputLabel>
      <Select
        value={filters.environment}
        onChange={(e) => onFilterChange({ environment: e.target.value })}
        label="Select Environment"
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
        renderValue={(selected) => {
          if (selected === 'all') return 'All Environments';
          const env = environments.find(e => e.environment_id === selected);
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              height: '100%'
            }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: environmentColors[env.environment_id],
                  flexShrink: 0
                }}
              />
              {env?.name}
            </Box>
          );
        }}
      >
        <MenuItem value="all">All Environments</MenuItem>
        {environments
          .filter(env => env.type === 'pilot')
          .map((env) => (
            <MenuItem 
              key={env.environment_id} 
              value={env.environment_id}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                width: '100%'
              }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: environmentColors[env.environment_id],
                    flexShrink: 0
                  }}
                />
                <span>{env.name}</span>
              </Box>
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};