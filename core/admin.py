from django.contrib import admin
from .models import BlogPost, Project


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_at', 'is_published']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_published']
    ordering = ['-created_at']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_at', 'is_published']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'description', 'technologies']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_published']
    ordering = ['-created_at']
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description', 'technologies')
        }),
        ('Links', {
            'fields': ('github_url', 'live_url')
        }),
        ('Publication', {
            'fields': ('is_published',)
        }),
    )
