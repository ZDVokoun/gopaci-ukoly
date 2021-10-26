export function hasValues(object, required) {
    const toCheck = Object.keys(object).filter(item => required.includes(item));
    return !(toCheck.some(key => object[key] === "" || !object[key]));
}