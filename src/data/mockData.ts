export interface ContentItem {
  id: string;
  source: string;
  sourceIcon: 'description' | 'play_circle' | 'headphones';
  title: string;
  description: string;
  tags: string[];
  badge?: string;
  imageUrl?: string;
  isVideo?: boolean;
  isPodcast?: boolean;
  podcastMeta?: string;
  pullQuote?: string;
  tweetAuthor?: string;
  tweetHandle?: string;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  description: string;
  tags: string[];
  source: string;
  consumedAt: string;
  imageUrl?: string;
}

export interface ArchiveGroup {
  label: string;
  icon: string;
  entries: ArchiveEntry[];
  stats?: { timeInvested: string; itemCount: number };
}

export const libraryItems: ContentItem[] = [
  {
    id: '1',
    source: 'Medium',
    sourceIcon: 'description',
    title: 'The Architecture of Silence in Modern Living',
    description: 'Exploring how minimalist spatial design influences cognitive load and emotional well-being in high-density urban environments.',
    tags: ['Design', 'Architecture'],
    badge: '12 MIN READ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMFlMwVLnhtm0O6KeI0GNiiPU516u7mGUsPeI8vUoVoNsjZk7wu5HlW5LB0nquNeNK4idcedDkXeTQ2df7leFrPK1FMKwQgeuTrHDDchuBC58OUSTla4GNiXXIws-SpNbHCsJYsokSt0Pu2NPFxvFUYwdtCPfGpBV5aTqWHg4cHqlSt5YY_bxgR12PHMCaUyd3bvdJuohdQ-p3sPYmYqP1VHJK1lqzZ9thM3YLZYCKoJTwtfXrVP-4bBt7lVZ9sVuQVs6askaVess',
  },
  {
    id: '2',
    source: 'YouTube',
    sourceIcon: 'play_circle',
    title: 'A Journey Through the Scandinavian Wilderness',
    description: 'A visual essay documenting the changing seasons in Northern Norway and the resilience of local flora.',
    tags: ['Nature', 'Visual'],
    badge: '15:42',
    isVideo: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFfePTCsK98vZD027l9LnkRT63VH-ko1xf-M3txS06XIVonL8eKkq3Vx03RhygFcPZBWKzGE0v160Hl58EJDg8Lxq61ivzcpCM8UPgGcn0uKRQ6_trwCCoWtlN_8kEh2gQliIAy5lStJFxG4YBrp3yz-yqRLDbtHmALqaFaXF86G0rKS7JjXQ4YRmwnU_7X0Pd8lPPWPeLLiKSkEnmb6Mz1KL97oalfxPt2AikL-3OiIrZ5Avf_4SRnvb6vtJgCfC9gYi51z64gMM',
  },
  {
    id: '3',
    source: 'The New York Times',
    sourceIcon: 'headphones',
    title: "The Daily: Tech's Big Moment",
    description: '"Innovation is not just about what is new, but what is lasting. We look at the decade\'s biggest shifts."',
    tags: ['Technology', 'Economics'],
    isPodcast: true,
    podcastMeta: 'Season 4 • Ep. 112',
    pullQuote: '"Innovation is not just about what is new, but what is lasting. We look at the decade\'s biggest shifts."',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0ovwfcTJaMsELPaIe2g1j1J1YE-x3fAwsDhjwEkgkhpucSX8b8SW6_GYv9RUbn5AMCzDXKWUlWPt6-TFvGaIwEw3H3afqv9pLiFwd1u-nvvBSWVZvw39zrvVlIyNjRVuP8aDQora64J-rEizk4nUWW1ptRw2tnv6tuHS9nS7WYDDHoYiblylIxfNMuNha81akJUNrq882OqKtgf-NQ6g-iPdAvzQ-eLpe1JxeNLv3OHefts8d1aA153irKQAHfg4jmG6FNPBkMXA',
  },
  {
    id: '4',
    source: 'WSJ',
    sourceIcon: 'description',
    title: 'The Resurgence of Long-Form Journalism',
    description: 'Why readers are turning away from bite-sized content in favor of deep, investigative narratives.',
    tags: ['Media', 'Culture'],
    badge: '8 MIN READ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1tqyI8AsdoVKTz91aYEtL4rIa77RmwPAhPkSoqPDmQOSXgyX2eLE9DLRvfzNej_u4eqCXeomHuFxGEO_1HLbVQoP2awVgH2x_hzvqqRU2oToGAAdNLtZdiBWuShPLWsuiF0zsGGjTmZZ4vfZ8yJEO1a0zjX7HYqTMN-fQV7g8SmteC8yRkwiSgn04QCl93HNsPYQ3BWPucw1QuHoF90wc_vL5c70QYY0WAglnv3XVCkIxtXzqDzNgZ1aad2wLw5u-nEYBwIi5h2E',
  },
  {
    id: '5',
    source: 'Twitter',
    sourceIcon: 'description',
    title: '',
    description: '"The best curators don\'t just find things. They find the connections between things that shouldn\'t be together but are."',
    tags: ['Philosophy'],
    tweetAuthor: 'Naval',
    tweetHandle: '@naval',
    isPodcast: false,
  },
  {
    id: '6',
    source: 'The Atlantic',
    sourceIcon: 'play_circle',
    title: 'The Future of AI in Creative Industries',
    description: 'A deep dive into how generative models are reshaping the way creative professionals work.',
    tags: ['AI', 'Creativity'],
    badge: '30 MIN READ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2nL2vXFnSHRFbTDJ3_mGJW0i4MEbQN4X_3JkyVHzv_mWkDCVjg5E-oD9hjstq7KPRR-y7wPBvzVa4DZMT4x7EYMCi3W6s_YwvXl_fNS3zcr5Bk8axIJ1MHDHyvGa8oRqoAf_kYqxe-zMstLwkMiVxGFAhF2hImfqFV7CZuMKJj_7VFlMcxYnj8MNhJGUakVvgQRpMXizWGd-eDAbJF1dRvp0_OiWw0H7gG25Q8U0Iz_4c8FoZL_KiPT4Lf_oHNefanEqCJFYWk',
  },
  {
    id: '7',
    source: 'Vimeo',
    sourceIcon: 'play_circle',
    title: 'Abstract: The Art of Lighting',
    description: 'Documentary episode focusing on light designers and their philosophy of atmosphere creation.',
    tags: ['Cinema', 'Art'],
    badge: '41:10',
    isVideo: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUv6pFQBbT9cbMGTv9hCHflAbhWZH1Q4qxC4O_e4OP1_M5OVXbdqE6Zrj5q7w1v8FqBDLe0MerC5LHKGHnwcxj5Rb4uBjHGYAWxdF4c7qmMWlJuGMV5DPnLa6qomP0jCMkjKgAzYF3kCqTWB8vFAHkRuUCrCZ7TSKLIwi1BKqvzJLJRTi4RMJdxYy-RoxK5Z1bGSE2FGF6S8fZY1UzRHLYjHJHGZCMLlNxWh0sST2LTpKEt2F2u0kIY8L0NmRZHNOuGSCBi-2s',
  },
  {
    id: '8',
    source: 'Spotify',
    sourceIcon: 'headphones',
    title: 'HBR: Managing Your Creative Energy',
    description: 'Expert advice on avoiding burnout and structuring your day for sustained creative output.',
    tags: ['Business'],
    badge: '54 MIN',
  },
];

