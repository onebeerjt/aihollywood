import FeedClient from "./components/FeedClient";

type FeedArticle = {
  id: string;
  title: string;
  year: number;
  source: string;
  summary: string;
  publishedAt?: string;
  url?: string;
};

type GNewsArticle = {
  title: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  url?: string;
  source?: { name?: string };
};

type GNewsResponse = {
  articles?: GNewsArticle[];
};

type GuardianResponse = {
  response?: {
    results?: Array<{
      id: string;
      webTitle: string;
      webUrl: string;
      webPublicationDate?: string;
      sectionName?: string;
      fields?: {
        trailText?: string;
        bodyText?: string;
      };
    }>;
  };
};

type LocResponse = {
  items?: Array<{
    title?: string;
    date?: string;
    id?: string;
    url?: string;
    snippet?: string;
    subject?: string[];
  }>;
};

const fallbackArticles: FeedArticle[] = [
  {
    id: "fallback-1",
    title: "Studio Backlots Open to the Public",
    year: 1991,
    source: "Hollywood Gazette",
    summary:
      "A summer initiative invites residents behind the scenes, turning iconic sound stages into open-air exhibits and reviving interest in practical sets.",
    url: "https://example.com/hollywood-gazette"
  },
  {
    id: "fallback-2",
    title: "A New Age of Movie Palaces",
    year: 2004,
    source: "West Coast Chronicle",
    summary:
      "Historic theaters reopen with restored marquees and live orchestras, anchoring neighborhood nights with a grand, old-world glow.",
    url: "https://example.com/west-coast-chronicle"
  },
  {
    id: "fallback-3",
    title: "Writers Find a Home in Silver Lake",
    year: 2012,
    source: "City Arts Journal",
    summary:
      "A once-quiet district becomes a hub for screenwriters, cafes, and public readings, shaping a new creative corridor in the city.",
    url: "https://example.com/city-arts-journal"
  },
  {
    id: "fallback-4",
    title: "Neon Marquees Return to Sunset",
    year: 1984,
    source: "Pacific Evening",
    summary:
      "A preservation effort revives the glow of classic theater signs, restoring a corridor once nicknamed the electric boulevard.",
    url: "https://example.com/pacific-evening"
  },
  {
    id: "fallback-5",
    title: "Costume Vault Opens for a One-Night Exhibit",
    year: 1976,
    source: "Studio Ledger",
    summary:
      "An archive of hand-stitched gowns, capes, and uniforms is displayed for the public, honoring generations of craftspeople.",
    url: "https://example.com/studio-ledger"
  },
  {
    id: "fallback-6",
    title: "The Quiet Art of Foley Comes Back in Style",
    year: 1999,
    source: "Soundstage Review",
    summary:
      "Younger filmmakers embrace analog sound effects again, with workshops filling up for hands-on sessions.",
    url: "https://example.com/soundstage-review"
  },
  {
    id: "fallback-7",
    title: "A Modern Ode to the Studio System",
    year: 2001,
    source: "Cinema Weekly",
    summary:
      "A new production slate mimics the golden age model, bundling talent into ensembles that rotate across films.",
    url: "https://example.com/cinema-weekly"
  },
  {
    id: "fallback-8",
    title: "Griffith Park Hosts Outdoor Scoring Night",
    year: 2016,
    source: "LA Arts Wire",
    summary:
      "Composers perform a live score beneath the stars as classic scenes play on a hillside screen.",
    url: "https://example.com/la-arts-wire"
  },
  {
    id: "fallback-9",
    title: "Indie Cinemas Add Private Listening Lounges",
    year: 2020,
    source: "Indie Screen",
    summary:
      "Boutique theaters introduce headphone lounges and curated playlists to extend the screening experience.",
    url: "https://example.com/indie-screen"
  },
  {
    id: "fallback-10",
    title: "The Stunt School That Trains the Next Wave",
    year: 2008,
    source: "Action Journal",
    summary:
      "A dedicated academy expands its program, teaching safe wire work and practical set choreography.",
    url: "https://example.com/action-journal"
  },
  {
    id: "fallback-11",
    title: "Restoring Hollywood’s Lost Backlot Streets",
    year: 1995,
    source: "Production Today",
    summary:
      "A reconstruction project revives a classic city block set, focusing on period-correct signage and lighting.",
    url: "https://example.com/production-today"
  },
  {
    id: "fallback-12",
    title: "New Wave Directors Revisit Studio Epics",
    year: 2010,
    source: "Film Quarterly",
    summary:
      "A generation of directors retools the studio epic format with smaller casts and more intimate pacing.",
    url: "https://example.com/film-quarterly"
  },
  {
    id: "fallback-13",
    title: "A Revival of Hand-Painted Movie Posters",
    year: 1989,
    source: "Art Deco Press",
    summary:
      "Illustrators return to brushwork and ink textures, bringing gallery-quality posters to boutique screenings.",
    url: "https://example.com/art-deco-press"
  }
];

function trimSummary(text: string, limit = 900) {
  if (text.length <= limit) {
    return text;
  }
  const clipped = text.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : limit)}…`;
}

function stripHtml(text?: string) {
  if (!text) {
    return "";
  }
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url?: string) {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).toString();
  } catch {
    return undefined;
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function articleKey(article: FeedArticle) {
  const title = article.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(has|have|with|and|for|from|the|a|an|of|in|to|on)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${title}|${article.year}`;
}

