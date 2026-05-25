const axios = require('axios');

class Geocoder {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cache = new Map();
  }

  async geocode(parts) {
    const address = [
      parts.street,
      parts.suburb,
      parts.city,
      parts.state,
      parts.postCode,
      parts.country,
    ]
      .filter(Boolean)
      .join(', ');

    if (!address.trim()) return null;
    if (this.cache.has(address)) return this.cache.get(address);

    try {
      const { data } = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        { params: { address, key: this.apiKey } }
      );

      if (data.status === 'OK' && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        const result = { lat: loc.lat, lng: loc.lng };
        this.cache.set(address, result);
        return result;
      }

      console.warn(`Geocoding returned ${data.status} for: ${address}`);
      return null;
    } catch (err) {
      console.warn(`Geocoding failed: ${err.message}`);
      return null;
    }
  }
}

module.exports = Geocoder;
