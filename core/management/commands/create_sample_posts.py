from django.core.management.base import BaseCommand
from core.models import BlogPost
from django.utils import timezone
import datetime


class Command(BaseCommand):
    help = 'Create sample blog posts'

    def handle(self, *args, **options):
        # Create sample blog posts
        posts = [
            {
                'title': 'Welcome to My Blog 2024',
                'slug': 'welcome-2024',
                'content': '''# Welcome to My Blog

This is my first blog post of 2024. Welcome to my personal website!

I'm excited to share my journey in web development, programming tips, and project updates.

## What to Expect

- Web development tutorials
- Programming tips and tricks
- Project showcases
- Personal experiences

Stay tuned for more content!''',
                'created_at': timezone.make_aware(datetime.datetime(2024, 3, 15))
            },
            {
                'title': 'Learning Django Framework',
                'slug': 'learning-django-2024',
                'content': '''# Learning Django Framework

Today I learned about Django models and views. It's amazing how easy it is to build web applications with Django.

## Key Features I Love

- **ORM (Object-Relational Mapping)** - Makes database operations simple
- **Admin Interface** - Automatic admin panel generation
- **URL Routing** - Clean and flexible URL patterns
- **Template System** - Powerful templating engine

```python
# Simple Django view
def home(request):
    return render(request, 'home.html')
```

Django definitely makes web development more enjoyable!''',
                'created_at': timezone.make_aware(datetime.datetime(2024, 6, 20))
            },
            {
                'title': 'CSS Grid Mastery',
                'slug': 'css-grid-2024',
                'content': '''# CSS Grid Mastery

CSS Grid is a powerful layout system. Here are some tips I learned while building responsive layouts.

## Basic Grid Setup

```css
.container {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: 20px;
}
```

## Key Benefits

1. **Two-dimensional layouts** - Control both rows and columns
2. **Responsive design** - Easy to create responsive grids
3. **Alignment control** - Perfect alignment of grid items

Grid has revolutionized how I approach web layouts!''',
                'created_at': timezone.make_aware(datetime.datetime(2024, 9, 10))
            },
            {
                'title': 'New Year Goals 2025',
                'slug': 'goals-2025',
                'content': '''# New Year Goals 2025

Happy New Year! Here are my development goals for 2025:

## Technical Goals

- **Learn React.js** - Master modern frontend development
- **Contribute to Open Source** - Give back to the community
- **Build More Projects** - Practice makes perfect
- **Improve Python Skills** - Dive deeper into advanced concepts

## Personal Goals

- Write more blog posts
- Network with other developers
- Attend tech conferences
- Mentor junior developers

Looking forward to an amazing year of growth and learning!''',
                'created_at': timezone.make_aware(datetime.datetime(2025, 1, 5))
            },
            {
                'title': 'Advanced Python Techniques',
                'slug': 'python-advanced-2025',
                'content': '''# Advanced Python Techniques

Exploring advanced Python features like decorators, context managers, and metaclasses.

## Decorators Example

```python
def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f} seconds")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return "Done!"
```

## Context Managers

```python
class DatabaseConnection:
    def __enter__(self):
        self.conn = connect_to_database()
        return self.conn
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()
```

These advanced features make Python code more elegant and powerful!''',
                'created_at': timezone.make_aware(datetime.datetime(2025, 2, 18))
            }
        ]

        created_count = 0
        for post_data in posts:
            obj, created = BlogPost.objects.get_or_create(
                slug=post_data['slug'],
                defaults=post_data
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
            self.style.SUCCESS(f'Total blog posts: {BlogPost.objects.count()}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} new posts')
        )
