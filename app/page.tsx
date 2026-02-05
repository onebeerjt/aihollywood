import FeedClient from "./components/FeedClient";

type GNewsArticle = {
  title: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  url?: string;
  source?: { name?: string };
};

type GNewsResponse = {
  articles: GNewsArticle[];
};

type FeedArticle = {
  title: string;
  year: number;
  source: string;
  summary: string;
  publishedAt?: string;
  url?: string;
};

function trimSummary(text: string, limit = 1200) {
  if (text.length <= limit) {
    return text;
  }
  const clipped = text.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : limit)}…`;
}

function buildSummary(article: GNewsArticle) {
  const raw = [article.content, article.description]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = raw.replace(/\s*\[\+\d+\s+chars\]\s*$/i, "");
  return cleaned ? trimSummary(cleaned) : "No summary available yet.";
}

function normalizeUrl(url?: string) {
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return undefined;
  }
}

const fallbackArticles: FeedArticle[] = [
  {
    title: "Studio Backlots Open to the Public",
    year: 1991,
    source: "Hollywood Gazette",
    summary:
      "A summer initiative invites residents behind the scenes, turning iconic sound stages into open-air exhibits and reviving interest in practical sets.",
    url: "https://example.com/hollywood-gazette",
    publishedAt: undefined
  },
  {
    title: "A New Age of Movie Palaces",
    year: 2004,
    source: "West Coast Chronicle",
    summary:
      "Historic theaters reopen with restored marquees and live orchestras, anchoring neighborhood nights with a grand, old-world glow.",
    url: "https://example.com/west-coast-chronicle",
    publishedAt: undefined
  },
  {
    title: "Writers Find a Home in Silver Lake",
    year: 2012,
    source: "City Arts Journal",
    summary:
      "A once-quiet district becomes a hub for screenwriters, cafes, and public readings, shaping a new creative corridor in the city.",
    url: "https://example.com/city-arts-journal",
    publishedAt: undefined
  },
  {
    title: "Neon Marquees Return to Sunset",
    year: 1984,
    source: "Pacific Evening",
    summary:
      "A preservation effort revives the glow of classic theater signs, restoring a corridor once nicknamed the electric boulevard.",
    url: "https://example.com/pacific-evening",
    publishedAt: undefined
  },
  {
    title: "Costume Vault Opens for a One-Night Exhibit",
    year: 1976,
    source: "Studio Ledger",
    summary:
      "An archive of hand-stitched gowns, capes, and uniforms is displayed for the public, honoring generations of craftspeople.",
    url: "https://example.com/studio-ledger",
    publishedAt: undefined
  },
  {
    title: "The Quiet Art of Foley Comes Back in Style",
    year: 1999,
    source: "Soundstage Review",
    summary:
      "Younger filmmakers embrace analog sound effects again, with workshops filling up for hands-on sessions.",
    url: "https://example.com/soundstage-review",
    publishedAt: undefined
  },
  {
    title: "A Modern Ode to the Studio System",
    year: 2001,
    source: "Cinema Weekly",
    summary:
      "A new production slate mimics the golden age model, bundling talent into ensembles that rotate across films.",
    url: "https://example.com/cinema-weekly",
    publishedAt: undefined
  },
  {
    title: "Griffith Park Hosts Outdoor Scoring Night",
    year: 2016,
    source: "LA Arts Wire",
    summary:
      "Composers perform a live score beneath the stars as classic scenes play on a hillside screen.",
    url: "https://example.com/la-arts-wire",
    publishedAt: undefined
  },
  {
    title: "Indie Cinemas Add Private Listening Lounges",
    year: 2020,
    source: "Indie Screen",
    summary:
      "Boutique theaters introduce headphone lounges and curated playlists to extend the screening experience.",
    url: "https://example.com/indie-screen",
    publishedAt: undefined
  },
  {
    title: "The Stunt School That Trains the Next Wave",
    year: 2008,
    source: "Action Journal",
    summary:
      "A dedicated academy expands its program, teaching safe wire work and practical set choreography.",
    url: "https://example.com/action-journal",
    publishedAt: undefined
  },
  {
    title: "Restoring Hollywood’s Lost Backlot Streets",
    year: 1995,
    source: "Production Today",
    summary:
      "A reconstruction project revives a classic city block set, focusing on period-correct signage and lighting.",
    url: "https://example.com/production-today",
    publishedAt: undefined
  },
  {
    title: "New Wave Directors Revisit Studio Epics",
    year: 2010,
    source: "Film Quarterly",
    summary:
      "A generation of directors retools the studio epic format with smaller casts and more intimate pacing.",
    url: "https://example.com/film-quarterly",
    publishedAt: undefined
  },
  {
    title: "A Revival of Hand-Painted Movie Posters",
    year: 1989,
    source: "Art Deco Press",
    summary:
      "Illustrators return to brushwork and ink textures, bringing gallery-quality posters to boutique screenings.",
    url: "https://example.com/art-deco-press",
    publishedAt: undefined
  }
];

function mergeFallback<T extends { title: string; year: number }>(
  primary: T[],
  fallback: T[],
  minCount = 12
) {
  if (primary.length >= minCount) {
    return primary;
  }
  const seen = new Set(primary.map((item) => `${item.title}-${item.year}`));
  const merged = [...primary];
  for (const item of fallback) {
    const key = `${item.title}-${item.year}`;
    if (seen.has(key)) {
      continue;
    }
    merged.push(item);
    seen.add(key);
  }
  return merged;
}

function ensureMinStories(primary: FeedArticle[], minCount = 24) {
  const merged = mergeFallback(primary, fallbackArticles, minCount);
  if (merged.length >= minCount) {
    return merged;
  }

  const padded = [...merged];
  let i = 0;

  while (padded.length < minCount) {
    const base = fallbackArticles[i % fallbackArticles.length];
    const cut = Math.floor(i / fallbackArticles.length) + 1;
    padded.push({
      ...base,
      title: `${base.title} (Archive Cut ${cut})`,
      source: `${base.source} Archive`,
      year: Math.max(1950, base.year - cut),
      publishedAt: undefined,
      url: undefined
    });
    i += 1;
  }

  return padded;
}

async function getArticles() {
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    return ensureMinStories(fallbackArticles);
  }

  const baseParams = {
    lang: "en",
    country: "us",
    max: "20",
    sortby: "relevance",
    in: "title,description",
    apikey: apiKey
  };

  const queries = [
    "hollywood OR film OR movie OR cinema",
    "\"golden age\" hollywood OR classic hollywood",
    "\"1950s\" hollywood OR \"old hollywood\" OR \"film noir\"",
    "\"studio system\" OR \"classic cinema\" OR \"silver screen\"",
    "academy awards OR oscar winner OR red carpet"
  ];

  try {
    const responses = await Promise.all(
      queries.map(async (query) => {
        const params = new URLSearchParams({
          ...baseParams,
          q: query,
          from: "1950-01-01T00:00:00Z"
        });

        const response = await fetch(`https://gnews.io/api/v4/search?${params}`, {
          next: { revalidate: 60 }
        });

        if (!response.ok) {
          return [] as GNewsArticle[];
        }

        const data = (await response.json()) as GNewsResponse;
        return data.articles;
      })
    );

    const merged = responses.flat();
    if (merged.length === 0) {
      return ensureMinStories(fallbackArticles);
    }

    const seen = new Set<string>();

    const normalized: FeedArticle[] = merged
      .filter((article) => {
        const key = `${article.title}-${article.publishedAt}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((article) => {
        const publishedAt = article.publishedAt
          ? new Date(article.publishedAt)
          : null;
        const year = publishedAt
          ? publishedAt.getFullYear()
          : new Date().getFullYear();
        const summary = buildSummary(article);

        return {
          title: article.title,
          year,
          source: article.source?.name ?? "Unknown Source",
          summary,
          publishedAt: article.publishedAt,
          url: normalizeUrl(article.url)
        };
      });
    return ensureMinStories(normalized);
  } catch {
    return ensureMinStories(fallbackArticles);
  }
}

export default async function Home() {
  const articles = await getArticles();

  return <FeedClient articles={articles} />;
}
