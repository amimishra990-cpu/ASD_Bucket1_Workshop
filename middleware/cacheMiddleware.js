const cache = new Map();
const CACHE_TTL = 60 * 1000;

function cacheGet(req, res, next) {
  const key = req.originalUrl;
  const cachedEntry = cache.get(key);

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedEntry.data);
  }

  cache.delete(key);
  res.set('X-Cache', 'MISS');

  const sendJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
    }

    return sendJson(data);
  };

  next();
}

function clearCache() {
  cache.clear();
}

module.exports = { cacheGet, clearCache, CACHE_TTL };