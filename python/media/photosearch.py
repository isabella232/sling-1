# Copyright 2021 Ringgaard Research ApS
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http:#www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Search Reddit for photos."""

import sling
import sling.flags as flags
import sling.log as log
import sling.net

flags.define("--port",
             help="port number for the HTTP server",
             default=8080,
             type=int,
             metavar="PORT")

# Parse command line flags.
flags.parse()

# Initialize web server.
app = sling.net.HTTPServer(flags.arg.port)
app.static("/common", "app", internal=True)
app.redirect("/", "/photosearch")

# Main page.
app.page("/photosearch",
"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name=viewport content="width=device-width, initial-scale=1">
  <title>Reddit photo search</title>
  <link rel="icon" href="/common/image/appicon.ico" type="image/x-icon" />
  <script type="module" src="/common/lib/material.js"></script>
  <script type="module" src="app.js"></script>
</head>
<body style="display: none">
  <photo-search-app id="app">
    <md-column-layout>
      <md-toolbar>
        <md-toolbar-logo></md-toolbar-logo>
        <div id="title">Reddit photo search</div>
        <md-input
          id="query"
          type="search"
          placeholder="Search for photos on Reddit...">
        </md-input>
        <md-icon-button id="search" icon="search">
        </md-icon-button>
      </md-toolbar>

      <md-content>
        <search-results id="results">
          <md-card-toolbar>
            <div>Results</div>
          </md-card-toolbar>
          <div id="hits"></div>
          <md-icon-button id="more" icon="more_horiz">
        </search-results>
      </md-content>
    </md-column-layout>
  </photo-search-app>
</body>
</html>
""")

app.js("/photosearch/app.js",
"""
import {Component} from "/common/lib/component.js";
import {MdCard} from "/common/lib/material.js";
import {reddit_thumbnail} from "/common/lib/reddit.js";

let nsfw = false;

class PhotoSearchApp extends Component {
  onconnected() {
    this.bind("#query", "keyup", e => {
      if (e.key === "Enter") this.onsearch();
    });
    this.bind("#search", "click", e => this.onsearch(e));

    let qs = new URLSearchParams(window.location.search);
    if (qs.get("nsfw") == "1") nsfw = true;
    let query = qs.get("q");
    if (query) {
      window.customElements.whenDefined("search-results").then(() => {
        this.find("#results").update(query);
        this.find("#query").update(query);
      });
    }
  }

  onsearch() {
    let query = this.find("#query").value()
    console.log("query", query)
    this.find("#results").update(query);
  }

  static stylesheet() {
    return `
      $ md-input {
        display: flex;
        width: 600px;
      }
      $ #title {
        padding-right: 50px;
      }
    `;
  }
}

Component.register(PhotoSearchApp);

const photo_urls = [
  "i.redd.it/[A-Za-z0-9]+.jpe?g",
  "i.redd.it/[A-Za-z0-9]+.png",
  "www.reddit.com/gallery/[A-Za-z0-9]+",
  "imgur.com/[A-Za-z0-9]+.jpe?g",
  "imgur.com/[A-Za-z0-9]+.png",
  "imgur.com/[A-Za-z0-9]+",
  "imgur.com/a/[A-Za-z0-9]+",
  "i.imgur.com/[A-Za-z0-9]+.jpe?g",
  "i.imgur.com/[A-Za-z0-9]+.png",
  "i.imgur.com/[A-Za-z0-9]+",
  "i.imgur.com/a/[A-Za-z0-9]+",
];

const photo_re = "^http(s)?\\\\://(" + photo_urls.join("|") + ")$";
const photo_pat = new RegExp(photo_re);

class SearchResult extends Component {
  render() {
    let p = this.state;
    let date = new Date(p.timestamp * 1000).toLocaleString();
    return `
      <div style="display: flex">
        <div class="photo">
          <a href="${p.url}" target="_blank">
            <img src="${p.thumb}" width=${p.width} height=${p.height}>
          </a>
        </div>
        <div class="descr">
          <div class="title">
            <a href="https://www.reddit.com${p.permalink}" target="_blank">
              ${p.title}
            </a>
          </div>
          <div class="info">
            <span class="${p.marker}">NSFW</span>
            Submitted on ${date} by ${p.author} to
            <a href="https://www.reddit.com/r/${p.sr}" target="_blank">
              r/${p.sr}
            </a>
          </div>
          <div class="link">
            <md-icon icon="link"></md-icon>
            <a href="${p.url}" target="_blank">${p.url}</a>
          </div>
        </div>
      </div>
    `;
  }

  static stylesheet() {
    return `
      $ {
        font-family: verdana, arial, helvetica;
      }
      $ a {
        text-decoration: none;
      }
      $ .photo {
        margin: 5px;
      }
      $ .title a {
        font-size: 20px;
        color: #006ABA;
      }
      $ .descr {
        margin: 5px;
        display: flex;
        flex-direction: column;
      }
      $ .descr a {
        color: #006ABA;
      }
      $ .info {
        font-size: 13px;
        margin-top: 6px;
        margin-bottom: 6px;
      }
      $ .link {
        display: flex;
      }
      $ .link md-icon {
        font-size: 19px;
        margin-right: 3px;
        color: #006ABA;
      }
      $ .link a:visited {
        font-size: 15px;
        color: #551A8B;
      }
      $ .nsfw {
        border-radius: 3px;
        border: 1px solid;
        font-size: 12px;
        padding: 2px 4px;
        margin: 2px;
        color: #d10023;
      }
      $ .sfw {
        display: none;
      }
    `;
  }
}

Component.register(SearchResult);

class SearchResults extends MdCard {
  visible() {
    return this.query != null;
    console.log("visible", this.query);
  }

  onconnected() {
    this.bind("#more", "click", e => this.onmore(e));
  }

  onupdate() {
    this.clear();
    this.query = this.state;
    this.fill()
  }

  onmore() {
    this.fill();
  }

  clear() {
    this.query = null;
    this.after = null;
    this.urls = new Set();
    this.find("#hits").innerHTML = null;
    this.find("#more").update(null);
  }

  fill() {
    let q = encodeURIComponent(this.query);
    let url = `https://www.reddit.com/search.json?q=${q}&limit=100`;
    if (nsfw) url = url + "&include_over_18=on";
    if (this.after) url = url + `&after=${this.after}`;
    console.log("url", url);

    document.body.style.cursor = "wait";
    fetch(url)
      .then(response => response.json())
      .then((result) => {
        this.add(result.data.children);
        this.after = result.data.after;
        this.find("#more").update(this.after);
        document.body.style.cursor = null;
      })
      .catch(error => {
        console.log("Reddit error", error.message, error.stack);
        document.body.style.cursor = null;
      });
  }

  add(hits) {
    let hitlist = this.find("#hits");
    for (let hit of hits) {
      let posting = hit.data;
      let url = posting.url;

      if (!photo_pat.test(url)) {
        console.log("bad", url);
        continue;
      }

      if (this.urls.has(url)) {
        console.log("dup", url);
        continue;
      }
      this.urls.add(url);

      let thumb = reddit_thumbnail(posting, 70);
      console.log("thumb", url, thumb.url, thumb.width, thumb.height);

      let result = new SearchResult();
      result.update({
        url: url,
        thumb: thumb.url,
        width: thumb.width,
        height: thumb.height,
        title: posting["title"],
        marker: posting["over_18"] ? "nsfw" : "sfw",
        permalink: posting["permalink"],
        sid: posting["name"],
        sr: posting["subreddit"],
        timestamp: posting["created_utc"],
        author: posting["author"],
      });
      hitlist.appendChild(result);
    }
  }

  static stylesheet() {
    return super.stylesheet() + `
    `;
  }
}

Component.register(SearchResults);

document.body.style = null;
""")

# Run app until shutdown.
log.info("running")
app.run()
log.info("stopped")

