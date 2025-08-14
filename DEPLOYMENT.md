# Heroku Deployment Guide

This guide will help you deploy your Django portfolio website to Heroku.

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure your project is in a Git repository

## Files Created for Heroku

- `Procfile`: Tells Heroku how to run your app
- `requirements.txt`: Python dependencies
- `runtime.txt`: Specifies Python version
- `app.json`: Heroku app configuration
- `.env.example`: Environment variables template
- `.gitignore`: Files to exclude from Git

## Deployment Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create a Heroku App
```bash
heroku create your-app-name
# Replace 'your-app-name' with your desired app name
```

### 3. Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:essential-0
```

### 4. Set Environment Variables
```bash
# Generate a new secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Set environment variables
heroku config:set SECRET_KEY="your-generated-secret-key"
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS="your-app-name.herokuapp.com"
```

### 5. Deploy to Heroku
```bash
# Add all files to git
git add .
git commit -m "Prepare for Heroku deployment"

# Deploy to Heroku
git push heroku main
```

### 6. Run Database Migrations
```bash
heroku run python manage.py migrate
```

### 7. Create Sample Data (Optional)
```bash
heroku run python manage.py create_sample_posts
heroku run python manage.py create_sample_projects
```

### 8. Create Superuser (Optional)
```bash
heroku run python manage.py createsuperuser
```

## Useful Heroku Commands

### View App Logs
```bash
heroku logs --tail
```

### Open Your App
```bash
heroku open
```

### Run Django Commands
```bash
heroku run python manage.py <command>
```

### Scale Your App
```bash
heroku ps:scale web=1
```

### View Config Variables
```bash
heroku config
```

## Environment Variables

The following environment variables are used:

- `SECRET_KEY`: Django secret key (automatically generated)
- `DEBUG`: Set to `False` for production
- `ALLOWED_HOSTS`: Your Heroku app domain
- `DATABASE_URL`: PostgreSQL connection (automatically set by Heroku)

## Static Files

Static files are handled by WhiteNoise middleware, which serves static files directly from your Django app. No additional configuration needed.

## Database

The app uses PostgreSQL in production (via Heroku Postgres) and SQLite for local development.

## Troubleshooting

### App Not Loading
1. Check logs: `heroku logs --tail`
2. Ensure all environment variables are set
3. Verify database migrations: `heroku run python manage.py migrate`

### Static Files Not Loading
1. Check STATIC_ROOT setting in settings.py
2. Ensure WhiteNoise is in MIDDLEWARE
3. Run: `heroku run python manage.py collectstatic --noinput`

### Database Issues
1. Check if PostgreSQL addon is installed: `heroku addons`
2. Verify DATABASE_URL: `heroku config:get DATABASE_URL`
3. Run migrations: `heroku run python manage.py migrate`

## Custom Domain (Optional)

To use a custom domain:

1. Add your domain to Heroku:
```bash
heroku domains:add www.yourdomain.com
```

2. Update ALLOWED_HOSTS:
```bash
heroku config:set ALLOWED_HOSTS="your-app-name.herokuapp.com,www.yourdomain.com"
```

3. Configure your DNS to point to Heroku's servers.

## Local Development

For local development, create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your local settings:
```
SECRET_KEY=your-local-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Security Notes

- Never commit your `.env` file to Git
- Use strong, unique secret keys
- Keep DEBUG=False in production
- Regularly update dependencies

## Support

For issues with Heroku deployment, check:
- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Django on Heroku](https://devcenter.heroku.com/articles/django-app-configuration)
