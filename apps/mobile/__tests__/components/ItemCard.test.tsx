import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ItemCard } from '../../components/ItemCard';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('lucide-react-native', () => ({
  Heart: () => 'Heart',
  Archive: () => 'Archive',
}));

jest.mock('react-native-gesture-handler', () => ({
  Swipeable: ({ children }: any) => children,
}));

jest.mock('convex/react', () => ({
  useMutation: () => jest.fn(),
}));

const mockItem = {
  _id: '123' as any,
  _creationTime: Date.now(),
  userId: 'user1' as any,
  url: 'https://example.com/article',
  title: 'Test Article',
  summary: 'A test summary',
  contentType: 'article' as const,
  status: 'saved',
  isFavorite: false,
  imageUrl: null,
  sourceName: 'Example',
  topicIds: [],
  notes: null,
  notesList: null,
  enrichmentStatus: 'enriched' as const,
  embedding: null,
};

describe('ItemCard', () => {
  it('renders title and summary', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText('Test Article')).toBeTruthy();
    expect(screen.getByText('A test summary')).toBeTruthy();
  });

  it('shows content type badge', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText('article')).toBeTruthy();
  });

  it('falls back to URL when no title', () => {
    render(<ItemCard item={{ ...mockItem, title: undefined as any }} />);
    expect(screen.getByText('https://example.com/article')).toBeTruthy();
  });
});
