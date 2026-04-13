import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FilterBar } from '../../components/FilterBar';

const options = [
  { label: 'Saved', value: 'saved' },
  { label: 'Done', value: 'done' },
];

describe('FilterBar', () => {
  it('renders all options plus All button', () => {
    render(<FilterBar options={options} selected={null} onSelect={jest.fn()} />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('calls onSelect when option tapped', () => {
    const onSelect = jest.fn();
    render(<FilterBar options={options} selected={null} onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Saved'));
    expect(onSelect).toHaveBeenCalledWith('saved');
  });

  it('calls onSelect with null when All tapped', () => {
    const onSelect = jest.fn();
    render(<FilterBar options={options} selected="saved" onSelect={onSelect} />);
    fireEvent.press(screen.getByText('All'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('deselects when tapping active option', () => {
    const onSelect = jest.fn();
    render(<FilterBar options={options} selected="saved" onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Saved'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
