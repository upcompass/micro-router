import { IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import * as UrlPattern from 'url-pattern'

export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type RouteHandler = (method: HttpVerb, path: string, handler: RequestHandler) => RequestHandler

export type RequestHandler = (req: RoutedIncomingMessage , res: ServerResponse) => any

export interface RoutedIncomingMessage extends IncomingMessage {
  params: object,
  query: object
}

const parseRoute = (route: UrlPattern, url: string) => {
  const { query, pathname } = parse(url, true)
  const params = route.match(pathname)
  return { query, params }
}

export const Route: RouteHandler = (method, path, handler) => {
  if (!path) {
    throw new Error('Invalid route path')
  }

  if (!handler) {
    throw new Error('Invalid micro handler')
  }

  const route = new UrlPattern(path)

  return (req: IncomingMessage , res: ServerResponse) => {
    const { params, query }: {params: object, query: object} = parseRoute(route, req.url)
    if (params && req.method === method) {
      return handler(Object.assign(req, { params, query }), res)
    }
  }
}

export const Routes = (defaultHandler: RequestHandler, ...handlers: RequestHandler[]) => {
  const routeHandlers = [...handlers, defaultHandler]
  return async (req, res) => {
      for (const handler of routeHandlers) {
        const result = await handler(req, res)
        if (result || res.headersSent) {
          return result
        }
      }
    }
}
