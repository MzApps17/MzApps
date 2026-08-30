export default function sitemap(){
  return [
    { url: 'https://mizoapps.in', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: 'https://mizoapps.in/marketplace', lastModified: new Date(), priority: 0.8 },
    { url: 'https://mizoapps.in/jobs', lastModified: new Date(), priority: 0.8 },
  ]
}
