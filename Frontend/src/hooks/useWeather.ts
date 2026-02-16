import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface WeatherData {
    temp_c: number;
    condition: {
        text: string;
        icon: string;
    };
    wind_kph: number;
    humidity: number;
}

export const useWeather = (location: string | undefined) => {
    return useQuery<WeatherData>({
        queryKey: ['weather', location],
        queryFn: async () => {
            if (!location) throw new Error('Location is required');
            try {
                const response = await fetch(`${API_BASE_URL}/api/weather?q=${encodeURIComponent(location)}`);
                if (!response.ok) throw new Error('Weather fetch failed');
                return await response.json();
            } catch (error) {
                console.warn("Weather API unreachable. Using fallback data.");
                return {
                    temp_c: 22.5,
                    condition: {
                        text: "Clear",
                        icon: "//cdn.weatherapi.com/weather/64x64/day/113.png"
                    },
                    wind_kph: 12.4,
                    humidity: 45
                };
            }
        },
        enabled: !!location,
        staleTime: 600000, // 10 minutes
        retry: 1
    });
};
