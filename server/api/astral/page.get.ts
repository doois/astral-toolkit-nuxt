import config from "#astral/config";
import { routeById } from "../../../shared/site/routes";
import { resolvePage } from "../../lib/resolve";

// The data of one generated page (route id from the table, plus its params), with
// the settings, menus and JSON-LD around it and the cache tags it carries. The
// pages call it during server rendering (an in-process call, no HTTP); it only
// ever returns published content, the same the CMS's delivery API would.
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const route = routeById(config, query.route);
  if (!route) throw createError({ statusCode: 404, statusMessage: "unknown_route" });
  const param = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : undefined);
  setResponseHeaders(event, { "cache-control": "no-store", "x-robots-tag": "noindex" });
  return resolvePage(config, route, { slug: param("slug"), page: param("page") });
});
