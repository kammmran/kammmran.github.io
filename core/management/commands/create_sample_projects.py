from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Project
import datetime


class Command(BaseCommand):
    help = 'Create sample projects'
    
    def handle(self, *args, **options):
        # Create sample projects
        projects = [
            {
                'title': 'Personal Portfolio Website',
                'slug': 'portfolio-website',
                'description': '''# Personal Portfolio Website

A modern, responsive portfolio website built with Django and vanilla CSS. This website showcases my projects, blog posts, and professional experience.

## Key Features

- **Responsive Design** - Works perfectly on all devices
- **Blog System** - Built-in blog with markdown support
- **Project Showcase** - Dedicated section for displaying projects
- **Clean UI** - Modern and professional design
- **Fast Loading** - Optimized for performance

## Technical Implementation

The website uses Django's MVT (Model-View-Template) architecture with a clean separation of concerns:

```python
# Example view structure
def home(request):
    blog_posts = BlogPost.objects.filter(is_published=True)
    return render(request, 'core/home.html', {'posts': blog_posts})
```

## Challenges Overcome

- Creating a responsive sidebar navigation
- Implementing dynamic content switching with JavaScript
- Optimizing the blog post display system
- Ensuring cross-browser compatibility''',
                'technologies': 'Django, Python, HTML5, CSS3, JavaScript, SQLite',
                'github_url': 'https://github.com/kamranheydarov/portfolio',
                'live_url': 'https://kamranheydarov.tech',
                'created_at': timezone.make_aware(datetime.datetime(2024, 1, 15))
            },
            {
                'title': 'E-Commerce Dashboard',
                'slug': 'ecommerce-dashboard',
                'description': '''# E-Commerce Analytics Dashboard

A comprehensive dashboard for e-commerce analytics built with React and Django REST Framework. Provides real-time insights into sales, customer behavior, and inventory management.

## Features

- **Real-time Analytics** - Live data updates using WebSockets
- **Interactive Charts** - Beautiful visualizations with Chart.js
- **Inventory Management** - Track products and stock levels
- **Customer Insights** - Detailed customer behavior analysis
- **Sales Reports** - Comprehensive sales reporting system

## Architecture

### Backend (Django REST Framework)
```python
class SalesAnalyticsViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SalesSerializer
    
    @action(detail=False)
    def daily_summary(self, request):
        # Calculate daily sales summary
        pass
```

### Frontend (React)
```javascript
// Real-time data fetching
useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/analytics/');
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setAnalyticsData(data);
    };
}, []);
```

## Performance Optimizations

- Database query optimization with Django ORM
- Frontend state management with Redux
- Caching strategies for frequently accessed data
- Lazy loading for improved initial page load''',
                'technologies': 'React, Django REST Framework, PostgreSQL, Redis, Chart.js, WebSockets',
                'github_url': 'https://github.com/kamranheydarov/ecommerce-dashboard',
                'live_url': '',
                'created_at': timezone.make_aware(datetime.datetime(2024, 4, 20))
            },
            {
                'title': 'Task Management API',
                'slug': 'task-management-api',
                'description': '''# Task Management REST API

A robust RESTful API for task management built with Django REST Framework. Includes user authentication, team collaboration, and advanced filtering capabilities.

## API Features

- **User Authentication** - JWT-based authentication system
- **Team Management** - Create and manage teams
- **Task CRUD Operations** - Full task lifecycle management
- **Advanced Filtering** - Filter tasks by status, priority, assignee
- **File Attachments** - Upload and manage task attachments
- **Real-time Notifications** - WebSocket-based notifications

## API Endpoints

### Authentication
```
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/refresh/
```

### Tasks
```
GET    /api/tasks/          # List all tasks
POST   /api/tasks/          # Create new task
GET    /api/tasks/{id}/     # Get specific task
PUT    /api/tasks/{id}/     # Update task
DELETE /api/tasks/{id}/     # Delete task
```

## Example Usage

```python
# Creating a new task
import requests

headers = {'Authorization': 'Bearer YOUR_JWT_TOKEN'}
data = {
    'title': 'Fix authentication bug',
    'description': 'Debug and fix the JWT token refresh issue',
    'priority': 'high',
    'assigned_to': 2,
    'due_date': '2024-12-31'
}

response = requests.post(
    'http://api.example.com/tasks/',
    json=data,
    headers=headers
)
```

## Technical Highlights

- **Custom Permissions** - Role-based access control
- **Serializer Optimization** - Efficient data serialization
- **Database Indexing** - Optimized query performance
- **API Documentation** - Auto-generated with drf-spectacular''',
                'technologies': 'Django REST Framework, PostgreSQL, Redis, Celery, JWT, Docker',
                'github_url': 'https://github.com/kamranheydarov/task-api',
                'live_url': 'https://task-api.kamranheydarov.tech',
                'created_at': timezone.make_aware(datetime.datetime(2024, 7, 10))
            },
            {
                'title': 'Weather Forecast App',
                'slug': 'weather-app',
                'description': '''# Weather Forecast Application

A beautiful weather application built with React Native that provides accurate weather forecasts with a clean, intuitive interface.

## Features

- **Current Weather** - Real-time weather conditions
- **7-Day Forecast** - Extended weather predictions
- **Location Services** - GPS-based location detection
- **Weather Maps** - Interactive weather radar
- **Push Notifications** - Weather alerts and updates
- **Offline Support** - Cached data for offline viewing

## User Experience

The app focuses on providing essential weather information with minimal friction:

### Key Screens
1. **Home Screen** - Current weather with key metrics
2. **Hourly View** - 24-hour weather timeline
3. **Weekly View** - 7-day forecast overview
4. **Map View** - Interactive weather radar
5. **Settings** - Location and notification preferences

## Technical Implementation

### Weather Data Integration
```javascript
const fetchWeatherData = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
        );
        const data = await response.json();
        return processWeatherData(data);
    } catch (error) {
        console.error('Weather fetch error:', error);
    }
};
```

### Location Services
```javascript
import Geolocation from '@react-native-community/geolocation';

const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            position => resolve(position.coords),
            error => reject(error),
            { enableHighAccuracy: true, timeout: 20000 }
        );
    });
};
```

## Design Philosophy

- **Minimalist Interface** - Clean, uncluttered design
- **Accessibility First** - Screen reader support and high contrast
- **Performance Optimized** - Smooth animations and fast loading
- **Data Efficiency** - Smart caching and minimal API calls''',
                'technologies': 'React Native, JavaScript, OpenWeatherMap API, AsyncStorage, React Navigation',
                'github_url': 'https://github.com/kamranheydarov/weather-app',
                'live_url': '',
                'created_at': timezone.make_aware(datetime.datetime(2024, 9, 5))
            },
            {
                'title': 'Social Media Analytics Tool',
                'slug': 'social-analytics',
                'description': '''# Social Media Analytics Tool

A comprehensive analytics platform that aggregates data from multiple social media platforms to provide insights into content performance and audience engagement.

## Platform Support

- **Instagram** - Posts, stories, and engagement metrics
- **Twitter/X** - Tweets, retweets, and follower analytics
- **Facebook** - Page insights and post performance
- **LinkedIn** - Professional content analytics
- **YouTube** - Video performance and subscriber data

## Key Features

### Analytics Dashboard
- Real-time engagement tracking
- Audience demographics analysis
- Content performance comparison
- Optimal posting time recommendations
- Hashtag performance analysis

### Reporting System
- Automated weekly/monthly reports
- Custom date range analysis
- Exportable charts and graphs
- Performance trend identification
- Competitor analysis tools

## Technical Architecture

### Data Collection Pipeline
```python
# Social media data aggregator
class SocialMediaConnector:
    def __init__(self, platform_configs):
        self.platforms = {}
        for platform, config in platform_configs.items():
            self.platforms[platform] = self.create_connector(platform, config)
    
    async def fetch_all_data(self):
        tasks = []
        for platform, connector in self.platforms.items():
            tasks.append(connector.fetch_recent_data())
        
        return await asyncio.gather(*tasks)
```

### Data Processing
```python
# Engagement rate calculation
def calculate_engagement_rate(post_data):
    total_engagement = (
        post_data['likes'] + 
        post_data['comments'] + 
        post_data['shares']
    )
    return (total_engagement / post_data['followers']) * 100
```

## Machine Learning Features

- **Content Optimization** - AI-powered content suggestions
- **Audience Insights** - ML-based audience segmentation
- **Trend Prediction** - Predictive analytics for viral content
- **Sentiment Analysis** - Comment and mention sentiment tracking

## Benefits for Users

1. **Time Saving** - Consolidated dashboard for all platforms
2. **Data-Driven Decisions** - Comprehensive analytics and insights
3. **Performance Optimization** - Actionable recommendations
4. **Competitive Intelligence** - Industry benchmarking
5. **ROI Tracking** - Clear performance metrics and trends''',
                'technologies': 'Django, PostgreSQL, Celery, Redis, React, Chart.js, Pandas, Scikit-learn',
                'github_url': 'https://github.com/kamranheydarov/social-analytics',
                'live_url': 'https://social-analytics.kamranheydarov.tech',
                'created_at': timezone.make_aware(datetime.datetime(2024, 11, 12))
            }
        ]

        created_count = 0
        for project_data in projects:
            obj, created = Project.objects.get_or_create(
                slug=project_data['slug'],
                defaults=project_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {obj.title}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Already exists: {obj.title}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new projects')
        )
        self.stdout.write(
            self.style.SUCCESS(f'Total projects: {Project.objects.count()}')
        )
