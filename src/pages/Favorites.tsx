import FilteredItems from "./FilteredItems";

export default function Favorites() {
  return (
    <FilteredItems
      title="Favorites"
      subtitle="Saved"
      filter={{ isFavorite: true }}
    />
  );
}
