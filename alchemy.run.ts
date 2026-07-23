import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Effect from 'effect/Effect'

export default Alchemy.Stack(
  'Games',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const website = yield* Cloudflare.Website.Vite('Website', {
      assets: {
        notFoundHandling: 'single-page-application',
      },
      domain: 'games.phtngyn.dev',
    })

    return {
      url: website.url,
    }
  }),
)
