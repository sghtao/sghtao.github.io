---
icon: fas fa-feather-alt
order: 4
toc: false
---

Retrospectives, reflections, and half-formed ideas — written to think out loud, not to be right.

---

{% assign thought_posts = site.posts | where_exp: "post", "post.categories contains 'Thoughts'" %}
{% if thought_posts.size > 0 %}
<ul class="posts-listing">
  {% for post in thought_posts %}
  <li class="post-entry">
    <span class="post-entry-date">{{ post.date | date: "%Y-%m-%d" }}</span>
    <a href="{{ post.url | relative_url }}" class="post-entry-title">{{ post.title }}</a>
  </li>
  {% endfor %}
</ul>
{% else %}
<p style="color: var(--text-muted-color); font-style: italic;">Nothing here yet. Add posts with <code>categories: [Thoughts]</code> to have them appear here.</p>
{% endif %}
