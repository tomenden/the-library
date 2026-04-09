import FilteredItems from "./FilteredItems";

export default function UnreadItems() {
  return (
    <FilteredItems
      title="Unread"
      subtitle="Queue"
      filter={{ status: "saved" }}
    />
  );
}
