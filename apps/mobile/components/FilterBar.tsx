import { ScrollView, Pressable, Text } from 'react-native';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterBar({ options, selected, onSelect }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 py-2"
      contentContainerStyle={{ gap: 8 }}
    >
      <Pressable
        className={`px-3 py-1.5 rounded-full ${
          selected === null ? 'bg-purple-600' : 'bg-gray-100'
        }`}
        onPress={() => onSelect(null)}
      >
        <Text className={selected === null ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
          All
        </Text>
      </Pressable>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          className={`px-3 py-1.5 rounded-full ${
            selected === opt.value ? 'bg-purple-600' : 'bg-gray-100'
          }`}
          onPress={() => onSelect(selected === opt.value ? null : opt.value)}
        >
          <Text
            className={
              selected === opt.value ? 'text-white text-sm' : 'text-gray-700 text-sm'
            }
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
