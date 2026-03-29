---
icon: fas fa-file-text
order: 1
---

<ul class="posts-listing">
  {% for post in site.posts %}
  <li class="post-entry">
    <span class="post-entry-date">{{ post.date | date: "%Y-%m-%d" }}</span>
    <a href="{{ post.url | relative_url }}" class="post-entry-title">{{ post.title }}</a>
    {% if post.categories.size > 0 %}
    <span class="post-entry-category">{{ post.categories | first }}</span>
    {% endif %}
  </li>
  {% endfor %}
</ul>