export const searchSuggestions = [
  { category: 'Architecture', title: 'The Brutalist Revival in Stockholm', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0NkpM6zB4_T1P7plB9TcZO8IpZ6hTw5VPU23yKyKArGzekyBng5DJHUw5aXsI-QpegcHU4dxgdQn13qtTRrcrOBgxpOPrR8X8iVn22GBK3imxlG8rbvedpiLu0GEKSqd-65ZxGetgS8-qhdJ9yG4T47dOib_gCZvCEm6EHBT1iBQ7grAwz4E6a213oTMNlSgt08X9YW8uB95E3gpxGmnNKtuzD5h9Go47uZKB9AYU7jMwKhDupH1nJP8iGxWpU0WlsT6UcfXTGOc' },
  { category: 'Literature', title: 'Recovering Lost Manuscripts', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmYYp8zZ4iu7TnikzZe0gBfJBQDRsREp7gfaYj_VnexMhCYOYZC-jxIQ8sRzsXpQysJcV7cLXAjv_euiUv9_0TnFFmmArSQV-gNY52_HaasqL2-f4XOz49a17LbW2UFPUjmS1W6AGwTaBkMNvj8r1QwDMECjvp_tQZQvQqYLtxo9bpp5Sr6ddjmDN722SWgwbEOcK1invPGrDYlcLIncY39tgXNEpGGW758G-xRk4husx6yWv-rFyvhJS3ssBo3rAWVFO_1s19CNc' },
];

export const trendingTags = ['#Existentialism', '#ModernArchitecture', '#Cybernetics', '#SlowLiving', '#MinimalistUI'];

export const recentSearches = ['Phenomenology of Space', 'Dieter Rams principles', 'Post-Humanism trends'];

export const searchResults = [
  {
    id: 's1',
    category: 'Design Philosophy',
    title: 'The Ethics of Quiet Spaces',
    description: 'How modern minimalism is evolving from a visual trend into a mental health imperative.',
    badge: '8 MIN READ',
    author: 'Elena Aris',
    authorInitials: 'EA',
    authorColor: 'bg-primary-fixed',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn7_DVLN17T_gDFjqx9lsO9zeKw62hqFCsRi6TOD222NRejzU31Su9cBMJ2jLyf8wjUhF1uiPlre4Kxhr-KxkSFXV-GQ-_N7_ck0SITwS1iFL4y4lBAcNmaOzu01p4UqPozSSmc-aUjnmiqy78FJdXNOBRQiP_ZG1cnzwtHVboDwKjExyJMgDt2H5SOrygL-K5bE1p7chKUAHuFtODp271QbprzQYr0jmlYPKcMZBrydr7nOCwgYUnjrQLDQ7zO4eskfrPgLJoPOM',
  },
  {
    id: 's2',
    category: 'Rituals',
    title: 'Sensory Memory and Aroma',
    description: 'A deep dive into how olfactory experiences shape our long-term cognitive recall.',
    badge: 'VIDEO',
    author: 'Julian Marc',
    authorInitials: 'JM',
    authorColor: 'bg-tertiary-fixed',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC6HYhgO-HPh2__a_aMHKQQlto-WDH-KW1PXQChBMm3lFvSQ4ovwWmyPS1ML-e_VHpWzJLj1fRT2rjZMhw87GtUJI_qJ624aNOv5cU69VtvfGxcDkNlw7w47JSkr_wcLvX1J74b4d1Pf4VGZmCt0vjnQIInaTd9PyKRMMuirc4sJVW26t0dCiIQ7_Rm1sdYYMgutroHX1DnoTz59zOByMSgoktupCmyS0JOFQcQ6KJ8injixIoLun3uhsv4ssmniaRksFShzk19OE',
  },
];

export const archiveGroups: ArchiveGroup[] = [
  {
    label: 'Today',
    icon: 'today',
    entries: [
      {
        id: 'a1',
        title: 'The Architecture of Silence: Modernist Retreats in the High Desert',
        description: 'A deep dive into how minimal physical structure enhances cognitive clarity...',
        tags: ['Architecture', 'The Atlantic'],
        consumedAt: 'CONSUMED AT 14:32',
        source: 'CONSUMED AT 14:32',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMFlMwVLnhtm0O6KeI0GNiiPU516u7mGUsPeI8vUoVoNsjZk7wu5HlW5LB0nquNeNK4idcedDkXeTQ2df7leFrPK1FMKwQgeuTrHDDchuBC58OUSTla4GNiXXIws-SpNbHCsJYsokSt0Pu2NPFxvFUYwdtCPfGpBV5aTqWHg4cHqlSt5YY_bxgR12PHMCaUyd3bvdJuohdQ-p3sPYmYqP1VHJK1lqzZ9thM3YLZYCKoJTwtfXrVP-4bBt7lVZ9sVuQVs6askaVess',
      },
      {
        id: 'a2',
        title: 'Morning Meditations: The Philosophy of Routine',
        description: 'How daily rituals shape the neural pathways of creative output over decades...',
        tags: ['Philosophy', 'Masterclass'],
        consumedAt: 'CONSUMED AT 08:15',
        source: 'CONSUMED AT 08:15',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmYYp8zZ4iu7TnikzZe0gBfJBQDRsREp7gfaYj_VnexMhCYOYZC-jxIQ8sRzsXpQysJcV7cLXAjv_euiUv9_0TnFFmmArSQV-gNY52_HaasqL2-f4XOz49a17LbW2UFPUjmS1W6AGwTaBkMNvj8r1QwDMECjvp_tQZQvQqYLtxo9bpp5Sr6ddjmDN722SWgwbEOcK1invPGrDYlcLIncY39tgXNEpGGW758G-xRk4husx6yWv-rFyvhJS3ssBo3rAWVFO_1s19CNc',
      },
    ],
  },
  {
    label: 'Yesterday',
    icon: 'history',
    entries: [
      {
        id: 'a3',
        title: 'The Digital Curator: AI in Modern Museums',
        description: 'Exploring the intersection of generative algorithms and classical aesthetics...',
        tags: ['Technology', 'YouTube Premium'],
        consumedAt: 'CONSUMED AT 21:47',
        source: 'CONSUMED AT 21:47',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn7_DVLN17T_gDFjqx9lsO9zeKw62hqFCsRi6TOD222NRejzU31Su9cBMJ2jLyf8wjUhF1uiPlre4Kxhr-KxkSFXV-GQ-_N7_ck0SITwS1iFL4y4lBAcNmaOzu01p4UqPozSSmc-aUjnmiqy78FJdXNOBRQiP_ZG1cnzwtHVboDwKjExyJMgDt2H5SOrygL-K5bE1p7chKUAHuFtODp271QbprzQYr0jmlYPKcMZBrydr7nOCwgYUnjrQLDQ7zO4eskfrPgLJoPOM',
      },
    ],
  },
  {
    label: 'Last Week',
    icon: 'date_range',
    entries: [],
    stats: { timeInvested: '24h 42m', itemCount: 18 },
  },
];

export const contentPreviewArticle = {
  title: 'The Quietude of Modern Minimalism: A Study in Spatial Silence',
  label: 'Article Preview',
  author: 'Julian Vance',
  publication: 'TheAtlantic.com',
  publishedDate: 'Oct 24, 2023',
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0NkpM6zB4_T1P7plB9TcZO8IpZ6hTw5VPU23yKyKArGzekyBng5DJHUw5aXsI-QpegcHU4dxgdQn13qtTRrcrOBgxpOPrR8X8iVn22GBK3imxlG8rbvedpiLu0GEKSqd-65ZxGetgS8-qhdJ9yG4T47dOib_gCZvCEm6EHBT1iBQ7grAwz4E6a213oTMNlSgt08X9YW8uB95E3gpxGmnNKtuzD5h9Go47uZKB9AYU7jMwKhDupH1nJP8iGxWpU0WlsT6UcfXTGOc',
  pullQuote: '"In an era defined by the persistent noise of digital connectivity, the architectural movement towards \'Spatial Silence\' offers a radical sanctuary for the modern mind."',
  body: "Minimalism is often misunderstood as an aesthetic of lack. In reality, it is a philosophy of intentionality. By removing the non-essential, we don't just create empty space; we curate the quality of the remaining atmosphere. This editorial explores how the materials of stone, light, and wood are being used to reclaim the domestic interior as a place of profound cognitive restoration.",
  tags: ['Minimalism', 'Wellness', 'Theory'],
  collection: 'Architecture & Design',
  wordCount: '~1,450 words',
  readTime: '7 MIN READ',
  savedDaysAgo: 'Saved 2 days ago',
  externalLink: 'Open on The Atlantic',
};
