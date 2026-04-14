/**
 * Mock data for local UI testing without authentication.
 * Activated by setting VITE_SKIP_AUTH=true in .env.local.
 * Tree-shaken out of production builds when SKIP_AUTH is false.
 */
import type { Id } from "@convex/_generated/dataModel";

export const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const id = (v: string) => v as Id<any>;
const DAY = 86_400_000;

export const MOCK_VIEWER = {
  name: "Tom Enden",
  email: "tom@example.com",
};

export const MOCK_TOPICS = [
  { _id: id("t1"), _creationTime: Date.now(), userId: id("u1"), name: "Philosophy" },
  { _id: id("t2"), _creationTime: Date.now(), userId: id("u1"), name: "Aesthetics" },
  { _id: id("t3"), _creationTime: Date.now(), userId: id("u1"), name: "Architecture" },
  { _id: id("t4"), _creationTime: Date.now(), userId: id("u1"), name: "Motivation" },
  { _id: id("t5"), _creationTime: Date.now(), userId: id("u1"), name: "Technology" },
  { _id: id("t6"), _creationTime: Date.now(), userId: id("u1"), name: "Science" },
  { _id: id("t7"), _creationTime: Date.now(), userId: id("u1"), name: "Digital Art" },
  { _id: id("t8"), _creationTime: Date.now(), userId: id("u1"), name: "Curation" },
];

// Base shape with all optional fields ContentPreview expects
interface MockItem {
  _id: Id<"items">; _creationTime: number; userId: Id<"users">;
  url: string; title: string; summary: string;
  contentType: "article" | "video" | "podcast" | "tweet" | "newsletter";
  sourceName: string; status: "saved" | "in_progress" | "done";
  imageUrl: string; topicIds: Id<"topics">[]; isFavorite: boolean;
  notes?: string; notesList?: string[]; enrichmentStatus?: "enriched" | "failed";
}

export const MOCK_ITEMS: MockItem[] = [
  {
    _id: id("i1"), _creationTime: Date.now() - 2 * DAY, userId: id("u1"),
    url: "https://aeon.co/essays/the-poetics-of-space", title: "The Poetics of Space: How Environment Shapes Thought",
    summary: "Exploring the fundamental relationship between the physical structures we inhabit and the inner architecture of our psyche, referencing Bachelard's seminal works through a modern digital lens.",
    contentType: "article", sourceName: "Aeon Magazine", status: "saved",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    topicIds: [id("t1"), id("t3")], isFavorite: true,
    notesList: ["Bachelard's idea of 'intimate immensity' is fascinating"], enrichmentStatus: "enriched",
  },
  {
    _id: id("i2"), _creationTime: Date.now() - 5 * DAY, userId: id("u1"),
    url: "https://nytimes.com/minimalism", title: "Minimalism as a Reactive Discipline",
    summary: "Why the reduction of sensory noise has become the ultimate luxury in a data-saturated world of constant stimulation.",
    contentType: "article", sourceName: "New York Times", status: "saved",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    topicIds: [id("t2")], isFavorite: false,
  },
  {
    _id: id("i3"), _creationTime: Date.now() - 7 * DAY, userId: id("u1"),
    url: "https://theparisreview.org/written-word", title: "The Weight of the Written Word",
    summary: "Revisiting the tactile nature of correspondence and its impact on human connection in an increasingly digital age.",
    contentType: "article", sourceName: "The Paris Review", status: "saved",
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    topicIds: [id("t1")], isFavorite: false,
  },
  {
    _id: id("i4"), _creationTime: Date.now() - 10 * DAY, userId: id("u1"),
    url: "https://mitpress.mit.edu/generative-aesthetics", title: "Generative Aesthetics",
    summary: "How algorithmic art is reshaping our understanding of creativity, authorship, and the boundaries between human and machine expression.",
    contentType: "article", sourceName: "MIT Press", status: "done",
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    topicIds: [id("t7")], isFavorite: false,
  },
  {
    _id: id("i5"), _creationTime: Date.now() - 14 * DAY, userId: id("u1"),
    url: "https://stripe.press/zen-of-code", title: "The Zen of Code",
    summary: "Finding clarity and flow state through the practice of deliberate programming and software craftsmanship.",
    contentType: "article", sourceName: "Stripe Press", status: "done",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    topicIds: [id("t5")], isFavorite: true,
  },
  {
    _id: id("i6"), _creationTime: Date.now() - 3 * DAY, userId: id("u1"),
    url: "https://youtube.com/watch?v=abc123", title: "The Architecture of Silence",
    summary: "A visual essay exploring how modern architects design contemplative spaces that resist the noise of urban life.",
    contentType: "video", sourceName: "YouTube", status: "saved",
    imageUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80",
    topicIds: [id("t3"), id("t2")], isFavorite: false,
  },
  {
    _id: id("i7"), _creationTime: Date.now() - 1 * DAY, userId: id("u1"),
    url: "https://hubermanlab.com/focus", title: "The Science of Focus and Deep Work",
    summary: "Dr. Andrew Huberman explains the neuroscience of attention, how to achieve sustained focus, and tools to optimize deep work sessions.",
    contentType: "podcast", sourceName: "Huberman Lab", status: "saved",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
    topicIds: [id("t6"), id("t4")], isFavorite: true,
  },
  {
    _id: id("i8"), _creationTime: Date.now() - 20 * DAY, userId: id("u1"),
    url: "https://ribbonfarm.com/curation", title: "Against Curation as Performance",
    summary: "Why collecting for the sake of collecting defeats the purpose. A case for intentional, messy, personal archives over polished public displays.",
    contentType: "article", sourceName: "Ribbonfarm", status: "done",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
    topicIds: [id("t8")], isFavorite: false,
  },
];

/** Look up a single mock item by ID (for ContentPreview). */
export function getMockItem(itemId: string) {
  return MOCK_ITEMS.find((i) => i._id === itemId) ?? null;
}
