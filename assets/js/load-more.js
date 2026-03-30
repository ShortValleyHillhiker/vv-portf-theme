let postsCache = null;

async function fetchPosts() {
  if (postsCache) return postsCache;
  const res = await fetch('/posts.json');
  postsCache = await res.json();
  return postsCache;
}

function renderWorkItem(post) {
  const a = document.createElement('a');
  a.href = post.url;
  a.className = 'work-item';
  a.innerHTML = `
    ${post.banner ? `<img src="${post.banner}" alt="${post.title}">` : ''}
    <span class="post-title">${post.title}</span>
    ${post.category ? `<span class="post-meta">${post.category}</span>` : ''}
  `;
  return a;
}

function renderBlogItem(post) {
  const a = document.createElement('a');
  a.href = post.url;
  a.className = 'blog-item';
  const date = new Date(post.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  a.innerHTML = `
    <span class="post-title">${post.title}</span>
    <span class="post-meta">${date}</span>
  `;
  return a;
}

export function initLoadMore() {
  document.querySelectorAll('.load-more-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      const loaded = parseInt(btn.dataset.loaded, 10);
      const section = btn.closest('section');
      const list = section.querySelector('[class*="listing-items"]');

      const posts = await fetchPosts();
      const filtered = posts.filter(p => p.type === type);
      const next = filtered[loaded];

      if (!next) { btn.remove(); return; }

      list.appendChild(type === 'work' ? renderWorkItem(next) : renderBlogItem(next));

      const newLoaded = loaded + 1;
      btn.dataset.loaded = newLoaded;

      if (newLoaded >= filtered.length) btn.remove();
    });
  });
}
