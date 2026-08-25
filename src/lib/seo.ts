/**
 * JSON-LD builders. Each returns a plain object to be serialised into a
 * `<script type="application/ld+json">` — `SeoHead.astro` does that for you via
 * its `schemas` prop.
 *
 * These are builders rather than components so a page can compose several
 * (Organization + Article + FAQPage) and so the shapes stay unit-testable.
 */

export interface PostalAddress {
  streetAddress: string;
  postalCode: string;
  addressLocality: string;
  /** ISO 3166-1 alpha-2, e.g. 'DE'. */
  addressCountry: string;
}

export interface OrganizationInput {
  /** Public brand name. */
  name: string;
  /** Registered entity, if it differs from the brand. */
  legalName?: string;
  url: string;
  description?: string;
  address?: PostalAddress;
  /** Country name the service is offered in, e.g. 'Deutschland'. */
  areaServed?: string;
  logo?: string;
}

export function organizationSchema(input: OrganizationInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    ...(input.legalName && { legalName: input.legalName }),
    url: input.url,
    ...(input.description && { description: input.description }),
    ...(input.logo && { logo: input.logo }),
    ...(input.address && { address: { '@type': 'PostalAddress', ...input.address } }),
    ...(input.areaServed && {
      areaServed: { '@type': 'Country', name: input.areaServed },
    }),
  };
}

export interface ArticleInput {
  headline: string;
  description: string;
  /** Canonical URL of the article. */
  url: string;
  /** ISO date. */
  datePublished?: string;
  /** ISO date. */
  dateModified?: string;
  /** Publisher/author name — usually the site brand. */
  publisher: string;
  section?: string;
  image?: string;
}

export function articleSchema(input: ArticleInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    ...(input.datePublished && { datePublished: input.datePublished }),
    ...(input.dateModified && { dateModified: input.dateModified }),
    ...(input.section && { articleSection: input.section }),
    ...(input.image && { image: input.image }),
    author: { '@type': 'Organization', name: input.publisher },
    publisher: { '@type': 'Organization', name: input.publisher },
  };
}

/**
 * Google only renders FAQ rich results when the answers are genuinely on the
 * page. Pass the same Q&A pairs you actually render, never a separate set.
 */
export function faqSchema(entries: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
