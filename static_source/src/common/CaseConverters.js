export function snakeToCamel (s) {
    return s.replace(/(_\w)/g, (x) => x[1].toUpperCase());
}

const ucFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const snakeToPascal = (s) => s.split('_').map(ucFirst).join('');
export const camelToPascal = (s) => ucFirst(s);

/**
 * @link https://github.com/peet/camel-to-snake/blob/master/index.js
 */
export const camelToSnake = (s) => {
    return s.replace(/([a-z]|(?:[A-Z0-9]+))([A-Z0-9]|$)/g, function(_, $1, $2) {
        return $1 + ($2 && '_' + $2);
    }).toLowerCase();
};

export const keysToSnakeFromCamel = (obj, removeNull = true) =>
    convertObjectKeys(obj, removeNull, camelToSnake);

export const keysToCamelFromSnake = (obj, removeNull = true) =>
    convertObjectKeys(obj, removeNull);

export function convertObjectKeys (obj, removeNull = true, converter = snakeToCamel) {
    if (Array.isArray(obj)) {
        return obj.map((x) => convertObjectKeys(x, removeNull, converter));
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    let r = {};
    for (let key in obj) {
        if(removeNull && obj[key] === null) {
            continue;
        }

        r[converter(key)] = obj[key] && typeof obj[key] === 'object'
            ? convertObjectKeys(obj[key], removeNull, converter)
            : obj[key];
    }

    return r;
}

