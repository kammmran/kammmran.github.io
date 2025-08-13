from django.db import models
from django.utils import timezone
import markdown
from markdown.extensions import codehilite


class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_markdown_content(self):
        """Convert markdown content to HTML"""
        return markdown.markdown(self.content, extensions=['codehilite', 'fenced_code', 'tables'])
    
    @property
    def year(self):
        return self.created_at.year


class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    technologies = models.CharField(max_length=300, help_text="Comma-separated list of technologies")
    github_url = models.URLField(blank=True, null=True)
    live_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_markdown_description(self):
        """Convert markdown description to HTML"""
        return markdown.markdown(self.description, extensions=['codehilite', 'fenced_code', 'tables'])
    
    def get_technologies_list(self):
        """Return technologies as a list"""
        return [tech.strip() for tech in self.technologies.split(',') if tech.strip()]

