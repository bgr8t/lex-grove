import fs from 'fs';
import path from 'path';

// This is a placeholder for your data fetching logic.
// In a real-world scenario, you would initialize firebase-admin here
// and fetch all public-facing, published content.
const fetchAllPublicUrls = async () => {
  // Example dynamic URLs. Replace with actual data fetching.
  const dynamicArticleSlugs = ['understanding-torts', 'the-rule-of-law'];
  const dynamicJobIds = ['123-software-engineer', '456-legal-intern'];
  const dynamicBriefIds = ['abc-case-brief', 'def-another-brief'];

  const articleUrls = dynamicArticleSlugs.map(slug => `/agora/article/${slug}`);
  const jobUrls = dynamicJobIds.map(id => `/akazi/job/${id}`);
  const briefUrls = dynamicBriefIds.map(id => `/case-brief/${id}`);

  return [...articleUrls, ...jobUrls, ...briefUrls];
};

const SITE_URL = 'https://www.lexgrove.com';

async function generateSitemap() {
  console.log('Generating sitemap...');

  const staticPages = [
    '/',
    '/library',
    '/agora',
    '/akazi',
    '/about',
    '/login',
    '/register',
    '/contribute',
  ].map(p => `${SITE_URL}${p}`);

  const dynamicPages = (await fetchAllPublicUrls()).map(p => `${SITE_URL}${p}`);
  
  const allUrls = [...staticPages, ...dynamicPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls.map(url => `
    <url>
      <loc>${url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`).join('')}
</urlset>`;

  const publicPath = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath);
  }

  fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), sitemap);
  console.log('sitemap.xml generated successfully in public directory.');
}

generateSitemap().catch(err => {
  console.error('Error generating sitemap:', err);
  process.exit(1);
}); 