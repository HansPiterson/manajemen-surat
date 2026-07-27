const clients = new Map();

export function addClient(id, res) {
  clients.set(id, res);
}

export function removeClient(id) {
  clients.delete(id);
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, res] of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(id);
    }
  }
}