function uniqArticles(items: FeedArticle[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = articleKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function fetchGNews(apiKey: string): Promise<FeedArticle[]> {
  const baseParams = {
    lang: "en",
    country: "us",
    max: "25",
    sortby: "publishedAt",
    in: "title,description",
    apikey: apiKey
  };

  const queries = [
    "hollywood OR film OR movie OR cinema",
    "classic hollywood OR golden age film OR studio era",
    "academy awards OR oscar OR hollywood premiere"
  ];

  const responses = await Promise.all(
    queries.map(async (query) => {
      const params = new URLSearchParams({
        ...baseParams,
        q: query,
        from: "1960-01-01T00:00:00Z"
      });

      const response = await fetch(`https://gnews.io/api/v4/search?${params}`, {
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        return [] as GNewsArticle[];
      }

      const data = (await response.json()) as GNewsResponse;
      return data.articles ?? [];
    })
  );

  return responses
    .flat()
    .map((article, index) => {
      const publishedAt = article.publishedAt;
      const year = publishedAt ? new Date(publishedAt).getFullYear() : new Date().getFullYear();
      const summary = trimSummary(
        stripHtml(`${article.content ?? ""} ${article.description ?? ""}`).replace(
          /\s*\[\+\d+\s+chars\]\s*$/i,
          ""
        )
      );

      return {
        id: `gnews-${slugify(article.title)}-${year}-${index}`,
        title: article.title,
        year,
        source: article.source?.name ?? "GNews",
        summary: summary || "No summary available.",
        publishedAt,
        url: normalizeUrl(article.url)
      } satisfies FeedArticle;
    })
    .filter((article) => article.title && article.summary);
}

async function fetchGuardian(apiKey?: string): Promise<FeedArticle[]> {
  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    "api-key": apiKey,
    q: "hollywood OR cinema",
    "section": "film",
    "page-size": "50",
    "show-fields": "trailText,bodyText",
    "from-date": "2000-01-01",
    "order-by": "newest"
  });

  const response = await fetch(`https://content.guardianapis.com/search?${params}`, {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as GuardianResponse;
  const results = data.response?.results ?? [];

  return results
    .map((item, index) => {
      const year = item.webPublicationDate
        ? new Date(item.webPublicationDate).getFullYear()
        : new Date().getFullYear();
      const summary = trimSummary(
        stripHtml(`${item.fields?.trailText ?? ""} ${item.fields?.bodyText ?? ""}`)
      );

      return {
        id: `guardian-${item.id}-${index}`,
        title: item.webTitle,
        year,
        source: "The Guardian",
        summary: summary || "No summary available.",
        publishedAt: item.webPublicationDate,
        url: normalizeUrl(item.webUrl)
      } satisfies FeedArticle;
    })
    .filter((article) => article.title && article.summary);
}

async function fetchLocArchive(): Promise<FeedArticle[]> {
  const decades = [1920, 1930, 1940, 1950, 1960, 1970];

  const responses = await Promise.all(
    decades.map(async (startYear) => {
      const endYear = startYear + 9;
      const params = new URLSearchParams({
        andtext: "hollywood",
        format: "json",
        page: "1",
        dateFilterType: "yearRange",
        date1: String(startYear),
        date2: String(endYear)
      });

      const response = await fetch(
        `https://chroniclingamerica.loc.gov/search/pages/results/?${params}`,
        { next: { revalidate: 86400 } }
      );

      if (!response.ok) {
        return [] as FeedArticle[];
      }

      const data = (await response.json()) as LocResponse;
      return (data.items ?? []).slice(0, 8).map((item, index) => {
        const year = item.date ? Number(item.date.slice(0, 4)) : startYear;
        const title = item.title?.trim() || `Hollywood Archive Clipping ${startYear}s`;
        const summary = trimSummary(
          stripHtml(item.snippet) ||
            `Library of Congress clipping from the ${startYear}s referencing Hollywood productions, performers, or studio-era coverage.`
        );

        return {
          id: `loc-${startYear}-${index}-${slugify(title)}`,
          title,
          year,
          source: "Library of Congress",
          summary,
          publishedAt: item.date,
          url: normalizeUrl(item.url ?? item.id)
        } satisfies FeedArticle;
      });
    })
  );

  return responses.flat();
}

function ensureMinimumPool(primary: FeedArticle[], minCount = 30) {
  const unique = uniqArticles(primary);
  if (unique.length >= minCount) {
    return unique;
  }

  const fill = uniqArticles([...unique, ...shuffle(fallbackArticles)]);
  return fill.slice(0, Math.max(minCount, fill.length));
}

async function getArticles() {
  const gnewsKey = process.env.GNEWS_API_KEY;
  const guardianKey = process.env.GUARDIAN_API_KEY;

  try {
    const [gnews, guardian, loc] = await Promise.all([
      gnewsKey ? fetchGNews(gnewsKey) : Promise.resolve([]),
      fetchGuardian(guardianKey),
      fetchLocArchive()
    ]);

    const merged = uniqArticles([...gnews, ...guardian, ...loc]);
    if (merged.length === 0) {
      return ensureMinimumPool(fallbackArticles);
    }

    return ensureMinimumPool(merged);
  } catch {
    return ensureMinimumPool(fallbackArticles);
  }
}

export default async function Home() {
  const articles = await getArticles();
  return <FeedClient articles={articles} />;
}
