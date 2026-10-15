import { Auth } from '@auth/core';
import Google from '@auth/core/providers/google';
import Facebook from '@auth/core/providers/facebook';
import Apple from '@auth/core/providers/apple';
import Twitter from '@auth/core/providers/twitter';
import { createHash } from 'node:crypto';

const definitions = [
  ['google', 'Google', Google, 'GOOGLE'],
  ['facebook', 'Facebook', Facebook, 'FACEBOOK'],
  ['apple', 'Apple', Apple, 'APPLE'],
  ['twitter', 'X.com', Twitter, 'TWITTER'],
];
export function providerStatus(env) {
  return definitions.map(([id, name, , key]) => ({id, name,
    enabled: Boolean(env.AUTH_SECRET && env[`AUTH_${key}_ID`] && env[`AUTH_${key}_SECRET`]),
  }));
}
export function authConfig(env) {
  return {
    basePath: '/api/auth', trustHost: true, secret: env.AUTH_SECRET,
    session: {strategy: 'jwt', maxAge: 30 * 24 * 60 * 60},
    providers: definitions.filter(([id]) => providerStatus(env).find(p => p.id === id).enabled)
      .map(([id, , factory, key]) => factory({clientId: env[`AUTH_${key}_ID`], clientSecret: env[`AUTH_${key}_SECRET`],
        ...(id === 'twitter' ? {authorization: {url: 'https://x.com/i/oauth2/authorize', params: {scope: 'users.read tweet.read'}}} : {}),
      })),
    pages: {signIn: '/index.html#login', error: '/index.html?auth_error=1#login'},
    callbacks: {
      async jwt({token, account}) {
        if (account) {
          const hex = createHash('sha256').update(`${account.provider}:${account.providerAccountId}`).digest('hex');
          token.elfId = `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
        }
        return token;
      },
      async session({session, token}) {
        session.user = {id: token.elfId, name: token.name || '', email: token.email || ''};
        return session;
      },
      async redirect({url, baseUrl}) {
        const target = new URL(url, baseUrl);
        return target.origin === new URL(baseUrl).origin ? target.href : `${baseUrl}/index.html#signup`;
      },
    },
    // Never log provider errors: they may contain tokens or personal data.
    logger: {error() {}, warn() {}, debug() {}},
  };
}
export async function authResponse(request, env = process.env) {
  const url = new URL(request.url);
  const action = url.pathname.slice('/api/auth/'.length);
  const headers = {'Cache-Control': 'no-store'};
  if (action === 'status' && request.method === 'GET') return Response.json({providers: providerStatus(env)}, {headers});
  if (!env.AUTH_SECRET) {
    if (action === 'session' && request.method === 'GET') return Response.json(null, {headers});
    return Response.json({error: 'auth_not_configured'}, {status: 503, headers});
  }
  const expected = new URL(env.AUTH_URL || 'https://elf.pink').origin;
  if (url.origin !== expected) return Response.json({error: 'auth_origin_not_allowed'}, {status: 403, headers});
  if (!['GET','POST'].includes(request.method)) return Response.json({error:'method_not_allowed'}, {status:405,headers});
  // Auth.js checks OAuth state/nonce/PKCE and POST CSRF; never disable these checks.
  const response = await Auth(request, authConfig(env));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
