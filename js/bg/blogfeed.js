"use strict"

const BlogFeed = {
	lastRequest: 0,
	
	fetching: null,
	cached: null,
	
	canRequest() {
		return Date.now() > this.lastRequest + 3e3
	},
	
	request() {
		if(!this.fetching) {
			this.lastRequest = Date.now()
			
			const striphtml = html => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ")
			const feedUrl = `https://blog.roblox.com/wp-json/wp/v2/posts?per_page=3&context=embed`

			this.fetching = fetch(feedUrl).then(async response => {
				if(!response.ok) {
					return
				}

				const json = await response.json()
				
				this.cached = json.map(post => ({
					url: post.link,
					date: post.date,
					title: striphtml(post.title.rendered).trim(),
					desc: striphtml(post.excerpt.rendered).trim()
				}))

				SHARED_DATA.set("blogfeed", this.cached)
				this.fetching = null
				
				return this.cached
			})
		}
		
		return this.fetching
	}
}

STORAGE.get(["cachedBlogFeedV2"], data => {
	if(data.cachedBlogFeedV2 && BlogFeed.cached) {
		BlogFeed.cached = data.cachedBlogFeedV2
		SHARED_DATA.set("blogfeed", BlogFeed.cached)
	}
})

MESSAGING.listen({
	requestBlogFeed(_, respond) {
		if(BlogFeed.cached) {
			respond(BlogFeed.cached, true)
		}
		
		if(BlogFeed.canRequest()) {
			BlogFeed.request().then(data => respond(data))
		} else {
			respond.cancel()
		}
	}
})