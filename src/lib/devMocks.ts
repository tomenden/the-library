/**
 * Mock data for local UI testing without authentication.
 * Activated by setting VITE_SKIP_AUTH=true in .env.local.
 * Tree-shaken out of production builds when SKIP_AUTH is false.
 */
import type { Id } from "../../convex/_generated/dataModel";

export const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";

const id = <T extends string>(v: string) => v as Id<T>;
const DAY = 86_400_000;

export const MOCK_VIEWER = {
  name: "Tom Enden",
  email: "tom@example.com",
};

export const MOCK_TOPICS = [
  { _id: id<"topics">("t1"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Philosophy" },
  { _id: id<"topics">("t2"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Aesthetics" },
  { _id: id<"topics">("t3"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Architecture" },
  { _id: id<"topics">("t4"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Motivation" },
  { _id: id<"topics">("t5"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Technology" },
  { _id: id<"topics">("t6"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Science" },
  { _id: id<"topics">("t7"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Digital Art" },
  { _id: id<"topics">("t8"), _creationTime: Date.now(), userId: id<"users">("u1"), name: "Curation" },
];

export const MOCK_ITEMS = [
  {
    _id: id<"items">("i1"), _creationTime: Date.now() - 2 * DAY, userId: id<"users">("u1"),
    url: "https://aeon.co/essays/the-poetics-of-space", title: "The Poetics of Space: How Environment Shapes Thought",
    summary: "Exploring the fundamental relationship between the physical structures we inhabit and the inner architecture of our psyche, referencing Bachelard's seminal works through a modern digital lens.",
    contentType: "article" as const, sourceName: "Aeon Magazine", status: "saved" as const,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    topicIds: [id<"topics">("t1"), id<"topics">("t3")], isFavorite: true,
    notesList: ["Bachelard's idea of 'intimate immensity' is fascinating"],
  },
  {
    _id: id<"items">("i2"), _creationTime: Date.now() - 5 * DAY, userId: id<"users">("u1"),
    url: "https://nytimes.com/minimalism", title: "Minimalism as a Reactive Discipline",
    summary: "Why the reduction of sensory noise has become the ultimate luxury in a data-saturated world of constant stimulation.",
    contentType: "article" as const, sourceName: "New York Times", status: "saved" as const,
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    topicIds: [id<"topics">("t2")], isFavorite: false,
  },
  {
    _id: id<"items">("i3"), _creationTime: Date.now() - 7 * DAY, userId: id<"users">("u1"),
    url: "https://theparisreview.org/written-word", title: "The Weight of the Written Word",
    summary: "Revisiting the tactile nature of correspondence and its impact on human connection in an increasingly digital age.",
    contentType: "article" as const, sourceName: "The Paris Review", status: "saved" as const,
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    topicIds: [id<"topics">("t1")], isFavorite: false,
  },
  {
    _id: id<"items">("i4"), _creationTime: Date.now() - 10 * DAY, userId: id<"users">("u1"),
    url: "https://mitpress.mit.edu/generative-aesthetics", title: "Generative Aesthetics",
    summary: "How algorithmic art is reshaping our understanding of creativity, authorship, and the boundaries between human and machine expression.",
    contentType: "article" as const, sourceName: "MIT Press", status: "done" as const,
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    topicIds: [id<"topics">("t7")], isFavorite: false,
  },
  {
    _id: id<"items">("i5"), _creationTime: Date.now() - 14 * DAY, userId: id<"users">("u1"),
    url: "https://stripe.press/zen-of-code", title: "The Zen of Code",
    summary: "Finding clarity and flow state through the practice of deliberate programming and software craftsmanship.",
    contentType: "article" as const, sourceName: "Stripe Press", status: "done" as const,
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    topicIds: [id<"topics">("t5")], isFavorite: true,
  },
  {
    _id: id<"items">("i6"), _creationTime: Date.now() - 3 * DAY, userId: id<"users">("u1"),
    url: "https://youtube.com/watch?v=abc123", title: "The Architecture of Silence",
    summary: "A visual essay exploring how modern architects design contemplative spaces that resist the noise of urban life.",
    contentType: "video" as const, sourceName: "YouTube", status: "saved" as const,
    imageUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80",
    topicIds: [id<"topics">("t3"), id<"topics">("t2")], isFavorite: false,
  },
  {
    _id: id<"items">("i7"), _creationTime: Date.now() - 1 * DAY, userId: id<"users">("u1"),
    url: "https://hubermanlab.com/focus", title: "The Science of Focus and Deep Work",
    summary: "Dr. Andrew Huberman explains the neuroscience of attention, how to achieve sustained focus, and tools to optimize deep work sessions.",
    contentType: "podcast" as const, sourceName: "Huberman Lab", status: "saved" as const,
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
    topicIds: [id<"topics">("t6"), id<"topics">("t4")], isFavorite: true,
  },
  {
    _id: id<"items">("i8"), _creationTime: Date.now() - 20 * DAY, userId: id<"users">("u1"),
    url: "https://ribbonfarm.com/curation", title: "Against Curation as Performance",
    summary: "Why collecting for the sake of collecting defeats the purpose. A case for intentional, messy, personal archives over polished public displays.",
    contentType: "article" as const, sourceName: "Ribbonfarm", status: "done" as const,
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
    topicIds: [id<"topics">("t8")], isFavorite: false,
  },
];

/** Look up a single mock item by ID (for ContentPreview). */
export function getMockItem(itemId: string) {
  return MOCK_ITEMS.find((i) => i._id === itemId) ?? null;
}
