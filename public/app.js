const methodSelect = document.getElementById('methodSelect');
const urlInput = document.getElementById('urlInput');
const sendButton = document.getElementById('sendButton');
const responseOutput = document.getElementById('responseOutput');
const statusValue = document.getElementById('statusValue');
const timeValue = document.getElementById('timeValue');
const sizeValue = document.getElementById('sizeValue');

function codeBlock(value) {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function renderResponse(data) {
  const status = data.status ?? 'Unknown';
  const statusText = data.statusText ?? 'Request';
  statusValue.textContent = `${status} ${statusText}`.trim();

  const responseBody = data.body ?? '';
  const output = typeof responseBody === 'string' ? responseBody : codeBlock(responseBody);
  responseOutput.textContent = output;

  const size = typeof responseBody === 'string' ? responseBody.length : JSON.stringify(responseBody ?? {}).length;
  sizeValue.textContent = formatBytes(size);
  timeValue.textContent = `${data.time ?? 0} ms`;
}

async function sendRequest() {
  const url = urlInput.value.trim();
  const method = methodSelect.value;

  if (!url) {
    responseOutput.textContent = 'Please enter a request URL.';
    statusValue.textContent = 'No URL';
    return;
  }

  const startedAt = performance.now();
  const payload = {
    url,
    method,
    headers: {},
    body: method === 'GET' || method === 'DELETE' ? '' : '{\n  "message": "Hello from the client"\n}'
  };

  try {
    const response = await fetch('/api/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const elapsed = Math.round(performance.now() - startedAt);
    renderResponse({ ...data, time: elapsed });
  } catch (error) {
    responseOutput.textContent = `Request failed: ${error.message}`;
    statusValue.textContent = 'Error';
    timeValue.textContent = '0 ms';
    sizeValue.textContent = '0 B';
  }
}

sendButton.addEventListener('click', sendRequest);
urlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendRequest();
  }
});

const defaultResponse = {
  status: 200,
  statusText: 'OK',
  time: 2,
  body: {
    message: 'The API client is ready. Click Send to fetch a response.'
  }
};
renderResponse(defaultResponse);
