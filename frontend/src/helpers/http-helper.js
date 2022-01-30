const http = {
    post: (endpoint, body) => new Promise(async (resolve, reject) => {
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        };
        const response = await fetch(endpoint, requestOptions);
        if (response.ok) {
            resolve(await response.json())
        } else {
            reject(await response.text())
        }
    }),
    put: (endpoint, body = {}) => new Promise(async (resolve, reject) => {
        const requestOptions = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        };
        const response = await fetch(endpoint, requestOptions);
        if (response.ok) {
            resolve(await response.json())
        } else {
            reject(await response.text())
        }
    }),
    delete: (endpoint, body = {}) => new Promise(async (resolve, reject) => {
        const requestOptions = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        };
        const response = await fetch(endpoint, requestOptions);
        if (response.ok) {
            resolve(await response.json())
        } else {
            reject(await response.text())
        }
    }),
    get: (endpoint) => new Promise(async (resolve, reject) => {
        const requestOptions = {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        };
        const response = await fetch(endpoint, requestOptions);
        if (response.ok) {
            resolve(await response.json())
        } else {
            reject(await response.text())
        }
    }),
}

export default http;

export function debounce (func) {
    let timer;
    return function (...args) {
      const context = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        func.apply(context, args);
      }, 500);
    };
  };
