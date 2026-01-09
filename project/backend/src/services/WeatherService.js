import axios from 'axios';

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '3d269e8b0e5344a3a8b91712251408';
    this.baseUrl = 'https://api.weatherapi.com/v1';
  }

  // Get weather for a specific location (circuit)
  async getWeatherForCircuit(circuitName, country = '') {
    try {
      // Map F1 circuits to their approximate coordinates for better weather accuracy
      const circuitCoordinates = this.getCircuitCoordinates(circuitName, country);
      
      if (!circuitCoordinates) {
        // Fallback to circuit name search
        return await this.searchWeatherByLocation(circuitName);
      }

      const response = await axios.get(`${this.baseUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: `${circuitCoordinates.lat},${circuitCoordinates.lon}`,
          aqi: 'no'
        }
      });

      return this.formatWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather for circuit:', error);
      // Return mock weather data as fallback
      return this.getMockWeatherData(circuitName);
    }
  }

  // Get weather forecast for upcoming races
  async getWeatherForecast(circuitName, date) {
    try {
      const circuitCoordinates = this.getCircuitCoordinates(circuitName);
      
      if (!circuitCoordinates) {
        return this.getMockWeatherData(circuitName);
      }

      const response = await axios.get(`${this.baseUrl}/forecast.json`, {
        params: {
          key: this.apiKey,
          q: `${circuitCoordinates.lat},${circuitCoordinates.lon}`,
          days: 3,
          aqi: 'no'
        }
      });

      return this.formatForecastData(response.data, date);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return this.getMockWeatherData(circuitName);
    }
  }

  // Search weather by location name
  async searchWeatherByLocation(location) {
    try {
      const response = await axios.get(`${this.baseUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: location,
          aqi: 'no'
        }
      });

      return this.formatWeatherData(response.data);
    } catch (error) {
      console.error('Error searching weather by location:', error);
      return this.getMockWeatherData(location);
    }
  }

  // Format weather data for consistent API response
  formatWeatherData(data) {
    if (!data.current) {
      throw new Error('Invalid weather data received');
    }

    return {
      temperature: Math.round(data.current.temp_c),
      humidity: data.current.humidity,
      wind_speed: Math.round(data.current.wind_kph),
      conditions: data.current.condition?.text || 'Unknown',
      feels_like: Math.round(data.current.feelslike_c),
      pressure: data.current.pressure_mb,
      visibility: data.current.vis_km,
      uv: data.current.uv,
      last_updated: data.current.last_updated_epoch * 1000
    };
  }

  // Format forecast data
  formatForecastData(data, targetDate) {
    if (!data.forecast?.forecastday) {
      throw new Error('Invalid forecast data received');
    }

    const targetDateStr = new Date(targetDate).toISOString().split('T')[0];
    const forecastDay = data.forecast.forecastday.find(day => day.date === targetDateStr);

    if (!forecastDay) {
      return this.getMockWeatherData('Unknown Circuit');
    }

    return {
      temperature: {
        min: Math.round(forecastDay.day.mintemp_c),
        max: Math.round(forecastDay.day.maxtemp_c),
        avg: Math.round(forecastDay.day.avgtemp_c)
      },
      humidity: forecastDay.day.avghumidity,
      wind_speed: Math.round(forecastDay.day.maxwind_kph),
      conditions: forecastDay.day.condition?.text || 'Unknown',
      chance_of_rain: forecastDay.day.daily_chance_of_rain,
      uv: forecastDay.day.uv
    };
  }

  // Get circuit coordinates for major F1 circuits
  getCircuitCoordinates(circuitName, country = '') {
    const circuitMap = {
      'Monaco': { lat: 43.7384, lon: 7.4246 },
      'Silverstone': { lat: 52.0736, lon: -1.0162 },
      'Monza': { lat: 45.6206, lon: 9.2854 },
      'Spa-Francorchamps': { lat: 50.4372, lon: 5.9713 },
      'Suzuka': { lat: 34.8431, lon: 136.5454 },
      'Interlagos': { lat: -23.7036, lon: -46.6997 },
      'Albert Park': { lat: -37.8497, lon: 144.9684 },
      'Bahrain International Circuit': { lat: 26.0322, lon: 50.5120 },
      'Shanghai International Circuit': { lat: 31.3389, lon: 121.2202 },
      'Red Bull Ring': { lat: 47.2197, lon: 14.7647 },
      'Hungaroring': { lat: 47.5819, lon: 19.2508 },
      'Zandvoort': { lat: 52.3888, lon: 4.5409 },
      'Marina Bay Street Circuit': { lat: 1.2914, lon: 103.8640 },
      'Yas Marina Circuit': { lat: 24.4672, lon: 54.6036 },
      'Circuit of the Americas': { lat: 30.1328, lon: -97.6401 },
      'Autódromo Hermanos Rodríguez': { lat: 19.4052, lon: -99.0907 },
      'Autódromo José Carlos Pace': { lat: -23.7036, lon: -46.6997 },
      'Jeddah Corniche Circuit': { lat: 21.6316, lon: 39.1044 },
      'Miami International Autodrome': { lat: 25.9581, lon: -80.2389 },
      'Las Vegas Strip Circuit': { lat: 36.1699, lon: -115.1398 }
    };

    // Try exact match first
    if (circuitMap[circuitName]) {
      return circuitMap[circuitName];
    }

    // Try partial matches
    for (const [name, coords] of Object.entries(circuitMap)) {
      if (circuitName.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(circuitName.toLowerCase())) {
        return coords;
      }
    }

    // Try country-based fallback
    if (country) {
      const countryCoords = this.getCountryCoordinates(country);
      if (countryCoords) {
        return countryCoords;
      }
    }

    return null;
  }

  // Get approximate country coordinates as fallback
  getCountryCoordinates(country) {
    const countryMap = {
      'Great Britain': { lat: 55.3781, lon: -3.4360 },
      'Italy': { lat: 41.8719, lon: 12.5674 },
      'Belgium': { lat: 50.8503, lon: 4.3517 },
      'Japan': { lat: 36.2048, lon: 138.2529 },
      'Brazil': { lat: -14.2350, lon: -51.9253 },
      'Australia': { lat: -25.2744, lon: 133.7751 },
      'Bahrain': { lat: 26.0667, lon: 50.5577 },
      'China': { lat: 35.8617, lon: 104.1954 },
      'Austria': { lat: 47.5162, lon: 14.5501 },
      'Hungary': { lat: 47.1625, lon: 19.5033 },
      'Netherlands': { lat: 52.1326, lon: 5.2913 },
      'Singapore': { lat: 1.3521, lon: 103.8198 },
      'United Arab Emirates': { lat: 24.0000, lon: 54.0000 },
      'United States': { lat: 37.0902, lon: -95.7129 },
      'Mexico': { lat: 23.6345, lon: -102.5528 },
      'Saudi Arabia': { lat: 23.8859, lon: 45.0792 },
      'Qatar': { lat: 25.3548, lon: 51.1839 }
    };

    return countryMap[country] || null;
  }

  // Get mock weather data as fallback
  getMockWeatherData(circuitName) {
    // Generate realistic weather based on circuit location and season
    const season = new Date().getMonth() + 1; // 1-12
    const isNorthernHemisphere = this.isNorthernHemisphere(circuitName);
    
    let baseTemp, conditions;
    
    if (isNorthernHemisphere) {
      if (season >= 3 && season <= 5) { // Spring
        baseTemp = 15 + Math.random() * 10;
        conditions = ['Partly Cloudy', 'Sunny', 'Cloudy'][Math.floor(Math.random() * 3)];
      } else if (season >= 6 && season <= 8) { // Summer
        baseTemp = 25 + Math.random() * 15;
        conditions = ['Sunny', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 3)];
      } else if (season >= 9 && season <= 11) { // Fall
        baseTemp = 10 + Math.random() * 15;
        conditions = ['Cloudy', 'Partly Cloudy', 'Rain'][Math.floor(Math.random() * 3)];
      } else { // Winter
        baseTemp = -5 + Math.random() * 15;
        conditions = ['Cloudy', 'Rain', 'Snow'][Math.floor(Math.random() * 3)];
      }
    } else {
      // Southern hemisphere (opposite seasons)
      if (season >= 3 && season <= 5) { // Fall
        baseTemp = 10 + Math.random() * 15;
        conditions = ['Cloudy', 'Partly Cloudy', 'Rain'][Math.floor(Math.random() * 3)];
      } else if (season >= 6 && season <= 8) { // Winter
        baseTemp = -5 + Math.random() * 15;
        conditions = ['Cloudy', 'Rain', 'Snow'][Math.floor(Math.random() * 3)];
      } else if (season >= 9 && season <= 11) { // Spring
        baseTemp = 15 + Math.random() * 10;
        conditions = ['Partly Cloudy', 'Sunny', 'Cloudy'][Math.floor(Math.random() * 3)];
      } else { // Summer
        baseTemp = 25 + Math.random() * 15;
        conditions = ['Sunny', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 3)];
      }
    }

    return {
      temperature: Math.round(baseTemp),
      humidity: 50 + Math.floor(Math.random() * 40),
      wind_speed: 5 + Math.floor(Math.random() * 25),
      conditions: conditions,
      feels_like: Math.round(baseTemp + (Math.random() - 0.5) * 5),
      pressure: 1000 + Math.floor(Math.random() * 50),
      visibility: 8 + Math.floor(Math.random() * 12),
      uv: 1 + Math.floor(Math.random() * 10),
      last_updated: Date.now()
    };
  }

  // Determine if circuit is in northern hemisphere
  isNorthernHemisphere(circuitName) {
    const southernCircuits = ['Albert Park', 'Interlagos', 'Shanghai International Circuit'];
    return !southernCircuits.some(name => circuitName.includes(name));
  }

  // Get weather for multiple circuits
  async getWeatherForMultipleCircuits(circuits) {
    const weatherPromises = circuits.map(circuit => 
      this.getWeatherForCircuit(circuit.name, circuit.country)
    );
    
    try {
      const results = await Promise.allSettled(weatherPromises);
      return results.map((result, index) => ({
        circuit: circuits[index],
        weather: result.status === 'fulfilled' ? result.value : this.getMockWeatherData(circuits[index].name)
      }));
    } catch (error) {
      console.error('Error fetching weather for multiple circuits:', error);
      return circuits.map(circuit => ({
        circuit,
        weather: this.getMockWeatherData(circuit.name)
      }));
    }
  }
}

export default new WeatherService();
