function setCache (key, value) {
  const cache = JSON.parse(localStorage.getItem("cache"))
  let newCache = {...cache, [key]:{value: value, expires: Date.now() + 1000 * 60 * 60 * 24 * 14}}
  for (let item of Object.keys(cache)) {
    if (!newCache[item].expires || newCache[item].expires < Date.now()) delete newCache[item]
  }
  localStorage.setItem("cache", JSON.stringify(newCache))
}
function getCache(key) {
  const cache = JSON.parse(localStorage.getItem("cache"))
  if (!cache) return null
  let result = cache[key]
  if (!result) return null
  if (result.expires < Date.now()) {
    setCache(key, null)
    return null
  }
  return result.value
}
export { getCache, setCache }
