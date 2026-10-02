const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');
const { clearCache, CACHE_TTL } = require('../middleware/cacheMiddleware');

const server = app.listen(0);
const { port } = server.address();

const baseUrl = `http://127.0.0.1:${port}`;

test('GET / returns the app HTML', async () => {
  const response = await fetch(baseUrl);
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.match(text, /API Client/i);
});

test('GET /products returns seeded data', async () => {
  const response = await fetch(`${baseUrl}/products`);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-cache'), 'MISS');
  assert.ok(Array.isArray(json));
  assert.equal(json[0].name, 'Keyboard');
});

test('GET responses are cached until a product changes', async () => {
  const cachedResponse = await fetch(`${baseUrl}/products`);
  assert.equal(cachedResponse.headers.get('x-cache'), 'HIT');

  const createdResponse = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test product', price: 10 })
  });
  const createdProduct = await createdResponse.json();
  assert.equal(createdResponse.status, 201);

  const refreshedList = await fetch(`${baseUrl}/products`);
  assert.equal(refreshedList.headers.get('x-cache'), 'MISS');
  assert.ok((await refreshedList.json()).some((product) => product.id === createdProduct.id));

  const firstProductRead = await fetch(`${baseUrl}/products/${createdProduct.id}`);
  assert.equal(firstProductRead.headers.get('x-cache'), 'MISS');
  const cachedProductRead = await fetch(`${baseUrl}/products/${createdProduct.id}`);
  assert.equal(cachedProductRead.headers.get('x-cache'), 'HIT');

  const patchedResponse = await fetch(`${baseUrl}/products/${createdProduct.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price: 12 })
  });
  assert.equal(patchedResponse.status, 200);

  const updatedProduct = await fetch(`${baseUrl}/products/${createdProduct.id}`);
  assert.equal(updatedProduct.headers.get('x-cache'), 'MISS');
  assert.equal((await updatedProduct.json()).price, 12);

  const replacedResponse = await fetch(`${baseUrl}/products/${createdProduct.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Replacement', price: 15 })
  });
  assert.equal(replacedResponse.status, 200);

  const replacedProduct = await fetch(`${baseUrl}/products/${createdProduct.id}`);
  assert.equal(replacedProduct.headers.get('x-cache'), 'MISS');
  assert.deepEqual(await replacedProduct.json(), {
    name: 'Replacement',
    price: 15,
    id: createdProduct.id
  });

  const deletedResponse = await fetch(`${baseUrl}/products/${createdProduct.id}`, { method: 'DELETE' });
  assert.equal(deletedResponse.status, 200);

  const missingProduct = await fetch(`${baseUrl}/products/${createdProduct.id}`);
  assert.equal(missingProduct.status, 404);
  assert.equal(missingProduct.headers.get('x-cache'), 'MISS');
});

test('cached responses expire after one minute', async () => {
  clearCache();
  const realNow = Date.now;
  let currentTime = realNow();
  Date.now = () => currentTime;

  try {
    const firstResponse = await fetch(`${baseUrl}/products`);
    assert.equal(firstResponse.headers.get('x-cache'), 'MISS');

    const cachedResponse = await fetch(`${baseUrl}/products`);
    assert.equal(cachedResponse.headers.get('x-cache'), 'HIT');

    currentTime += CACHE_TTL;
    const expiredResponse = await fetch(`${baseUrl}/products`);
    assert.equal(expiredResponse.headers.get('x-cache'), 'MISS');
    assert.equal(CACHE_TTL, 60_000);
  } finally {
    Date.now = realNow;
    clearCache();
  }
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
