# jekyll-post
Draft, edit, publish Jekyll posts from the command line.

Installation: `npm install -g robcrocombe/jekyll-post`

Usage: `post <command> "post name"`

Options:

```
  -h, --help           output usage information
  -V, --version        output the version number
  d, draft <name>      create a draft post
  p, publish [name]    publish all drafts, or a single draft
  u, unpublish <name>  unpublish a post
```

Jekyll-Post can be ran from the root of any Jekyll directory containing `_drafts` and `_posts`.
