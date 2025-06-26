   const apiKey = "ab4daf2968c432b8901c3a7bfae80324";
        const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const weatherContent = document.getElementById('weatherContent');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const suggestions = document.getElementById('suggestions');

        let currentSuggestionIndex = -1;
        let suggestionsData = [];
        let searchTimeout;

        const popularCities = [
            { name: "New York", country: "US", full: "New York, United States" },
            { name: "London", country: "GB", full: "London, United Kingdom" },
            { name: "Tokyo", country: "JP", full: "Tokyo, Japan" },
            { name: "Paris", country: "FR", full: "Paris, France" },
            { name: "Sydney", country: "AU", full: "Sydney, Australia" },
            { name: "Los Angeles", country: "US", full: "Los Angeles, United States" },
            { name: "Berlin", country: "DE", full: "Berlin, Germany" },
            { name: "Rome", country: "IT", full: "Rome, Italy" },
            { name: "Dubai", country: "AE", full: "Dubai, UAE" },
            { name: "Singapore", country: "SG", full: "Singapore" },
            { name: "Moscow", country: "RU", full: "Moscow, Russia" },
            { name: "Mumbai", country: "IN", full: "Mumbai, India" },
            { name: "São Paulo", country: "BR", full: "São Paulo, Brazil" },
            { name: "Cairo", country: "EG", full: "Cairo, Egypt" },
            { name: "Lagos", country: "NG", full: "Lagos, Nigeria" },
            { name: "Barcelona", country: "ES", full: "Barcelona, Spain" },
            { name: "Amsterdam", country: "NL", full: "Amsterdam, Netherlands" },
            { name: "Bangkok", country: "TH", full: "Bangkok, Thailand" },
            { name: "Istanbul", country: "TR", full: "Istanbul, Turkey" },
            { name: "Toronto", country: "CA", full: "Toronto, Canada" },
            { name: "Mexico City", country: "MX", full: "Mexico City, Mexico" },
            { name: "Buenos Aires", country: "AR", full: "Buenos Aires, Argentina" },
            { name: "Seoul", country: "KR", full: "Seoul, South Korea" },
            { name: "Hong Kong", country: "HK", full: "Hong Kong" },
            { name: "Vienna", country: "AT", full: "Vienna, Austria" },
            { name: "Stockholm", country: "SE", full: "Stockholm, Sweden" },
            { name: "Prague", country: "CZ", full: "Prague, Czech Republic" },
            { name: "Zurich", country: "CH", full: "Zurich, Switzerland" },
            { name: "Copenhagen", country: "DK", full: "Copenhagen, Denmark" },
            { name: "Oslo", country: "NO", full: "Oslo, Norway" }
        ];

        async function fetchCitySuggestions(query) {
            if (!query || query.length < 2) {
                return [];
            }

            try {
                const popularMatches = popularCities
                    .filter(city =>
                        city.name.toLowerCase().includes(query.toLowerCase()) ||
                        city.full.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 8);

                const geoResponse = await fetch(
                    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=8&appid=${apiKey}`
                );

                if (geoResponse.ok) {
                    const geoData = await geoResponse.json();
                    const apiMatches = geoData.map(item => ({
                        name: item.name,
                        country: item.country,
                        full: `${item.name}, ${item.state ? item.state + ', ' : ''}${item.country}`,
                        lat: item.lat,
                        lon: item.lon
                    }));

                    const combined = [...popularMatches, ...apiMatches];
                    const unique = combined.filter((city, index, self) =>
                        index === self.findIndex(c => c.name === city.name && c.country === city.country)
                    );

                    return unique.slice(0, 6);
                } else {
                    return popularMatches;
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                // Fallback to popular cities
                return popularCities
                    .filter(city =>
                        city.name.toLowerCase().includes(query.toLowerCase()) ||
                        city.full.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 6);
            }
        }

        function showSuggestions(cities) {
            if (cities.length === 0) {
                suggestions.innerHTML = '<div class="no-suggestions">No cities found</div>';
                suggestions.classList.add('show');
                return;
            }

            const suggestionsHTML = cities.map((city, index) => `
                <div class="suggestion-item" data-index="${index}" data-city="${city.name}">
                    <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div class="suggestion-text">
                        <div class="suggestion-main">${city.name}</div>
                        <div class="suggestion-sub">${city.full}</div>
                    </div>
                </div>
            `).join('');

            suggestions.innerHTML = suggestionsHTML;
            suggestions.classList.add('show');
            suggestionsData = cities;
            currentSuggestionIndex = -1;

            suggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const cityName = item.getAttribute('data-city');
                    searchInput.value = cityName;
                    hideSuggestions();
                    checkWeather(cityName);
                });
            });
        }

        function hideSuggestions() {
            suggestions.classList.remove('show');
            currentSuggestionIndex = -1;
        }

        function highlightSuggestion(index) {
            suggestions.querySelectorAll('.suggestion-item').forEach((item, i) => {
                item.classList.toggle('highlighted', i === index);
            });
        }

        function handleKeyNavigation(e) {
            const suggestionItems = suggestions.querySelectorAll('.suggestion-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestionItems.length - 1);
                highlightSuggestion(currentSuggestionIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
                highlightSuggestion(currentSuggestionIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentSuggestionIndex >= 0 && suggestionsData[currentSuggestionIndex]) {
                    const selectedCity = suggestionsData[currentSuggestionIndex];
                    searchInput.value = selectedCity.name;
                    hideSuggestions();
                    checkWeather(selectedCity.name);
                } else {
                    checkWeather(searchInput.value);
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        }

        const weatherIcons = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '🌨️',
            'Mist': '🌫️',
            'Smoke': '🌫️',
            'Haze': '🌫️',
            'Dust': '🌫️',
            'Fog': '🌫️',
            'Sand': '🌫️',
            'Ash': '🌫️',
            'Squall': '💨',
            'Tornado': '🌪️'
        };

        const backgroundClasses = {
            'Clear': 'clear-day',
            'Clouds': 'cloudy',
            'Rain': 'rainy',
            'Drizzle': 'rainy',
            'Thunderstorm': 'stormy',
            'Snow': 'snowy',
            'Mist': 'misty',
            'Smoke': 'misty',
            'Haze': 'misty',
            'Dust': 'misty',
            'Fog': 'misty',
            'Sand': 'misty',
            'Ash': 'misty',
            'Squall': 'stormy',
            'Tornado': 'stormy'
        };

        function updateDateTime() {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            document.getElementById('dateTime').textContent = now.toLocaleDateString('en-US', options);
        }

        function updateBackground(weatherCondition, isNight = false) {
            document.body.classList.add('weather-transition');

            setTimeout(() => {
                document.body.className = '';

                let bgClass = backgroundClasses[weatherCondition] || 'clear-day';

                if (weatherCondition === 'Clear' && isNight) {
                    bgClass = 'clear-night';
                }

                document.body.classList.add(bgClass);

                setTimeout(() => {
                    document.body.classList.remove('weather-transition');
                }, 100);
            }, 200);
        }

        function updateFavicon(weatherCondition, isNight = false) {
            const icons = {
                'Clear': isNight ? '🌙' : '☀️',
                'Clouds': '☁️',
                'Rain': '🌧️',
                'Drizzle': '🌦️',
                'Thunderstorm': '⛈️',
                'Snow': '🌨️',
                'Mist': '🌫️',
                'Smoke': '🌫️',
                'Haze': '🌫️',
                'Dust': '🌫️',
                'Fog': '🌫️',
                'Sand': '🌫️',
                'Ash': '🌫️',
                'Squall': '💨',
                'Tornado': '🌪️'
            };

            const emoji = icons[weatherCondition] || '⛅';
            const favicon = document.querySelector("link[rel='icon']");
            favicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
        }

        function isNightTime(sunriseTime, sunsetTime) {
            const currentTime = Math.floor(Date.now() / 1000);
            return currentTime < sunriseTime || currentTime > sunsetTime;
        }

        async function checkWeather(city) {
            if (!city.trim()) return;

            loading.style.display = 'block';
            loading.className = 'loading'; // Reset classes
            weatherContent.classList.remove('show');
            error.style.display = 'none';

            try {
                const response = await fetch(apiUrl + encodeURIComponent(city) + `&appid=${apiKey}`);

                if (!response.ok) {
                    throw new Error('City not found');
                }

                const data = await response.json();

                document.getElementById('location').textContent = `${data.name}, ${data.sys.country}`;
                document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°`;
                document.getElementById('weatherDescription').textContent = data.weather[0].description;
                document.getElementById('feelsLike').textContent = `Feels like ${Math.round(data.main.feels_like)}°`;
                document.getElementById('humidity').textContent = `${data.main.humidity}%`;
                document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
                document.getElementById('visibility').textContent = data.visibility ? `${Math.round(data.visibility / 1000)} km` : 'N/A';
                document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

                const weatherCondition = data.weather[0].main;
                document.getElementById('weatherIcon').textContent = weatherIcons[weatherCondition] || '🌤️';

                const isNight = isNightTime(data.sys.sunrise, data.sys.sunset);

                loading.classList.add(weatherCondition.toLowerCase());
                if (weatherCondition === 'Clear' && isNight) {
                    loading.classList.add('clear-night');
                } else if (weatherCondition === 'Clear') {
                    loading.classList.add('clear-day');
                }

                updateBackground(weatherCondition, isNight);

                updateFavicon(weatherCondition, isNight);

                updateDateTime();

                setTimeout(() => {
                    loading.style.display = 'none';
                    weatherContent.classList.add('show');
                }, 800);

            } catch (err) {
                loading.style.display = 'none';
                error.style.display = 'block';
                setTimeout(() => {
                    error.style.display = 'none';
                }, 5000);
            }
        }

        searchBtn.addEventListener('click', () => {
            hideSuggestions();
            checkWeather(searchInput.value);
        });

        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();

            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            if (query.length < 2) {
                hideSuggestions();
                return;
            }

            searchTimeout = setTimeout(async () => {
                const cities = await fetchCitySuggestions(query);
                showSuggestions(cities);
            }, 300);
        });

        searchInput.addEventListener('keydown', (event) => {
            if (suggestions.classList.contains('show')) {
                handleKeyNavigation(event);
            } else if (event.key === 'Enter') {
                checkWeather(searchInput.value);
            }
        });

        searchInput.addEventListener('focus', async () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                const cities = await fetchCitySuggestions(query);
                showSuggestions(cities);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                hideSuggestions();
            }
        });

        updateDateTime();
        setTimeout(() => {
            checkWeather('London');
        }, 500);

        setInterval(updateDateTime, 60000);
