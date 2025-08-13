from django.shortcuts import render
from django.db.models import Count
from .models import BlogPost, Project
import datetime


def home(request):
    # Get all published blog posts
    blog_posts = BlogPost.objects.filter(is_published=True)
    
    # Get years with their blog posts (descending order) - no post count needed
    years_with_posts = []
    all_years = (
        BlogPost.objects.filter(is_published=True)
        .extra({'year': "strftime('%%Y', created_at)"})
        .values_list('year', flat=True)
        .distinct()
        .order_by('-year')
    )
    
    for year in all_years:
        year_int = int(year)
        posts_in_year = blog_posts.filter(created_at__year=year_int).order_by('-created_at')
        years_with_posts.append({
            'year': year_int,
            'posts': posts_in_year,
        })
    
    context = {
        'years_with_posts': years_with_posts,
        'all_posts': blog_posts,
    }
    return render(request, 'core/home.html', context)


def projects(request):
    # Get all published projects ordered by creation date (latest first)
    all_projects = Project.objects.filter(is_published=True).order_by('-created_at')
    
    context = {
        'all_projects': all_projects,
    }
    return render(request, 'core/projects.html', context)


def cv(request):
    return render(request, 'core/cv.html')
