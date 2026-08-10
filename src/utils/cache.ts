import { string } from "zod";
import {redis} from "../lib/redis.js";

const DEFAULT_TTL_SECONDS = 60;

export const getOrSetCache = async <T>(
    key : string,
    fetchFn : () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
 ) : Promise<T> => {
     
 const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached) as T;
  }

  const fresh = await fetchFn();
  await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);

  return fresh;

 }